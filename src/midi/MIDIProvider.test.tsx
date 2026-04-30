// @ts-nocheck
// src/midi/MIDIProvider.test.tsx

import React, { useEffect } from 'react';
import { render, screen, waitFor, act, cleanup } from '@testing-library/react';
// @ts-nocheck
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Import the actual MIDIProvider and useMidi hook from the component file
import { MIDIProvider, useMidi } from './MIDIProvider';

// --- Define types that are used by the component but not exported ---
interface MIDIOutput {
  id: string;
  name: string;
  type: 'output';
  send(data: number[], timestamp?: number): void;
  close(): Promise<void>;
}

interface MIDIInput {
  id: string;
  name: string;
  type: 'input';
  onmidimessage: ((event: MIDIMessageEvent) => void) | null;
  onstatechange: ((event: MIDIConnectionEvent) => void) | null;
  open(): Promise<void>;
  close(): Promise<void>;
}

interface MIDIAccess {
  inputs: Map<string, MIDIInput>;
  outputs: Map<string, MIDIOutput>;
  onstatechange: ((event: MIDIConnectionEvent) => void) | null;
}

interface MidiMessageReceivedEventDetail {
  data: Uint8Array;
  timestamp: number;
  input: MIDIInput;
}

interface MidiContextType {
  midiAccess: MIDIAccess | null;
  selectedInputPort: MIDIInput | null;
  selectedOutputPort: MIDIOutput | null;
  loading: boolean;
  error: string | null;
  setInputPort: (portId: string) => void;
  setOutputPort: (portId: string) => void;
  splitPoint: number;
  setSplitPoint: (note: number) => void;
}

// --- Mock Objects ---
let mockMidiInput1: MIDIInput;
let mockMidiInput2: MIDIInput;
let mockMidiOutput1: MIDIOutput;

