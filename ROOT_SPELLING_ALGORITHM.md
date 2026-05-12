# Root Spelling Algorithm Report

This document outlines the algorithm used in `src/utils/chordSpeller.ts` to determine the root spelling of a chord given its pitch set and the current key signature.

## Overview

The spelling of a chord's root is not just a matter of identifying the Pitch Class (PC), but also choosing the correct enharmonic representation (e.g., C# vs. Db) based on the musical context (the key signature) and the chord's internal structure (quality).

The primary entry point for this logic is `getRootSpellingFromKey`.

---

## 1. Core Logic: `getRootSpellingFromKey`

The function follows these steps to determine the root spelling:

1.  **LUT Lookup**: The Pitch Class Set (PCS) is converted to a decimal value representing its structure relative to its lowest note. This decimal is used to retrieve the `PCS_Entry` from the Lookup Table (LUT).
2.  **Determine Absolute Root PC**: The LUT entry contains a `root_pc` (which is an interval offset relative to the set's lowest note). The absolute Pitch Class of the root is calculated as:
    `absoluteRootPC = (entry.root_pc + lowPitch) % 12`
3.  **Calculate Relative Root Distance**: The distance in semitones (`rootPCN`) between the `absoluteRootPC` and the key's root PC is calculated.
4.  **Degree Assignment**:
    - If `rootPCN` corresponds to a natural scale degree (0, 2, 4, 5, 7, 9, 11 semitones), it is assigned the corresponding scale degree name ("1", "2", "3", etc.).
    - If `rootPCN` is chromatic (1, 3, 6, 8, 10 semitones), the algorithm calls `getChromaticRootInterval` to resolve the enharmonic spelling.
5.  **Spelling Generation**: The determined interval (e.g., "b2", "#4") is passed to `convertIntervalToPitchSpelling`, which uses the key signature to generate the final letter name and accidental.

---

## 2. Enharmonic Resolution: `getChromaticRootInterval`

When a root is chromatic relative to the key, this function uses a heuristic approach to choose between sharp (#) or flat (b) versions of the note.

### Heuristic Criteria:
- **Cardinality**: Special handling for single notes (cardinality 1) and dyads (cardinality 2).
- **Pattern Matching**: The algorithm checks the chord's decimal structure against predefined sets:
    - `MINOR_PATTERN_DECIMALS`: Often prefers sharp-side enharmonics (e.g., `#4` instead of `b5`).
    - `DOMINANT_PATTERN_DECIMALS`: Specific mappings tailored for dominant chord structures.
    - `PHRYGIAN_PATTERN_DECIMALS`: Typically forces sharp-side enharmonics.
- **Triad Quality**: If no pattern matches, the `base_triad` property (e.g., "maj", "min", "dim", "aug") determines the default mapping.
    - **Example**: A diminished triad (`dim`) context often prefers sharp intervals like `#2`, `#4`, and `#5`.

---

## 3. Translation to Pitch: `convertIntervalToPitchSpelling`

This function converts an abstract interval string (e.g., "b3") into a concrete pitch name (e.g., "Eb" in C Major).

1.  **Letter Selection**: It calculates the target letter by shifting the key root's letter (`keyRootLetter`) by the interval's degree.
2.  **Accidental Calculation**: It compares the Pitch Class of the target letter with the intended Pitch Class of the interval. It then adds the necessary accidental (#, b, x, bb) to the letter to bridge the gap.

---

## 4. Manual Overrides

The system supports a `spellingOverride` mechanism. In the higher-level functions `getChordSpelling` and `getChordSymbol`, the calculated root spelling is discarded if a manual override exists for the specific pitch corresponding to the root or the low note (bass). This allows the user to manually "fix" spellings that the heuristic algorithm may have guessed incorrectly.

---

## 5. Summary of Terminology Refactor

To maintain music theory coherence, the codebase disambiguates between:
- **Root**: The fundamental pitch upon which the chord is built.
- **Low Pitch / Bass Note**: The lowest sounding pitch in a specific voicing/inversion.
- **Key Root**: The tonic of the current key signature.
- **Reference Note**: A general starting point for interval calculations (formerly often loosely called "root").

| Concept | Code Terminology |
| :--- | :--- |
| Chord Root PC | `absoluteRootPC` |
| Lowest Note Pitch | `lowPitch` |
| Key Root Name | `keyRootName` |
| Interval Base | `referenceName` |
