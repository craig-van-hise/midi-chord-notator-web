import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import type { ReactNode } from 'react';
import { requestMidiAccess } from './midiAccess';
import { fetchBinaryLUT } from '../utils/binaryLut';
import type { PCS_Entry } from '../utils/chordSpeller';
import { audioEngine } from '../audio/engine';
import * as Tone from 'tone';

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
  selectedInputId: string;
  keySignature: string; // e.g., "C Major", "Gb Major"
  loading: boolean;
  error: string | null;
  setInputPort: (portId: string) => void;
  setKeySignature: (name: string) => void;
  splitPoint: number;
  setSplitPoint: (note: number) => void;
  handleMidiPanic: () => void;
  isSustainActive: boolean;
  isToggleModeActive: boolean;
  setIsToggleModeActive: (b: boolean) => void;
  isHoldModeActive: boolean;
  setIsHoldModeActive: (b: boolean) => void;
  dispatchVirtualMidi: (data: Uint8Array) => void;
  updateActiveNotes: (notes: any[]) => void;
  lut: (PCS_Entry | null)[];
}

const MidiContext = createContext<MidiContextType | undefined>(undefined);

export const MIDIProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [midiAccess, setMidiAccess] = useState<MIDIAccess | null>(null);
  const [selectedInputId, setSelectedInputId] = useState<string>(localStorage.getItem('midi_input_id') || "omni");
  const [keySignature, setKeySignature] = useState<string>("C Major"); 
  const [splitPoint, setSplitPoint] = useState<number>(60); // Default: Middle C (60)
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isSustainActive, setIsSustainActive] = useState<boolean>(false);
  const [isToggleModeActive, setIsToggleModeActive] = useState<boolean>(true);
  const [isHoldModeActive, setIsHoldModeActive] = useState<boolean>(true);
  const [lut, setLut] = useState<(PCS_Entry | null)[]>([]);


  const physicallyHeldNotes = React.useRef<Set<number>>(new Set());
  const pendingNoteOffs = React.useRef<Set<number>>(new Set());
  const heldModePendingNoteOffs = React.useRef<Set<number>>(new Set());

  const dispatchMidiEvent = useCallback((data: Uint8Array) => {

    const midiEventDetail = {
      data,
      timestamp: performance.now(),
      input: null, // Virtual input
    };
    const customEvent = new CustomEvent('MIDI_MESSAGE_RECEIVED', { detail: midiEventDetail });
    window.dispatchEvent(customEvent);
  }, []);

  const handleIncomingMidi = useCallback((data: Uint8Array, isVirtual: boolean = false) => {

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
      if (!isVirtual && isHoldModeActive && physicallyHeldNotes.current.size === 0) {
        // Flush old held notes before starting new chord
        heldModePendingNoteOffs.current.forEach(noteNum => {
          dispatchMidiEvent(new Uint8Array([0x80 + channel, noteNum, 0]));
        });
        heldModePendingNoteOffs.current.clear();
      }
      
      if (!isVirtual) {
        physicallyHeldNotes.current.add(note);
      }
      pendingNoteOffs.current.delete(note);
      heldModePendingNoteOffs.current.delete(note);
      
      // ROMPler Integration
      const noteString = Tone.Frequency(note, "midi").toNote();
      if (Tone.context.state === 'running') {
        audioEngine.noteOn(noteString, velocity / 127);
      }

      dispatchMidiEvent(data);
      return;
    }

    // Note Off
    if (command === 0x80 || (command === 0x90 && velocity === 0)) {
      if (!isVirtual) {
        physicallyHeldNotes.current.delete(note);
      }
      
      if (isSustainActive) {
        pendingNoteOffs.current.add(note);
      } else if (isHoldModeActive && !isVirtual) {
        heldModePendingNoteOffs.current.add(note);
      } else {
        dispatchMidiEvent(data);
      }

      // ROMPler Integration
      const noteString = Tone.Frequency(note, "midi").toNote();
      audioEngine.releaseNote(noteString);

      return;
    }

    // Default: Dispatch other messages
    dispatchMidiEvent(data);
  }, [isSustainActive, isHoldModeActive, dispatchMidiEvent]);

  const dispatchVirtualMidi = useCallback((data: Uint8Array) => {
    handleIncomingMidi(data, true);
  }, [handleIncomingMidi]);

  const handleMidiPanic = useCallback(() => {

    // Reset sustain state
    setIsSustainActive(false);
    setIsToggleModeActive(true);
    setIsHoldModeActive(true);
    pendingNoteOffs.current.clear();
    heldModePendingNoteOffs.current.clear();

    // ROMPler Integration
    audioEngine.releaseAll();

    // Dispatch proprietary PANIC flag
    const panicEvent = new CustomEvent('MIDI_MESSAGE_RECEIVED', {
      detail: { 
        data: new Uint8Array([0, 0, 0]), 
        timestamp: performance.now(), 
        panic: true 
      }
    });
    window.dispatchEvent(panicEvent);
  }, []);

  useEffect(() => {
    if (!isHoldModeActive) {
      // Flush held notes when mode is deactivated
      heldModePendingNoteOffs.current.forEach(noteNum => {
        dispatchMidiEvent(new Uint8Array([0x80, noteNum, 0])); // Use channel 0 for virtual flush
      });
      heldModePendingNoteOffs.current.clear();
    }
  }, [isHoldModeActive, dispatchMidiEvent]);

  const handleMidiMessage = useCallback((_event: Event) => {
    // const customEvent = _event as CustomEvent<MidiMessageReceivedEventDetail>;
  }, []);

  const midiAccessRef = React.useRef<MIDIAccess | null>(null);

  useEffect(() => {
    midiAccessRef.current = midiAccess;
  }, [midiAccess]);

  useEffect(() => {
    if (!midiAccess) return;

    const inputsToListen = selectedInputId === 'omni'
      ? Array.from(midiAccess.inputs.values())
      : [midiAccess.inputs.get(selectedInputId)].filter(Boolean) as MIDIInput[];

    inputsToListen.forEach(input => {
      input.onmidimessage = (event: MIDIMessageEvent) => {
        if (event.data) handleIncomingMidi(event.data as Uint8Array, false);
      };
    });

    return () => {
      inputsToListen.forEach(input => {
        input.onmidimessage = null;
      });
    };
  }, [midiAccess, selectedInputId, handleIncomingMidi]);

  useEffect(() => {
    let isMounted = true;

    const initializeMidi = async () => {
      setLoading(true);
      setError(null);
      setMidiAccess(null);

      try {
        const access = await requestMidiAccess();
        if (!isMounted) return;

        setMidiAccess(access);

        // Load LUT
        try {
          const baseUrl = import.meta.env.BASE_URL.replace(/\/$/, '');
          const data = await fetchBinaryLUT(`${baseUrl}/PCS_LUT.dat`);
          setLut(data);
        } catch (e) {
          console.error('Failed to load Binary LUT data in MIDIProvider:', e);
        }

        const savedInputId = localStorage.getItem('midi_input_id');

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
    
    window.addEventListener('MIDI_MESSAGE_RECEIVED', handleMidiMessage);

    return () => {
      isMounted = false;
      const access = midiAccessRef.current;
      if (access) {
        access.inputs.forEach(input => {
          input.close().catch(err => console.error('Error closing MIDI input:', err));
          input.onmidimessage = null;
        });
      }
      window.removeEventListener('MIDI_MESSAGE_RECEIVED', handleMidiMessage);
    };
  }, [handleMidiMessage, handleIncomingMidi]);

  const setInputPort = (portId: string) => {
    setSelectedInputId(portId);
    if (portId === 'omni' || portId === '') {
      localStorage.removeItem('midi_input_id');
    } else {
      localStorage.setItem('midi_input_id', portId);
    }
  };


  const updateActiveNotes = useCallback((notes: any[]) => {
    const refreshEvent = new CustomEvent('MIDI_MESSAGE_RECEIVED', {
      detail: { 
        refresh: true,
        notes 
      }
    });
    window.dispatchEvent(refreshEvent);
  }, []);

  return (
    <MidiContext.Provider
      value={{
        midiAccess,
        selectedInputId,
        keySignature,
        loading,
        error,
        setInputPort,
        setKeySignature,
        splitPoint,
        setSplitPoint,
        handleMidiPanic,
        isSustainActive,
        isToggleModeActive,
        setIsToggleModeActive,
        isHoldModeActive,
        setIsHoldModeActive,
        dispatchVirtualMidi,
        updateActiveNotes,
        lut,
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