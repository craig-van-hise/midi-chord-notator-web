# PROJECT_STATE: Grand Staff MIDI Notator

**Current System Status:** ✅ Stable - OMNI Architecture & Multi-Mode Engine Hardened
**Last Updated:** 2026-05-14

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
|  |  ├── NavControllerOriginal.tsx (MIDI Navigation)
|  |  ├── NotationCanvas.tsx
|  |  ├── ROMPler (MIDI Playback)
|  |  |  ├── AudioProvider.tsx
|  |  |  └── SimpleSampler.ts
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
* **Audio:** Web Audio API (SimpleSampler)
* **Styling:** Tailwind CSS 4, CSS Variables for music spacing, Jost/Quicksand Fonts
* **Testing:** Vitest, React Testing Library, JSDOM
* **Notation:** SMuFL (Standard Music Font Layout) via Bravura font
* **MIDI:** Native Web MIDI API

## 3. System Capabilities

### 🎹 MIDI & Audio Engine
* **OMNI Input Engine:** Defaults to "All Ports" listening, dynamically binding `onmidimessage` listeners to every active hardware and virtual input.
* **Integrated ROMPler:** Tabbed footer Sampler with ADSR envelope, sample-based playback, and `activePreviews` reference tracking to prevent orphaned sustain.
* **Consolidated Multi-Mode Logic:** Implements simultaneous **Toggle** (persistent latching) and **Hold** (chord-based flushing) modes.
* **History Engine (Undo/Redo):** Comprehensive state tracking that captures all MIDI-driven and pointer-driven mutations.

### 🎼 Notation Engine (Imperative)
* **Headless Mathematical Hit-Testing:** Calculates intersections in memory based on staff-space coordinates, bypassing the DOM for 100% selection accuracy.
* **Pipeline Integrity:** Uses immutable UUID-based note identities to prevent React reconciliation artifacts.
* **Dual-Column Layout (Cohemitonia):** Automatically zippers dense chromatic unisons into a legible two-column stack.
* **Intelligent Ottava Engine:** Dynamically evaluates staff density to apply 8va/15ma/8vb/15mb shifts.

### 🖱 Selection & Editing Engine
* **Anchor-Persistent Range Selection:** Supports shift-click selection with a stable origin, allowing users to expand or contract selections fluidly.
* **Diatonic Transposition:** `Alt + ArrowUp/Down` performs key-signature-aware pitch shifts.
* **Voicing-Aware PCS Rotation:** `Cmd + Alt + ArrowUp/Down` rotates the active pitch class set while maintaining voicing structure.
* **MIDI Navigation Controller:** Dedicated component (`NavControllerOriginal`) for tactile interaction and state traversal.

### 🧠 Chord Identification & Spelling Engine
* **PCS LUT Integration:** 2MB binary database for instant lookup of 56,000+ pitch class sets.
* **Hardened Inversion Spelling:** Verified root-position vs. inversion interval logic ensures correct enharmonic mapping (e.g. "G Bb D E" vs "G E E E").
* **Safety Fallbacks:** Engine defaults to key-aware individual spelling if chord interval matches fail, preventing visual glitches.

## 4. Recent Evolution
* **2026-05-14:** Resolved a critical **Chord Spelling Regression** caused by a LUT generator bug in Phase 4.5. Hardened the `chordSpeller.ts` utility with safety fallbacks and repacked the binary database with correct inversion mappings.
* **2026-05-13:** Integrated the **MIDI ROMPler** into a tabbed footer, implementing a robust Preview Voice Manager to eliminate orphaned sustain during rapid canvas interactions.
* **2026-05-12:** Ported the **MIDI Navigation Controller** suite, establishing `NavControllerOriginal` as the primary interaction hub for state traversal.

## 5. Future Roadmap
* **Performance:** Optimizing accidental compaction for extremely dense (> 8 note) clusters.
* **UI:** Enhanced visual feedback for OMNI routing status in the main HUD.
