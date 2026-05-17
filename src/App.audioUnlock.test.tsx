import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import App from './App';
import { audioEngine } from './audio/engine';
import { useMidi } from './midi/MIDIProvider';
import * as Tone from 'tone';
import { vi, describe, test, expect, beforeEach } from 'vitest';

const mockToneStart = vi.fn().mockResolvedValue(undefined);

vi.mock('./midi/MIDIProvider', () => ({
  useMidi: vi.fn(),
  MIDIProvider: ({ children }: any) => <>{children}</>,
}));

vi.mock('tone', async (importOriginal) => {
  const actual = await importOriginal<typeof import('tone')>();
  return {
    ...actual,
    start: (...args: any[]) => mockToneStart(...args),
    context: {
      state: 'suspended',
    },
  };
});

vi.mock('./audio/engine', () => ({
  audioEngine: {
    isInitialized: false,
    isUnlocked: false,
    init: vi.fn().mockResolvedValue(undefined),
    loadInstrument: vi.fn().mockResolvedValue(undefined),
    setVolume: vi.fn(),
    setPan: vi.fn(),
    setTuningOffset: vi.fn(),
    setAttack: vi.fn(),
    setDecay: vi.fn(),
    setSustain: vi.fn(),
    setRelease: vi.fn(),
    setReverbWet: vi.fn(),
    getMeterLevels: vi.fn().mockReturnValue({ l: -100, r: -100 }),
    noteOn: vi.fn(),
    releaseNote: vi.fn(),
    releaseAll: vi.fn(),
  }
}));

describe('App - Start Audio Engine Gatekeeper', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockToneStart.mockClear();
    (useMidi as any).mockReturnValue({
      keySignature: 'C Major',
      splitPoint: 60,
      lut: Array(4096).fill(null),
      updateActiveNotes: vi.fn(),
    });
  });

  test('Given the app mounts, Then the "Start Audio Engine" overlay is visible', async () => {
    render(<App />);
    expect(screen.getByTestId('audio-unlock-overlay')).toBeInTheDocument();
    expect(screen.getByText('Start Audio Engine')).toBeInTheDocument();
  });

  test('Given the overlay is visible, When the user clicks the start button, Then audioEngine.init() and loadInstrument() are called and the overlay unmounts', async () => {
    render(<App />);
    const button = screen.getByText('Start Audio Engine');
    expect(button).toBeInTheDocument();

    await act(async () => {
      fireEvent.click(button);
    });

    expect(audioEngine.init).toHaveBeenCalled();
    expect(audioEngine.loadInstrument).toHaveBeenCalledWith('piano');
    expect(screen.queryByTestId('audio-unlock-overlay')).not.toBeInTheDocument();
  });
});
