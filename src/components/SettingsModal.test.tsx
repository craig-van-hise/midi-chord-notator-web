import React from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import SettingsModal from './SettingsModal';
import { MIDIProvider } from '../midi/MIDIProvider';

describe('SettingsModal', () => {
  beforeEach(() => {
    cleanup();
  });

  it('should render the gear icon', () => {
    render(
      <MIDIProvider>
        <SettingsModal />
      </MIDIProvider>
    );
    expect(screen.getByLabelText('Settings')).toBeInTheDocument();
  });

  it('should open the modal when the gear icon is clicked', () => {
    render(
      <MIDIProvider>
        <SettingsModal />
      </MIDIProvider>
    );
    
    const gearButton = screen.getByLabelText('Settings');
    fireEvent.click(gearButton);
    
    expect(screen.getByText('Split Point (Treble / Bass)')).toBeInTheDocument();
    expect(screen.getByRole('combobox')).toBeInTheDocument();
  });

  it('should update splitPoint when a new option is selected', () => {
    render(
      <MIDIProvider>
        <SettingsModal />
      </MIDIProvider>
    );
    
    // Open modal
    fireEvent.click(screen.getByLabelText('Settings'));
    
    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: '48' } });
    
    // Modal stays open in the new implementation until "Close" is clicked
    expect(screen.getByText('Split Point (Treble / Bass)')).toBeInTheDocument();
    
    // Click close
    fireEvent.click(screen.getByText('Close'));
    expect(screen.queryByText('Split Point (Treble / Bass)')).not.toBeInTheDocument();
  });

  it('should contain 25 options (MIDI 48 through 72)', () => {
    render(
      <MIDIProvider>
        <SettingsModal />
      </MIDIProvider>
    );
    
    fireEvent.click(screen.getByLabelText('Settings'));
    const options = screen.getAllByRole('option');
    expect(options).toHaveLength(25);
    expect(options[0]).toHaveValue('48');
    expect(options[24]).toHaveValue('72');
  });
});

