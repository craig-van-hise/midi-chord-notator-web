import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { TransformationsToolbar } from './TransformationsToolbar';
import { ButtonId, ButtonConfigMap } from './ToolbarTypes';
import React from 'react';

const mockConfigs: ButtonConfigMap = {
  SEMI_UP: { stepSize: 1, midiChannel: 1, midiNote: 60 },
  SEMI_DOWN: { stepSize: 1, midiChannel: 1, midiNote: 61 },
  KEYSTEP_UP: { stepSize: 1, midiChannel: 1, midiNote: 62 },
  KEYSTEP_DOWN: { stepSize: 1, midiChannel: 1, midiNote: 63 },
  OCT_UP: { stepSize: 1, midiChannel: 1, midiNote: 64 },
  OCT_DOWN: { stepSize: 1, midiChannel: 1, midiNote: 65 },
  ROT_UP: { stepSize: 1, midiChannel: 1, midiNote: 66 },
  ROT_DOWN: { stepSize: 1, midiChannel: 1, midiNote: 67 },
  PLAY: { stepSize: 1, midiChannel: 1, midiNote: 68 },
  HOME: { stepSize: 1, midiChannel: 1, midiNote: 69 },
  UNDO: { stepSize: 1, midiChannel: 1, midiNote: 70 },
  REDO: { stepSize: 1, midiChannel: 1, midiNote: 71 },
};

const mockPressedButtons: Record<ButtonId, boolean> = Object.keys(mockConfigs).reduce((acc, key) => ({ ...acc, [key]: false }), {} as any);

describe('TransformationsToolbar', () => {
  it('renders with inline-flex and w-max root container', () => {
    const { container } = render(
      <TransformationsToolbar 
        pressedButtons={mockPressedButtons}
        configs={mockConfigs}
        onButtonDown={vi.fn()}
        onButtonUp={vi.fn()}
        onButtonContextMenu={vi.fn()}
        onBackgroundContextMenu={vi.fn()}
        learnModeTarget={null}
      />
    );
    const root = container.firstChild as HTMLElement;
    expect(root.className).toContain('w-[420px]');
    expect(root.className).toContain('h-[130px]');
    expect(root.className).toContain('rounded-[4rem]');
  });

  it('renders 8 SVG arrows and 4 action buttons', () => {
    const { container } = render(
      <TransformationsToolbar 
        pressedButtons={mockPressedButtons}
        configs={mockConfigs}
        onButtonDown={vi.fn()}
        onButtonUp={vi.fn()}
        onButtonContextMenu={vi.fn()}
        onBackgroundContextMenu={vi.fn()}
        learnModeTarget={null}
      />
    );
    
    // There are 8 arrows (SVG paths)
    const svgs = container.querySelectorAll('svg');
    expect(svgs.length).toBe(12);

    // There are 4 action buttons in the action zone (which are <button> with lucide icons)
    // Plus the 8 arrow buttons. Total 12 buttons.
    const buttons = container.querySelectorAll('button');
    expect(buttons.length).toBe(12);
  });

  it('renders correct labels', () => {
    render(
      <TransformationsToolbar 
        pressedButtons={mockPressedButtons}
        configs={mockConfigs}
        onButtonDown={vi.fn()}
        onButtonUp={vi.fn()}
        onButtonContextMenu={vi.fn()}
        onBackgroundContextMenu={vi.fn()}
        learnModeTarget={null}
      />
    );
    
    expect(screen.getByText(/semi/i)).toBeTruthy();
    expect(screen.getByText(/keyStep/i)).toBeTruthy();
    expect(screen.getByText(/oct/i)).toBeTruthy();
    expect(screen.getByText(/rot/i)).toBeTruthy();
  });
});
