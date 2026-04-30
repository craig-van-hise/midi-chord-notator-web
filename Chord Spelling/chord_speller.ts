
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
    // Other fields can be added if needed, but these are essential for the spelling algo
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
 * Interval to Semitones/Step mapping
 */
const INTERVAL_DATA: Record<string, { steps: number; semitones: number }> = {
    "1": { steps: 0, semitones: 0 },
    "b2": { steps: 1, semitones: 1 },
    "2": { steps: 1, semitones: 2 },
    "#2": { steps: 1, semitones: 3 },
    "b3": { steps: 2, semitones: 3 },
    "3": { steps: 2, semitones: 4 },
    "4": { steps: 3, semitones: 5 },
    "#4": { steps: 3, semitones: 6 },
    "b5": { steps: 4, semitones: 6 },
    "5": { steps: 4, semitones: 7 },
    "#5": { steps: 4, semitones: 8 },
    "b6": { steps: 5, semitones: 8 },
    "6": { steps: 5, semitones: 9 },
    "#6": { steps: 5, semitones: 10 },
    "b7": { steps: 6, semitones: 10 },
    "7": { steps: 6, semitones: 11 },
    "bb7": { steps: 6, semitones: 9 },
    "#1": { steps: 0, semitones: 1 },
    "b1": { steps: 0, semitones: -1 }, // rare
};

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
 * Replaces the giant switch statement by calculating based on key root
 */
export function convertIntervalToPitchSpelling(interval: string, keySigPC: number): string {
    const keyRootName = KEY_NAME_MAP[keySigPC] || "C";
    const keyRootPC = PITCH_TO_PC[keyRootName.substring(0, 2)] ?? PITCH_TO_PC[keyRootName[0]];
    
    // Parse the interval (e.g., "b3")
    const match = interval.match(/^([b#x]*)([1-7])$/);
    if (!match) return "invalid";
    
    const accidental = match[1];
    const degree = parseInt(match[2]);
    
    // Base semitones for major scale degrees
    const majorSteps = [0, 2, 4, 5, 7, 9, 11];
    const baseSemitones = majorSteps[degree - 1];
    
    // Accidental offset
    let offset = 0;
    if (accidental === "b") offset = -1;
    else if (accidental === "bb") offset = -2;
    else if (accidental === "#") offset = 1;
    else if (accidental === "x") offset = 2;
    
    const targetSemitones = (baseSemitones + offset) % 12;
    const targetPC = (keyRootPC + targetSemitones + 12) % 12;
    
    // Find the diatonic letter
    const rootLetter = keyRootName[0];
    const rootLetterIndex = DIATONIC_NAMES.indexOf(rootLetter);
    const targetLetterIndex = (rootLetterIndex + degree - 1) % 7;
    const targetLetter = DIATONIC_NAMES[targetLetterIndex];
    const targetLetterPC = DIATONIC_PC[targetLetterIndex];
    
    // Calculate final accidental based on the difference between targetPC and targetLetterPC
    let diff = (targetPC - targetLetterPC + 12) % 12;
    if (diff > 6) diff -= 12; // Handle wraps (e.g., B# vs C)
    
    let finalAccidental = "";
    if (diff === 1) finalAccidental = "#";
    else if (diff === 2) finalAccidental = "x";
    else if (diff === -1) finalAccidental = "b";
    else if (diff === -2) finalAccidental = "bb";
    
    return targetLetter + finalAccidental;
}

/**
 * Port of getChromaticRootInterval
 */
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

/**
 * Port of getRootSpellingFromKey
 */
export function getRootSpellingFromKey(ps: number[], keySigPC: number, lut: (PCS_Entry | null)[]): string {
    const sortedPS = [...ps].sort((a, b) => a - b);
    const decimal = psToDecimal(sortedPS);
    const entry = lut[decimal];
    
    if (!entry) return "C"; // Fallback

    const rootPC = (entry.root_pc + sortedPS[0]) % 12;
    const keyPC = PITCH_TO_PC[KEY_NAME_MAP[keySigPC]?.substring(0, 2) || "C"] ?? 0;
    
    // Handle aux keys PC mapping
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

/**
 * Helper to parse interval strings into [degree, offset]
 */
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

/**
 * Sum two interval strings
 */
export function sumIntervalStrings(a: string, b: string): string {
    const [degA, offA] = parseIntervalString(a);
    const [degB, offB] = parseIntervalString(b);
    
    const degSum = ((degA + degB - 2) % 7) + 1;
    
    // Sharp offsets for specific degree combinations (from original PSTools-Intervals.js)
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

/**
 * Main Function: getChordSpelling
 */
export function getChordSpelling(ps: number[], keyName: string = "C", lut: (PCS_Entry | null)[]): string[] {
    const keySigPC = KEY_SIG_MAP[keyName] ?? 0;
    const sortedPS = [...ps].sort((a, b) => a - b);
    const decimal = psToDecimal(sortedPS);
    const entry = lut[decimal];

    if (!entry) return sortedPS.map(p => "C"); // Fallback

    const psRootName = getRootSpellingFromKey(sortedPS, keySigPC, lut);
    
    // We treat the chord root as a temporary key context to relate to the main key
    const rootRelKeyInterval = getIntervalBetweenPitches(keyName, psRootName);
            
    // First, find the root's PC to normalize the set
    const absoluteRootPC = (entry.root_pc + sortedPS[0]) % 12;
    
    return sortedPS.map(pitch => {
        const pc = pitch % 12;
        // Interval from root to this note (semitones)
        const semitones = (pc - absoluteRootPC + 12) % 12;
        
        // Find which chord interval this semitone corresponds to in the entry
        let toneInterval = "1";
        const majorSteps = [0, 2, 4, 5, 7, 9, 11];
        
        for (const interval of entry.chord_intervals) {
             const [deg, off] = parseIntervalString(interval);
             if ((majorSteps[deg-1] + off + 12) % 12 === semitones) {
                 toneInterval = interval;
                 break;
             }
        }
        
        // Sum the relative tone interval with the root's absolute interval in the key
        const absoluteInterval = sumIntervalStrings(toneInterval, rootRelKeyInterval);
        return convertIntervalToPitchSpelling(absoluteInterval, keySigPC);
    });
}

/**
 * Helper to find interval between two pitch names (e.g. C to Eb is b3)
 */
function getIntervalBetweenPitches(rootName: string, targetName: string): string {
    const rootLetter = rootName[0];
    const targetLetter = targetName[0];
    const rootLetterIndex = DIATONIC_NAMES.indexOf(rootLetter);
    const targetLetterIndex = DIATONIC_NAMES.indexOf(targetLetter);
    
    const degree = ((targetLetterIndex - rootLetterIndex + 7) % 7) + 1;
    
    // Get PC for root and target
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

// --- Example Usage ---
/*
import * as fs from 'fs';
const lut = JSON.parse(fs.readFileSync('./PCS_LUT_min.json', 'utf8'));

// C Major triad in C Major key
console.log(getChordSpelling([60, 64, 67], "C", lut)); // ["C", "E", "G"]

// D Major triad in C Major key
console.log(getChordSpelling([62, 66, 69], "C", lut)); // ["D", "F#", "A"]

// Eb Major triad in C Major key
console.log(getChordSpelling([63, 67, 70], "C", lut)); // ["Eb", "G", "Bb"]

// C Minor triad in C Major key
console.log(getChordSpelling([60, 63, 67], "C", lut)); // ["C", "Eb", "G"]
*/
