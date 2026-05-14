import React, { useEffect, useRef, useState } from 'react';
import { SMuFL, assignXLevels, transposeDiatonically, calculateWriteModePitch, type AccidentalOverride, getNoteNameFromPosition } from '../utils/notationMath';
import { useMidi } from '../midi/MIDIProvider';
import KeySignatureSelector from './KeySignatureSelector';
import { getChordSpelling, getSpellingData, getChordSymbol } from '../utils/chordSpeller';
import { audioEngine } from '../audio/engine';
import * as Tone from 'tone';

// Define the expected staff space from CSS variables
const STAFF_SPACE_CSS_VAR = '--staff-space';

interface ActiveNoteData {
  id: string;
  note: number;
  stepOffset: number;
  accidental: string | null;
  isTreble: boolean;
  sourceMidi?: number;
  spellingOverride?: string;
  spellingString?: string;
  [key: string]: any; // Preserve MIDI metadata (velocity, etc.)
}

const generateId = () => {
  try {
    return crypto.randomUUID();
  } catch (e) {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
  }
};

const NotationCanvas: React.FC = () => {
  const [tick, setTick] = useState(0);
  const forceUpdate = () => setTick(t => t + 1);
  const canvasRef = useRef<HTMLDivElement>(null);
  const [staffSpace, setStaffSpace] = useState<number>(12); // Default value
  const activeNotes = useRef<ActiveNoteData[]>([]);
  const [chordSymbol, setChordSymbol] = useState<string>("");
  const { keySignature = 'C Major', splitPoint = 60, lut = [], updateActiveNotes, isToggleModeActive, isHoldModeActive, setSelectedNotes } = useMidi();
  const keySignatureRef = useRef(keySignature);
  const splitPointRef = useRef(splitPoint);
  const lutRef = useRef(lut);
  
  // Data-binding state for rendering
  const [renderedNotes, setRenderedNotes] = useState<any[]>([]);
  const [ottavaLabels, setOttavaLabels] = useState<any[]>([]);
  
  // Hold Mode State Machine Variables
  const physicalKeysDown = useRef<Set<number>>(new Set());
  const isWaitingForNewChord = useRef<boolean>(false);
  const selectedNoteIds = useRef<Set<string>>(new Set());
  const lastSelectedNoteId = useRef<string | null>(null);
  const marqueeRef = useRef<HTMLDivElement>(null);
  const dragTracker = useRef({
    isDragging: false,
    startX: 0,
    startY: 0,
    currentX: 0,
    currentY: 0,
  });
  
  const undoStack = useRef<ActiveNoteData[][]>([]);
  const redoStack = useRef<ActiveNoteData[][]>([]);
  const isWriteMode = useRef<boolean>(false);
  const lastPointerY = useRef<number>(0);
  const activePreviews = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  
  const [accidentalOverride, setAccidentalOverride] = useState<AccidentalOverride>(null);
  const accidentalOverrideRef = useRef<AccidentalOverride>(null);

  useEffect(() => {
    accidentalOverrideRef.current = accidentalOverride;
  }, [accidentalOverride]);

  const handleFlatClick = () => setAccidentalOverride(prev => prev === 'b' ? 'bb' : prev === 'bb' ? null : 'b');
  const handleNaturalClick = () => setAccidentalOverride(prev => prev === 'n' ? null : 'n');
  const handleSharpClick = () => setAccidentalOverride(prev => prev === '#' ? 'x' : prev === 'x' ? null : '#');
  
  const commitState = () => {
    undoStack.current.push(activeNotes.current.map(n => ({ ...n })));
    redoStack.current = []; // Clear redo stack on new action
    if (undoStack.current.length > 50) undoStack.current.shift(); // Max 50 states
  };
  
  const playPreviewNotes = (noteStrings: string[], interrupt: boolean = true, velocity: number = 100) => {
    if (interrupt) {
        // Force note-offs for anything currently previewing
        activePreviews.current.forEach((timeoutId, noteStr) => {
            clearTimeout(timeoutId);
            audioEngine.releaseNote(noteStr);
        });
        activePreviews.current.clear();
    }

    const normalizedVelocity = velocity / 127;

    noteStrings.forEach(noteStr => {
        audioEngine.noteOn(noteStr, normalizedVelocity);
        const timeoutId = setTimeout(() => {
            audioEngine.releaseNote(noteStr);
            activePreviews.current.delete(noteStr);
        }, 500);
        activePreviews.current.set(noteStr, timeoutId);
    });
  };

  
  // 1. Update staffSpace from CSS
  useEffect(() => {
    const updateStaffSpace = () => {
      if (canvasRef.current) {
        const computedStyle = getComputedStyle(document.documentElement);
        const spaceValue = computedStyle.getPropertyValue(STAFF_SPACE_CSS_VAR).trim();
        const parsedSpace = parseFloat(spaceValue) || 12;
        setStaffSpace(parsedSpace);
      }
    };
    updateStaffSpace();
  }, []);

  // 2. Logic functions defined in component body for access to latest state
  const snapGhostNote = (clientY: number, rect: DOMRect) => {
    const pointerY = clientY - rect.top;
    const canvasCenterY = rect.height / 2;
    const relativeY = canvasCenterY - pointerY;
    let stepOffset = 0;

    if (relativeY >= 0) {
        stepOffset = Math.round((relativeY - staffSpace) / (staffSpace / 2));
    } else {
        stepOffset = Math.round((relativeY + staffSpace) / (staffSpace / 2));
    }

    const snappedY = canvasCenterY - (((stepOffset) * (staffSpace / 2)) + (relativeY >= 0 ? staffSpace : -staffSpace));

    const ghost = document.getElementById('ghost-note');
    if (ghost) {
        ghost.classList.remove('hidden');
        ghost.style.top = `${snappedY}px`;
        (ghost as any).dataset.step = stepOffset.toString();
        
        const { midiNote, accidental } = calculateWriteModePitch(stepOffset, keySignatureRef.current, accidentalOverrideRef.current);
        (ghost as any).dataset.midiNote = midiNote.toString();
        (ghost as any).dataset.accidental = accidental === null ? 'null' : accidental;
        
        const accElement = document.getElementById('ghost-accidental');
        if (accElement) accElement.textContent = accidental || '';
    }
  };

  // --- TRANSFORMATION HELPERS ---

  const applyChromaticShift = (delta: number, stepSize: number = 1) => {
    if (selectedNoteIds.current.size === 0) return;
    commitState();
    const shift = delta * stepSize;
    const newSelection = new Set<string>();

    activeNotes.current = activeNotes.current.map((noteData) => {
      const isSelected = selectedNoteIds.current.has(noteData.id);
      if (!isSelected) return noteData;
      const newPitch = Math.max(0, Math.min(127, noteData.note + shift));
      newSelection.add(noteData.id);
      return { ...noteData, note: newPitch, spellingOverride: undefined };
    });

    selectedNoteIds.current = newSelection;
    updateSpellings();
    updateActiveNotes?.([...activeNotes.current]);
    recalculateLayout();

    // Audio Preview
    const transposedStrings = Array.from(selectedNoteIds.current)
      .map(id => activeNotes.current.find(n => n.id === id)?.note)
      .filter((n): n is number => typeof n === 'number')
      .map(pitch => Tone.Frequency(pitch, "midi").toNote());
    if (transposedStrings.length > 0) playPreviewNotes(transposedStrings, true);
  };

  const applyDiatonicShift = (delta: number, stepSize: number = 1) => {
    if (selectedNoteIds.current.size === 0) return;
    commitState();
    const keyName = keySignatureRef.current;
    const newSelection = new Set<string>();

    activeNotes.current = activeNotes.current.map((noteData) => {
      const isSelected = selectedNoteIds.current.has(noteData.id);
      if (!isSelected) return noteData;
      const newMidiNote = transposeDiatonically(noteData.stepOffset, delta * stepSize, keyName);
      newSelection.add(noteData.id);
      return { ...noteData, note: newMidiNote, spellingOverride: undefined };
    });

    selectedNoteIds.current = newSelection;
    updateSpellings();
    updateActiveNotes?.([...activeNotes.current]);
    recalculateLayout();

    // Audio Preview
    const transposedStrings = Array.from(selectedNoteIds.current)
      .map(id => activeNotes.current.find(n => n.id === id)?.note)
      .filter((n): n is number => typeof n === 'number')
      .map(pitch => Tone.Frequency(pitch, "midi").toNote());
    if (transposedStrings.length > 0) playPreviewNotes(transposedStrings, true);
  };

  const applyPcsRotation = (delta: number, stepSize: number = 1) => {
    if (selectedNoteIds.current.size === 0) return;
    commitState();
    
    // Voicing-Aware PCS Rotation
    const selectedEntries = Array.from(selectedNoteIds.current).map(id => {
      const noteData = activeNotes.current.find(n => n.id === id);
      return { id, pitch: noteData ? noteData.note : 0 };
    }).filter(en => en.pitch !== 0).sort((a, b) => a.pitch - b.pitch);

    const pcs = Array.from(new Set(selectedEntries.map(se => se.pitch % 12))).sort((a,b)=>a-b);
    if (pcs.length === 0) return;

    const pcOverrides: Record<number, string> = {};
    activeNotes.current.forEach(n => {
        if (n.spellingOverride) pcOverrides[n.note % 12] = n.spellingOverride;
    });

    const newSelection = new Set<string>();
    const totalDelta = delta * stepSize;

    activeNotes.current = activeNotes.current.map((noteData) => {
      const isSelected = selectedNoteIds.current.has(noteData.id);
      if (!isSelected) return noteData;

      const note = noteData.note;
      const currentPC = note % 12;
      const currentPcsIndex = pcs.indexOf(currentPC);
      
      // Calculate rotation index with wrap-around
      const nextPcsIndex = (currentPcsIndex + totalDelta + (pcs.length * Math.abs(totalDelta))) % pcs.length;
      const targetPC = pcs[nextPcsIndex];
      
      let newNote = note;
      if (totalDelta > 0) {
        newNote++;
        while(newNote % 12 !== targetPC) { newNote++; }
      } else if (totalDelta < 0) {
        newNote--;
        while(newNote % 12 !== targetPC) { newNote--; }
      }
      
      newSelection.add(noteData.id);
      return { ...noteData, note: newNote, spellingOverride: pcOverrides[targetPC] };
    });

    selectedNoteIds.current = newSelection;
    updateSpellings();
    updateActiveNotes?.([...activeNotes.current]);
    recalculateLayout();

    // Audio Preview
    const transposedStrings = Array.from(selectedNoteIds.current)
      .map(id => activeNotes.current.find(n => n.id === id)?.note)
      .filter((n): n is number => typeof n === 'number')
      .map(pitch => Tone.Frequency(pitch, "midi").toNote());
    if (transposedStrings.length > 0) playPreviewNotes(transposedStrings, true);
  };

  const undo = () => {
    if (undoStack.current.length > 0) {
      redoStack.current.push(activeNotes.current.map(n => ({ ...n })));
      activeNotes.current = undoStack.current.pop() || [];
      selectedNoteIds.current.clear();
      updateSpellings();
      updateActiveNotes?.([...activeNotes.current]);
      recalculateLayout();
    }
  };

  const redo = () => {
    if (redoStack.current.length > 0) {
      undoStack.current.push(activeNotes.current.map(n => ({ ...n })));
      activeNotes.current = redoStack.current.pop() || [];
      selectedNoteIds.current.clear();
      updateSpellings();
      updateActiveNotes?.([...activeNotes.current]);
      recalculateLayout();
    }
  };

  const applyHome = () => {
    if (undoStack.current.length > 0) {
      // Revert to first state in history
      const homeState = undoStack.current[0];
      activeNotes.current = homeState ? homeState.map(n => ({ ...n })) : [];
      undoStack.current = homeState ? [[...homeState]] : [];
      redoStack.current = [];
      selectedNoteIds.current.clear();
      updateSpellings();
      updateActiveNotes?.([...activeNotes.current]);
      recalculateLayout();
    }
  };

  const recalculateLayout = () => {
    try {
      const noteDatas = activeNotes.current;
      if (noteDatas.length === 0) {
        setRenderedNotes([]);
        setOttavaLabels([]);
        return;
      }

      const trebleNotesRaw = noteDatas.filter(n => n.isTreble);
      const bassNotesRaw = noteDatas.filter(n => !n.isTreble);

      let trebleShift = 0;
      let trebleLabelText: string | null = null;
      if (trebleNotesRaw.length > 0) {
        const maxTrebleStep = Math.max(...trebleNotesRaw.map(n => n.stepOffset));
        if (maxTrebleStep >= 28) { trebleShift = -14; trebleLabelText = "15ma"; }
        else if (maxTrebleStep >= 21) { trebleShift = -7; trebleLabelText = "8va"; }
      }

      let bassShift = 0;
      let bassLabelText: string | null = null;
      if (bassNotesRaw.length > 0) {
        const minBassStep = Math.min(...bassNotesRaw.map(n => n.stepOffset));
        if (minBassStep <= -30) { bassShift = 14; bassLabelText = "15mb"; }
        else if (minBassStep <= -23) { bassShift = 7; bassLabelText = "8vb"; }
      }



      const labels: any[] = [];
      const allNotes: any[] = [];
      const NOTE_OFFSET_X_PX = staffSpace * 1.2;
      const PADDING_PX = 5;
      const ACC_WIDTH_PX = staffSpace * 1.2;

      const processGroup = (rawNotes: ActiveNoteData[], shift: number, isTreble: boolean) => {
        const groupNotes = rawNotes.map(n => ({
          ...n,
          finalStep: n.stepOffset + shift,
          y: ((n.stepOffset + shift) * (staffSpace / 2)) + staffSpace - (!isTreble ? (2 * staffSpace) : 0),
          ySteps: n.stepOffset + shift,
        }));

        const assignedRaw = assignXLevels(groupNotes);
        // Clone objects to ensure React detects mutations as state changes
        const assigned = assignedRaw.map(n => ({ ...n }));
        
        const leftNotes = assigned.filter(n => !n.isRightColumn);
        const rightNotes = assigned.filter(n => n.isRightColumn);

        let rightBaseX = 0;
        if (rightNotes.length > 0) {
          let leftMaxX = 0;
          // We need to calculate left offsets first to know leftMaxX
          const leftLevelOffsets: Record<number, number> = { 0: 0 };
          leftNotes.sort((a, b) => (a.xLevel || 0) - (b.xLevel || 0));
          leftNotes.forEach(note => {
            const L = note.xLevel || 0;
            if (L === 0) {
              note.xOffset = 0;
            } else if (L === 1) {
              note.xOffset = NOTE_OFFSET_X_PX + PADDING_PX;
              leftLevelOffsets[1] = note.xOffset;
            } else {
              const prevOffset = leftLevelOffsets[L-1] || leftLevelOffsets[0];
              const hasAccidental = !!note.accidental || note.forceAccidentalDisplay;
              const offset = prevOffset + NOTE_OFFSET_X_PX + PADDING_PX + (hasAccidental ? ACC_WIDTH_PX : 0);
              note.xOffset = offset;
              leftLevelOffsets[L] = Math.max(leftLevelOffsets[L] || 0, offset);
            }
          });

          leftNotes.forEach(n => {
            const rightEdge = (n.xOffset || 0) + NOTE_OFFSET_X_PX;
            if (rightEdge > leftMaxX) leftMaxX = rightEdge;
          });

          // Pre-calculate Right Stack Accidental Reach
          let maxRightAccReachPx = 0;
          const rightAccNotesForReach = rightNotes.filter(n => !!n.accidental || n.forceAccidentalDisplay);
          if (rightAccNotesForReach.length > 0) {
            const sortedRightAcc = [...rightAccNotesForReach].sort((a, b) => b.finalStep - a.finalStep);
            const rightColumns: number[][] = [];
            sortedRightAcc.forEach(note => {
              let col = 0;
              let placed = false;
              while (!placed) {
                if (!rightColumns[col]) rightColumns[col] = [];
                if (!rightColumns[col].some(existingStep => Math.abs(existingStep - note.finalStep) <= 3)) {
                  rightColumns[col].push(note.finalStep);
                  placed = true;
                } else { col++; }
              }
            });
            const maxCol = rightColumns.length - 1;
            // 1.5 base reach + 1.2 for every additional column
            maxRightAccReachPx = (1.5 + (maxCol * 1.2)) * staffSpace;
          }

          const padding = 0.8 * staffSpace;
          rightBaseX = leftMaxX + maxRightAccReachPx + padding;

          const rightLevelOffsets: Record<number, number> = { 0: rightBaseX };
          rightNotes.sort((a, b) => (a.xLevel || 0) - (b.xLevel || 0));
          rightNotes.forEach(note => {
            const L = note.xLevel || 0;
            if (L === 0) {
              note.xOffset = rightBaseX;
            } else if (L === 1) {
              note.xOffset = rightBaseX + NOTE_OFFSET_X_PX + PADDING_PX;
              rightLevelOffsets[1] = note.xOffset;
            } else {
              const prevOffset = rightLevelOffsets[L-1] || rightLevelOffsets[0];
              const hasAccidental = !!note.accidental || note.forceAccidentalDisplay;
              const offset = prevOffset + NOTE_OFFSET_X_PX + PADDING_PX + (hasAccidental ? ACC_WIDTH_PX : 0);
              note.xOffset = offset;
              rightLevelOffsets[L] = Math.max(rightLevelOffsets[L] || 0, offset);
            }
          });
        } else {
          // Standard single column processing
          const levelOffsets: Record<number, number> = { 0: 0 };
          leftNotes.sort((a, b) => (a.xLevel || 0) - (b.xLevel || 0));
          leftNotes.forEach(note => {
            const L = note.xLevel || 0;
            if (L === 0) {
              note.xOffset = 0;
            } else if (L === 1) {
              note.xOffset = NOTE_OFFSET_X_PX + PADDING_PX;
              levelOffsets[1] = note.xOffset;
            } else {
              const prevOffset = levelOffsets[L-1] || levelOffsets[0];
              const hasAccidental = !!note.accidental || note.forceAccidentalDisplay;
              const offset = prevOffset + NOTE_OFFSET_X_PX + PADDING_PX + (hasAccidental ? ACC_WIDTH_PX : 0);
              note.xOffset = offset;
              levelOffsets[L] = Math.max(levelOffsets[L] || 0, offset);
            }
          });
        }

        const notesWithAccidentals = assigned.filter(n => !!n.accidental || n.forceAccidentalDisplay);
        const ACC_BASE_OFFSET = -1.5;
        const ACC_COLUMN_WIDTH = 1.2;

        const processAccColumns = (accNotes: any[], baseX: number) => {
          const sorted = accNotes.sort((a, b) => b.finalStep - a.finalStep);
          const columns: number[][] = [];
          
          sorted.forEach(note => {
            let col = 0;
            let placed = false;
            while (!placed) {
              if (!columns[col]) columns[col] = [];
              const collision = columns[col].some(existingStep => Math.abs(existingStep - note.finalStep) <= 3);
              if (!collision) {
                columns[col].push(note.finalStep);
                const offsetMultiplier = ACC_BASE_OFFSET - (col * ACC_COLUMN_WIDTH);
                
                // Compaction: Bring accidentals slightly closer to noteheads
                const compactionOffset = 0.15 * staffSpace;
                const currentCompaction = (baseX > 0) ? compactionOffset : 0; // Apply to Right Stack
                
                // Calculate position relative to the note's xOffset, but anchored to the stack's baseX
                const relativeShift = (note.xOffset || 0) - baseX;
                const leftStr = `${offsetMultiplier} * var(${STAFF_SPACE_CSS_VAR})`;
                const compactionStr = currentCompaction !== 0 ? ` + ${currentCompaction.toFixed(1)}px` : '';
                const shiftStr = relativeShift !== 0 ? ` - ${relativeShift}px` : '';
                note.accidentalLeft = (compactionStr || shiftStr) ? `calc(${leftStr}${compactionStr}${shiftStr})` : `calc(${leftStr})`;
                placed = true;
              } else {
                col++;
              }
            }
          });
        };

        const leftAccNotes = notesWithAccidentals.filter(n => !n.isRightColumn);
        const rightAccNotes = notesWithAccidentals.filter(n => n.isRightColumn);

        processAccColumns(leftAccNotes, 0);
        if (rightNotes.length > 0) {
          // Use the EXACT same rightBaseX calculated above
          processAccColumns(rightAccNotes, rightBaseX);
        }

        assigned.forEach(n => {
          if (!allNotes.some(existing => existing.id === n.id)) {
            allNotes.push(n);
          }
        });
        if (isTreble && trebleLabelText && assigned.length > 0) {
          const highest = assigned.reduce((prev, curr) => (curr.finalStep > prev.finalStep) ? curr : prev);
          labels.push({ text: trebleLabelText, y: highest.y, type: 'treble', offset: -staffSpace * 2.8 });
        }
        if (!isTreble && bassLabelText && assigned.length > 0) {
          const lowest = assigned.reduce((prev, curr) => (curr.finalStep < prev.finalStep) ? curr : prev);
          labels.push({ text: bassLabelText, y: lowest.y, type: 'bass', offset: staffSpace * 0.8 });
        }
      };

      processGroup(trebleNotesRaw, trebleShift, true);
      processGroup(bassNotesRaw, bassShift, false);
      setRenderedNotes([...allNotes]);
      setOttavaLabels([...labels]);
    } catch (e) {
      // Layout error fallback
    }
  };

  const updateSpellings = () => {
    try {
      activeNotes.current.sort((a, b) => a.note - b.note);
      const pitches = activeNotes.current.map(n => n.note);
      if (pitches.length === 0) {
        setChordSymbol("");
        setRenderedNotes([]);
        setOttavaLabels([]);
        return;
      }
      const keyName = keySignatureRef.current;
      
      const overrides: Record<number, string> = {};
      activeNotes.current.forEach(n => {
          if (n.spellingOverride) overrides[n.note] = n.spellingOverride;
      });

      const spellings = getChordSpelling(pitches, keyName, lutRef.current, overrides);
      const symbol = getChordSymbol(pitches, keyName, lutRef.current, overrides);
      setChordSymbol(symbol);

      activeNotes.current.forEach((data, i) => {
        // Save the final broadcast string
        activeNotes.current[i].spellingString = spellings[i];
        
        const { stepOffset, accidental } = getSpellingData(data.note, spellings[i]);
        activeNotes.current[i] = {
          ...data,
          stepOffset,
          accidental,
          isTreble: data.note >= splitPointRef.current
        };
      });
      recalculateLayout();
    } catch (e) {
      console.error('Error updating spellings:', e);
    }
  };

  // 3. Event Listeners and Triggers
  useEffect(() => {
    keySignatureRef.current = keySignature;
    lutRef.current = lut;
    updateSpellings();
  }, [keySignature, lut]);

  useEffect(() => {
    splitPointRef.current = splitPoint;
  }, [splitPoint]);


  useEffect(() => {
    const handleMidiMessage = (event: Event) => {
      const customEvent = event as CustomEvent;
      const { data, panic, refresh, notes } = customEvent.detail || {};

      if (panic) {
        activeNotes.current = [];
        physicalKeysDown.current.clear();
        isWaitingForNewChord.current = false;
        setRenderedNotes([]);
        setOttavaLabels([]);
        updateActiveNotes?.([]);
        return;
      }

      if (refresh) {
        if (notes) {
          activeNotes.current = notes.map((item: any) => {
            if (typeof item === 'object' && item.id) return item;
            return {
              id: generateId(),
              note: item,
              stepOffset: 0,
              accidental: null,
              isTreble: item >= splitPointRef.current,
              sourceMidi: item
            };
          });
        }
        updateSpellings();
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
        
        if (isToggleModeActive) {
           commitState();
           // Toggle Mode overrides Hold Mode's new chord flush
           const existingIndex = activeNotes.current.findIndex(n => n.note === note);
           if (existingIndex !== -1) {
               activeNotes.current.splice(existingIndex, 1);
               audioEngine.releaseNote(Tone.Frequency(note, "midi").toNote());
           } else {
               activeNotes.current.push({ id: generateId(), note, stepOffset: 0, accidental: null, isTreble: note >= splitPointRef.current, velocity: velocity || 100, channel: (status & 0x0F) || 0, status: status || 0x90, sourceMidi: note });
               audioEngine.noteOn(Tone.Frequency(note, "midi").toNote(), velocity / 127);
           }
           updateSpellings();
        } else {
            if (isHoldModeActive && isWaitingForNewChord.current) {
              commitState();
              activeNotes.current = [];
              audioEngine.releaseAll();
              isWaitingForNewChord.current = false;
            }
            if (!activeNotes.current.some(n => n.note === note)) {
              commitState();
              activeNotes.current.push({ id: generateId(), note, stepOffset: 0, accidental: null, isTreble: note >= splitPointRef.current, velocity: velocity || 100, channel: (status & 0x0F) || 0, status: status || 0x90, sourceMidi: note });
              audioEngine.noteOn(Tone.Frequency(note, "midi").toNote(), velocity / 127);
              updateSpellings();
            }
        }
        updateActiveNotes?.([...activeNotes.current]);
      } else if (isNoteOff) {
        physicalKeysDown.current.delete(note);
        
        // Only delete the note on key release if BOTH modes are OFF
        if (!isHoldModeActive && !isToggleModeActive) {
          const index = activeNotes.current.findIndex(n => n.note === note);
          if (index !== -1) {
            commitState();
            activeNotes.current.splice(index, 1);
            audioEngine.releaseNote(Tone.Frequency(note, "midi").toNote());
            updateSpellings();
          }
        }
        
        if (isHoldModeActive && physicalKeysDown.current.size === 0) {
          isWaitingForNewChord.current = true;
        }
        updateActiveNotes?.([...activeNotes.current]);
      }
      recalculateLayout();
    };
    window.addEventListener('MIDI_MESSAGE_RECEIVED', handleMidiMessage);
    return () => window.removeEventListener('MIDI_MESSAGE_RECEIVED', handleMidiMessage);
  }, []);

  // APP EVENT BRIDGE
  useEffect(() => {
    const handleTransform = (e: any) => {
      const { type, stepSize } = e.detail;

      // PRE-FLIGHT AUTO-SELECT: If no selection, select all active notes
      if (selectedNoteIds.current.size === 0 && activeNotes.current.length > 0) {
        activeNotes.current.forEach(note => selectedNoteIds.current.add(note.id));
        const allIds = Array.from(selectedNoteIds.current);
        setSelectedNotes?.(allIds.map(id => activeNotes.current.find(n => n.id === id)?.note).filter((n): n is number => n !== undefined));
        forceUpdate(); // Ensure UI highlights the newly selected notes
      }

      if (selectedNoteIds.current.size === 0) return;

      switch (type) {
        case 'SEMI_UP': applyChromaticShift(1, stepSize); break;
        case 'SEMI_DOWN': applyChromaticShift(-1, stepSize); break;
        case 'KEY_UP': applyDiatonicShift(1, stepSize); break;
        case 'KEY_DOWN': applyDiatonicShift(-1, stepSize); break;
        case 'ROT_UP': applyPcsRotation(1, stepSize); break;
        case 'ROT_DOWN': applyPcsRotation(-1, stepSize); break;
        case 'OCT_UP': applyChromaticShift(12, stepSize); break;
        case 'OCT_DOWN': applyChromaticShift(-12, stepSize); break;
      }
    };

    const handleHistory = (e: any) => {
      const { action } = e.detail;
      switch (action) {
        case 'UNDO': undo(); break;
        case 'REDO': redo(); break;
        case 'HOME': applyHome(); break;
      }
    };

    const handlePlay = (e: any) => {
      const { velocity } = e.detail;
      const selectedStrings = Array.from(selectedNoteIds.current)
        .map(id => activeNotes.current.find(n => n.id === id)?.note)
        .filter((n): n is number => typeof n === 'number')
        .map(pitch => Tone.Frequency(pitch, "midi").toNote());
      
      if (selectedStrings.length > 0) {
        playPreviewNotes(selectedStrings, true, velocity);
      }
    };

    window.addEventListener('APP_TRANSFORM', handleTransform as any);
    window.addEventListener('APP_HISTORY', handleHistory as any);
    window.addEventListener('APP_PLAY', handlePlay as any);
    return () => {
      window.removeEventListener('APP_TRANSFORM', handleTransform as any);
      window.removeEventListener('APP_HISTORY', handleHistory as any);
      window.removeEventListener('APP_PLAY', handlePlay as any);
    };
  }, []);

  // Selection Garbage Collector: Prune selected IDs that no longer exist in activeNotes
  // AND Sync global selection state
  useEffect(() => {
    const validIds = new Set(activeNotes.current.map(n => n.id));
    let changed = false;
    selectedNoteIds.current.forEach(id => {
      if (!validIds.has(id)) {
        selectedNoteIds.current.delete(id);
        changed = true;
      }
    });

    const selectedPitches = Array.from(selectedNoteIds.current)
      .map(id => activeNotes.current.find(n => n.id === id)?.note)
      .filter((n): n is number => typeof n === 'number');
    
    setSelectedNotes(selectedPitches);

    if (changed) forceUpdate();
  }, [renderedNotes, tick]); // tick ensures sync on forceUpdate calls

  const handlePointerDown = (e: React.PointerEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const pointerX = e.clientX - rect.left;
    const pointerY = e.clientY - rect.top;

    if (isWriteMode.current) {
      const isOutsideStaves = pointerX < (rect.width / 2 - 150) || pointerX > (rect.width / 2 + 150);
      if (isOutsideStaves) {
        isWriteMode.current = false;
        const ghost = document.getElementById('ghost-note');
        if (ghost) ghost.classList.add('hidden');
        forceUpdate();
        return;
      } else {
        // Write the note
        const ghost = document.getElementById('ghost-note');
        const step = parseInt((ghost as any)?.dataset.step || '0');
        const targetMidiNote = parseInt((ghost as any)?.dataset.midiNote || '60');
        const targetAccidental = (ghost as any)?.dataset.accidental === 'null' ? null : (ghost as any)?.dataset.accidental;
        const overrideString = getNoteNameFromPosition(step, targetAccidental, keySignatureRef.current);

        commitState();
        activeNotes.current.push({
            id: generateId(),
            note: targetMidiNote,
            sourceMidi: targetMidiNote,
            stepOffset: step,
            accidental: targetAccidental,
            spellingOverride: overrideString,
            isTreble: targetMidiNote >= splitPointRef.current,
            velocity: 100,
            channel: 0,
            status: 0x90
        });
        updateSpellings();
        updateActiveNotes?.([...activeNotes.current]);
        playPreviewNotes([Tone.Frequency(targetMidiNote, "midi").toNote()], false);
        return; // Early return to prevent selection logic
      }
    }
    
    // Mathematical Hit-Test
    const staffSpacePx = 10; 
    const horizontalThreshold = staffSpacePx * 1.5;
    const verticalThreshold = staffSpacePx * 0.8;
    
    
    const clickedNote = renderedNotes.find((note) => {
      const centerX = rect.width / 2 + (note.xOffset || 0);
      const centerY = rect.height / 2 - note.y;
      
      const dx = Math.abs(pointerX - centerX);
      const dy = Math.abs(pointerY - centerY);
      const match = dx < horizontalThreshold && dy < verticalThreshold;
      return match;
    });

    if (clickedNote) {
      const id = clickedNote.id;
      const pitch = clickedNote.note;

      if (e.shiftKey && lastSelectedNoteId.current) {
        // Range Selection
        const anchorNote = renderedNotes.find(n => n.id === lastSelectedNoteId.current);
        if (!anchorNote) return;
        const lastPitch = anchorNote.note;
        const min = Math.min(pitch, lastPitch);
        const max = Math.max(pitch, lastPitch);

        selectedNoteIds.current.clear();
        renderedNotes.forEach((n) => {
          if (n.note >= min && n.note <= max) {
            selectedNoteIds.current.add(n.id);
          }
        });
      } else if (e.metaKey || e.ctrlKey) {
        // Multi-Selection (Toggle)
        if (selectedNoteIds.current.has(id)) {
          selectedNoteIds.current.delete(id);
        } else {
          selectedNoteIds.current.add(id);
        }
        lastSelectedNoteId.current = id;
      } else {
        // Single Selection
        selectedNoteIds.current.clear();
        selectedNoteIds.current.add(id);
        lastSelectedNoteId.current = id;
      }
    } else {
      // Click-away deselection
      if (!e.shiftKey && !e.metaKey && !e.ctrlKey) {
        if (selectedNoteIds.current.size > 0) {
          selectedNoteIds.current.clear();
          lastSelectedNoteId.current = null;
        }
      }
    }

    if (clickedNote) {
      const selectedStrings = Array.from(selectedNoteIds.current)
        .map(id => renderedNotes.find(n => n.id === id)?.note)
        .filter((n): n is number => typeof n === 'number')
        .map(pitch => Tone.Frequency(pitch, "midi").toNote());
      
      if (selectedStrings.length > 0) {
        playPreviewNotes(selectedStrings, true);
      }
    }
    
    forceUpdate(); 

    // Initialize Marquee
    dragTracker.current = {
      isDragging: true,
      startX: pointerX,
      startY: pointerY,
      currentX: pointerX,
      currentY: pointerY,
    };
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // --- 1. GLOBAL SHORTCUTS (No selection required) ---
      
      // Escape: Exit Write Mode & Clear Selection
      if (e.key === 'Escape') {
        isWriteMode.current = false;
        const ghost = document.getElementById('ghost-note');
        if (ghost) ghost.classList.add('hidden');
        selectedNoteIds.current.clear();
        lastSelectedNoteId.current = null;
        forceUpdate();
        return;
      }

      // Shift + W: Toggle Write Mode
      if (e.key === 'W' || (e.key === 'w' && e.shiftKey)) {
        isWriteMode.current = !isWriteMode.current;
        selectedNoteIds.current.clear();
        const ghost = document.getElementById('ghost-note');
        if (isWriteMode.current && ghost && canvasRef.current) {
            // Instantly snap ghost note to last known pointer Y
            snapGhostNote(lastPointerY.current, canvasRef.current.getBoundingClientRect());
        } else if (ghost) {
            ghost.classList.add('hidden');
        }
        forceUpdate();
        return;
      }

      // Cmd/Ctrl + Z: Undo
      if (e.key === 'z' && (e.metaKey || e.ctrlKey) && !e.shiftKey) {
        e.preventDefault();
        undo();
        return;
      }

      // Cmd/Ctrl + Shift + Z (or Cmd+Y): Redo
      if (((e.key === 'Z' || e.key === 'z') && e.shiftKey && (e.metaKey || e.ctrlKey)) || (e.key === 'y' && (e.metaKey || e.ctrlKey))) {
        e.preventDefault();
        redo();
        return;
      }

      // --- 2. SELECTION-DEPENDENT SHORTCUTS ---
      if (selectedNoteIds.current.size === 0) return;

      const allPitches = activeNotes.current.map(n => n.note).sort((a, b) => a - b);
      const selectedEntries = Array.from(selectedNoteIds.current).map(id => {
        const noteData = activeNotes.current.find(n => n.id === id);
        return { 
          id, 
          pitch: noteData ? noteData.note : 0 
        };
      }).filter(en => en.pitch !== 0).sort((a, b) => a.pitch - b.pitch);

      if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
        const delta = e.key === 'ArrowUp' ? 1 : -1;

        if (e.shiftKey || e.metaKey || e.ctrlKey || e.altKey) {
          e.preventDefault();
          
          if (e.altKey && (e.metaKey || e.ctrlKey)) {
            applyPcsRotation(delta, 1);
          } else if (e.altKey) {
            applyDiatonicShift(delta, 1);
          } else {
            const multiplier = (e.metaKey || e.ctrlKey) ? 12 : 1;
            applyChromaticShift(delta, multiplier);
          }
        } else {
          // SELECTION TRAVERSAL
          if (selectedEntries.length === 1) {
            e.preventDefault();
            const currentNoteId = selectedEntries[0].id;
            const currentIndexInActive = activeNotes.current.findIndex(n => n.id === currentNoteId);
            if (currentIndexInActive === -1) return;
            
            const currentPitch = activeNotes.current[currentIndexInActive].note;
            const currentIndexInSorted = allPitches.indexOf(currentPitch);
            const nextIndexInSorted = (currentIndexInSorted + delta + allPitches.length) % allPitches.length;
            const nextPitch = allPitches[nextIndexInSorted];
            
            // Find the note object for the next pitch
            const nextNote = activeNotes.current.find(n => n.note === nextPitch);
            if (nextNote) {
              selectedNoteIds.current.clear();
              selectedNoteIds.current.add(nextNote.id);
              lastSelectedNoteId.current = nextNote.id;
              forceUpdate();
              playPreviewNotes([Tone.Frequency(nextPitch, "midi").toNote()], true);
            }
          }
        }
      }

      // Deletion
      if (e.key === 'Delete' || e.key === 'Backspace') {
          e.preventDefault();
          commitState();
          activeNotes.current = activeNotes.current.filter(n => !selectedNoteIds.current.has(n.id));
          selectedNoteIds.current.clear();
          updateSpellings();
          updateActiveNotes?.([...activeNotes.current]);
          return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);


  const handlePointerMove = (e: React.PointerEvent) => {
    lastPointerY.current = e.clientY;
    const rect = e.currentTarget.getBoundingClientRect();

    if (isWriteMode.current) {
      snapGhostNote(e.clientY, rect);
    }

    if (!dragTracker.current.isDragging) return;
    
    const currentX = e.clientX - rect.left;
    const currentY = e.clientY - rect.top;
    const { startX, startY } = dragTracker.current;
    
    dragTracker.current.currentX = currentX;
    dragTracker.current.currentY = currentY;

    const left = Math.min(startX, currentX);
    const top = Math.min(startY, currentY);
    const width = Math.abs(startX - currentX);
    const height = Math.abs(startY - currentY);
    
    if (marqueeRef.current) {
      if (width > 5 || height > 5) {
        marqueeRef.current.classList.remove('hidden');
        marqueeRef.current.style.left = `${left}px`;
        marqueeRef.current.style.top = `${top}px`;
        marqueeRef.current.style.width = `${width}px`;
        marqueeRef.current.style.height = `${height}px`;
      }
    }
  };

  const handlePointerUp = () => {
    if (!dragTracker.current.isDragging) return;
    dragTracker.current.isDragging = false;
    
    if (marqueeRef.current && !marqueeRef.current.classList.contains('hidden')) {
      const rect = canvasRef.current!.getBoundingClientRect();
      const left = Math.min(dragTracker.current.startX, dragTracker.current.currentX);
      const right = Math.max(dragTracker.current.startX, dragTracker.current.currentX);
      const top = Math.min(dragTracker.current.startY, dragTracker.current.currentY);
      const bottom = Math.max(dragTracker.current.startY, dragTracker.current.currentY);
      
      marqueeRef.current.classList.add('hidden');
      
      renderedNotes.forEach((note) => {
        const noteX = rect.width / 2 + (note.xOffset || 0);
        const noteY = rect.height / 2 - note.y;
        
        if (noteX >= left && noteX <= right && noteY >= top && noteY <= bottom) {
          selectedNoteIds.current.add(note.id);
        }
      });
      
      forceUpdate();

      const selectedStrings = Array.from(selectedNoteIds.current)
        .map(id => renderedNotes.find(n => n.id === id)?.note)
        .filter((n): n is number => typeof n === 'number')
        .map(pitch => Tone.Frequency(pitch, "midi").toNote());
      
      if (selectedStrings.length > 0) {
        playPreviewNotes(selectedStrings, true);
      }
    }
  };

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
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      onDoubleClick={() => {
        isWriteMode.current = !isWriteMode.current;
        selectedNoteIds.current.clear();
        const ghost = document.getElementById('ghost-note');
        if (isWriteMode.current && ghost && canvasRef.current) {
            snapGhostNote(lastPointerY.current, canvasRef.current.getBoundingClientRect());
        } else if (ghost) {
            ghost.classList.add('hidden');
        }
        forceUpdate();
      }}
      data-testid="notation-canvas-container"
      className="notation-canvas-container relative w-full h-[320px] bg-white dark:bg-[#0a0a0a] overflow-visible flex items-start justify-center select-none"
    >
      {/* Compact Grand Staff System */}
      <div className="grand-staff-system relative w-[300px] h-full flex flex-col justify-center items-center">
        {/* Key Signature Selector - Absolute Positioned */}
        <div className="absolute top-1/2 -translate-y-1/2 right-[100%] mr-8 z-20 flex flex-col gap-3 items-end">
          <KeySignatureSelector />
          
          {isWriteMode.current && (
            <div 
              className="flex items-center gap-1 bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-gray-800 rounded p-1 shadow-sm"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => e.stopPropagation()}
            >
              <button onClick={handleFlatClick} className={`w-8 h-8 flex items-center justify-center rounded text-[22px] font-['Bravura'] transition-colors ${accidentalOverride === 'b' || accidentalOverride === 'bb' ? 'bg-[#aa3bff]/20 text-[#aa3bff]' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'}`}>
                {accidentalOverride === 'bb' ? SMuFL.accidentalDoubleFlat : SMuFL.accidentalFlat}
              </button>
              <button onClick={handleNaturalClick} className={`w-8 h-8 flex items-center justify-center rounded text-[22px] font-['Bravura'] transition-colors ${accidentalOverride === 'n' ? 'bg-[#aa3bff]/20 text-[#aa3bff]' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'}`}>
                {SMuFL.accidentalNatural}
              </button>
              <button onClick={handleSharpClick} className={`w-8 h-8 flex items-center justify-center rounded text-[22px] font-['Bravura'] transition-colors ${accidentalOverride === '#' || accidentalOverride === 'x' ? 'bg-[#aa3bff]/20 text-[#aa3bff]' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'}`}>
                {accidentalOverride === 'x' ? SMuFL.accidentalDoubleSharp : SMuFL.accidentalSharp}
              </button>
            </div>
          )}
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
        <div id="notes-layer" data-testid="notes-layer" className="absolute inset-0 pointer-events-none z-10">
          <div id="ghost-note" className="absolute hidden pointer-events-none opacity-40 z-50 transition-none" style={{ left: '50%', transform: 'translate(-50%, -50%)' }}>
              <div id="ghost-accidental" className="absolute" style={{ left: 'calc(-1.5 * var(--staff-space))', top: '50%', transform: 'translateY(-50%)', fontFamily: "'Bravura', sans-serif", fontSize: `calc(var(--staff-space) * 3)`, color: 'var(--accent, #aa3bff)' }}></div>
              <div id="ghost-notehead" style={{ fontFamily: "'Bravura', sans-serif", fontSize: `calc(var(--staff-space) * 4.2)`, color: 'var(--accent, #aa3bff)' }}>{SMuFL.noteheadBlack}</div>
          </div>
          {renderedNotes.map(note => (
            <div 
              key={note.id}
              className="notation-note-container transition-all duration-75"
              data-midi-note={note.note}
              data-note-id={note.note}
              data-testid={`note-container-${note.note}`}
              data-selected={selectedNoteIds.current.has(note.id) || undefined}
              style={{
                position: 'absolute',
                left: note.xOffset ? `calc(50% + ${note.xOffset}px)` : '50%',
                top: note.y ? `calc(50% - ${note.y}px)` : '50%',
                transform: 'translate(-50%, -50%)',
                pointerEvents: 'none'
              }}
            >
              {/* Visual Notehead (SMuFL) */}
              <div 
                className="notehead" 
                style={{
                  fontFamily: "'Bravura', sans-serif",
                  fontSize: `calc(var(${STAFF_SPACE_CSS_VAR}) * 4.2)`,
                  color: selectedNoteIds.current.has(note.id) ? '#ef4444' : 'var(--accent, #aa3bff)',
                  textShadow: selectedNoteIds.current.has(note.id) ? '0 0 15px rgba(239, 68, 68, 0.4)' : '0 0 10px rgba(170, 59, 255, 0.3)',
                  pointerEvents: 'none',
                  transition: 'color 0.1s ease, text-shadow 0.1s ease'
                }}
              >
                {SMuFL.noteheadWhole}
              </div>

              {/* Visual Accidental (SMuFL) */}
              {(note.accidental || note.forceAccidentalDisplay) && (
                <div 
                  data-is-accidental="true"
                  style={{
                    position: 'absolute',
                    left: note.accidentalLeft || `calc(-1.5 * var(${STAFF_SPACE_CSS_VAR}))`,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    fontFamily: "'Bravura', sans-serif",
                    fontSize: `calc(var(${STAFF_SPACE_CSS_VAR}) * 3)`,
                    color: selectedNoteIds.current.has(note.id) ? '#ef4444' : 'var(--accent, #aa3bff)',
                    pointerEvents: 'none',
                    transition: 'color 0.1s ease'
                  }}
                >
                  {note.accidental || SMuFL.accidentalNatural}
                </div>
              )}

              {/* Ledger Lines */}
              {(() => {
                const lines = [];
                const renderLedgerLine = (lineStep: number) => {
                  const yOffset = (note.finalStep - lineStep) * (staffSpace / 2);
                  return (
                    <div 
                      key={`ledger-${note.note}-${lineStep}`}
                      className="absolute left-1/2 -translate-x-1/2 h-[1.5px] bg-black dark:bg-gray-400 z-[-1]"
                      style={{
                        width: `calc(var(${STAFF_SPACE_CSS_VAR}) * 2.5)`,
                        top: `calc(50% + ${yOffset}px - 1px)`
                      }}
                      data-testid={`ledger-line-${lineStep}`}
                    />
                  );
                };

                if (note.isTreble) {
                  if (note.finalStep >= 12) {
                    for (let ls = 12; ls <= note.finalStep; ls += 2) lines.push(renderLedgerLine(ls));
                  } else if (note.finalStep <= 0) {
                    for (let ls = 0; ls >= note.finalStep; ls -= 2) lines.push(renderLedgerLine(ls));
                  }
                } else {
                  if (note.finalStep >= 0) {
                    for (let ls = 0; ls <= note.finalStep; ls += 2) lines.push(renderLedgerLine(ls));
                  } else if (note.finalStep <= -12) {
                    for (let ls = -12; ls >= note.finalStep; ls -= 2) lines.push(renderLedgerLine(ls));
                  }
                }
                return lines;
              })()}
            </div>
          ))}

          {/* Ottava Labels */}
          {ottavaLabels.map((label, idx) => (
            <div 
              key={`label-${idx}`}
              className="ottava-label absolute font-serif italic text-black dark:text-gray-300 pointer-events-none whitespace-nowrap -translate-x-1/2 left-1/2"
              style={{
                fontSize: `calc(var(${STAFF_SPACE_CSS_VAR}) * 1.5)`,
                top: `calc(50% - ${label.y}px + ${label.offset}px)`
              }}
            >
              {label.text}
            </div>
          ))}
        </div>

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
      <div ref={marqueeRef} className="absolute border border-blue-500 bg-blue-500/20 z-50 pointer-events-none hidden" style={{ left: 0, top: 0, width: 0, height: 0 }} />
    </div>
  );
};

export default NotationCanvas;