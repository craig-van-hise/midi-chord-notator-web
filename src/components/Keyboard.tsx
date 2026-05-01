import React from 'react';
import { useMidi } from '../midi/MIDIProvider';
import { getChordSpelling } from '../utils/chordSpeller';

/**
 * 88-Key MIDI Keyboard (A0 to C8)
 * - Fixed sizing: 1248px wide (52 white keys @ 24px each)
 * - SPN Notation: Middle C (60) is C4
 * - Performance: Direct DOM manipulation via updateKeyVisuals88
 */

const WHITE_KEY_WIDTH = 18;
const WHITE_KEY_HEIGHT = 88;
const BLACK_KEY_WIDTH = 11;
const BLACK_KEY_HEIGHT = 56;

export const Piano88: React.FC = () => {
    const { dispatchVirtualMidi, lut, keySignature } = useMidi();
    const [isToggleMode, setIsToggleMode] = React.useState(false);
    const [virtualHeldNotes, setVirtualHeldNotes] = React.useState<Set<number>>(new Set());
    const activePitches = React.useRef<Set<number>>(new Set());
    const pianoKeys = [];

    // Listen for MIDI messages to update spelled notes strip
    React.useEffect(() => {
        const handleMidi = (event: Event) => {
            const detail = (event as CustomEvent).detail;
            if (!detail) return;

            if (detail.panic) {
                setVirtualHeldNotes(new Set());
                activePitches.current.clear();
                updateSpelledNotesStrip([]);
                return;
            }

            if (detail.data) {
                const [status, note, velocity] = detail.data;
                const isNoteOn = (status & 0xF0) === 0x90 && velocity > 0;
                const isNoteOff = (status & 0xF0) === 0x80 || ((status & 0xF0) === 0x90 && velocity === 0);

                if (isNoteOn) activePitches.current.add(note);
                else if (isNoteOff) activePitches.current.delete(note);

                if (lut.length > 0) {
                    const pitches = Array.from(activePitches.current).sort((a, b) => a - b);
                    const keyName = keySignature.split(' ')[0];
                    const spellings = getChordSpelling(pitches, keyName, lut);
                    
                    const spelledData = pitches.map((p, i) => ({
                        note: p,
                        spelling: spellings[i]
                    }));
                    updateSpelledNotesStrip(spelledData);
                }
            }

            if (detail.refresh && lut.length > 0) {
                const pitches = Array.from(activePitches.current).sort((a, b) => a - b);
                const keyName = keySignature.split(' ')[0];
                const spellings = getChordSpelling(pitches, keyName, lut);
                
                const spelledData = pitches.map((p, i) => ({
                    note: p,
                    spelling: spellings[i]
                }));
                updateSpelledNotesStrip(spelledData);
            }
        };

        window.addEventListener('MIDI_MESSAGE_RECEIVED', handleMidi);
        return () => window.removeEventListener('MIDI_MESSAGE_RECEIVED', handleMidi);
    }, [lut, keySignature]);

    const handleKeyInteraction = (note: number, isDown: boolean) => {
        if (isToggleMode) {
            // In toggle mode, only onPointerDown matters
            if (isDown) {
                if (virtualHeldNotes.has(note)) {
                    // Turn off
                    dispatchVirtualMidi(new Uint8Array([0x80, note, 0]));
                    setVirtualHeldNotes(prev => {
                        const next = new Set(prev);
                        next.delete(note);
                        return next;
                    });
                } else {
                    // Turn on
                    dispatchVirtualMidi(new Uint8Array([0x90, note, 100]));
                    setVirtualHeldNotes(prev => {
                        const next = new Set(prev);
                        next.add(note);
                        return next;
                    });
                }
            }
        } else {
            // Standard behavior
            if (isDown) {
                dispatchVirtualMidi(new Uint8Array([0x90, note, 100]));
            } else {
                dispatchVirtualMidi(new Uint8Array([0x80, note, 0]));
            }
        }
    };

    // Range: A0 (MIDI 21) to C8 (MIDI 108)
    for (let note = 21; note <= 108; note++) {
        const noteInOctave = note % 12;
        const isBlack = [1, 3, 6, 8, 10].includes(noteInOctave);

        if (!isBlack) {
            const hasRightBlack = [0, 2, 5, 7, 9].includes(noteInOctave) && (note + 1 <= 108);
            const isC = noteInOctave === 0;
            const octave = Math.floor(note / 12) - 1; 

            pianoKeys.push(
                <div
                    key={`w-${note}`}
                    id={`pk88-${note}`}
                    onPointerDown={(e) => {
                        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
                        handleKeyInteraction(note, true);
                    }}
                    onPointerUp={() => handleKeyInteraction(note, false)}
                    onPointerLeave={() => handleKeyInteraction(note, false)}
                    style={{
                        width: `${WHITE_KEY_WIDTH}px`,
                        height: `${WHITE_KEY_HEIGHT}px`,
                        borderLeft: '1px solid #ccc',
                        borderRight: '1px solid #ccc',
                        backgroundColor: '#fff',
                        position: 'relative',
                        boxSizing: 'border-box',
                        borderBottomLeftRadius: '3px',
                        borderBottomRightRadius: '3px',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'flex-end',
                        alignItems: 'center',
                        flexShrink: 0
                    }}
                >
                    {hasRightBlack && (
                        <div
                            id={`pk88-${note + 1}`}
                            onPointerDown={(e) => {
                                e.stopPropagation();
                                (e.target as HTMLElement).releasePointerCapture(e.pointerId);
                                handleKeyInteraction(note + 1, true);
                            }}
                            onPointerUp={(e) => { e.stopPropagation(); handleKeyInteraction(note + 1, false); }}
                            onPointerLeave={(e) => { e.stopPropagation(); handleKeyInteraction(note + 1, false); }}
                            style={{
                                position: 'absolute',
                                zIndex: 10,
                                top: 0,
                                right: '-5.5px', 
                                width: `${BLACK_KEY_WIDTH}px`,
                                height: `${BLACK_KEY_HEIGHT}px`,
                                backgroundColor: '#444', // Slightly darker gray for a more balanced look
                                borderBottom: '6px solid #000',
                                borderLeft: '1px solid #333',
                                borderRight: '1px solid #333',
                                borderTop: 'none',
                                borderBottomLeftRadius: '2px',
                                borderBottomRightRadius: '2px',
                                boxSizing: 'border-box'
                            }}
                        />
                    )}
                    {isC && (
                        <span style={{
                            fontSize: '8px',
                            fontFamily: 'sans-serif',
                            color: '#333',
                            marginBottom: '4px',
                            pointerEvents: 'none',
                            userSelect: 'none'
                        }}>
                            C{octave}
                        </span>
                    )}
                </div>
            );
        }
    }

    return (
        <div className="flex flex-col items-center gap-2">
            {/* Toggle Mode Control - Moved up slightly */}
            <div className="flex items-center mb-1">
                <button
                    onClick={() => setIsToggleMode(!isToggleMode)}
                    className={`px-3 py-1 text-[10px] uppercase tracking-widest font-bold rounded border transition-all duration-200 ${
                        isToggleMode 
                        ? 'bg-[#aa3bff] border-[#aa3bff] text-white shadow-lg shadow-[#aa3bff]/30 translate-y-[1px]' 
                        : 'bg-white dark:bg-[#1a1a1a] border-gray-200 dark:border-gray-800 text-gray-500 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                >
                    Toggle Mode {isToggleMode ? 'Active' : 'Off'}
                </button>
            </div>

            {/* Spelled Notes Strip - Tall version with zipper logic support */}
            <div 
                id="spelled-notes-strip"
                className="w-[936px] h-[30px] relative overflow-hidden text-[10px] font-bold tracking-tight text-[#aa3bff] dark:text-[#c084fc] pointer-events-none"
                style={{ 
                    fontFamily: "'Jost', sans-serif",
                    backgroundColor: 'rgba(170, 59, 255, 0.03)',
                    borderRadius: '2px',
                    border: '1px solid rgba(170, 59, 255, 0.1)'
                }}
            >
                {/* Spelled notes will be injected here as absolute elements */}
            </div>

            <div className="piano-container flex justify-center bg-transparent">
                <div
                    style={{
                        display: 'flex',
                        width: '936px', 
                        height: `${WHITE_KEY_HEIGHT}px`,
                        backgroundColor: '#fff',
                        borderTop: '1px solid #ddd',
                        boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)',
                        position: 'relative',
                        borderRadius: '4px',
                        overflow: 'hidden',
                        touchAction: 'none'
                    }}
                >
                    {pianoKeys}
                </div>
            </div>
        </div>
    );
};

/**
 * Updates visuals for the 88-key component via direct DOM access
 * This bypasses React reconciliation for 60fps performance.
 */
export const updateKeyVisuals88 = (note: number, color: string) => {
    const el = document.getElementById(`pk88-${note}`);
    if (!el) return;

    const isBlack = [1, 3, 6, 8, 10].includes(note % 12);

    if (color) {
        el.style.backgroundColor = color;
        el.style.boxShadow = `inset 0 -5px 10px rgba(0,0,0,0.1), 0 0 12px ${color}`;
        if (isBlack) {
            el.style.zIndex = '11';
            el.style.borderBottom = '1px solid #000'; // Lengthen highlight: only 1px outline remains
            el.style.borderLeft = '1px solid #333';
            el.style.borderRight = '1px solid #333';
        }
    } else {
        el.style.backgroundColor = isBlack ? '#444' : '#fff'; // Darker gray for the top surface
        el.style.boxShadow = 'none';
        if (isBlack) {
            el.style.zIndex = '10';
            el.style.borderBottom = '6px solid #000'; // Restore standard black key "front portion"
            el.style.borderLeft = '1px solid #333';
            el.style.borderRight = '1px solid #333';
            el.style.borderTop = 'none';
        }
    }
};

/**
 * Updates the spelled notes strip via direct DOM access
 * Aligns labels horizontally and vertically with the keys.
 * Implements "zipper" collision detection to prevent overlapping text.
 */
export const updateSpelledNotesStrip = (spellings: { note: number; spelling: string }[]) => {
    const el = document.getElementById('spelled-notes-strip');
    if (!el) return;
    
    // Clear existing
    el.innerHTML = '';

    let lastX = -100;
    let currentRow = 0;

    spellings.forEach(data => {
        const x = getNoteX(data.note);
        
        // Zipper logic: if notes are horizontally close, stagger them vertically
        if (Math.abs(x - lastX) < 18) { 
            currentRow = (currentRow + 1) % 2;
        } else {
            currentRow = 0; // Reset to bottom row if there's enough space
        }
        lastX = x;

        const label = document.createElement('div');
        label.textContent = data.spelling;
        label.style.position = 'absolute';
        label.style.left = `${x}px`;
        // Row 0 is at bottom (75%), Row 1 is at top (25%)
        label.style.top = currentRow === 0 ? '70%' : '30%';
        label.style.transform = 'translate(-50%, -50%)';
        label.style.whiteSpace = 'nowrap';
        el.appendChild(label);
    });
};

/**
 * Helper to calculate the horizontal center of a MIDI note (21-108)
 */
const getNoteX = (note: number): number => {
    let whiteKeysBefore = 0;
    for (let n = 21; n < note; n++) {
        if (![1, 3, 6, 8, 10].includes(n % 12)) {
            whiteKeysBefore++;
        }
    }
    const isBlack = [1, 3, 6, 8, 10].includes(note % 12);
    return isBlack ? (whiteKeysBefore * 18) : (whiteKeysBefore * 18 + 9);
};

export default Piano88;
