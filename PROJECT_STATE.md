# PROJECT_STATE: Grand Staff MIDI Notator

**Current System Status:** ✅ Phase 9 Complete - MIDI Thru & Feedback Loop Protection
**Last Updated:** 2026-05-05

## 1. Project Architecture (Level 3)
```text
.
├── # Prompts
├── .agent
├── .conductor_logs
├── public
|  ├── PCS_LUT.dat
|  ├── fonts
|  |  ├── Bravura.woff2
|  |  └── Bravura_metadata.json
|  └── icons.svg
├── src
|  ├── App.tsx
|  ├── components
|  |  ├── ErrorBoundary.tsx
|  |  ├── KeySignatureSelector.tsx
|  |  ├── Keyboard.tsx
|  |  ├── NotationCanvas.tsx
|  |  └── SettingsModal.tsx
|  ├── midi
|  |  ├── MIDIProvider.tsx
|  |  ├── MidiPortSelector.tsx
|  |  └── midiAccess.ts
|  ├── utils
|  |  ├── binaryLut.ts
|  |  ├── chordSpeller.ts
|  |  └── notationMath.ts
|  └── vitest.setup.ts
├── tsconfig.json
└── vite.config.ts
```

## 2. Tech Stack
* **Core:** React 19, TypeScript, Vite 8
* **Styling:** Tailwind CSS 4, CSS Variables for music spacing, Quicksand/Jost Fonts
* **Testing:** Vitest, React Testing Library, JSDOM
* **Notation:** SMuFL (Standard Music Font Layout) via Bravura font
* **MIDI:** Native Web MIDI API

## 3. System Capabilities

### 🎹 MIDI Engine
* **Targeted Input Listening:** Explicitly attaches `onmidimessage` listeners only to the user-selected input port, preventing feedback loops in virtual loopback configurations.
* **Hardware MIDI Thru:** Low-latency pass-through that forwards raw MIDI data to external hardware synthesizers immediately upon receipt.
* **Ref-Based Port Management:** Uses `useRef` for port handling in high-frequency callbacks to prevent React stale closures without performance degradation.
* **Panic System:** Global "All Notes Off" trigger (CC 123 + individual Note Offs) to clear both internal state and external gear.

### 🎼 Notation Engine (Imperative)
* **Grand Staff System:** Renders treble and bass staves using SMuFL glyphs.
* **Dual-Column Layout (Cohemitonia):** Handles dense chromatic unisons (e.g., Db and D natural) using a two-stack zippering architecture with dynamic gap injection.
* **Intelligent Ottava Transposition:** Implements group-wide staff shifts (8va/15ma/8vb/15mb).
* **Collision Detection:** Accidental stacking logic with tuned 0.8 staff-space padding and "zipper pattern" for notehead clusters.

### 🧠 Chord Identification & Spelling Engine
* **PCS LUT Integration:** Utilizes a 2MB Pitch Class Set Look-Up Table (56,000+ entries) for instant identification.
* **Compound Interval Spelling:** Support for 9ths, 11ths, and 13ths with modulo-7 diatonic mapping.
* **$O(1)$ Chromatic Root Spelling:** Optimized lookup for root note enharmonics, including support for Minor 2nd, Dorian, and Phrygian sonority rules.
* **Professional Chord Symbols:** Key-aware labels with automated inversion detection and slash notation (e.g., "G7/B").

## 4. Recent Evolution
* **2026-05-04:** Implemented **MIDI Thru** architecture for external hardware support. Refactored the MIDI input engine to use **Targeted Listeners**, eliminating infinite feedback loops. Resolved CI/CD build failures and updated to Node 24.
* **2026-05-04:** Expanded the chromatic spelling engine to support **Minor 2nd, Dorian, and Phrygian** rules, ensuring theoretical accuracy for modal voicings.
* **2026-05-01:** Overhauled the interval parsing engine to support **Compound Intervals** (9ths, 11ths, 13ths).
* **2026-05-01:** Architected and implemented the **Dual-Column Layout** engine for resolving chromatic cluster collisions (cohemitonia).

## 5. Future Roadmap
* **Maintenance:** Periodic updates to the `PCS_LUT.dat` theoretical database.
* **UI Polish:** Fine-tuning accidental compaction for extremely dense clusters (> 5 notes).
