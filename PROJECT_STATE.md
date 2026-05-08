# PROJECT_STATE: Grand Staff MIDI Notator

**Current System Status:** ✅ Phase 12 Complete - Headless Mathematical Hit-Testing
**Last Updated:** 2026-05-08

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
* **Targeted Input Listening:** Explicitly attaches `onmidimessage` listeners only to the user-selected input port.
* **Global Note Synchronization:** Implements a custom event-driven synchronization bridge between the `NotationCanvas` and `MIDIProvider`.
* **Hardware MIDI Thru:** Low-latency pass-through that forwards raw MIDI data to external gear.
* **Panic System:** Global "All Notes Off" trigger.

### 🎼 Notation Engine (Imperative)
* **Headless Mathematical Hit-Testing:** Intercepts raw pointer coordinates and calculates intersections in memory using the layout's Y-coordinate baseline. Completely bypasses the DOM for interaction.
* **Dual-Column Layout (Cohemitonia):** Handles dense chromatic unisons using a two-stack zippering architecture.
* **Intelligent Ottava Transposition:** Implements group-wide staff shifts (8va/15ma/8vb/15mb).
* **Collision Detection:** Accidental stacking logic with tuned 0.8 staff-space padding.

### 🖱 Note Selection & Editing Engine
* **Headless Marquee:** Calculates selection sets by intersecting drawn bounding boxes with the mathematical note positions in the active set.
* **Diatonic Transposition:** `Alt + ArrowUp/Down` snaps selected notes to the active key signature's scale degrees.
* **Voicing-Aware PCS Rotation:** `Cmd + Alt + ArrowUp/Down` performs theoretical rotation of the pitch class set.
* **Selection Modes:** Supports single-click, multi-select (Cmd/Ctrl), and range selection (Shift).

### 🧠 Chord Identification & Spelling Engine
* **PCS LUT Integration:** Utilizes a 2MB Pitch Class Set Look-Up Table (56,000+ entries) for instant identification.
* **Compound Interval Spelling:** Support for 9ths, 11ths, and 13ths.
* **$O(1)$ Chromatic Root Spelling:** Optimized lookup for root note enharmonics.
* **Professional Chord Symbols:** Key-aware labels with automated inversion detection.

## 4. Recent Evolution
* **2026-05-08:** Abandoned DOM-based hit-testing. Implemented the **Headless Mathematical Hit-Testing** engine, achieving 100% selection accuracy by calculating collisions in memory. Restored **Diatonic Transposition** and **PCS Rotation** mutations using the new coordinate-based selection set.
* **2026-05-04:** Implemented **MIDI Thru** architecture for external hardware support.
* **2026-05-04:** Expanded the chromatic spelling engine to support **Minor 2nd, Dorian, and Phrygian** rules.
* **2026-05-01:** Overhauled the interval parsing engine to support **Compound Intervals** (9ths, 11ths, 13ths).

## 5. Future Roadmap
* **Maintenance:** Periodic updates to the `PCS_LUT.dat` theoretical database.
* **UI Polish:** Fine-tuning accidental compaction for extremely dense clusters (> 5 notes).
