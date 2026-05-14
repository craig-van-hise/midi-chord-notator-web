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

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value.toString();
    }),
    clear: vi.fn(() => {
      store = {};
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    length: 0,
    key: vi.fn((index: number) => Object.keys(store)[index] || null),
  };
})();

Object.defineProperty(window, 'localStorage', { value: localStorageMock });
