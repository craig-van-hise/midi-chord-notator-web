import React, { useEffect, useRef, useState } from 'react';
import { SMuFL, assignXLevels } from '../utils/notationMath';
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
  const { keySignature = 'C Major', splitPoint = 60, lut = [], updateActiveNotes } = useMidi();
  const keySignatureRef = useRef(keySignature);
  const splitPointRef = useRef(splitPoint);
  const lutRef = useRef(lut);
  
  // Data-binding state for rendering
  const [renderedNotes, setRenderedNotes] = useState<any[]>([]);
  const [ottavaLabels, setOttavaLabels] = useState<any[]>([]);
  
  // Hold Mode State Machine Variables
  const physicalKeysDown = useRef<Set<number>>(new Set());
  const isHoldModeEnabled = useRef<boolean>(false);
  const isWaitingForNewChord = useRef<boolean>(false);
  const selectedNoteIds = useRef<Set<string>>(new Set());
  const lastSelectedNoteId = useRef<string | null>(null);
  const marqueeRef = useRef<HTMLDivElement>(null);
  const dragTracker = useRef({
    isDragging: false,
    startX: 0,
    startY: 0,
  });

  
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
  const recalculateLayout = () => {
    try {
      const noteDatas = Array.from(activeNotes.current.values());
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
                note.accidentalLeft = `calc(${offsetMultiplier} * var(${STAFF_SPACE_CSS_VAR}) + ${currentCompaction}px - ${relativeShift}px)`;
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

        allNotes.push(...assigned);
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
      const pitches = Array.from(activeNotes.current.keys()).sort((a, b) => a - b);
      if (pitches.length === 0) {
        setChordSymbol("");
        setRenderedNotes([]);
        setOttavaLabels([]);
        return;
      }
      const keyName = keySignatureRef.current;
      const spellings = getChordSpelling(pitches, keyName, lutRef.current);
      const symbol = getChordSymbol(pitches, keyName, lutRef.current);
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
    const handleHoldModeChange = (event: Event) => {
      const customEvent = event as CustomEvent<{ enabled: boolean }>;
      if (!customEvent.detail) return;
      const enabled = customEvent.detail.enabled;
      isHoldModeEnabled.current = enabled;
      if (!enabled) {
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
      }
    };
    window.addEventListener('HOLD_MODE_CHANGED', handleHoldModeChange);
    return () => window.removeEventListener('HOLD_MODE_CHANGED', handleHoldModeChange);
  }, []);

  useEffect(() => {
    const handleMidiMessage = (event: Event) => {
      const customEvent = event as CustomEvent;
      const { data, panic, refresh, notes } = customEvent.detail || {};

      if (panic) {
        activeNotes.current.clear();
        physicalKeysDown.current.clear();
        isWaitingForNewChord.current = false;
        setRenderedNotes([]);
        setOttavaLabels([]);
        return;
      }

      if (refresh) {
        if (notes) {
          activeNotes.current.clear();
          notes.forEach((pitch: number) => {
            activeNotes.current.set(pitch, {
              note: pitch,
              stepOffset: 0,
              accidental: null,
              isTreble: pitch >= splitPointRef.current
            });
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
        if (isHoldModeEnabled.current && isWaitingForNewChord.current) {
          activeNotes.current.clear();
          isWaitingForNewChord.current = false;
        }
        if (!activeNotes.current.has(note)) {
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
      recalculateLayout();
    };
    window.addEventListener('MIDI_MESSAGE_RECEIVED', handleMidiMessage);
    return () => window.removeEventListener('MIDI_MESSAGE_RECEIVED', handleMidiMessage);
  }, []);

  const handlePointerDown = (e: React.PointerEvent) => {
    let noteEl = (e.target as HTMLElement).closest('[data-note-id]') as HTMLElement;
    
    // Fallback: tight radius hit-test if target isn't the note
    if (!noteEl) {
      const radius = 15;
      const notes = document.querySelectorAll('[data-note-id]');
      for (const el of notes) {
        const rect = el.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        const dist = Math.sqrt(Math.pow(e.clientX - centerX, 2) + Math.pow(e.clientY - centerY, 2));
        if (dist <= radius) {
          noteEl = el as HTMLElement;
          break;
        }
      }
    }

    if (noteEl) {
      const id = noteEl.getAttribute('data-note-id')!;
      const pitch = parseInt(noteEl.getAttribute('data-pitch') || "0");

      if (e.shiftKey && lastSelectedNoteId.current) {
        // Range Selection
        const lastEl = document.querySelector(`[data-note-id="${lastSelectedNoteId.current}"]`) as HTMLElement;
        if (lastEl) {
          const lastPitch = parseInt(lastEl.getAttribute('data-pitch') || "0");
          const min = Math.min(pitch, lastPitch);
          const max = Math.max(pitch, lastPitch);

          const allNotes = document.querySelectorAll('[data-note-id]');
          allNotes.forEach(el => {
            const p = parseInt(el.getAttribute('data-pitch') || "0");
            const noteId = el.getAttribute('data-note-id')!;
            if (p >= min && p <= max) {
              selectedNoteIds.current.add(noteId);
              (el as HTMLElement).setAttribute('data-selected', 'true');
            }
          });
        }
      } else if (e.metaKey || e.ctrlKey) {
        // Multi-Selection (Toggle)
        if (selectedNoteIds.current.has(id)) {
          selectedNoteIds.current.delete(id);
          noteEl.removeAttribute('data-selected');
        } else {
          selectedNoteIds.current.add(id);
          noteEl.setAttribute('data-selected', 'true');
        }
      } else {
        // Single Selection
        document.querySelectorAll('[data-selected="true"]').forEach(el => el.removeAttribute('data-selected'));
        selectedNoteIds.current.clear();
        
        selectedNoteIds.current.add(id);
        noteEl.setAttribute('data-selected', 'true');
      }
      lastSelectedNoteId.current = id;
    } else {
      // Clear Selection if clicking background (unless multi-selecting)
      if (!e.metaKey && !e.ctrlKey) {
        document.querySelectorAll('[data-selected="true"]').forEach(el => el.removeAttribute('data-selected'));
        selectedNoteIds.current.clear();
        lastSelectedNoteId.current = null;
      }
      
      // Start Marquee Drag
      dragTracker.current.isDragging = true;
      dragTracker.current.startX = e.clientX;
      dragTracker.current.startY = e.clientY;
      
      if (marqueeRef.current) {
        marqueeRef.current.style.display = 'none';
        marqueeRef.current.style.width = '0';
        marqueeRef.current.style.height = '0';
      }
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (selectedNoteIds.current.size === 0) return;

      const allPitches = Array.from(activeNotes.current.keys()).sort((a, b) => a - b);
      const selectedPitches = Array.from(selectedNoteIds.current)
        .map(id => parseInt(id))
        .sort((a, b) => a - b);

      if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
        const delta = e.key === 'ArrowUp' ? 1 : -1;

        if (e.shiftKey || e.metaKey || e.ctrlKey || e.altKey) {
          e.preventDefault();
          
          if (e.altKey && (e.metaKey || e.ctrlKey)) {
            // Phase 4: Voicing-Aware PCS Rotation
            const pcs = Array.from(new Set(selectedPitches.map(n => n % 12))).sort((a,b)=>a-b);
            const mutations: Map<number, number> = new Map();
            const newSelection = new Set<string>();

            selectedPitches.forEach(note => {
              const currentPC = note % 12;
              const currentPcsIndex = pcs.indexOf(currentPC);
              const nextPcsIndex = delta === 1 
                ? (currentPcsIndex + 1) % pcs.length
                : (currentPcsIndex - 1 + pcs.length) % pcs.length;
              const targetPC = pcs[nextPcsIndex];
              
              let newNote = note;
              if (delta === 1) {
                newNote++;
                while(newNote % 12 !== targetPC) { newNote++; }
              } else {
                newNote--;
                while(newNote % 12 !== targetPC) { newNote--; }
              }
              mutations.set(note, newNote);
              newSelection.add(newNote.toString());
            });
            
            const newActiveNotes = new Map(activeNotes.current);
            selectedPitches.forEach(p => newActiveNotes.delete(p));
            mutations.forEach((newNote, oldNote) => {
              const data = activeNotes.current.get(oldNote);
              if (data) newActiveNotes.set(newNote, { ...data, note: newNote });
            });

            activeNotes.current = newActiveNotes;
            selectedNoteIds.current = newSelection;
            updateSpellings();
            updateActiveNotes(Array.from(activeNotes.current.keys()));
          } else if (e.altKey) {
            // Phase 3: Diatonic Transposition
            const keyRootName = keySignatureRef.current.split(' ')[0];
            const majorPattern = [0, 2, 4, 5, 7, 9, 11];
            const rootMap: Record<string, number> = { 'C':0, 'C#':1, 'Db':1, 'D':2, 'D#':3, 'Eb':3, 'E':4, 'F':5, 'F#':6, 'Gb':6, 'G':7, 'G#':8, 'Ab':8, 'A':9, 'A#':10, 'Bb':10, 'B':11 };
            const currentRootPC = rootMap[keyRootName] ?? 0;
            const scale = majorPattern.map(p => (p + currentRootPC) % 12).sort((a, b) => a - b);

            const mutations: Map<number, number> = new Map();
            const newSelection = new Set<string>();

            selectedPitches.forEach(note => {
              let currentPC = note % 12;
              if (!scale.includes(currentPC)) {
                let closest = scale[0];
                let minDist = 12;
                scale.forEach(s => {
                   const d = Math.abs(s - currentPC);
                   if (d < minDist) { minDist = d; closest = s; }
                });
                currentPC = closest;
              }

              const currentIndex = scale.indexOf(currentPC);
              const nextIndex = (currentIndex + delta + scale.length) % scale.length;
              const targetPC = scale[nextIndex];

              let newNote = note;
              if (delta > 0) {
                newNote++;
                while(newNote % 12 !== targetPC) { newNote++; }
              } else {
                newNote--;
                while(newNote % 12 !== targetPC) { newNote--; }
              }
              mutations.set(note, newNote);
              newSelection.add(newNote.toString());
            });

            const newActiveNotes = new Map(activeNotes.current);
            selectedPitches.forEach(p => newActiveNotes.delete(p));
            mutations.forEach((newNote, oldNote) => {
              const data = activeNotes.current.get(oldNote);
              if (data) newActiveNotes.set(newNote, { ...data, note: newNote });
            });

            activeNotes.current = newActiveNotes;
            selectedNoteIds.current = newSelection;
            updateSpellings();
            updateActiveNotes(Array.from(activeNotes.current.keys()));
          } else {
            // Chromatic Transposition
            const multiplier = (e.metaKey || e.ctrlKey) ? 12 : 1;
            const shift = delta * multiplier;
            
            const mutations: Map<number, number> = new Map();
            const newSelection = new Set<string>();

            selectedPitches.forEach(pitch => {
              const newPitch = pitch + shift;
              mutations.set(pitch, newPitch);
              newSelection.add(newPitch.toString());
            });

            const newActiveNotes = new Map(activeNotes.current);
            selectedPitches.forEach(p => newActiveNotes.delete(p));
            mutations.forEach((newNote, oldNote) => {
              const data = activeNotes.current.get(oldNote);
              if (data) newActiveNotes.set(newNote, { ...data, note: newNote });
            });

            activeNotes.current = newActiveNotes;
            selectedNoteIds.current = newSelection;
            updateSpellings();
            updateActiveNotes(Array.from(activeNotes.current.keys()));
          }
        } else {
          // SELECTION TRAVERSAL
          if (selectedPitches.length === 1) {
            e.preventDefault();
            const currentIndex = allPitches.indexOf(selectedPitches[0]);
            const nextIndex = (currentIndex + delta + allPitches.length) % allPitches.length;
            const nextPitch = allPitches[nextIndex];
            
            document.querySelectorAll('[data-selected="true"]').forEach(el => el.removeAttribute('data-selected'));
            selectedNoteIds.current.clear();
            selectedNoteIds.current.add(nextPitch.toString());
            
            const nextEl = document.querySelector(`[data-note-id="${nextPitch}"]`);
            if (nextEl) nextEl.setAttribute('data-selected', 'true');
            lastSelectedNoteId.current = nextPitch.toString();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Sync selection attributes after re-render
  useEffect(() => {
    selectedNoteIds.current.forEach(id => {
      const el = document.querySelector(`[data-note-id="${id}"]`);
      if (el) el.setAttribute('data-selected', 'true');
    });
  }, [renderedNotes]);

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!dragTracker.current.isDragging) return;
    
    const currentX = e.clientX;
    const currentY = e.clientY;
    const { startX, startY } = dragTracker.current;
    
    const left = Math.min(startX, currentX);
    const top = Math.min(startY, currentY);
    const width = Math.abs(startX - currentX);
    const height = Math.abs(startY - currentY);
    
    if (marqueeRef.current) {
      if (width > 5 || height > 5) { // Small threshold
        marqueeRef.current.style.display = 'block';
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
    
    if (marqueeRef.current && marqueeRef.current.style.display === 'block') {
      const marqueeRect = marqueeRef.current.getBoundingClientRect();
      marqueeRef.current.style.display = 'none';
      
      const notes = document.querySelectorAll('[data-note-id]');
      notes.forEach(el => {
        const noteRect = el.getBoundingClientRect();
        
        // Phase 1: Center-Point Collision Math
        const noteCenterX = noteRect.left + noteRect.width / 2;
        const noteCenterY = noteRect.top + noteRect.height / 2;
        
        const isInside = 
          noteCenterX >= marqueeRect.left &&
          noteCenterX <= marqueeRect.right &&
          noteCenterY >= marqueeRect.top &&
          noteCenterY <= marqueeRect.bottom;
        
        if (isInside) {
          const id = el.getAttribute('data-note-id')!;
          selectedNoteIds.current.add(id);
          (el as HTMLElement).setAttribute('data-selected', 'true');
        }
      });
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
      data-testid="notation-canvas-container"
      className="notation-canvas-container relative w-full h-[320px] bg-white dark:bg-[#0a0a0a] overflow-visible flex items-start justify-center select-none"
    >
      <div ref={marqueeRef} className="selection-marquee" style={{ display: 'none' }} />
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
        <div id="notes-layer" className="absolute inset-0 pointer-events-none z-10">
          {renderedNotes.map(note => (
            <div 
              key={`note-${note.note}`}
              className="notation-note-container transition-all duration-75"
              style={{
                position: 'absolute',
                left: `calc(50% + ${note.xOffset || 0}px)`,
                top: `calc(50% - ${note.y}px)`,
                transform: 'translate(-50%, -50%)',
                pointerEvents: 'all',
                cursor: 'pointer'
              }}
              data-note-id={note.note.toString()}
              data-pitch={note.note}
              data-midi-note={note.note}
              data-step-offset={note.finalStep}
              data-x-offset-px={note.xOffset}
              data-x-level={note.xLevel}
              data-testid={`note-container-${note.note}`}
            >
              {/* Notehead */}
              <div className="notehead" style={{
                fontFamily: "'Bravura', sans-serif",
                fontSize: `calc(var(${STAFF_SPACE_CSS_VAR}) * 4.2)`,
                color: 'var(--accent, #aa3bff)',
                textShadow: '0 0 10px rgba(170, 59, 255, 0.3)'
              }}>
                {SMuFL.noteheadWhole}
              </div>

              {/* Accidental */}
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
                    color: 'var(--accent, #aa3bff)'
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
                    if (note.finalStep % 2 !== 0 && note.finalStep > 12) lines.push(renderLedgerLine(note.finalStep - 1));
                  } else if (note.finalStep <= 0) {
                    for (let ls = 0; ls >= note.finalStep; ls -= 2) lines.push(renderLedgerLine(ls));
                    if (note.finalStep % 2 !== 0 && note.finalStep < 0) lines.push(renderLedgerLine(note.finalStep + 1));
                  }
                } else {
                  if (note.finalStep >= 0) {
                    for (let ls = 0; ls <= note.finalStep; ls += 2) lines.push(renderLedgerLine(ls));
                    if (note.finalStep % 2 !== 0 && note.finalStep > 0) lines.push(renderLedgerLine(note.finalStep - 1));
                  } else if (note.finalStep <= -12) {
                    for (let ls = -12; ls >= note.finalStep; ls -= 2) lines.push(renderLedgerLine(ls));
                    if (note.finalStep % 2 !== 0 && note.finalStep < -12) lines.push(renderLedgerLine(note.finalStep + 1));
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
    </div>
  );
};

export default NotationCanvas;