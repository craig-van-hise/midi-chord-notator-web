import React from 'react';
import { useMidi } from '../midi/MIDIProvider';

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
    const { dispatchVirtualMidi } = useMidi();
    const [isToggleMode, setIsToggleMode] = React.useState(false);
    const [virtualHeldNotes, setVirtualHeldNotes] = React.useState<Set<number>>(new Set());
    const pianoKeys = [];

    // Clear virtual held notes on MIDI panic
    React.useEffect(() => {
        const handlePanic = (event: Event) => {
            if ((event as CustomEvent).detail?.panic) {
                setVirtualHeldNotes(new Set());
            }
        };
        window.addEventListener('MIDI_MESSAGE_RECEIVED', handlePanic);
        return () => window.removeEventListener('MIDI_MESSAGE_RECEIVED', handlePanic);
    }, []);

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
                                backgroundColor: '#1a1a1a',
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
        <div className="flex flex-col items-center gap-4">
            {/* Toggle Mode Control */}
            <div className="flex items-center gap-2">
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
        if (isBlack) el.style.zIndex = '11';
    } else {
        el.style.backgroundColor = isBlack ? '#1a1a1a' : '#fff';
        el.style.boxShadow = '';
        if (isBlack) el.style.zIndex = '10';
    }
};

export default Piano88;
