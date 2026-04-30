// src/components/KeySignatureSelector.tsx
import React from 'react';
import { useMidi } from '../midi/MIDIProvider';

const KEY_SIGNATURES = [
  'Cb Major', 'Gb Major', 'Db Major', 'Ab Major', 'Eb Major', 'Bb Major', 'F Major',
  'C Major',
  'G Major', 'D Major', 'A Major', 'E Major', 'B Major', 'F# Major', 'C# Major'
];

const KeySignatureSelector: React.FC = () => {
  const { keySignature, setKeySignature } = useMidi();

  return (
    <div className="flex items-center gap-1.5 text-xs">
      <label htmlFor="key-sig-select" className="text-gray-400 font-medium whitespace-nowrap">Key:</label>
      <select
        id="key-sig-select"
        value={keySignature}
        onChange={(e) => setKeySignature(e.target.value)}
        className="bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-gray-800 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-[#aa3bff]/30 focus:border-[#aa3bff] transition-all cursor-pointer"
      >
        {KEY_SIGNATURES.map((sig) => (
          <option key={sig} value={sig}>
            {sig}
          </option>
        ))}
      </select>
    </div>
  );
};

export default KeySignatureSelector;
