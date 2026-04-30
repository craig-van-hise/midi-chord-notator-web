# Chord Speller Engine

A lightweight, performant TypeScript library for determining the musically correct spelling of chords based on a key signature and arbitrary MIDI pitch sets.

## Overview

The Chord Speller Engine solves the problem of enharmonic spelling in music software. Instead of simply returning "C# or Db," it uses a sophisticated algorithm to analyze the chord's structure and its relationship to the key to provide the theoretically correct note names (e.g., in the key of E major, an F-A-C triad is correctly spelled as `F, A, C`, not `E#, A, B#`).

## How It Works

The engine operates in four primary phases:

1.  **Set Normalization & Identification**: The input MIDI pitches are converted into a Pitch Class Set (PCS) and normalized (transposed to start at 0). This normalized set is used as a decimal index to look up metadata in the `PCS_LUT_min.json`.
2.  **Root Determination**: The algorithm identifies the theoretical root of the chord. If the root is chromatic relative to the key, it uses the chord's "triad quality" (Major, Minor, Diminished, etc.) and cardinality to decide on the correct enharmonic root spelling (e.g., `#1` vs `b2`).
3.  **Interval Summing**: Every note in the chord is related to the root using "chord intervals" from the LUT. These relative intervals are summed with the root's absolute interval in the key to determine each note's absolute theoretical interval relative to the key.
4.  **Programmatic Spelling**: Finally, each absolute interval is converted into a pitch name using a programmatic engine that calculates the correct diatonic letter and accidental based on the key's root and the interval's degree.

## Key Files

-   **`chord_speller.ts`**: The core TypeScript engine. It is environment-agnostic and works in Node.js, browsers, or Deno.
-   **`PCS_LUT_min.json`**: An optimized, 240KB data file containing structural metadata for all possible pitch class sets.
-   **`minify_lut.js`**: A utility script to regenerate the minified LUT from a master data source.
-   **`test_cases.js`**: A verification suite to ensure algorithm accuracy across various musical edge cases.

## Usage

### Installation
Simply copy `chord_speller.ts` and `PCS_LUT_min.json` into your project.

### Example
```typescript
import { getChordSpelling } from './chord_speller';
import * as fs from 'fs';

// 1. Load the LUT (In Node.js)
const lut = JSON.parse(fs.readFileSync('./PCS_LUT_min.json', 'utf8'));

// 2. Define pitches and key
const pitches = [61, 63, 67, 70]; // Db, Eb, G, Bb
const key = "G";

// 3. Get spelling
const spelling = getChordSpelling(pitches, key, lut);
console.log(spelling); // ["Db", "Eb", "G", "Bb"]
```

## Features

-   **High Performance**: Uses an O(1) decimal-indexed lookup for chord metadata.
-   **Lightweight**: The minified LUT is 87% smaller than the raw data source.
-   **Accurate**: Handles complex inversions, chromatic alterations, and auxiliary keys (like F#, C#, G#).
-   **No Dependencies**: Standard TypeScript/JavaScript with no external library requirements.
