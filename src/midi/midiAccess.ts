// Function to request MIDI access and set up event listeners
export async function requestMidiAccess(): Promise<MIDIAccess> {
  if (typeof navigator === 'undefined' || !navigator.requestMIDIAccess) {
    throw new Error('Web MIDI API is not available in this environment.');
  }

  try {
    const midiAccess = await navigator.requestMIDIAccess();
    console.log('MIDI Access granted:', midiAccess);

    return midiAccess;
  } catch (error: any) {
    console.error('Failed to grant MIDI Access:', error);
    throw new Error(`MIDI access denied: ${error.message || 'Unknown error'}`);
  }
}