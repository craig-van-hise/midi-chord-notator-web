// src/utils/notationMath.ts

// Constants for SMuFL glyphs
export const SMuFL = {
    noteheadWhole: '\uE0A2', // Whole Notehead
    noteheadBlack: '\uE0A4', // Black Notehead
    accidentalSharp: '\uE262',
    accidentalFlat: '\uE260',
    accidentalNatural: '\uE261',
    accidentalDoubleSharp: '\uE263',
    accidentalDoubleFlat: '\uE264',
    // ... other glyphs as needed
};

// Default staff space in pixels, as defined in PDD Phase 1
// This value should ideally be read from CSS variables at runtime.
// For pure function testing, we'll pass it as an argument.
const DEFAULT_STAFF_SPACE_PX = 12;
const MIDI_NOTE_MIN = 0;
const MIDI_NOTE_MAX = 127;

const C_MAJOR_SCALE = [
    { step: 0, pc: 0 }, { step: 1, pc: 2 }, { step: 2, pc: 4 }, { step: 3, pc: 5 },
    { step: 4, pc: 7 }, { step: 5, pc: 9 }, { step: 6, pc: 11 }
];
const ORDER_OF_SHARPS = [3, 0, 4, 1, 5, 2, 6]; // F, C, G, D, A, E, B (Steps)
const ORDER_OF_FLATS = [6, 2, 5, 1, 4, 0, 3]; // B, E, A, D, G, C, F (Steps)
const KEY_SIG_ACCIDENTALS: Record<string, number> = {
    "C Major": 0, "G Major": 1, "D Major": 2, "A Major": 3, "E Major": 4, "B Major": 5, "F# Major": 6, "C# Major": 7,
    "F Major": -1, "Bb Major": -2, "Eb Major": -3, "Ab Major": -4, "Db Major": -5, "Gb Major": -6, "Cb Major": -7
};
const ACCIDENTAL_TO_KEY_NAME: Record<number, string> = {
    0: "C Major", 1: "G Major", 2: "D Major", 3: "A Major", 4: "E Major", 5: "B Major", 6: "F# Major", 7: "C# Major",
    [-1]: "F Major", [-2]: "Bb Major", [-3]: "Eb Major", [-4]: "Ab Major", [-5]: "Db Major", [-6]: "Gb Major", [-7]: "Cb Major"
};

/**
 * Generates the diatonic pitch classes for the active key signature.
 */
export function getDiatonicMap(keySignature: string): Map<number, { step: number, acc: string | null }> {
    if (KEY_SIG_ACCIDENTALS[keySignature] === undefined) {
        throw new Error(`[NotationEngine] Invalid key signature provided: "${keySignature}". Expected a valid string mapping.`);
    }
    const count = KEY_SIG_ACCIDENTALS[keySignature];
    const scale = C_MAJOR_SCALE.map(s => ({ ...s, acc: null as string | null }));

    if (count > 0) {
        for (let i = 0; i < count; i++) {
            const step = ORDER_OF_SHARPS[i];
            scale[step].pc = (scale[step].pc + 1) % 12;
            scale[step].acc = SMuFL.accidentalSharp;
        }
    } else if (count < 0) {
        for (let i = 0; i < Math.abs(count); i++) {
            const step = ORDER_OF_FLATS[i];
            scale[step].pc = (scale[step].pc + 11) % 12;
            scale[step].acc = SMuFL.accidentalFlat;
        }
    }

    const map = new Map<number, { step: number, acc: string | null }>();
    scale.forEach(s => map.set(s.pc, { step: s.step, acc: s.acc }));
    return map;
}


// Custom error class for domain-specific logic failures
export class InvalidMidiNoteError extends Error {
    public readonly midiNote: number;

    constructor(midiNote: number, message: string = `Invalid MIDI note: ${midiNote}. Notes must be between ${MIDI_NOTE_MIN} and ${MIDI_NOTE_MAX}.`) {
        super(message);
        this.name = "InvalidMidiNoteError";
        this.midiNote = midiNote;
        // Ensure the stack trace is captured correctly
        if ((Error as any).captureStackTrace) {
            (Error as any).captureStackTrace(this, InvalidMidiNoteError);
        }
    }
}

