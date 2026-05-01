
import { SMuFL, getEnharmonicSpelling } from './notationMath';

/**
 * PCS_LUT Entry structure based on the provided JSON
 */
export interface PCS_Entry {
    decimal: number;
    chord_type: string;
    root_pc: number;
    chord_intervals: string[];
    base_triad: string;
    cardinality: number;
    pitch_class_set: number[];
}

/**
 * Key definitions for KeySigPC mapping
 */
export const KEY_SIG_MAP: Record<string, number> = {
    "C": 0, "Db": 1, "D": 2, "Eb": 3, "E": 4, "F": 5, "Gb": 6, "G": 7, "Ab": 8, "A": 9, "Bb": 10, "B": 11,
    "F#": 12, "C#": 13, "G#": 14, "D#": 15, "A#": 16
};

export const KEY_NAME_MAP: Record<number, string> = Object.fromEntries(
    Object.entries(KEY_SIG_MAP).map(([name, pc]) => [pc, name])
);

/**
 * Mapping of Pitch Names to Pitch Classes
 */
export const PITCH_TO_PC: Record<string, number> = {
    "C": 0, "C#": 1, "Db": 1, "D": 2, "D#": 3, "Eb": 3, "E": 4, "E#": 5, "F": 5, "F#": 6, "Gb": 6, "G": 7, "G#": 8, "Ab": 8, "A": 9, "A#": 10, "Bb": 10, "B": 11, "B#": 0, "Cb": 11
};

/**
 * Diatonic base names for interval calculation
 */
const DIATONIC_NAMES = ["C", "D", "E", "F", "G", "A", "B"];
const DIATONIC_PC = [0, 2, 4, 5, 7, 9, 11];

/**
 * Helper to convert Pitch Set to Decimal (sum of 2^pc)
 * Important: The LUT indexes sets transposed to start at 0.
 */
export function psToDecimal(ps: number[]): number {
    const sortedPS = [...ps].sort((a, b) => a - b);
    if (sortedPS.length === 0) return 0;
    const lowNotePC = sortedPS[0] % 12;
    const uniquePCs = Array.from(new Set(sortedPS.map(p => (p % 12 - lowNotePC + 12) % 12))).sort((a, b) => a - b);
    return uniquePCs.reduce((sum, pc) => sum + Math.pow(2, pc), 0);
}

/**
 * Programmatic Interval to Pitch Spelling
 */
