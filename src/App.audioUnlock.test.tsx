import { render, screen, fireEvent, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import NotationCanvas from './components/NotationCanvas';
import { useMidi } from './midi/MIDIProvider';
import { vi, describe, test, expect, beforeEach } from 'vitest';

const mockToneStart = vi.fn().mockResolvedValue(undefined);

vi.mock('./midi/MIDIProvider', () => ({
  useMidi: vi.fn(),
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
    init: vi.fn(),
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

describe('NotationCanvas - Click to Start Gatekeeper & MIDI Bouncer', () => {
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

  test('Given the app mounts, Then the "Click to Start" overlay is visible', async () => {
    render(<NotationCanvas />);
    expect(screen.getByTestId('audio-unlock-overlay')).toBeInTheDocument();
    expect(screen.getByText('Click to Start Audio Engine')).toBeInTheDocument();
  });

  test('Given the overlay is visible, When the user clicks the start button, Then Tone.start() is called and the overlay unmounts', async () => {
    render(<NotationCanvas />);
    const button = screen.getByText('Click to Start Audio Engine');
    expect(button).toBeInTheDocument();

    await act(async () => {
      fireEvent.click(button);
    });

    expect(mockToneStart).toHaveBeenCalledTimes(1);
    expect(screen.queryByTestId('audio-unlock-overlay')).not.toBeInTheDocument();
  });
});
