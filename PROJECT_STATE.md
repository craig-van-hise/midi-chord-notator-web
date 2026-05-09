# PROJECT_STATE: Grand Staff MIDI Notator

**Current System Status:** ✅ Stable - OMNI Architecture & Multi-Mode Engine Hardened
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

### 🎹 MIDI & UX Engine
* **OMNI Input Engine:** Defaults to "All Ports" listening, dynamically binding `onmidimessage` listeners to every active hardware and virtual input.
* **Consolidated Multi-Mode Logic:** Implements simultaneous **Toggle** (persistent latching) and **Hold** (chord-based flushing) modes.
* **History Engine (Undo/Redo):** Comprehensive state tracking that captures all MIDI-driven and pointer-driven mutations.
* **Panic System:** Global "All Notes Off" trigger that clears both internal state and physical key trackers.

### 🎼 Notation Engine (Imperative)
* **Headless Mathematical Hit-Testing:** Calculates intersections in memory based on staff-space coordinates, bypassing the DOM for 100% selection accuracy.
* **Pipeline Integrity:** Uses immutable UUID-based note identities to prevent React reconciliation artifacts.
* **Dual-Column Layout (Cohemitonia):** Automatically zippers dense chromatic unisons into a legible two-column stack.
* **Intelligent Ottava Engine:** Dynamically evaluates staff density to apply 8va/15ma/8vb/15mb shifts.

### 🖱 Selection & Editing Engine
* **Anchor-Persistent Range Selection:** Supports shift-click selection with a stable origin, allowing users to expand or contract selections fluidly.
* **Diatonic Transposition:** `Alt + ArrowUp/Down` performs key-signature-aware pitch shifts.
* **Voicing-Aware PCS Rotation:** `Cmd + Alt + ArrowUp/Down` rotates the active pitch class set while maintaining voicing structure.

### 🧠 Chord Identification & Spelling Engine
* **PCS LUT Integration:** 2MB binary database for instant lookup of 56,000+ pitch class sets.
* **Enforced Sort-Order:** Pitch-ordered analysis pipeline guarantees consistent enharmonic spelling and stave assignment.
* **Compound Interval Support:** Advanced spelling for 9ths, 11ths, and 13ths with automated inversion detection.

## 4. Recent Evolution
* **2026-05-09:** Streamlined the MIDI architecture by **eradicating all MIDI Output logic** and implementing a default **OMNI Input Engine**. Consolidated Toggle and Hold modes into the global state and hardened the state-synchronization between the canvas and virtual keyboard to eliminate "flickering" and "Maximum call stack" errors.
* **2026-05-08:** Transitioned to **Immutable Note Identities (UUIDs)** and **Headless Mathematical Hit-Testing**. Resolved persistent React "ghosting" artifacts and achieved perfect selection accuracy.

## 5. Future Roadmap
* **Performance:** Optimizing accidental compaction for extremely dense (> 8 note) clusters.
* **UI:** Enhanced visual feedback for OMNI routing status in the main HUD.
