/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect } from 'react';
import { render, screen, waitFor, act, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { MIDIProvider, useMidi } from './MIDIProvider';
import { audioEngine } from '../audio/engine';

vi.mock('../audio/engine', () => ({
  audioEngine: {
    triggerAttack: vi.fn(),
    triggerRelease: vi.fn(),
    init: vi.fn().mockResolvedValue(undefined),
    loadInstrument: vi.fn().mockResolvedValue(undefined),
  }
}));

interface MIDIInput {
  id: string;
  name: string;
  type: 'input';
  onmidimessage: ((event: MIDIMessageEvent) => void) | null;
  onstatechange: ((event: MIDIConnectionEvent) => void) | null;
  open(): Promise<void>;
  close(): Promise<void>;
}

let mockMidiInput1: MIDIInput;

beforeEach(() => {
  cleanup();
  vi.clearAllMocks();
  vi.resetModules();
  localStorage.clear();

  vi.stubGlobal('navigator', {
    requestMIDIAccess: vi.fn(),
  });

  mockMidiInput1 = {
    id: 'input-1',
    name: 'Mock MIDI Keyboard 1',
    type: 'input',
    onmidimessage: null,
    onstatechange: null,
    open: vi.fn().mockResolvedValue(undefined),
    close: vi.fn().mockResolvedValue(undefined),
  };
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

const TestConsumer: React.FC<{ onReady?: (ctx: any) => void }> = ({ onReady }) => {
  const context = useMidi();

  useEffect(() => {
    if (context && context.midiAccess && !context.loading) {
      onReady?.(context);
    }
  }, [context, onReady]);

  return (
    <div>
      {context?.loading ? 'Loading...' : 'Ready'}
    </div>
  );
};

describe('MIDIProvider - Playable Transformations TDD Checkpoint', () => {
  it('Given a mapped transformation, When a simulated MIDI Note On arrives with velocity 100, Then audioEngine.triggerAttack is called with the transformed notes and corresponding velocity', async () => {
    const mockMidiAccess = {
      inputs: new Map([['input-1', mockMidiInput1]]),
      outputs: new Map(),
      onstatechange: null,
    };
    (navigator.requestMIDIAccess as any).mockResolvedValue(mockMidiAccess);

    let capturedContext: any;
    render(
      <MIDIProvider>
        <TestConsumer onReady={(ctx) => { capturedContext = ctx; }} />
      </MIDIProvider>
    );

    await waitFor(() => expect(screen.getByText('Ready')).toBeInTheDocument());
    expect(capturedContext).toBeDefined();

    act(() => {
      // Set C major triad [60, 64, 67] as selected notes
      capturedContext.setSelectedNotes([60, 64, 67]);
      // Map SEMI_UP (Diatonic Up / Semitone Up) to MIDI note 48 (C3)
      capturedContext.updateButtonConfig('SEMI_UP', { midiNote: 48, midiChannel: 1 });
    });

    // Simulate Note On for MIDI note 48 with velocity 100
    act(() => {
      mockMidiInput1.onmidimessage!({
        data: new Uint8Array([0x90, 48, 100]),
      } as any);
    });

    // SEMI_UP transforms [60, 64, 67] to [61, 65, 68]
    expect(audioEngine.triggerAttack).toHaveBeenCalledWith([61, 65, 68], 100 / 127);
  });

  it('Given an active transformation held in the Map, When the corresponding simulated MIDI Note Off arrives, Then audioEngine.triggerRelease is called with the exact array of transformed notes, and the Map entry is cleared', async () => {
    const mockMidiAccess = {
      inputs: new Map([['input-1', mockMidiInput1]]),
      outputs: new Map(),
      onstatechange: null,
    };
    (navigator.requestMIDIAccess as any).mockResolvedValue(mockMidiAccess);

    let capturedContext: any;
    render(
      <MIDIProvider>
        <TestConsumer onReady={(ctx) => { capturedContext = ctx; }} />
      </MIDIProvider>
    );

    await waitFor(() => expect(screen.getByText('Ready')).toBeInTheDocument());
    expect(capturedContext).toBeDefined();

    act(() => {
      capturedContext.setSelectedNotes([60, 64, 67]);
      capturedContext.updateButtonConfig('SEMI_UP', { midiNote: 48, midiChannel: 1 });
    });

    // Simulate Note On for MIDI note 48 with velocity 100
    act(() => {
      mockMidiInput1.onmidimessage!({
        data: new Uint8Array([0x90, 48, 100]),
      } as any);
    });

    expect(audioEngine.triggerAttack).toHaveBeenCalledWith([61, 65, 68], 100 / 127);

    // Verify map has the active notes
    expect(capturedContext.activeTransformationNotes.get(48)).toEqual([61, 65, 68]);

    // Simulate Note Off for MIDI note 48 (status 0x80 or 0x90 with velocity 0)
    act(() => {
      mockMidiInput1.onmidimessage!({
        data: new Uint8Array([0x80, 48, 0]),
      } as any);
    });

    expect(audioEngine.triggerRelease).toHaveBeenCalledWith([61, 65, 68]);
    expect(capturedContext.activeTransformationNotes.has(48)).toBe(false);
  });
});
