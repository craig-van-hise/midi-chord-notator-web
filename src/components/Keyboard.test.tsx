import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Keyboard from './Keyboard';

// Mock useMidi
vi.mock('../midi/MIDIProvider', () => ({
  useMidi: () => ({
    dispatchVirtualMidi: vi.fn(),
    lut: [],
    keySignature: 'C Major'
  }),
}));

describe('Keyboard Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders both TOGGLE MODE and HOLD MODE buttons', () => {
    render(<Keyboard />);
    expect(screen.getByText('TOGGLE MODE')).toBeInTheDocument();
    expect(screen.getByText('HOLD MODE')).toBeInTheDocument();
  });

  it('dispatches HOLD_MODE_CHANGED event when HOLD MODE is clicked', () => {
    const dispatchSpy = vi.spyOn(window, 'dispatchEvent');
    render(<Keyboard />);
    
    const holdModeButton = screen.getByText('HOLD MODE');
    
    // Initial render might dispatch if useEffect runs on mount (current implementation does)
    // Actually, useEffect runs on mount with isHoldModeEnabled = false
    
    fireEvent.click(holdModeButton);

    // Check for the custom event
    expect(dispatchSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'HOLD_MODE_CHANGED',
        detail: { enabled: true }
      })
    );

    fireEvent.click(holdModeButton);
    expect(dispatchSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'HOLD_MODE_CHANGED',
        detail: { enabled: false }
      })
    );
  });
});
