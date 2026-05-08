import React, { useEffect, useRef, useState } from 'react';
import { SMuFL, assignXLevels } from '../utils/notationMath';
import { useMidi } from '../midi/MIDIProvider';
import KeySignatureSelector from './KeySignatureSelector';
import { getChordSpelling, getSpellingData, getChordSymbol } from '../utils/chordSpeller';

const STAFF_SPACE_CSS_VAR = '--staff-space';

interface ActiveNoteData {
  id: string;
  note: number;
  stepOffset: number;
  accidental: string | null;
  isTreble: boolean;
}

const NotationCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [staffSpace, setStaffSpace] = useState<number>(12);
  const activeNotes = useRef<ActiveNoteData[]>([]);
  const [chordSymbol, setChordSymbol] = useState<string>("");
  const { keySignature = 'C Major', splitPoint = 60, lut = [] } = useMidi();
  const keySignatureRef = useRef(keySignature);
  const splitPointRef = useRef(splitPoint);
  const lutRef = useRef(lut);
  
  const [renderedNotes, setRenderedNotes] = useState<any[]>([]);
  const [ottavaLabels, setOttavaLabels] = useState<any[]>([]);
  const [selectedNoteIds, setSelectedNoteIds] = useState<Set<string>>(new Set());
  const lastSelectedNoteId = useRef<string | null>(null);
  const marqueeRef = useRef<HTMLDivElement>(null);
  const noteIdCounter = useRef(0);
  const dragTracker = useRef({
    isDragging: false,
    startX: 0,
    startY: 0,
    currentX: 0,
    currentY: 0
  });

  const recalculateLayout = () => {
    try {
      const allNotes: any[] = [];
      const labels: any[] = [];
      const staffSpacePx = staffSpace;
      const rectWidth = canvasRef.current?.getBoundingClientRect().width || 800;

      const trebleNotesRaw = activeNotes.current.filter(n => n.isTreble);
      const bassNotesRaw = activeNotes.current.filter(n => !n.isTreble);

      const processGroup = (notes: ActiveNoteData[], shift: number, isTreble: boolean) => {
        const sorted = [...notes].sort((a, b) => a.note - b.note);
        const xLeveled = assignXLevels(sorted.map(n => n.note));
        
        sorted.forEach((note, i) => {
          const xLevel = xLeveled[i];
          const xOffset = xLevel * (staffSpacePx * 1.2);
          const y = (note.stepOffset * (staffSpacePx / 2)) + shift;

          allNotes.push({
            ...note,
            instanceId: note.id,
            x: rectWidth / 2 + xOffset,
            y,
            xOffset,
            isTreble
          });
        });
      };

      processGroup(trebleNotesRaw, 0, true);
      processGroup(bassNotesRaw, 0, false);
      
      setRenderedNotes(allNotes);
      setOttavaLabels(labels);
    } catch (e) {
      console.error('Layout error:', e);
    }
  };

  const updateSpellings = () => {
    try {
      if (activeNotes.current.length === 0) {
        setChordSymbol("");
        setRenderedNotes([]);
        setOttavaLabels([]);
        return;
      }
      
      const pitches = [...activeNotes.current.map(n => n.note)].sort((a, b) => a - b);
      const spellings = getChordSpelling(pitches, keySignatureRef.current, lutRef.current);
      const symbol = getChordSymbol(pitches, keySignatureRef.current, lutRef.current);
      setChordSymbol(symbol);

      activeNotes.current.forEach(note => {
        const pIndex = pitches.indexOf(note.note);
        if (pIndex !== -1) {
          const { stepOffset, accidental } = getSpellingData(note.note, spellings[pIndex]);
          note.stepOffset = stepOffset;
          note.accidental = accidental;
        }
      });
      
      recalculateLayout();
    } catch (e) {
      console.error('Spelling error:', e);
    }
  };

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
      const { data, refresh, notes } = customEvent.detail;

      if (refresh) {
        if (notes) {
          const newNotes: ActiveNoteData[] = [];
          notes.forEach((pitch: number) => {
            const existing = activeNotes.current.find(n => n.note === pitch);
            newNotes.push(existing || {
              id: `note-${noteIdCounter.current++}`,
              note: pitch,
              stepOffset: 0,
              accidental: null,
              isTreble: pitch >= splitPointRef.current
            });
          });
          activeNotes.current = newNotes;
          updateSpellings();
        }
        return;
      }

      if (!data) return;
      const status = data[0];
      const note = data[1];
      const velocity = data[2];
      const isNoteOn = (status & 0xF0) === 0x90 && velocity > 0;
      const isNoteOff = (status & 0xF0) === 0x80 || ((status & 0xF0) === 0x90 && velocity === 0);

      if (isNoteOn) {
        if (!activeNotes.current.some(n => n.note === note)) {
          activeNotes.current.push({
            id: `note-${noteIdCounter.current++}`,
            note,
            stepOffset: 0,
            accidental: null,
            isTreble: note >= splitPointRef.current
          });
          updateSpellings();
        }
      } else if (isNoteOff) {
        activeNotes.current = activeNotes.current.filter(n => n.note !== note);
        updateSpellings();
      }
    };

    window.addEventListener('MIDI_MESSAGE_RECEIVED', handleMidiMessage);
    return () => window.removeEventListener('MIDI_MESSAGE_RECEIVED', handleMidiMessage);
  }, []);

  const handlePointerDown = (e: React.PointerEvent) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const pointerX = e.clientX - rect.left;
    const pointerY = e.clientY - rect.top;

    const horizontalThreshold = staffSpace * 1.5;
    const verticalThreshold = staffSpace * 0.8;
    
    const clickedNote = renderedNotes.find(note => {
      const centerX = rect.width / 2 + (note.xOffset || 0);
      const centerY = rect.height / 2 - note.y;
      return Math.abs(pointerX - centerX) < horizontalThreshold && 
             Math.abs(pointerY - centerY) < verticalThreshold;
    });

    if (clickedNote) {
      const id = clickedNote.instanceId;
      const newSelection = new Set(selectedNoteIds);

      if (e.shiftKey && lastSelectedNoteId.current) {
        const lastNote = renderedNotes.find(n => n.instanceId === lastSelectedNoteId.current);
        if (lastNote) {
          const min = Math.min(lastNote.note, clickedNote.note);
          const max = Math.max(lastNote.note, clickedNote.note);
          renderedNotes.forEach(n => {
            if (n.note >= min && n.note <= max) newSelection.add(n.instanceId);
          });
        }
      } else if (e.metaKey || e.ctrlKey) {
        if (newSelection.has(id)) newSelection.delete(id);
        else newSelection.add(id);
      } else {
        newSelection.clear();
        newSelection.add(id);
      }
      
      setSelectedNoteIds(newSelection);
      lastSelectedNoteId.current = id;
    } else {
      if (!e.metaKey && !e.ctrlKey && !e.shiftKey) {
        setSelectedNoteIds(new Set());
        lastSelectedNoteId.current = null;
      }
      dragTracker.current = { isDragging: true, startX: pointerX, startY: pointerY, currentX: pointerX, currentY: pointerY };
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!dragTracker.current.isDragging || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const currentX = e.clientX - rect.left;
    const currentY = e.clientY - rect.top;
    dragTracker.current.currentX = currentX;
    dragTracker.current.currentY = currentY;

    if (marqueeRef.current) {
      const width = Math.abs(dragTracker.current.startX - currentX);
      const height = Math.abs(dragTracker.current.startY - currentY);
      if (width > 5 || height > 5) {
        marqueeRef.current.classList.remove('hidden');
        marqueeRef.current.style.left = `${Math.min(dragTracker.current.startX, currentX)}px`;
        marqueeRef.current.style.top = `${Math.min(dragTracker.current.startY, currentY)}px`;
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
      
      const newSelection = new Set(selectedNoteIds);
      renderedNotes.forEach(note => {
        const noteX = rect.width / 2 + (note.xOffset || 0);
        const noteY = rect.height / 2 - note.y;
        if (noteX >= left && noteX <= right && noteY >= top && noteY <= bottom) {
          newSelection.add(note.instanceId);
        }
      });
      setSelectedNoteIds(newSelection);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (selectedNoteIds.size === 0) return;
      if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
        const delta = e.key === 'ArrowUp' ? 1 : -1;
        if (e.shiftKey || e.metaKey || e.ctrlKey || e.altKey) {
          e.preventDefault();
          const newActiveNotes = [...activeNotes.current];
          const newSelection = new Set<string>();

          if (e.altKey && (e.metaKey || e.ctrlKey)) {
            const selectedIndices = activeNotes.current.map((n, i) => selectedNoteIds.has(n.id) ? i : -1).filter(i => i !== -1);
            const selectedPitches = selectedIndices.map(i => activeNotes.current[i].note);
            const pcs = Array.from(new Set(selectedPitches.map(n => n % 12))).sort((a,b)=>a-b);

            selectedIndices.forEach(idx => {
              const note = activeNotes.current[idx].note;
              const currentPC = note % 12;
              const currentPcsIndex = pcs.indexOf(currentPC);
              const nextPcsIndex = delta === 1 ? (currentPcsIndex + 1) % pcs.length : (currentPcsIndex - 1 + pcs.length) % pcs.length;
              const targetPC = pcs[nextPcsIndex];
              let newNote = note + (delta === 1 ? 1 : -1);
              while(newNote % 12 !== targetPC) { newNote += (delta === 1 ? 1 : -1); }
              newActiveNotes[idx] = { ...newActiveNotes[idx], note: newNote };
              newSelection.add(newActiveNotes[idx].id);
            });
          } else if (e.altKey) {
            const selectedIndices = activeNotes.current.map((n, i) => selectedNoteIds.has(n.id) ? i : -1).filter(i => i !== -1);
            const keyRootName = keySignatureRef.current.split(' ')[0];
            const majorPattern = [0, 2, 4, 5, 7, 9, 11];
            const rootMap: Record<string, number> = { 'C':0, 'C#':1, 'Db':1, 'D':2, 'D#':3, 'Eb':3, 'E':4, 'F':5, 'F#':6, 'Gb':6, 'G':7, 'G#':8, 'Ab':8, 'A':9, 'A#':10, 'Bb':10, 'B':11 };
            const currentRootPC = rootMap[keyRootName] ?? 0;
            const scale = majorPattern.map(p => (p + currentRootPC) % 12).sort((a, b) => a - b);

            selectedIndices.forEach(idx => {
              const note = activeNotes.current[idx].note;
              let currentPC = note % 12;
              if (!scale.includes(currentPC)) {
                let closest = scale[0];
                let minDist = 12;
                scale.forEach(s => { const d = Math.abs(s - currentPC); if (d < minDist) { minDist = d; closest = s; } });
                currentPC = closest;
              }
              const currentIndex = scale.indexOf(currentPC);
              const nextIndex = (currentIndex + delta + scale.length) % scale.length;
              const targetPC = scale[nextIndex];
              let newNote = note + (delta > 0 ? 1 : -1);
              while(newNote % 12 !== targetPC) { newNote += (delta > 0 ? 1 : -1); }
              newActiveNotes[idx] = { ...newActiveNotes[idx], note: newNote };
              newSelection.add(newActiveNotes[idx].id);
            });
          } else {
            const multiplier = (e.metaKey || e.ctrlKey) ? 12 : 1;
            activeNotes.current.forEach((n, idx) => {
              if (selectedNoteIds.has(n.id)) {
                newActiveNotes[idx] = { ...n, note: n.note + delta * multiplier };
                newSelection.add(n.id);
              }
            });
          }

          activeNotes.current = newActiveNotes;
          setSelectedNoteIds(newSelection);
          updateSpellings();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedNoteIds]);

  return (
    <div 
      ref={canvasRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      className="relative w-full h-[320px] bg-white dark:bg-[#0a0a0a] rounded-lg shadow-inner overflow-hidden border border-gray-200 dark:border-white/5 cursor-crosshair touch-none"
      data-testid="notation-canvas-container"
    >
      <div className="absolute top-4 left-6 z-10 flex flex-col gap-1">
        <div className="text-[10px] uppercase tracking-widest text-neutral-400 font-medium">Grand Staff</div>
        <div className="text-xl font-bold tracking-tight text-[#aa3bff] drop-shadow-sm min-h-[1.75rem]">{chordSymbol}</div>
      </div>

      <div className="absolute top-4 right-6 z-10">
        <KeySignatureSelector />
      </div>

      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="relative w-full h-full">
          <div className="staff-group treble-staff absolute w-full" style={{ top: `calc(50% - var(${STAFF_SPACE_CSS_VAR}) * 6)` }}>
            {[0, 1, 2, 3, 4].map(i => <div key={`t-${i}`} className="staff-line w-full border-t border-black dark:border-gray-600 absolute opacity-70" style={{ top: `calc(${i} * var(${STAFF_SPACE_CSS_VAR}))` }} />)}
            <div className="treble-clef absolute left-2 text-black dark:text-gray-300" data-testid="treble-clef" style={{ top: `calc(var(${STAFF_SPACE_CSS_VAR}) * 2)`, fontSize: `calc(var(${STAFF_SPACE_CSS_VAR}) * 4)`, fontFamily: 'Bravura' }}>{SMuFL.trebleClef}</div>
          </div>

          <div className="staff-group bass-staff absolute w-full" style={{ top: `calc(50% + var(${STAFF_SPACE_CSS_VAR}) * 2)` }}>
            {[0, 1, 2, 3, 4].map(i => <div key={`b-${i}`} className="staff-line w-full border-t border-black dark:border-gray-600 absolute opacity-70" style={{ top: `calc(${i} * var(${STAFF_SPACE_CSS_VAR}))` }} />)}
            <div className="bass-clef absolute left-2 text-black dark:text-gray-300" data-testid="bass-clef" style={{ top: 0, fontSize: `calc(var(${STAFF_SPACE_CSS_VAR}) * 4)`, fontFamily: 'Bravura' }}>{SMuFL.bassClef}</div>
          </div>

          <div className="system-left-edge absolute left-0" style={{ top: `calc(50% - var(${STAFF_SPACE_CSS_VAR}) * 6)`, height: `calc(var(${STAFF_SPACE_CSS_VAR}) * 12)` }}>
            <div className="brace absolute right-[calc(100%+var(${STAFF_SPACE_CSS_VAR})*0.25)] top-[calc(var(${STAFF_SPACE_CSS_VAR})*6)] font-['Bravura'] text-[calc(var(${STAFF_SPACE_CSS_VAR})*12)] leading-none text-black dark:text-gray-300">{SMuFL.brace}</div>
            <div className="system-barline absolute left-0 w-[1.5px] h-[calc(var(${STAFF_SPACE_CSS_VAR})*12)] bg-black dark:bg-gray-600" />
          </div>
          <div className="system-right-barline absolute right-0 w-[1.5px] h-[calc(var(${STAFF_SPACE_CSS_VAR})*12)] bg-black dark:bg-gray-600" style={{ top: `calc(50% - var(${STAFF_SPACE_CSS_VAR}) * 6)` }} />

          <div className="absolute inset-0 pointer-events-none z-10" id="notes-layer">
            {renderedNotes.map((note) => (
              <div 
                key={note.instanceId}
                data-midi-note={note.note}
                data-note-id={note.note}
                data-instance-id={note.instanceId}
                data-testid={`note-container-${note.note}`}
                {...(selectedNoteIds.has(note.instanceId) ? { 'data-selected': 'true' } : {})}
                className="notation-note-container transition-all duration-75"
                style={{
                  position: 'absolute',
                  left: `calc(50% + ${note.xOffset || 0}px)`,
                  top: `calc(50% - ${note.y}px)`,
                  transform: 'translate(-50%, -50%)',
                }}
              >
                <div className="notehead" style={{ fontFamily: '"Bravura", sans-serif', fontSize: `calc(var(${STAFF_SPACE_CSS_VAR}) * 4.2)`, color: selectedNoteIds.has(note.instanceId) ? '#aa3bff' : 'inherit', textShadow: selectedNoteIds.has(note.instanceId) ? '0 0 10px rgba(170, 59, 255, 0.3)' : 'none' }}>
                  {SMuFL.noteheadBlack}
                </div>
                {note.accidental && (
                  <div className="accidental absolute right-[105%] top-1/2 -translate-y-1/2" style={{ fontFamily: '"Bravura", sans-serif', fontSize: `calc(var(${STAFF_SPACE_CSS_VAR}) * 3)` }}>
                    {note.accidental === '#' ? SMuFL.accidentalSharp : note.accidental === 'b' ? SMuFL.accidentalFlat : SMuFL.accidentalNatural}
                  </div>
                )}
                {Math.abs(note.stepOffset) >= 6 && Array.from({ length: Math.floor((Math.abs(note.stepOffset) - 4) / 2) }).map((_, i) => (
                  <div key={i} className="absolute left-1/2 -translate-x-1/2 h-[1.5px] bg-black dark:bg-gray-400 z-[-1]" style={{ width: `calc(var(${STAFF_SPACE_CSS_VAR}) * 2.5)`, top: note.stepOffset > 0 ? `calc(50% + ${(i + 1) * staffSpace}px - 1px)` : `calc(50% - ${(i + 1) * staffSpace}px - 1px)` }} />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
      <div ref={marqueeRef} className="absolute border border-blue-500 bg-blue-500/20 z-40 pointer-events-none hidden selection-marquee" />
    </div>
  );
};

export default NotationCanvas;