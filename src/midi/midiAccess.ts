// Define the structure for the custom event data
interface MidiMessageReceivedEventDetail {
  data: Uint8Array; // The MIDI message data
  timestamp: number; // The timestamp of the message
  input: MIDIInput; // The input port from which the message originated
}

// Function to request MIDI access and set up event listeners
export async function requestMidiAccess(): Promise<MIDIAccess> {
  if (typeof navigator === 'undefined' || !navigator.requestMIDIAccess) {
    throw new Error('Web MIDI API is not available in this environment.');
  }

  try {
    const midiAccess = await navigator.requestMIDIAccess();
    console.log('MIDI Access granted:', midiAccess);

    // Iterate over all MIDI input ports and attach the message handler
    midiAccess.inputs.forEach((input: MIDIInput) => {
      input.onmidimessage = (event: MIDIMessageEvent) => {
        // Dispatch a CustomEvent when a MIDI message is received
        const midiEventDetail: MidiMessageReceivedEventDetail = {
          data: event.data as Uint8Array, // Ensure data is treated as Uint8Array
          timestamp: event.timeStamp,
          input: input,
        };
        const customEvent = new CustomEvent('RAW_MIDI_MESSAGE_RECEIVED', { detail: midiEventDetail });
        window.dispatchEvent(customEvent);
        console.log(`MIDI Message from ${input.name}:`, event.data);
      };
      // Optionally, open the input port if it's not already open
      // Note: In many browsers, inputs are automatically opened upon requestMIDIAccess
      // or when a listener is attached. Explicitly opening might be redundant or cause issues.
      // input.open().catch(err => console.error(`Error opening MIDI input ${input.name}:`, err));
    });

    // Handle state changes for MIDI devices (optional but good practice)
    midiAccess.onstatechange = (event: MIDIConnectionEvent) => {
      console.log(`MIDI device state changed: ${event.port?.name} (${event.port?.state})`);
      // Re-attach listeners if a device state changes (e.g., new device connected)
      if (event.port?.state === 'connected' && event.port?.type === 'input') {
        const input = event.port as MIDIInput;
        if (!input.onmidimessage) { // Only attach if not already listening
            input.onmidimessage = (msgEvent: MIDIMessageEvent) => {
                const midiEventDetail: MidiMessageReceivedEventDetail = {
                  data: msgEvent.data as Uint8Array,
                  timestamp: msgEvent.timeStamp,
                  input: input,
                };
                const customEvent = new CustomEvent('RAW_MIDI_MESSAGE_RECEIVED', { detail: midiEventDetail });
                window.dispatchEvent(customEvent);
                console.log(`MIDI Message from ${input.name} (state change listener):`, msgEvent.data);
            };
        }
      }
    };

    return midiAccess;
  } catch (error: any) {
    console.error('Failed to grant MIDI Access:', error);
    throw new Error(`MIDI access denied: ${error.message || 'Unknown error'}`);
  }
}