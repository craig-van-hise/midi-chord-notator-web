// src/midi/MidiPortSelector.tsx

import React from 'react';
import { useMidi } from './MIDIProvider';

const MidiPortSelector: React.FC = () => {
  const {
    midiAccess,
    selectedInputPort,
    selectedOutputPort,
    loading,
    error,
    setInputPort,
    setOutputPort,
  } = useMidi();
  const selectInputRef = React.useRef<HTMLSelectElement>(null);
  const selectOutputRef = React.useRef<HTMLSelectElement>(null);

  if (loading) {
    return <div>Initializing MIDI...</div>;
  }

  if (error) {
    return <div style={{ color: 'red' }}>Error: {error}</div>;
  }

  if (!midiAccess) {
    return <div>No MIDI access available.</div>;
  }

  const inputPorts = Array.from(midiAccess.inputs.entries());
  const outputPorts = Array.from(midiAccess.outputs.entries());

  const handleInputChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (val === "") {
      setInputPort("");
      return;
    }

    const selectedPort = midiAccess.inputs.get(val);
    
    // Phase 1: Cross-state eviction
    if (selectedPort && selectedOutputPort && selectedPort.name === selectedOutputPort.name) {
      console.warn("[MIDI Intercept] Loopback detected. Evicting Output port.");
      setOutputPort(""); 
    }
    
    setInputPort(val);
  };

  const handleOutputChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (val === "") {
      setOutputPort("");
      return;
    }

    const selectedPort = midiAccess.outputs.get(val);

    // Phase 1: Ironclad rejection block
    if (selectedPort && selectedInputPort && selectedPort.name === selectedInputPort.name) {
      console.error("[MIDI Intercept] Illegal loopback attempted. Blocked.");
      return;
    }

    setOutputPort(val);
  };

  // Use the port ID for the value, or a distinct value for null/no selection.
  const selectInputVal = selectedInputPort ? selectedInputPort.id : '';
  const selectOutputVal = selectedOutputPort ? selectedOutputPort.id : '';

  return (
    <div className="flex items-center gap-4 text-xs">
      <div className="flex items-center gap-1.5">
        <label htmlFor="midi-input-select" className="text-gray-400 font-medium">In:</label>
        <select
          id="midi-input-select"
          ref={selectInputRef}
          value={selectInputVal}
          onChange={handleInputChange}
          disabled={inputPorts.length === 0}
          className="bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-gray-800 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-[#aa3bff]/30 focus:border-[#aa3bff] transition-all cursor-pointer disabled:opacity-50"
        >
          {inputPorts.length === 0 ? (
            <option value="">No input</option>
          ) : (
            <>
              <option value="">No input</option>
              {inputPorts.map(([id, port]) => (
                <option 
                  key={id} 
                  value={id}
                  disabled={selectedOutputPort?.name === port.name}
                >
                  {port.name}
                </option>
              ))}
            </>
          )}
        </select>
      </div>

      <div className="flex items-center gap-1.5">
        <label htmlFor="midi-output-select" className="text-gray-400 font-medium">Out:</label>
        <select
          id="midi-output-select"
          ref={selectOutputRef}
          value={selectOutputVal}
          onChange={handleOutputChange}
          disabled={outputPorts.length === 0}
          className="bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-gray-800 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-[#aa3bff]/30 focus:border-[#aa3bff] transition-all cursor-pointer disabled:opacity-50"
        >
          {outputPorts.length === 0 ? (
            <option value="">No output</option>
          ) : (
            <>
              <option value="">No output</option>
              {outputPorts.map(([id, port]) => (
                <option 
                  key={id} 
                  value={id}
                  disabled={selectedInputPort?.name === port.name}
                >
                  {port.name}
                </option>
              ))}
            </>
          )}
        </select>
      </div>
    </div>
  );
};

export default MidiPortSelector;