/**
 * Calculates the vertical Y-coordinate for a given MIDI note on the Grand Staff.
 * The calculation is based on Middle C (MIDI 60) being the vertical midpoint (Y=0).
 * Each semitone shift corresponds to a vertical shift of staffSpace / 2 pixels.
 * This function provides a clef-neutral Y-coordinate, assuming a linear mapping
 * of MIDI notes to vertical positions. The rendering engine will need to apply
 * clef-specific offsets if necessary.
 *
 * @param midiNote - The MIDI note number (0-127).
 * @param staffSpace - The vertical distance between staff lines in pixels. Defaults to DEFAULT_STAFF_SPACE_PX.
 * @returns The calculated Y-coordinate relative to the Grand Staff midpoint (Middle C).
 * @throws {InvalidMidiNoteError} If the midiNote is outside the valid MIDI range (0-127).
 */
/**
 * Maps a MIDI note and key signature to a staff position and accidental.
 */
export interface Spelling {
    stepOffset: number; // Staff steps relative to Middle C
    accidental: string | null; // SMuFL glyph or null
}

/**
 * Returns the enharmonic spelling for a MIDI note given a key signature.
 */
export function getEnharmonicSpelling(midiNote: number, keySignature: string | number): { stepOffset: number, accidental: string | null } {
    const keyName = typeof keySignature === 'number' ? ACCIDENTAL_TO_KEY_NAME[keySignature] : keySignature;
    const pitchClass = midiNote % 12;
    const baseOctave = Math.floor(midiNote / 12) - 1; // Standard MIDI octave
    const diatonicMap = getDiatonicMap(keyName);

    const mapping = diatonicMap.get(pitchClass);
    if (mapping) {
        const { step, acc } = mapping;
        let diatonicOctave = baseOctave;
        
        // Octave Boundary Corrections
        // MIDI octaves split at B/C (11/0). Diatonic spelling can cross this boundary.
        if (pitchClass === 11 && step === 0) diatonicOctave += 1; // Cb correction (MIDI B3 -> Cb4)
        if (pitchClass === 0 && step === 6) diatonicOctave -= 1; // B# correction (MIDI C4 -> B#3)
        
        const stepOffset = ((diatonicOctave - 4) * 7) + step;
        return { stepOffset, accidental: acc };
    }

    // Phase 3: Chromatic Fallback Handling
    const isFlatKey = (KEY_SIG_ACCIDENTALS[keyName] ?? 0) < 0;
    
    if (isFlatKey) {
        const flatMapping: Record<number, { step: number, acc: string | null }> = {
            0: { step: 0, acc: null },
            1: { step: 1, acc: SMuFL.accidentalFlat }, // Db
            2: { step: 1, acc: null },
            3: { step: 2, acc: SMuFL.accidentalFlat }, // Eb
            4: { step: 2, acc: null },
            5: { step: 3, acc: null },
            6: { step: 4, acc: SMuFL.accidentalFlat }, // Gb
            7: { step: 4, acc: null },
            8: { step: 5, acc: SMuFL.accidentalFlat }, // Ab
            9: { step: 5, acc: null },
            10: { step: 6, acc: SMuFL.accidentalFlat }, // Bb
            11: { step: 6, acc: null },
        };
        const { step, acc } = flatMapping[pitchClass];
        const stepOffset = ((baseOctave - 4) * 7) + step;
        return { stepOffset, accidental: acc };
    } else {
        const sharpMapping: Record<number, { step: number, acc: string | null }> = {
            0: { step: 0, acc: null },
            1: { step: 0, acc: SMuFL.accidentalSharp }, // C#
            2: { step: 1, acc: null },
            3: { step: 1, acc: SMuFL.accidentalSharp }, // D#
            4: { step: 2, acc: null },
            5: { step: 3, acc: null },
            6: { step: 3, acc: SMuFL.accidentalSharp }, // F#
            7: { step: 4, acc: null },
            8: { step: 4, acc: SMuFL.accidentalSharp }, // G#
            9: { step: 5, acc: null },
            10: { step: 5, acc: SMuFL.accidentalSharp }, // A#
            11: { step: 6, acc: null },
        };
        const { step, acc } = sharpMapping[pitchClass];
        const stepOffset = ((baseOctave - 4) * 7) + step;
        return { stepOffset, accidental: acc };
    }
}

export function calculateStaffPosition(midiNote: number, staffSpace: number = DEFAULT_STAFF_SPACE_PX): number {
    if (midiNote < MIDI_NOTE_MIN || midiNote > MIDI_NOTE_MAX) {
        throw new InvalidMidiNoteError(midiNote);
    }

    // Default to C Major for simple position calculation if needed
    const { stepOffset } = getEnharmonicSpelling(midiNote, 0);
    return stepOffset * (staffSpace / 2);
}
