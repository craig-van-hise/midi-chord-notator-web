
import { describe, it, expect } from 'vitest';
import { convertIntervalToPitchSpelling, getChordSpelling, getChordSymbol } from './chordSpeller';

describe('chordSpeller Interval Parsing', () => {
  it('should parse compound intervals correctly (9th)', () => {
    // Current logic should fail and return "invalid" or misspelling
    // convertIntervalToPitchSpelling("9", 0) -> 0 is C Major
    expect(convertIntervalToPitchSpelling("9", 0)).toBe("D");
  });

  it('should parse compound intervals correctly (#11th)', () => {
    expect(convertIntervalToPitchSpelling("#11", 0)).toBe("F#");
  });

  it('should parse compound intervals correctly (b13th)', () => {
    expect(convertIntervalToPitchSpelling("b13", 0)).toBe("Ab");
  });

  it('should spell Cmaj9 correctly', () => {
    // Mock LUT entry for Cmaj9 [60, 64, 67, 71, 74]
    // 60=C4, 64=E4, 67=G4, 71=B4, 74=D5
    const mockLut = new Array(4096).fill(null);
    mockLut[2193] = { // Example decimal for Cmaj9 transposed to 0
        decimal: 2193,
        chord_type: "maj9",
        root_pc: 0,
        chord_intervals: ["1", "3", "5", "7", "9"],
        base_triad: "maj",
        cardinality: 5,
        pitch_class_set: [0, 4, 7, 11, 14]
    };
    
    // psToDecimal calculation for [60, 64, 67, 71, 74]
    // PCs: 0, 4, 7, 11, 2
    // Relative to low note 0: 0, 4, 7, 11, 2
    // Decimal: 2^0 + 2^4 + 2^7 + 2^11 + 2^2 = 1 + 16 + 128 + 2048 + 4 = 2197
    // Wait, let me re-calculate decimal logic in psToDecimal
    // uniquePCs = [0, 2, 4, 7, 11]
    // 2^0 + 2^2 + 2^4 + 2^7 + 2^11 = 1 + 4 + 16 + 128 + 2048 = 2197
    
    mockLut[2197] = {
        decimal: 2197,
        chord_type: "maj9",
        root_pc: 0,
        chord_intervals: ["1", "3", "5", "7", "9"],
        base_triad: "maj",
        cardinality: 5,
        pitch_class_set: [0, 2, 4, 7, 11]
    };

    const spelling = getChordSpelling([60, 64, 67, 71, 74], "C Major", mockLut);
    expect(spelling[spelling.length - 1]).toBe("D");
  });

  it('should generate correct chord symbol for Em7b5', () => {
    // E4, G4, Bb4, D5 -> [64, 67, 70, 74]
    // PCs: 4, 7, 10, 2
    // Low note PC: 4
    // Relative PCs: (4-4)%12=0, (7-4)%12=3, (10-4)%12=6, (2-4+12)%12=10
    // Decimal: 2^0 + 2^3 + 2^6 + 2^10 = 1 + 8 + 64 + 1024 = 1097
    
    const mockLut = new Array(4096).fill(null);
    mockLut[1097] = {
        decimal: 1097,
        chord_type: "m7b5",
        root_pc: 0, // Root is the low note
        chord_intervals: ["1", "b3", "b5", "b7"],
        base_triad: "dim",
        cardinality: 4,
        pitch_class_set: [0, 3, 6, 10]
    };

    const symbol = getChordSymbol([64, 67, 70, 74], "C Major", mockLut);
    expect(symbol).toBe("Em7b5");
  });

  it('should spell Major 2nd (decimal 5) as flat-side (Bb, C) in C Major', () => {
    const mockLut = new Array(4096).fill(null);
    mockLut[5] = {
        decimal: 5,
        chord_type: "M2",
        root_pc: 0, 
        chord_intervals: ["1", "2"],
        base_triad: "other",
        cardinality: 2,
        pitch_class_set: [0, 2]
    };

    const spelling = getChordSpelling([58, 60], "C Major", mockLut);
    expect(spelling).toEqual(["Bb", "C"]);
  });

  it('should spell Perfect 4th (decimal 33) as flat-side (Db, Gb) in C Major', () => {
    const mockLut = new Array(4096).fill(null);
    mockLut[33] = {
        decimal: 33,
        chord_type: "P4",
        root_pc: 0, 
        chord_intervals: ["1", "4"],
        base_triad: "other",
        cardinality: 2,
        pitch_class_set: [0, 5]
    };

    const spelling = getChordSpelling([61, 66], "C Major", mockLut);
    expect(spelling).toEqual(["Db", "Gb"]);
  });

  it('should spell Perfect 4th on tritone (decimal 33, rootPCN 6) as sharp-side (F#, B) in C Major', () => {
    const mockLut = new Array(4096).fill(null);
    mockLut[33] = {
        decimal: 33,
        chord_type: "P4",
        root_pc: 0, 
        chord_intervals: ["1", "4"],
        base_triad: "other",
        cardinality: 2,
        pitch_class_set: [0, 5]
    };

    // MIDI [66, 71] -> PCs [6, 11]
    // Low note PC: 6 (F#/Gb)
    // Relative PCs: (6-6)=0, (11-6)=5
    // Decimal: 2^0 + 2^5 = 33
    // In C Major, rootPCN = (6 - 0) = 6
    const spelling = getChordSpelling([66, 71], "C Major", mockLut);
    expect(spelling).toEqual(["F#", "B"]);
  });
});
