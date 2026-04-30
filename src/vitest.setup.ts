import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Provide a basic mock for navigator.requestMIDIAccess to prevent failures in 
// tests that render components using MIDIProvider but don't explicitly test MIDI.
if (typeof navigator !== 'undefined') {
  Object.defineProperty(navigator, 'requestMIDIAccess', {
    value: vi.fn().mockResolvedValue({
      inputs: new Map(),
      outputs: new Map(),
      onstatechange: null,
    }),
    configurable: true,
  });
}
