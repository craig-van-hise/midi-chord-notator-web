# Chord Spelling Regression Report: "E E E E" Inversion Bug

## Overview
A critical regression was identified in the `midi-chord-notator-web` application where inverted chords were spelled incorrectly, often resulting in repeating note names (e.g., an E half-diminished 1st inversion rendering as **"G E E E"** or **"E E E E"**). This issue appeared following a recent update to the Pitch Class Set (PCS) Look-Up Table (LUT) generation process.

## Root Cause Analysis
The issue was traced to a **Data Generation Logic Failure** in the LUT generator script (`lut_main.py`).

### 1. Inversion Interval Logic
In the project's deterministic spelling engine, the LUT is expected to provide chord intervals relative to the **Chord Root**, regardless of the chord's voicing or inversion. 
- **Root Position (E-G-Bb-D):** Intervals are `1, b3, b5, b7`.
- **1st Inversion (G-Bb-D-E):** Intervals should still be `1, b3, b5, b7` (or a rotation thereof like `b3, b5, b7, 1`), mapped to the correct Pitch Classes relative to the root (E).

### 2. The Regression in `lut_main.py`
A recent change to support "list-based manual overrides" in `lut_main.py` introduced a bug in the override detection loop. 
- **The Bug**: Phase 1 of the generator initializes the `chord_intervals` field as a `list`. The updated override detection loop incorrectly flagged *all* Phase 1 lists as manual overrides from `dictionaries.py`.
- **The Consequence**: Because they were flagged as overrides, Phase 4.5 of the generator (which recalculates intervals relative to the root for inversions) was skipped for nearly all entries.
- **Result**: Inversions were saved into the LUT with intervals relative to their **Bass Note** (e.g., `[G, Bb, D, E]` saved as `1, b3, 5, 6`) instead of the **Root**.

### 3. Engine Failure
The `getChordSpelling` utility calculates the semitone distance of each note relative to the **Root**. 
- When the engine looked for these "root-relative" semitones in the "bass-relative" intervals provided by the broken LUT, it failed to find matches for most notes.
- The engine defaulted to a `"1"` interval for any unmatched note, causing them to be spelled as the root (e.g., "E").

## Solution & Implementation

### Phase 1: LUT Generator Fix
The manual override detection in `lut_main.py` was refined to correctly distinguish between default Phase 1 lists and actual manual overrides injected via `dictionaries.py`.
- **Change**: The script now only flags an override if the field was provided as a `string` (the standard format for `dictionaries.py` overrides) or if it's a list type that wasn't part of the Phase 1 defaults.

### Phase 2: Data Regeneration
The entire 4096-row PCS LUT was regenerated and repacked into the binary `.dat` format. 
- **Verified Fix**: Decimal `649` (E half-diminished 1st inv) now correctly contains `["1", "b3", "b5", "b7"]` instead of `["1", "b3", "5", "6"]`.

### Phase 3: Engine Hardening
A safety fallback was added to `src/utils/chordSpeller.ts` to prevent visual "collapsing" of chords in the future.
- **Change**: If a note cannot be matched to a chord interval in the LUT, the engine now falls back to the **key-aware individual note speller** (`getEnharmonicSpelling`) instead of defaulting to the root name. This ensures that even if data is inconsistent, the user sees distinct note names.

## Verification Results
A reproduction test case simulating an inverted E half-diminished 7th chord was used to validate the fix.

| State | Input (MIDI) | Output (Spelling) | Result |
| :--- | :--- | :--- | :--- |
| **Pre-Fix** | `[67, 70, 74, 76]` | `["G", "E", "E", "E"]` | **FAIL** |
| **Post-Fix** | `[67, 70, 74, 76]` | `["G", "Bb", "D", "E"]` | **PASS** |

## Files Modified
1. `../PCS_LUT Editor/Python_Port/lut_main.py`: Fixed override detection logic.
2. `src/utils/chordSpeller.ts`: Implemented safety fallback.
3. `public/PCS_LUT.dat`: Repacked with corrected inversion data.