export function convertIntervalToPitchSpelling(interval: string, keySigPC: number): string {
    const keyRootName = KEY_NAME_MAP[keySigPC] || "C";
    const keyRootPC = PITCH_TO_PC[keyRootName.substring(0, 2)] ?? PITCH_TO_PC[keyRootName[0]];
    
    const match = interval.match(/^([b#x]*)([1-7])$/);
    if (!match) return "invalid";
    
    const accidental = match[1];
    const degree = parseInt(match[2]);
    
    const majorSteps = [0, 2, 4, 5, 7, 9, 11];
    const baseSemitones = majorSteps[degree - 1];
    
    let offset = 0;
    if (accidental === "b") offset = -1;
    else if (accidental === "bb") offset = -2;
    else if (accidental === "#") offset = 1;
    else if (accidental === "x") offset = 2;
    
    const targetSemitones = (baseSemitones + offset) % 12;
    const targetPC = (keyRootPC + targetSemitones + 12) % 12;
    
    const rootLetter = keyRootName[0];
    const rootLetterIndex = DIATONIC_NAMES.indexOf(rootLetter);
    const targetLetterIndex = (rootLetterIndex + degree - 1) % 7;
    const targetLetter = DIATONIC_NAMES[targetLetterIndex];
    const targetLetterPC = DIATONIC_PC[targetLetterIndex];
    
    let diff = (targetPC - targetLetterPC + 12) % 12;
    if (diff > 6) diff -= 12;
    
    let finalAccidental = "";
    if (diff === 1) finalAccidental = "#";
    else if (diff === 2) finalAccidental = "x";
    else if (diff === -1) finalAccidental = "b";
    else if (diff === -2) finalAccidental = "bb";
    
    return targetLetter + finalAccidental;
}

function getChromaticRootInterval(rootPCN: number, cardinality: number, decimal: number, triadQuality: string): string {
    const chromaticIntervals: Record<number, string[]> = {
        1: ["b2", "#1"], 3: ["b3", "#2"], 6: ["b5", "#4"],
        8: ["b6", "#5"], 10: ["b7", "#6"]
    };

    if (cardinality === 1) return chromaticIntervals[rootPCN][0];

    if (cardinality === 2) {
        const check14679e = [3, 17, 65, 129, 513, 2049];
        return check14679e.includes(decimal) ? chromaticIntervals[rootPCN][0] : chromaticIntervals[rootPCN][1];
    }

    if (cardinality > 2) {
        const triadMappings: Record<string, Record<number, string>> = {
            "maj": { 1: "b2", 3: "b3", 6: "b5", 8: "b6", 10: "b7" },
            "min": { 1: "#1", 3: "b3", 6: "#4", 8: "b6", 10: "b7" },
            "dim": { 1: "#1", 3: "#2", 6: "#4", 8: "#5", 10: "#6" },
            "aug": { 1: "b2", 3: "b3", 6: "b5", 8: "b6", 10: "b7" },
            "sus4": { 1: "b2", 3: "b3", 6: "#4", 8: "b6", 10: "b7" },
            "other": { 1: "b2", 3: "b3", 6: "b5", 8: "b6", 10: "b7" },
            "chromatic": { 1: "#1", 3: "#2", 6: "#4", 8: "#5", 10: "#6" }
        };
        const mapping = triadMappings[triadQuality] || triadMappings["other"];
        return mapping[rootPCN] || "1";
    }
    return "1";
}

export function getRootSpellingFromKey(ps: number[], keySigPC: number, lut: (PCS_Entry | null)[]): string {
    const sortedPS = [...ps].sort((a, b) => a - b);
    const decimal = psToDecimal(sortedPS);
    const entry = lut[decimal];
    
    if (!entry) return "C";

    const rootPC = (entry.root_pc + sortedPS[0]) % 12;
    const keyPC = PITCH_TO_PC[KEY_NAME_MAP[keySigPC]?.substring(0, 2) || "C"] ?? 0;
    
    let effectiveKeyPC = keyPC;
    if (keySigPC >= 12) {
        const auxMap: Record<number, number> = { 12: 6, 13: 1, 14: 8, 15: 3, 16: 10 };
        effectiveKeyPC = auxMap[keySigPC];
    }

    const rootPCN = (rootPC - effectiveKeyPC + 12) % 12;
    
    const naturalScaleIntervals: Record<number, string> = {
        0: "1", 2: "2", 4: "3", 5: "4", 7: "5", 9: "6", 11: "7"
    };

    let rootInterval = naturalScaleIntervals[rootPCN];
    if (!rootInterval) {
        rootInterval = getChromaticRootInterval(rootPCN, entry.cardinality, decimal, entry.base_triad);
    }

    return convertIntervalToPitchSpelling(rootInterval, keySigPC);
}

function parseIntervalString(interval: string): [number, number] {
    const match = interval.match(/^([b#x]*)([1-7])$/);
    if (!match) return [1, 0];
    const accidental = match[1];
    const degree = parseInt(match[2]);
    let offset = 0;
    if (accidental === "b") offset = -1;
    else if (accidental === "bb") offset = -2;
    else if (accidental === "#") offset = 1;
    else if (accidental === "x") offset = 2;
    return [degree, offset];
}

export function sumIntervalStrings(a: string, b: string): string {
    const [degA, offA] = parseIntervalString(a);
    const [degB, offB] = parseIntervalString(b);
    
    const degSum = ((degA + degB - 2) % 7) + 1;
    
    const sharpOffsetPairs = [
        [2, 3], [3, 2], [3, 3], [2, 7], [7, 2], [3, 6], [6, 3], [3, 7], [7, 3],
        [5, 7], [7, 5], [6, 6], [6, 7], [7, 6], [7, 7]
    ];
    
    let offset = 0;
    if (sharpOffsetPairs.some(p => p[0] === degA && p[1] === degB)) {
        offset = 1;
    } else if (degA === 4 && degB === 4) {
        offset = -1;
    }
    
    const offSum = offA + offB + offset;
    
    let acc = "";
    if (offSum === 1) acc = "#";
    else if (offSum === 2) acc = "x";
    else if (offSum === -1) acc = "b";
    else if (offSum === -2) acc = "bb";
    
    return acc + degSum;
}

export function getChordSpelling(ps: number[], keySignature: string = "C Major", lut: (PCS_Entry | null)[]): string[] {
    const keyName = keySignature.split(' ')[0];
    const keySigPC = KEY_SIG_MAP[keyName] ?? 0;
    const sortedPS = [...ps].sort((a, b) => a - b);
    const decimal = psToDecimal(sortedPS);
    const entry = lut[decimal];

    if (!entry) {
        // Fallback: Use key-aware enharmonic spelling for individual notes
        return sortedPS.map(pitch => {
            const { stepOffset, accidental } = getEnharmonicSpelling(pitch, keySignature);
            const letter = DIATONIC_NAMES[((stepOffset % 7) + 7) % 7];
            let acc = "";
            if (accidental === SMuFL.accidentalSharp) acc = "#";
            else if (accidental === SMuFL.accidentalDoubleSharp) acc = "x";
            else if (accidental === SMuFL.accidentalFlat) acc = "b";
            else if (accidental === SMuFL.accidentalDoubleFlat) acc = "bb";
            return letter + acc;
        });
    }

    const psRootName = getRootSpellingFromKey(sortedPS, keySigPC, lut);
    const rootRelKeyInterval = getIntervalBetweenPitches(keyName, psRootName);
    const absoluteRootPC = (entry.root_pc + sortedPS[0]) % 12;
    
    return sortedPS.map(pitch => {
        const pc = pitch % 12;
        const semitones = (pc - absoluteRootPC + 12) % 12;
        
        let toneInterval = "1";
        const majorSteps = [0, 2, 4, 5, 7, 9, 11];
        
        for (const interval of entry.chord_intervals) {
             const [deg, off] = parseIntervalString(interval);
             if ((majorSteps[deg-1] + off + 12) % 12 === semitones) {
                 toneInterval = interval;
                 break;
             }
        }
        
        const absoluteInterval = sumIntervalStrings(toneInterval, rootRelKeyInterval);
        return convertIntervalToPitchSpelling(absoluteInterval, keySigPC);
    });
}

function getIntervalBetweenPitches(rootName: string, targetName: string): string {
    const rootLetter = rootName[0];
    const targetLetter = targetName[0];
    const rootLetterIndex = DIATONIC_NAMES.indexOf(rootLetter);
    const targetLetterIndex = DIATONIC_NAMES.indexOf(targetLetter);
    
    const degree = ((targetLetterIndex - rootLetterIndex + 7) % 7) + 1;
    const rootPC = PITCH_TO_PC[rootName] ?? PITCH_TO_PC[rootName.substring(0, 2)] ?? PITCH_TO_PC[rootName[0]];
    const targetPC = PITCH_TO_PC[targetName] ?? PITCH_TO_PC[targetName.substring(0, 2)] ?? PITCH_TO_PC[targetName[0]];
    
    const semitones = (targetPC - rootPC + 12) % 12;
    const majorSteps = [0, 2, 4, 5, 7, 9, 11];
    const diff = (semitones - majorSteps[degree - 1] + 12) % 12;
    
    let acc = "";
    if (diff === 1) acc = "#";
    else if (diff === 2) acc = "x";
    else if (diff === 11) acc = "b";
    else if (diff === 10) acc = "bb";
    
    return acc + degree;
}

/**
 * Maps pitch names to SMuFL glyphs and staff steps
 */
export function getSpellingData(midiNote: number, spelling: string): { stepOffset: number, accidental: string | null } {
    const letter = spelling[0];
    const accidentalPart = spelling.substring(1);
    const step = DIATONIC_NAMES.indexOf(letter);
    
    const baseOctave = Math.floor(midiNote / 12) - 1;
    const pitchClass = midiNote % 12;
    const targetLetterPC = DIATONIC_PC[step];
    
    let diatonicOctave = baseOctave;
    
    // Octave correction
    if (pitchClass === 11 && targetLetterPC === 0) diatonicOctave += 1;
    if (pitchClass === 0 && targetLetterPC === 11) diatonicOctave -= 1;
    
    const stepOffset = ((diatonicOctave - 4) * 7) + step;
    
    let accGlyph: string | null = null;
    if (accidentalPart === "#") accGlyph = SMuFL.accidentalSharp;
    else if (accidentalPart === "x") accGlyph = SMuFL.accidentalDoubleSharp;
    else if (accidentalPart === "b") accGlyph = SMuFL.accidentalFlat;
    else if (accidentalPart === "bb") accGlyph = SMuFL.accidentalDoubleFlat;
    
    return { stepOffset, accidental: accGlyph };
}

/**
 * Derives a chord symbol from the pitch set and LUT entry.
 */
export function getChordSymbol(ps: number[], keySignature: string = "C Major", lut: (PCS_Entry | null)[]): string {
    const sortedPS = [...ps].sort((a, b) => a - b);
    if (sortedPS.length === 0) return "";
    
    const decimal = psToDecimal(sortedPS);
    const entry = lut[decimal];
    if (!entry) return "";

    const keyName = keySignature.split(' ')[0];
    const keySigPC = KEY_SIG_MAP[keyName] ?? 0;
    const rootName = getRootSpellingFromKey(sortedPS, keySigPC, lut);
    
    let symbol = rootName + entry.chord_type;
    
    // Slash notation if root_pc != 0 (meaning the low note is not the root)
    if (entry.root_pc !== 0) {
        // Find the spelling of the lowest note
        const spellings = getChordSpelling(sortedPS, keySignature, lut);
        const lowNoteSpelling = spellings[0];
        symbol += " / " + lowNoteSpelling;
    }
    
    return symbol;
}
