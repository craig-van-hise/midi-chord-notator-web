import React, { useEffect, useRef, useState } from 'react';
import { SMuFL } from '../utils/notationMath';
import { useMidi } from '../midi/MIDIProvider';
import KeySignatureSelector from './KeySignatureSelector';
import { getChordSpelling, getSpellingData, getChordSymbol } from '../utils/chordSpeller';

// Define the expected staff space from CSS variables
const STAFF_SPACE_CSS_VAR = '--staff-space';

interface ActiveNoteData {
  note: number;
  stepOffset: number;
  accidental: string | null;
  isTreble: boolean;
}

const NotationCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [staffSpace, setStaffSpace] = useState<number>(12); // Default value
  const activeNotes = useRef<Map<number, ActiveNoteData>>(new Map());
  const [chordSymbol, setChordSymbol] = useState<string>("");
  const { keySignature, splitPoint, lut } = useMidi();
  const keySignatureRef = useRef(keySignature);
  const splitPointRef = useRef(splitPoint);
  
  // Hold Mode State Machine Variables
  const physicalKeysDown = useRef<Set<number>>(new Set());
  const isHoldModeEnabled = useRef<boolean>(false);
  const isWaitingForNewChord = useRef<boolean>(false);

  
  useEffect(() => {
    keySignatureRef.current = keySignature;
    // Trigger a refresh of spellings and rendering when key signature changes
    window.dispatchEvent(new CustomEvent('MIDI_MESSAGE_RECEIVED', { detail: { refresh: true } }));
  }, [keySignature]);

  useEffect(() => {
    splitPointRef.current = splitPoint;
  }, [splitPoint]);

  useEffect(() => {
    if (lut && lut.length > 0) {
      window.dispatchEvent(new CustomEvent('MIDI_MESSAGE_RECEIVED', { detail: { refresh: true } }));
    }
  }, [lut]);
  
  useEffect(() => {
    // 1. Update staffSpace from CSS
    const updateStaffSpace = () => {
      if (canvasRef.current) {
        const computedStyle = getComputedStyle(document.documentElement);
        const spaceValue = computedStyle.getPropertyValue(STAFF_SPACE_CSS_VAR).trim();
        const parsedSpace = parseFloat(spaceValue) || 12;
        setStaffSpace(parsedSpace);
      }
    };

    updateStaffSpace();

    // 2. Hold Mode State Listener
    const handleHoldModeChange = (event: Event) => {
      const customEvent = event as CustomEvent<{ enabled: boolean }>;
      if (!customEvent.detail) return;
      const enabled = customEvent.detail.enabled;
      
      isHoldModeEnabled.current = enabled;
      
      if (!enabled) {
        // On Hold Mode Toggled OFF: Reset state and sync display with physical keys
        isWaitingForNewChord.current = false;
        activeNotes.current.clear();
        physicalKeysDown.current.forEach(note => {
          activeNotes.current.set(note, {
            note,
            stepOffset: 0,
            accidental: null,
            isTreble: note >= splitPointRef.current
          });
        });
        updateSpellings();
        renderActiveNotes();
      }
    };
    window.addEventListener('HOLD_MODE_CHANGED', handleHoldModeChange);

    // 3. MIDI Event Listener
    const applyAccidentalOffsets = (group: HTMLDivElement[], shiftedNoteIds: Set<string>) => {
      const notesWithAccidentals = group.filter(n => n.dataset.hasAccidental === 'true');
      const sorted = notesWithAccidentals.sort((a, b) => parseInt(b.dataset.stepOffset!) - parseInt(a.dataset.stepOffset!));

      const columns: number[][] = [];
      const noteAssignments = new Map<string, number>();

      sorted.forEach(noteEl => {
        let assignedColumn = 0;
        let placed = false;
        const stepOffset = parseInt(noteEl.dataset.stepOffset!);

        while (!placed) {
          if (!columns[assignedColumn]) columns[assignedColumn] = [];
          const collision = columns[assignedColumn].some(existingOffset => 
            Math.abs(existingOffset - stepOffset) <= 3
          );

          if (!collision) {
            columns[assignedColumn].push(stepOffset);
            noteAssignments.set(noteEl.dataset.midiNote!, assignedColumn);
            placed = true;
          } else {
            assignedColumn++;
          }
        }
      });

      const ACC_BASE_OFFSET = -1.5;
      const ACC_COLUMN_WIDTH = 1.2;

      sorted.forEach(noteEl => {
        const noteId = noteEl.dataset.midiNote!;
        const col = noteAssignments.get(noteId) || 0;
        
        const accidentalEl = Array.from(noteEl.children).find(child => 
          (child as HTMLDivElement).dataset.isAccidental === 'true'
        ) as HTMLDivElement;

        if (accidentalEl) {
          const offsetMultiplier = ACC_BASE_OFFSET - (col * ACC_COLUMN_WIDTH);
          const xOffsetPx = noteEl.dataset.xOffsetPx;
          
          if (xOffsetPx && xOffsetPx !== '0') {
            accidentalEl.style.left = `calc(${offsetMultiplier} * var(${STAFF_SPACE_CSS_VAR}) - ${xOffsetPx}px)`;
          } else {
            accidentalEl.style.left = `calc(${offsetMultiplier} * var(${STAFF_SPACE_CSS_VAR}))`;
          }
        }
      });
    };

    const applyNoteheadOffsets = (renderedElements: HTMLDivElement[]) => {
      const trebleNotes = renderedElements.filter(n => n.dataset.isTrebleGroup === 'true');
      const bassNotes = renderedElements.filter(n => n.dataset.isTrebleGroup === 'false');

      const processGroup = (group: HTMLDivElement[]) => {
        const shiftedIds = new Set<string>();
        const sorted = group.sort((a, b) => parseInt(a.dataset.stepOffset!) - parseInt(b.dataset.stepOffset!));
        
        const clusters: HTMLDivElement[][] = [];
        if (sorted.length === 0) return shiftedIds;

        let currentCluster: HTMLDivElement[] = [sorted[0]];
        for (let i = 1; i < sorted.length; i++) {
          const prev = parseInt(sorted[i - 1].dataset.stepOffset!);
          const curr = parseInt(sorted[i].dataset.stepOffset!);
          if (curr - prev === 1) {
            currentCluster.push(sorted[i]);
          } else {
            clusters.push(currentCluster);
            currentCluster = [sorted[i]];
          }
        }
        clusters.push(currentCluster);

        const NOTE_OFFSET_X_PX = staffSpace * 1.2;

        clusters.forEach(cluster => {
          const isDense = cluster.length >= 3 && cluster.some((el, idx) => {
            if (idx >= 2) {
              const m0 = parseInt(cluster[idx - 2].dataset.midiNote!);
              const m1 = parseInt(cluster[idx - 1].dataset.midiNote!);
              const m2 = parseInt(el.dataset.midiNote!);
              return (m2 - m1 === 1 && m1 - m0 === 1);
            }
            return false;
          });

          if (isDense) {
            // Surgical Integration: use assignXLevels for larger clusters
            const notePositions = cluster.map(el => ({
              ySteps: parseInt(el.dataset.stepOffset!),
              el: el
            }));
            const assigned = assignXLevels(notePositions);
            assigned.forEach(node => {
              const noteEl = node.el;
              const xLevel = node.xLevel || 0;
              if (xLevel === 0) {
                noteEl.style.left = '50%';
                noteEl.dataset.xOffsetPx = '0';
              } else if (xLevel === 1) {
                shiftedIds.add(noteEl.dataset.midiNote!);
                noteEl.style.left = `calc(50% + ${NOTE_OFFSET_X_PX}px + 5px)`;
                noteEl.dataset.xOffsetPx = (NOTE_OFFSET_X_PX + 5).toString();
              } else {
                shiftedIds.add(noteEl.dataset.midiNote!);
                const hasAccidental = noteEl.dataset.hasAccidental === 'true';
                const accWidth = staffSpace * 1.2;
                const extraPadding = hasAccidental ? accWidth + (xLevel * 5) : (xLevel * 5);
                const offset = (xLevel * NOTE_OFFSET_X_PX) + extraPadding;
                noteEl.style.left = `calc(50% + ${offset}px)`;
                noteEl.dataset.xOffsetPx = offset.toString();
              }
            });
          } else {
            cluster.forEach((noteEl, i) => {
              if (i % 2 === 0) {
                noteEl.style.left = '50%';
                noteEl.dataset.xOffsetPx = '0';
              } else {
                shiftedIds.add(noteEl.dataset.midiNote!);
                noteEl.style.left = `calc(50% + ${NOTE_OFFSET_X_PX}px + 5px)`;
                noteEl.dataset.xOffsetPx = (NOTE_OFFSET_X_PX + 5).toString();
              }
            });
          }
        });
        return shiftedIds;
      };

      const shiftedTreble = processGroup(trebleNotes);
      const shiftedBass = processGroup(bassNotes);

      applyAccidentalOffsets(trebleNotes, shiftedTreble);
      applyAccidentalOffsets(bassNotes, shiftedBass);
    };

    const renderActiveNotes = () => {
      try {
      const notesLayer = canvasRef.current?.querySelector('#notes-layer');
      if (!notesLayer) return;
      notesLayer.innerHTML = '';

      const noteDatas = Array.from(activeNotes.current.values());
      const trebleNotes = noteDatas.filter(n => n.isTreble);
      const bassNotes = noteDatas.filter(n => !n.isTreble);

      // Treble Transposition
      let trebleShift = 0;
      let trebleLabel: string | null = null;
      if (trebleNotes.length > 0) {
        const maxTrebleStep = Math.max(...trebleNotes.map(n => n.stepOffset));
        if (maxTrebleStep >= 28) { trebleShift = -14; trebleLabel = "15ma"; }
        else if (maxTrebleStep >= 21) { trebleShift = -7; trebleLabel = "8va"; }
      }

      // Bass Transposition
      let bassShift = 0;
      let bassLabel: string | null = null;
      if (bassNotes.length > 0) {
        const minBassStep = Math.min(...bassNotes.map(n => n.stepOffset));
        if (minBassStep <= -30) { bassShift = 14; bassLabel = "15mb"; }
        else if (minBassStep <= -23) { bassShift = 7; bassLabel = "8vb"; }
      }

      const renderedElements: HTMLDivElement[] = [];

      const renderNote = (data: ActiveNoteData, shift: number) => {
        const finalStep = data.stepOffset + shift;
        let y = (finalStep * (staffSpace / 2)) + staffSpace;
        if (!data.isTreble) {
          y -= (2 * staffSpace); // Bass Offset Shift
        }

        const noteContainer = document.createElement('div');
        noteContainer.className = 'notation-note-container transition-all duration-75';
        noteContainer.style.position = 'absolute';
        noteContainer.style.left = '50%';
        noteContainer.style.top = `calc(50% - ${y}px)`;
        noteContainer.style.transform = 'translate(-50%, -50%)';
        noteContainer.dataset.midiNote = data.note.toString();
        noteContainer.dataset.stepOffset = finalStep.toString();
        noteContainer.dataset.isTrebleGroup = data.isTreble.toString();
        noteContainer.dataset.testid = `note-container-${data.note}`;

        // Render Notehead
        const notehead = document.createElement('div');
        notehead.style.fontFamily = "'Bravura', sans-serif";
        notehead.style.fontSize = `calc(var(${STAFF_SPACE_CSS_VAR}) * 4.2)`;
        notehead.style.color = 'var(--accent, #aa3bff)';
        notehead.style.textShadow = '0 0 10px rgba(170, 59, 255, 0.3)';
        notehead.textContent = SMuFL.noteheadWhole;
        noteContainer.appendChild(notehead);

        // Render Accidental if needed
        if (data.accidental) {
          noteContainer.dataset.hasAccidental = 'true';
          const accidentalEl = document.createElement('div');
          accidentalEl.dataset.isAccidental = 'true';
          accidentalEl.style.position = 'absolute';
          accidentalEl.style.left = `calc(-1.5 * var(${STAFF_SPACE_CSS_VAR}))`;
          accidentalEl.style.top = '50%';
          accidentalEl.style.transform = 'translateY(-50%)';
          accidentalEl.style.fontFamily = "'Bravura', sans-serif";
          accidentalEl.style.fontSize = `calc(var(${STAFF_SPACE_CSS_VAR}) * 3)`;
          accidentalEl.style.color = 'var(--accent, #aa3bff)';
          accidentalEl.textContent = data.accidental;
          noteContainer.appendChild(accidentalEl);
        }

        // Render Ledger Lines if needed
        const renderLedgerLine = (lineStep: number) => {
          const yOffset = (finalStep - lineStep) * (staffSpace / 2);
          const line = document.createElement('div');
          line.className = 'absolute left-1/2 -translate-x-1/2 h-[1.5px] bg-black dark:bg-gray-400 z-[-1]';
          line.style.width = `calc(var(${STAFF_SPACE_CSS_VAR}) * 2.5)`;
          line.style.top = `calc(50% + ${yOffset}px - 1px)`;
          line.dataset.testid = `ledger-line-${lineStep}`;
          noteContainer.appendChild(line);
        };

        if (data.isTreble) {
          if (finalStep >= 12) {
            for (let ls = 12; ls <= finalStep; ls += 2) renderLedgerLine(ls);
            if (finalStep % 2 !== 0 && finalStep > 12) renderLedgerLine(finalStep - 1);
          } else if (finalStep <= 0) {
            for (let ls = 0; ls >= finalStep; ls -= 2) renderLedgerLine(ls);
            if (finalStep % 2 !== 0 && finalStep < 0) renderLedgerLine(finalStep + 1);
          }
        } else {
          if (finalStep >= 0) {
            for (let ls = 0; ls <= finalStep; ls += 2) renderLedgerLine(ls);
            if (finalStep % 2 !== 0 && finalStep > 0) renderLedgerLine(finalStep - 1);
          } else if (finalStep <= -12) {
            for (let ls = -12; ls >= finalStep; ls -= 2) renderLedgerLine(ls);
            if (finalStep % 2 !== 0 && finalStep < -12) renderLedgerLine(finalStep + 1);
          }
        }

        notesLayer.appendChild(noteContainer);
        renderedElements.push(noteContainer);
        return { noteContainer, finalStep, y };
      };

      const trebleResults = trebleNotes.map(n => renderNote(n, trebleShift));
      const bassResults = bassNotes.map(n => renderNote(n, bassShift));

      applyNoteheadOffsets(renderedElements);

      // Ottava Labels
      if (trebleLabel && trebleResults.length > 0) {
        const highestTreble = trebleResults.reduce((prev, curr) => (curr.finalStep > prev.finalStep) ? curr : prev);
        const labelEl = document.createElement('div');
        labelEl.textContent = trebleLabel;
        labelEl.className = "ottava-label absolute font-serif italic text-black dark:text-gray-300 pointer-events-none whitespace-nowrap -translate-x-1/2 left-1/2";
        labelEl.style.fontSize = `calc(var(${STAFF_SPACE_CSS_VAR}) * 1.5)`;
        labelEl.style.top = `calc(50% - ${highestTreble.y}px - var(${STAFF_SPACE_CSS_VAR}) * 2.8)`;
        notesLayer.appendChild(labelEl);
      }

      if (bassLabel && bassResults.length > 0) {
        const lowestBass = bassResults.reduce((prev, curr) => (curr.finalStep < prev.finalStep) ? curr : prev);
        const labelEl = document.createElement('div');
        labelEl.textContent = bassLabel;
        labelEl.className = "ottava-label absolute font-serif italic text-black dark:text-gray-300 pointer-events-none whitespace-nowrap -translate-x-1/2 left-1/2";
        labelEl.style.fontSize = `calc(var(${STAFF_SPACE_CSS_VAR}) * 1.5)`;
        labelEl.style.top = `calc(50% - ${lowestBass.y}px + var(${STAFF_SPACE_CSS_VAR}) * 0.8)`;
        notesLayer.appendChild(labelEl);
      }
    } catch (e) {
      console.error('Error rendering active notes:', e);
    }
    };

    const updateSpellings = () => {
      try {
        const pitches = Array.from(activeNotes.current.keys()).sort((a, b) => a - b);
        if (pitches.length === 0) {
          setChordSymbol("");
          return;
        }

        // Extract root key name (e.g., "Eb Major" -> "Eb")
        const keyName = keySignatureRef.current;
        const spellings = getChordSpelling(pitches, keyName, lut);
        const symbol = getChordSymbol(pitches, keyName, lut);
        setChordSymbol(symbol);

        pitches.forEach((pitch, i) => {
          const { stepOffset, accidental } = getSpellingData(pitch, spellings[i]);
          activeNotes.current.set(pitch, {
            note: pitch,
            stepOffset,
            accidental,
            isTreble: pitch >= splitPointRef.current
          });
        });
      } catch (e) {
        console.error('Error updating spellings:', e);
      }
    };

    const handleMidiMessage = (event: Event) => {
      const customEvent = event as CustomEvent;
      const { data, panic, refresh } = customEvent.detail || {};

      if (panic) {
        activeNotes.current.clear();
        physicalKeysDown.current.clear();
        isWaitingForNewChord.current = false;
        renderActiveNotes();
        return;
      }

      if (refresh) {
        updateSpellings();
        renderActiveNotes();
        return;
      }

      if (!data || !(data instanceof Uint8Array) || data.length < 3) return;

      const status = data[0];
      const note = data[1];
      const velocity = data[2];

      const isNoteOn = (status & 0xF0) === 0x90 && velocity > 0;
      const isNoteOff = (status & 0xF0) === 0x80 || ((status & 0xF0) === 0x90 && velocity === 0);

      if (isNoteOn) {
        physicalKeysDown.current.add(note);

        if (isHoldModeEnabled.current && isWaitingForNewChord.current) {
          activeNotes.current.clear();
          isWaitingForNewChord.current = false;
        }

        if (!activeNotes.current.has(note)) {
          // Temporarily set with default spelling, will be updated by updateSpellings()
          activeNotes.current.set(note, {
            note,
            stepOffset: 0,
            accidental: null,
            isTreble: note >= splitPointRef.current
          });
          updateSpellings();
        }
      } else if (isNoteOff) {
        physicalKeysDown.current.delete(note);

        if (!isHoldModeEnabled.current) {
          if (activeNotes.current.has(note)) {
            activeNotes.current.delete(note);
            updateSpellings();
          }
        }

        if (isHoldModeEnabled.current && physicalKeysDown.current.size === 0) {
          isWaitingForNewChord.current = true;
        }
      }
      renderActiveNotes();
    };

    window.addEventListener('MIDI_MESSAGE_RECEIVED', handleMidiMessage);

    return () => {
      window.removeEventListener('HOLD_MODE_CHANGED', handleHoldModeChange);
      window.removeEventListener('MIDI_MESSAGE_RECEIVED', handleMidiMessage);
    };
  }, [staffSpace, lut]);

  if (!lut || lut.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[320px] bg-white dark:bg-[#0a0a0a] rounded-lg border border-gray-100 dark:border-white/5">
        <div className="animate-pulse flex flex-col items-center">
          <div className="h-2 w-24 bg-[#aa3bff]/20 rounded-full mb-4"></div>
          <div className="text-neutral-400 text-xs font-medium tracking-widest uppercase">Loading Database</div>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={canvasRef}
      className="notation-canvas-container relative w-full h-[320px] bg-white dark:bg-[#0a0a0a] overflow-visible flex items-start justify-center"
    >
      {/* Compact Grand Staff System */}
      <div className="grand-staff-system relative w-[300px] h-full flex flex-col justify-center items-center">
        {/* Key Signature Selector - Absolute Positioned */}
        <div className="absolute top-1/2 -translate-y-1/2 right-[100%] mr-8 z-20">
          <KeySignatureSelector />
        </div>

        {/* Chord Symbol Label */}
        {chordSymbol && (
          <div 
            className="absolute top-1/2 -translate-y-1/2 left-[100%] ml-8 text-2xl font-bold text-[#aa3bff] dark:text-[#c084fc] pointer-events-none whitespace-nowrap"
            style={{ 
              fontFamily: "'Quicksand', sans-serif",
              textShadow: '0 0 15px rgba(170, 59, 255, 0.2)'
            }}
          >
            {chordSymbol}
          </div>
        )}
        
        {/* Notes Layer */}
        <div id="notes-layer" className="absolute inset-0 pointer-events-none z-10" />

        {/* Treble Staff */}
        <div className="staff-group treble-staff absolute w-full" style={{ top: 'calc(50% - var(--staff-space) * 6)' }}>
          {[0, 1, 2, 3, 4].map(i => (
            <div key={`treble-line-${i}`} className="staff-line w-full border-t border-black dark:border-gray-600 absolute opacity-70" style={{ top: `calc(${i} * var(--staff-space))` }} />
          ))}
          <div data-testid="treble-clef" className="treble-clef absolute left-2 text-black dark:text-gray-300" style={{ top: 'calc(var(--staff-space) * 2)', fontSize: 'calc(var(--staff-space) * 4)', fontFamily: 'Bravura' }}>{'\uE050'}</div>
        </div>

        {/* Bass Staff */}
        <div className="staff-group bass-staff absolute w-full" style={{ top: 'calc(50% + var(--staff-space) * 2)' }}>
          {[0, 1, 2, 3, 4].map(i => (
            <div key={`bass-line-${i}`} className="staff-line w-full border-t border-black dark:border-gray-600 absolute opacity-70" style={{ top: `calc(${i} * var(--staff-space))` }} />
          ))}
          <div data-testid="bass-clef" className="bass-clef absolute left-2 text-black dark:text-gray-300" style={{ top: 'calc(var(--staff-space) * 0)', fontSize: 'calc(var(--staff-space) * 4)', fontFamily: 'Bravura' }}>{'\uE062'}</div>
        </div>

        {/* Brace and System Barlines */}
        <div className="system-left-edge absolute left-0 h-[calc(var(--staff-space)*12)]" style={{ top: 'calc(50% - var(--staff-space) * 6)' }}>
          <div className="brace absolute right-[calc(100%+var(--staff-space)*0.25)] top-[calc(var(--staff-space)*6)] font-['Bravura'] text-[calc(var(--staff-space)*12)] leading-none text-black dark:text-gray-300">{'\uE000'}</div>
          <div className="system-barline absolute left-0 w-[1.5px] h-[calc(var(--staff-space)*12)] bg-black dark:bg-gray-600" />
        </div>

        {/* Right System Barline */}
        <div className="system-right-barline absolute right-0 w-[1.5px] h-[calc(var(--staff-space)*12)] bg-black dark:bg-gray-600" style={{ top: 'calc(50% - var(--staff-space) * 6)' }} />

        {/* Middle C reference line (invisible but for alignment) */}
        <div className="absolute w-full h-0 border-t border-transparent" style={{ top: '50%' }} />

      </div>
    </div>
  );
};

export default NotationCanvas;