import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import type { ReactNode } from 'react';
import { requestMidiAccess } from './midiAccess';

// Define the structure for the custom event data
/*
interface MidiMessageReceivedEventDetail {
  data: Uint8Array; // The MIDI message data
  timestamp: number; // The timestamp of the message
  input: MIDIInput; // The input port from which the message originated
}
*/

interface MidiContextType {
  midiAccess: MIDIAccess | null;
  selectedInputPort: MIDIInput | null;
  selectedOutputPort: MIDIOutput | null;
  keySignature: string; // e.g., "C Major", "Gb Major"
  loading: boolean;
  error: string | null;
  setInputPort: (portId: string) => void;
  setOutputPort: (portId: string) => void;
  setKeySignature: (name: string) => void;
  splitPoint: number;
  setSplitPoint: (note: number) => void;
  handleMidiPanic: () => void;
  isSustainActive: boolean;
  dispatchVirtualMidi: (data: Uint8Array) => void;
}

const MidiContext = createContext<MidiContextType | undefined>(undefined);

export const MIDIProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [midiAccess, setMidiAccess] = useState<MIDIAccess | null>(null);
  const [selectedInputPort, setSelectedInputPort] = useState<MIDIInput | null>(null);
  const [selectedOutputPort, setSelectedOutputPort] = useState<MIDIOutput | null>(null);
  const [keySignature, setKeySignature] = useState<string>("C Major"); 
  const [splitPoint, setSplitPoint] = useState<number>(60); // Default: Middle C (60)
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isSustainActive, setIsSustainActive] = useState<boolean>(false);

  const physicallyHeldNotes = React.useRef<Set<number>>(new Set());
  const pendingNoteOffs = React.useRef<Set<number>>(new Set());

  const dispatchMidiEvent = useCallback((data: Uint8Array) => {
    const midiEventDetail = {
      data,
      timestamp: performance.now(),
      input: null, // Virtual input
    };
    const customEvent = new CustomEvent('MIDI_MESSAGE_RECEIVED', { detail: midiEventDetail });
    window.dispatchEvent(customEvent);
  }, []);

  const handleIncomingMidi = useCallback((data: Uint8Array) => {
    const [status, note, velocity] = data;
    const command = status & 0xF0;
    const channel = status & 0x0F;

    // CC 64 Sustain Pedal
    if (command === 0xB0 && note === 64) {
      const active = velocity >= 64;
      setIsSustainActive(active);
      if (!active) {
        // Sustain turned OFF: Dispatch all pending note offs
        pendingNoteOffs.current.forEach(noteNum => {
          dispatchMidiEvent(new Uint8Array([0x80 + channel, noteNum, 0]));
        });
        pendingNoteOffs.current.clear();
      }
      // Still dispatch the CC message for others to hear
      dispatchMidiEvent(data);
      return;
    }

    // Note On
    if (command === 0x90 && velocity > 0) {
      physicallyHeldNotes.current.add(note);
      pendingNoteOffs.current.delete(note);
      dispatchMidiEvent(data);
      return;
    }

    // Note Off
    if (command === 0x80 || (command === 0x90 && velocity === 0)) {
      physicallyHeldNotes.current.delete(note);
      if (isSustainActive) {
        pendingNoteOffs.current.add(note);
      } else {
        dispatchMidiEvent(data);
      }
      return;
    }

    // Default: Dispatch other messages
    dispatchMidiEvent(data);
  }, [isSustainActive, dispatchMidiEvent]);

  const dispatchVirtualMidi = useCallback((data: Uint8Array) => {
    handleIncomingMidi(data);
  }, [handleIncomingMidi]);

  const handleMidiPanic = useCallback(() => {
    if (selectedOutputPort) {
      for (let channel = 0; channel < 16; channel++) {
        // Note Off for all notes
        for (let note = 0; note < 128; note++) {
          selectedOutputPort.send([0x80 + channel, note, 0]);
        }
        // All Notes Off CC 123
        selectedOutputPort.send([0xB0 + channel, 123, 0]);
        // Sustain 0 CC 64
        selectedOutputPort.send([0xB0 + channel, 64, 0]);
      }
    }

    // Reset sustain state
    setIsSustainActive(false);
    pendingNoteOffs.current.clear();

    // Dispatch proprietary PANIC flag
    const panicEvent = new CustomEvent('MIDI_MESSAGE_RECEIVED', {
      detail: { 
        data: new Uint8Array([0, 0, 0]), 
        timestamp: performance.now(), 
        panic: true 
      }
    });
    window.dispatchEvent(panicEvent);
  }, [selectedOutputPort]);

  const handleMidiMessage = useCallback((_event: Event) => {
    // const customEvent = _event as CustomEvent<MidiMessageReceivedEventDetail>;
  }, []);

  const midiAccessRef = React.useRef<MIDIAccess | null>(null);

  useEffect(() => {
    midiAccessRef.current = midiAccess;
  }, [midiAccess]);

  useEffect(() => {
    let isMounted = true;

    const initializeMidi = async () => {
      setLoading(true);
      setError(null);
      setMidiAccess(null);
      setSelectedInputPort(null);
      setSelectedOutputPort(null);

      try {
        const access = await requestMidiAccess();
        if (!isMounted) return;

        setMidiAccess(access);

        if (access.inputs.size > 0) {
          const firstInput = access.inputs.values().next().value as MIDIInput | undefined;
          if (firstInput) setSelectedInputPort(firstInput);
        }
        if (access.outputs.size > 0) {
          const firstOutput = access.outputs.values().next().value as MIDIOutput | undefined;
          if (firstOutput) setSelectedOutputPort(firstOutput);
        }

        const handleStateChange = (event: MIDIConnectionEvent) => {
          console.log(`MIDI device state changed: ${event.port?.name} (${event.port?.state})`);
        };
        access.onstatechange = handleStateChange;

        setLoading(false);
      } catch (err: any) {
        console.error('Failed to initialize MIDI:', err);
        if (isMounted) {
          setError(err.message || 'Failed to initialize MIDI.');
          setLoading(false);
        }
      }
    };

    initializeMidi();
    
    const handleRawMidi = (event: Event) => {
      const customEvent = event as CustomEvent;
      if (customEvent.detail?.data) {
        handleIncomingMidi(customEvent.detail.data);
      }
    };

    window.addEventListener('RAW_MIDI_MESSAGE_RECEIVED', handleRawMidi);
    window.addEventListener('MIDI_MESSAGE_RECEIVED', handleMidiMessage);

    return () => {
      isMounted = false;
      const access = midiAccessRef.current;
      if (access) {
        access.inputs.forEach(input => {
          input.close().catch(err => console.error('Error closing MIDI input:', err));
          input.onmidimessage = null;
        });
        access.outputs.forEach(output => {
          output.close().catch(err => console.error('Error closing MIDI output:', err));
        });
      }
      window.removeEventListener('RAW_MIDI_MESSAGE_RECEIVED', handleRawMidi);
      window.removeEventListener('MIDI_MESSAGE_RECEIVED', handleMidiMessage);
    };
  }, [handleMidiMessage, handleIncomingMidi]);

  const setInputPort = (portId: string) => {
    if (!portId || portId === "") {
      setSelectedInputPort(null);
      return;
    }
    if (midiAccess && midiAccess.inputs.has(portId)) {
      setSelectedInputPort(midiAccess.inputs.get(portId)!);
    } else {
      console.warn(`Input port with ID "${portId}" not found.`);
    }
  };

  const setOutputPort = (portId: string) => {
    if (!portId || portId === "") {
      setSelectedOutputPort(null);
      return;
    }
    if (midiAccess && midiAccess.outputs.has(portId)) {
      setSelectedOutputPort(midiAccess.outputs.get(portId)!);
    } else {
      console.warn(`Output port with ID "${portId}" not found.`);
    }
  };

  return (
    <MidiContext.Provider
      value={{
        midiAccess,
        selectedInputPort,
        selectedOutputPort,
        keySignature,
        loading,
        error,
        setInputPort,
        setOutputPort,
        setKeySignature,
        splitPoint,
        setSplitPoint,
        handleMidiPanic,
        isSustainActive,
        dispatchVirtualMidi,
      }}
    >
      {children}
    </MidiContext.Provider>
  );
};

export const useMidi = (): MidiContextType => {
  const context = useContext(MidiContext);
  if (context === undefined) {
    throw new Error('useMidi must be used within a MIDIProvider');
  }
  return context;
};