// @ts-nocheck
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { requestMidiAccess } from './midiAccess'; // Assuming midiAccess.ts is in the same directory

// Mocking the global navigator object and its requestMIDIAccess method
const mockMidiAccessSuccess = vi.fn();
const mockMidiAccessError = vi.fn();

const mockNavigator = {
  requestMIDIAccess: mockMidiAccessSuccess,
};

describe('midiAccess', () => {
  beforeEach(() => {
    // Reset mocks before each test
    vi.resetAllMocks();

    // Set up the global navigator with our mock
    // We need to cast to any because the global Navigator type might not have requestMIDIAccess
    global.navigator = mockNavigator as any;
  });

  afterEach(() => {
    // Clean up the global navigator after each test
    // Restore original navigator if it existed, or delete if not
    // For simplicity here, we'll just delete the mock. A more robust solution
    // might involve saving and restoring the original.
    delete global.navigator;
  });

  it('should successfully request and return MIDI access', async () => {
    const mockMidiAccessResult = {
      inputs: new Map(),
      outputs: new Map(),
      onstatechange: null,
    };
    mockMidiAccessSuccess.mockResolvedValue(mockMidiAccessResult);

    const midiAccess = await requestMidiAccess();

    expect(mockMidiAccessSuccess).toHaveBeenCalledTimes(1);
    // No options passed to requestMIDIAccess in the implementation, so no args check here
    // expect(mockMidiAccessSuccess).toHaveBeenCalledWith(/* expected options if any */);
    expect(midiAccess).toEqual(mockMidiAccessResult);
  });

  it('should throw an error if MIDI access is denied', async () => {
    const errorMessage = 'User denied access to MIDI devices.';
    mockMidiAccessSuccess.mockRejectedValue(new Error(errorMessage));

    await expect(requestMidiAccess()).rejects.toThrow(`MIDI access denied: ${errorMessage}`);
    expect(mockMidiAccessSuccess).toHaveBeenCalledTimes(1);
  });

  it('should throw an error if Web MIDI API is not available', async () => {
    // Temporarily remove requestMIDIAccess from the mocked navigator
    // or ensure the global navigator itself is not available or doesn't have the method
    const originalNavigator = global.navigator;
    // Ensure navigator exists but doesn't have requestMIDIAccess
    global.navigator = { ...mockNavigator, requestMIDIAccess: undefined } as any;

    await expect(requestMidiAccess()).rejects.toThrow('Web MIDI API is not available in this environment.');

    // Restore navigator to its previous state if it existed
    if (originalNavigator) {
      global.navigator = originalNavigator;
    } else {
      delete global.navigator;
    }
  });

  it('should throw a generic error if MIDI access fails with an unknown error', async () => {
    mockMidiAccessSuccess.mockRejectedValue(new Error()); // Error without a specific message

    await expect(requestMidiAccess()).rejects.toThrow('MIDI access denied: Unknown error');
    expect(mockMidiAccessSuccess).toHaveBeenCalledTimes(1);
  });
});
