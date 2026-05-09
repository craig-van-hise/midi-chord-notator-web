# PROJECT_STATE: Grand Staff MIDI Notator

**Current System Status:** ✅ Stable - Data Integrity & Selection Engine Hardened
**Last Updated:** 2026-05-09

## 1. Project Architecture (Level 3)
```text
.
├── # Prompts
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
|  |  ├── InfoModal.tsx
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
* **Styling:** Tailwind CSS 4, CSS Variables for music spacing, Jost/Quicksand Fonts
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
* **Headless Mathematical Hit-Testing:** Intercepts raw pointer coordinates and calculates intersections in memory. Completely bypasses the DOM for interaction.
* **Pipeline Integrity (Data Reconciliation):** Uses immutable object patterns and UUID-based identity to prevent state desync and React "ghosting" artifacts during complex transpositions.
* **Dual-Column Layout (Cohemitonia):** Handles dense chromatic unisons using a two-stack zippering architecture.
* **Intelligent Ottava Engine:** Independent staff evaluation for group-wide shifts (8va/15ma/8vb/15mb).
* **Collision Detection:** Accidental stacking logic with tuned 0.8 staff-space padding.

### 🖱 Note Selection & Editing Engine
* **Anchor-Persistent Range Selection:** Supports shift-click selection with a stable anchor, allowing users to "scale back" selections without losing the origin point.
* **Headless Marquee:** Calculates selection sets by intersecting drawn bounding boxes with the mathematical note positions in memory.
* **Diatonic Transposition:** `Alt + ArrowUp/Down` snaps selected notes to the active key signature's scale degrees.
* **Voicing-Aware PCS Rotation:** `Cmd + Alt + ArrowUp/Down` performs theoretical rotation of the pitch class set.

### 🧠 Chord Identification & Spelling Engine
* **PCS LUT Integration:** Utilizes a 2MB Pitch Class Set Look-Up Table (56,000+ entries) for instant identification.
* **Forced Pitch Sorting:** Enforces a pitch-ordered pipeline before spelling analysis to guarantee consistent stave-assignment.
* **Compound Interval Spelling:** Support for 9ths, 11ths, and 13ths.
* **Professional Chord Symbols:** Key-aware labels with automated inversion detection.

## 4. Recent Evolution
* **2026-05-08:** Hardened the MIDI data pipeline by transitioning to **Immutable Note Identities (UUIDs)**. This eliminated "React Ghosting" during note crossovers and resolved state desync by enforcing a pitch-sort order before spelling calculation. Refined the selection engine to support **Anchor-Persistent Range Selection** and fixed visual artifacts in ledger line generation and keyboard highlights.
* **2026-05-08:** Abandoned DOM-based hit-testing. Implemented the **Headless Mathematical Hit-Testing** engine, achieving 100% selection accuracy by calculating collisions in memory.

## 5. Future Roadmap
* **Maintenance:** Periodic updates to the `PCS_LUT.dat` theoretical database.
* **UI Polish:** Fine-tuning accidental compaction for extremely dense clusters (> 5 notes).
