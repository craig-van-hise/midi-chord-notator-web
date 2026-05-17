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

// Mock audioEngine.init to prevent Tone.js Web Audio API errors in JSDOM
import { audioEngine } from './audio/engine';
vi.spyOn(audioEngine, 'init').mockResolvedValue(undefined);

if (typeof window !== 'undefined' && typeof window.HTMLElement !== 'undefined') {
  window.HTMLElement.prototype.releasePointerCapture = vi.fn();
  window.HTMLElement.prototype.setPointerCapture = vi.fn();
}

// Mock global fetch to return minimal valid binary LUT buffer
if (typeof globalThis !== 'undefined') {
  const minimalLutBuffer = new Uint8Array([
    0x50, 0x4c, 0x55, 0x54, // PLUT
    12, 0, 0, 0,            // stringPoolOffset = 12
    0, 0, 0, 0,             // rowsCount = 0
    0x5b, 0x5d              // "[]"
  ]).buffer;

  globalThis.fetch = vi.fn().mockResolvedValue({
    arrayBuffer: vi.fn().mockResolvedValue(minimalLutBuffer),
  });
}


