# PROJECT_STATE: Grand Staff MIDI Notator

**Current System Status:** ✅ Stable - Transformations Suite & MIDI Learn Hardened
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
|  |  ├── SettingsModal.tsx
|  |  └── toolbar
|  |     ├── TransformationsContextMenus.tsx
|  |     ├── TransformationsDrawer.tsx
|  |     ├── TransformationsToolbar.tsx
|  |     └── TransformationsTypes.ts
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
* **Audio:** Tone.js, Web Audio API (SimpleSampler)
* **Styling:** Tailwind CSS 4, Framer Motion (Drawer animations)
* **Testing:** Vitest, React Testing Library, JSDOM
* **Notation:** SMuFL (Standard Music Font Layout) via Bravura font
* **MIDI:** Native Web MIDI API

## 3. System Capabilities

### 🎹 MIDI & Audio Engine
* **"Dumb Pipe" Provider:** Streamlined MIDI input thread that routes hardware and virtual events instantly to the canvas, bypassing legacy caching to prevent sustain hangs.
* **Integrated ROMPler:** Tabbed footer Sampler with ADSR envelope, sample-based playback, and `activePreviews` reference tracking to prevent orphaned sustain.
* **Dynamic PLAY Envelopes:** The Toolbar `PLAY` button behaves like a physical key, respecting hardware velocity and sustaining exactly as long as the key (or pointer) is held.
* **Choke Group (Monophony):** Enforces strict monophony for mapped hardware keys to prevent transformation stacking and ensure clean audio transitions.

### 🛠 Transformations Toolbar
* **Interactive Drawer:** An animated, calibrated drawer providing quick access to Chromatic/Diatonic shifts, PCS Rotations, and History controls.
* **MIDI Learn Mode:** Intuitive mapping system for binding hardware MIDI notes to UI transformation actions, with `localStorage` persistence.
* **Context-Aware Menus:** Per-button configuration for step sizes and MIDI channel/note filtering.

### 🎼 Notation Engine (Imperative)
* **Headless Mathematical Hit-Testing:** Calculates intersections in memory based on staff-space coordinates, bypassing the DOM for 100% selection accuracy.
* **Pipeline Integrity:** Uses immutable UUID-based note identities to prevent React reconciliation artifacts.
* **Dual-Column Layout (Cohemitonia):** Automatically zippers dense chromatic unisons into a legible two-column stack.
* **Intelligent Ottava Engine:** Dynamically evaluates staff density to apply 8va/15ma/8vb/15mb shifts.

### 🧠 Selection & Editing Engine
* **Anchor-Persistent Range Selection:** Supports shift-click selection with a stable origin, allowing users to expand or contract selections fluidly.
* **Diatonic Transposition:** `Alt + ArrowUp/Down` performs key-signature-aware pitch shifts.
* **Voicing-Aware PCS Rotation:** `Cmd + Alt + ArrowUp/Down` rotates the active pitch class set while maintaining voicing structure.

## 4. Recent Evolution
* **2026-05-14:** Integrated the **Transformations Suite** with an animated drawer. Implemented **MIDI Learn Mode** with persistence, a strict **Choke Group** for hardware monophony, and **Dynamic PLAY Envelopes**. Refactored `MIDIProvider` into a "Dumb Pipe" to fix legacy sustain bugs.
* **2026-05-13:** Integrated the **MIDI ROMPler** into a tabbed footer, implementing a robust Preview Voice Manager to eliminate orphaned sustain during rapid canvas interactions.
* **2026-05-12:** Ported the **MIDI Navigation Controller** suite, establishing `NavControllerOriginal` as the primary interaction hub for state traversal.

## 5. Future Roadmap
* **Performance:** Optimizing accidental compaction for extremely dense (> 8 note) clusters.
* **UI:** Enhanced visual feedback for OMNI routing status in the main HUD.
