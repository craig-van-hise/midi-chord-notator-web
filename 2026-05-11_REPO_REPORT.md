# 2026-05-11 REPO REPORT: Grand Staff MIDI Notator

## 📋 Executive Summary
The **Grand Staff MIDI Notator** is a high-performance, musicales-accurate web application built with **React 19**, **Vite 8**, and **Tailwind CSS 4**. It utilizes an imperative notation engine to render real-time MIDI input on a grand staff using the **Bravura** SMuFL font. 

The architecture is centered around a centralized `MIDIProvider` that manages an OMNI-input engine and a 2MB binary **Pitch Class Set Look-Up Table (PCS LUT)** for instantaneous chord identification and enharmonic spelling. The notation engine (`NotationCanvas`) is highly specialized, supporting complex musical logic such as chromatic "zippering" (cohemitonia), dynamic ottava shifts, and a custom mathematical hit-testing system for selection accuracy.

## 🏗 Detailed Tree & Architecture Explanation

### Core Architecture
- **State Management:** Uses React Context (`MIDIProvider`) for global application state (key signature, MIDI ports, LUT data) and `useRef` within `NotationCanvas` for performance-critical real-time notation data to avoid React reconciliation overhead during dense polyphonic input.
- **Rendering Strategy:** A "Clear and Redraw" imperative model inside `NotationCanvas` that maps MIDI data to staff-space coordinates using `notationMath.ts`.
- **Data Flow:** `Web MIDI API` → `MIDIProvider` → `NotationCanvas` → `chordSpeller` (via LUT) → `recalculateLayout` → `DOM Update`.

### Directory Breakdown
- **`src/midi/`**: Handles the interface with the Web MIDI API, port selection, and broadcasting messages via custom DOM events (`MIDI_MESSAGE_RECEIVED`).
- **`src/components/`**: UI layer. The most critical file is `NotationCanvas.tsx`, which contains the majority of the app's musical logic.
- **`src/utils/`**: Pure functions for musical mathematics.
    - `notationMath.ts`: Coordinate geometry, staff spacing, and transposition logic.
    - `chordSpeller.ts`: The primary engine for translating raw pitches into readable musical notation.
    - `binaryLut.ts`: The data access layer for the PCS LUT.
- **`public/`**: Static assets, including the `PCS_LUT.dat` binary database and the `Bravura` music font.

## 🔗 Component Interaction Analysis
- **`MIDIProvider` ↔ `NotationCanvas`**: The provider supplies the LUT and global settings. The canvas updates the provider with the "active notes" set for synchronization with the virtual keyboard.
- **`NotationCanvas` ↔ `chordSpeller`**: The canvas passes raw MIDI pitch sets to the speller, which returns key-aware enharmonic strings and staff offsets.
- **`App.tsx` ↔ `Keyboard.tsx`**: `App.tsx` contains a side-effect (`MidiKeyboardUpdater`) that listens for MIDI messages and directly calls a DOM-manipulation utility (`updateKeyVisuals88`) inside the `Keyboard` component for zero-latency visual feedback.

## 🗑 Vestigial File Report

### 🔴 High Confidence (Dead / Reference Code)
*These files are not imported and appear to be leftovers from previous iterations or diagnostic sessions.*

- **`src/components/NotationCanvasV2.tsx`**: An older, significantly less capable version of the notation engine.
- **`Chord Spelling/`**: A legacy directory containing reference spelling logic.
  - `Chord Spelling/README.md`
  - `Chord Spelling/chord_speller.ts`: Superseded by `src/utils/chordSpeller.ts`.
- **`FAILURE_REPORT.md`**: Temporary diagnostic report.
- **`# Post-Mortem- Selection Engine Failure Report.md`**: Historical documentation of a resolved bug.
- **`test_output_main.txt`**: Vestigial test log.
- **`test_output.txt`**: Vestigial test log.
- **`temp_downloaded.dat`**: Artifact from a previous data download/test.
- **`project_tree.txt`**: Temporary file.

### 🟡 Medium Confidence (Review Needed)
*These files are located in cleanup directories or appear to be micro-tests that may no longer be necessary.*

- **`xCleanup/`**: Should be archived or deleted if the code it contains is no longer needed for reference.
  - `xCleanup/scratch/phase1_test.ts`
  - `xCleanup/scratch/verify_dat.js`
- **`src/utils/padding.test.ts`**: Very basic test; check if it still provides value to the current layout engine.
- **`src/utils/pipeline.test.ts`**: Minimal test for the old data pipeline.

### 🟢 Low Confidence (Likely Useful)
*These files appear vestigial but provide valuable regression testing or headless validation.*

- **`src/components/NotationCanvas.headless.test.tsx`**: Essential for verifying layout math without a DOM.
- **`src/components/NotationCanvas.bugs.test.tsx`**: Critical for preventing regressions of previously fixed bugs.