beforeEach(() => {
  // Clear DOM and mocks
  cleanup();
  vi.clearAllMocks();
  vi.resetModules();

  // Mock window.addEventListener and window.removeEventListener
  vi.spyOn(window, 'addEventListener');
  vi.spyOn(window, 'removeEventListener');

  // Remove the CustomEvent stub as JSDOM provides it
  // vi.stubGlobal('CustomEvent', ...) 

  // Mock Navigator
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
  mockMidiInput2 = {
    id: 'input-2',
    name: 'Mock MIDI Interface 2',
    type: 'input',
    onmidimessage: null,
    onstatechange: null,
    open: vi.fn().mockResolvedValue(undefined),
    close: vi.fn().mockResolvedValue(undefined),
  };
  mockMidiOutput1 = {
    id: 'output-1',
    name: 'Mock MIDI Synth 1',
    type: 'output',
    send: vi.fn(),
    close: vi.fn().mockResolvedValue(undefined),
  };
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

// --- Test Component ---
const TestConsumer: React.FC<{
  children?: React.ReactNode;
  onMidiReady?: (context: MidiContextType) => void;
  onMidiMessage?: (detail: MidiMessageReceivedEventDetail) => void;
}> = ({ children, onMidiReady, onMidiMessage }) => {
  const context = useMidi();

  useEffect(() => {
    if (context && context.midiAccess && !context.loading) {
      onMidiReady?.(context);
    }
  }, [context, onMidiReady]);

  useEffect(() => {
    const handleMidiMessage = (event: Event) => {
      const customEvent = event as CustomEvent<MidiMessageReceivedEventDetail>;
      onMidiMessage?.(customEvent.detail);
    };

    window.addEventListener('MIDI_MESSAGE_RECEIVED', handleMidiMessage);
    return () => {
      window.removeEventListener('MIDI_MESSAGE_RECEIVED', handleMidiMessage);
    };
  }, [onMidiMessage]);

  if (!context) return <div>Context not available</div>;

  return (
    <>
      {context.loading && <div data-testid="loading">Loading...</div>}
      {context.error && <div data-testid="error">{context.error}</div>}
      {!context.loading && !context.error && context.midiAccess && (
        <div data-testid="midi-access-granted">
          MIDI Access Granted
          <div data-testid="selected-input-port">
            {context.selectedInputPort ? context.selectedInputPort.name : 'No input selected'}
          </div>
          <div data-testid="selected-output-port">
            {context.selectedOutputPort ? context.selectedOutputPort.name : 'No output selected'}
          </div>
          {children}
        </div>
      )}
      {!context.loading && !context.error && !context.midiAccess && (
         <div>MIDI not initialized or available</div>
      )}
    </>
  );
};

// --- Tests ---
describe('MIDIProvider', () => {
  it('should show loading state initially and then render children', async () => {
    // Create a promise that we can resolve manually
    let resolveMidiAccess: (value: MIDIAccess) => void;
    const midiAccessPromise = new Promise<MIDIAccess>((resolve) => {
      resolveMidiAccess = resolve;
    });

    (navigator.requestMIDIAccess as any).mockReturnValue(midiAccessPromise);

    render(
      <MIDIProvider>
        <TestConsumer>Test Children</TestConsumer>
      </MIDIProvider>
    );

    // Assert loading state
    expect(screen.getByTestId('loading')).toBeInTheDocument();
    expect(screen.queryByText('Test Children')).not.toBeInTheDocument();

    // Resolve the promise
    await act(async () => {
      resolveMidiAccess!({
        inputs: new Map(),
        outputs: new Map(),
        onstatechange: null,
      });
    });

    // Assert loaded state
    await waitFor(() => expect(screen.queryByTestId('loading')).not.toBeInTheDocument());
    expect(screen.getByText(/Test Children/)).toBeInTheDocument();
  });

  it('should request MIDI access on mount and provide context', async () => {
    const mockMidiAccess: MIDIAccess = {
      inputs: new Map([['input-1', mockMidiInput1]]),
      outputs: new Map([['output-1', mockMidiOutput1]]),
      onstatechange: null,
    };
    (navigator.requestMIDIAccess as any).mockResolvedValue(mockMidiAccess);

    render(
      <MIDIProvider>
        <TestConsumer />
      </MIDIProvider>
    );

    await waitFor(() => expect(screen.getByTestId('midi-access-granted')).toBeInTheDocument());
    expect(navigator.requestMIDIAccess).toHaveBeenCalledTimes(1);
  });

  it('should set the first available input and output ports as selected by default', async () => {
    const mockMidiAccess = {
      inputs: new Map([
        ['input-abc', { ...mockMidiInput1, id: 'input-abc', name: 'First Keyboard' }],
        ['input-def', { ...mockMidiInput2, id: 'input-def', name: 'Second Interface' }],
      ]),
      outputs: new Map([['output-xyz', { ...mockMidiOutput1, id: 'output-xyz', name: 'First Synth' }]]),
      onstatechange: null,
    };
    (navigator.requestMIDIAccess as any).mockResolvedValue(mockMidiAccess);

    render(
      <MIDIProvider>
        <TestConsumer />
      </MIDIProvider>
    );

    await waitFor(() => expect(screen.getByTestId('selected-input-port')).toHaveTextContent('First Keyboard'));
    expect(screen.getByTestId('selected-output-port')).toHaveTextContent('First Synth');
  });

  it('should display an error message if MIDI access is denied', async () => {
    const errorMessage = 'MIDI access was denied by the user.';
    (navigator.requestMIDIAccess as any).mockRejectedValue(new Error(errorMessage));

    render(
      <MIDIProvider>
        <TestConsumer />
      </MIDIProvider>
    );

    await waitFor(() => expect(screen.getByTestId('error')).toHaveTextContent(errorMessage));
  });

  it('should handle the MIDI_MESSAGE_RECEIVED event and call the handler', async () => {
    const mockMidiAccess = {
      inputs: new Map([[mockMidiInput1.id, mockMidiInput1]]),
      outputs: new Map(),
      onstatechange: null,
    };
    (navigator.requestMIDIAccess as any).mockResolvedValue(mockMidiAccess);

    const onMidiMessageSpy = vi.fn();
    render(
      <MIDIProvider>
        <TestConsumer onMidiMessage={onMidiMessageSpy} />
      </MIDIProvider>
    );

    await waitFor(() => expect(screen.getByTestId('midi-access-granted')).toBeInTheDocument());

    const mockMidiMessageDetail: MidiMessageReceivedEventDetail = {
      data: new Uint8Array([0x90, 0x30, 0x7f]),
      timestamp: 12345,
      input: mockMidiInput1,
    };

    act(() => {
      window.dispatchEvent(new window.CustomEvent('MIDI_MESSAGE_RECEIVED', { detail: mockMidiMessageDetail }));
    });

    expect(onMidiMessageSpy).toHaveBeenCalledWith(mockMidiMessageDetail);
  });

  it('should allow setting a different input port', async () => {
    const mockMidiAccess = {
      inputs: new Map([
        ['input-1', mockMidiInput1],
        ['input-2', mockMidiInput2]
      ]),
      outputs: new Map(),
      onstatechange: null,
    };
    (navigator.requestMIDIAccess as any).mockResolvedValue(mockMidiAccess);

    let capturedContext: MidiContextType | undefined;
    render(
      <MIDIProvider>
        <TestConsumer onMidiReady={(ctx) => { capturedContext = ctx; }} />
      </MIDIProvider>
    );

    await waitFor(() => expect(capturedContext).toBeDefined());
    // Wait for default port selection
    await waitFor(() => expect(screen.getByTestId('selected-input-port')).not.toHaveTextContent('No input selected'));

    act(() => {
      capturedContext!.setInputPort('input-2');
    });

    await waitFor(() => expect(screen.getByTestId('selected-input-port')).toHaveTextContent('Mock MIDI Interface 2'));
  });

  it('should allow setting a different output port', async () => {
    const mockMidiAccess = {
      inputs: new Map(),
      outputs: new Map([['output-1', mockMidiOutput1]]),
      onstatechange: null,
    };
    (navigator.requestMIDIAccess as any).mockResolvedValue(mockMidiAccess);

    let capturedContext: MidiContextType | undefined;
    render(
      <MIDIProvider>
        <TestConsumer onMidiReady={(ctx) => { capturedContext = ctx; }} />
      </MIDIProvider>
    );

    await waitFor(() => expect(capturedContext).toBeDefined());
    // Wait for default port selection
    await waitFor(() => expect(screen.getByTestId('selected-output-port')).not.toHaveTextContent('No output selected'));

    act(() => {
      capturedContext!.setOutputPort('output-1');
    });

    await waitFor(() => expect(screen.getByTestId('selected-output-port')).toHaveTextContent('Mock MIDI Synth 1'));
  });

  it('should warn and not change selected port if an invalid input port ID is provided', async () => {
    const mockMidiAccess = {
      inputs: new Map([['input-1', mockMidiInput1]]),
      outputs: new Map(),
      onstatechange: null,
    };
    (navigator.requestMIDIAccess as any).mockResolvedValue(mockMidiAccess);
    const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    let capturedContext: MidiContextType | undefined;
    render(
      <MIDIProvider>
        <TestConsumer onMidiReady={(ctx) => { capturedContext = ctx; }} />
      </MIDIProvider>
    );

    await waitFor(() => expect(capturedContext).toBeDefined());
    // Wait for default port selection
    await waitFor(() => expect(screen.getByTestId('selected-input-port')).not.toHaveTextContent('No input selected'));

    act(() => {
      capturedContext!.setInputPort('invalid');
    });

    expect(screen.getByTestId('selected-input-port')).toHaveTextContent('Mock MIDI Keyboard 1');
    expect(consoleWarnSpy).toHaveBeenCalledWith('Input port with ID "invalid" not found.');
  });

  it('should clean up event listeners and close MIDI ports on unmount', async () => {
    const mockMidiAccess = {
      inputs: new Map([
        ['input-1', mockMidiInput1],
        ['input-2', mockMidiInput2],
      ]),
      outputs: new Map([['output-1', mockMidiOutput1]]),
      onstatechange: null,
    };
    (navigator.requestMIDIAccess as any).mockResolvedValue(mockMidiAccess);

    const { unmount } = render(
      <MIDIProvider>
        <TestConsumer />
      </MIDIProvider>
    );

    await waitFor(() => expect(screen.getByTestId('midi-access-granted')).toBeInTheDocument());
    // Wait for default port selection to ensure midiAccess is fully integrated
    await waitFor(() => expect(screen.getByTestId('selected-input-port')).not.toHaveTextContent('No input selected'));

    unmount();

    expect(window.removeEventListener).toHaveBeenCalledWith('MIDI_MESSAGE_RECEIVED', expect.any(Function));
    expect(mockMidiInput1.close).toHaveBeenCalled();
    expect(mockMidiInput2.close).toHaveBeenCalled();
    expect(mockMidiOutput1.close).toHaveBeenCalled();
  });

  it('should handle cases with no MIDI inputs or outputs gracefully', async () => {
    const mockMidiAccessNoPorts = {
      inputs: new Map(),
      outputs: new Map(),
      onstatechange: null,
    };
    (navigator.requestMIDIAccess as any).mockResolvedValue(mockMidiAccessNoPorts);

    render(
      <MIDIProvider>
        <TestConsumer />
      </MIDIProvider>
    );

    await waitFor(() => expect(screen.getByTestId('midi-access-granted')).toBeInTheDocument());
    expect(screen.getByTestId('selected-input-port')).toHaveTextContent('No input selected');
    expect(screen.getByTestId('selected-output-port')).toHaveTextContent('No output selected');
  });

  it('should initialize splitPoint to 60 and allow updating it', async () => {
    const mockMidiAccess = {
      inputs: new Map(),
      outputs: new Map(),
      onstatechange: null,
    };
    (navigator.requestMIDIAccess as any).mockResolvedValue(mockMidiAccess);

    let capturedContext: any;
    render(
      <MIDIProvider>
        <TestConsumer onMidiReady={(ctx) => { capturedContext = ctx; }} />
      </MIDIProvider>
    );

    await waitFor(() => expect(capturedContext).toBeDefined());
    expect(capturedContext.splitPoint).toBe(60);

    act(() => {
      capturedContext.setSplitPoint(48);
    });

    expect(capturedContext.splitPoint).toBe(48);
  });
});
