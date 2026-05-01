# PROJECT_STATE: Grand Staff MIDI Notator

**Current System Status:** ✅ Phase 6 Complete - Core Features & UI Optimization Finalized
**Last Updated:** 2026-04-24

## 1. Project Architecture (Level 3)
```text
.
├── # Prompts
├── .agent
├── .conductor_logs
├── WOs
├── dist
├── public
├── src
|  ├── App.css
|  ├── App.test.tsx
|  ├── App.tsx
|  ├── assets
|  |  ├── PCS_LUT.json
|  |  ├── hero.png
|  |  ├── react.svg
|  |  └── vite.svg
|  ├── components
|  |  ├── InfoModal.tsx
|  |  ├── KeySignatureSelector.tsx
|  |  ├── Keyboard.tsx
|  |  ├── NotationCanvas.test.tsx
|  |  ├── NotationCanvas.tsx
|  |  ├── SettingsModal.test.tsx
|  |  └── SettingsModal.tsx
|  ├── index.css
|  ├── main.tsx
|  ├── midi
|  |  ├── MIDIProvider.test.tsx
|  |  ├── MIDIProvider.tsx
|  |  ├── MidiPortSelector.tsx
|  |  ├── midiAccess.test.ts
|  |  └── midiAccess.ts
|  ├── utils
|  |  ├── chordSpeller.ts
|  |  ├── notationMath.test.ts
|  |  └── notationMath.ts
|  └── vitest.setup.ts
├── test_output.txt
├── tsconfig.app.json
├── tsconfig.json
├── tsconfig.node.json
└── vite.config.ts
```

## 2. Tech Stack
* **Core:** React 19, TypeScript, Vite 8
* **Styling:** Tailwind CSS 4, CSS Variables for music spacing, Quicksand Font (Chord Symbols)
* **Testing:** Vitest, React Testing Library, JSDOM
* **Notation:** SMuFL (Standard Music Font Layout) via Bravura font
* **MIDI:** Native Web MIDI API

## 3. System Capabilities

### 🎹 MIDI Engine
* **Native Integration:** Direct interface with `navigator.requestMIDIAccess`.
* **Event Decoupling:** Uses a Custom Event bridge (`MIDI_MESSAGE_RECEIVED`) to communicate between the React provider and imperative rendering layers, bypassing React's re-render cycle for 60fps performance.
* **Port Selection:** UI controls for selecting input/output MIDI devices.
* **Panic System:** Global "All Notes Off" trigger to clear the canvas and keyboard state.

### 🎼 Notation Engine (Imperative)
* **Grand Staff System:** Renders treble and bass staves using SMuFL glyphs.
* **Group Redraw Architecture:** Engine maintains active note state and performs a full redraw on every MIDI event.
* **Intelligent Ottava Transposition:** Implements group-wide staff shifts (8va/15ma/8vb/15mb).
* **Collision Detection:** Implementation of a "zipper pattern" for notehead clusters and horizontal accidental stacking.

### 🧠 Chord Identification & Spelling Engine
* **PCS LUT Integration:** Utilizes a comprehensive 2MB Pitch Class Set Look-Up Table (56,000+ entries) for instant chord identification.
* **Theoretical Spelling:** Sophisticated interval-based spelling logic that determines the musically correct name for any pitch set relative to the key signature.
* **Chord Symbols:** Real-time display of chord names (e.g., "Cm7", "G13") above the staff.
* **Slash Notation:** Automated detection of inversions and root positioning, providing standard slash chord labels (e.g., "C/E") when the lowest note is not the root.

### 📐 Enharmonic & Key Logic
* **Key Signature Selector:** UI support for 7 flats to 7 sharps.
* **Enharmonic Spelling:** Algorithm-driven note naming (e.g., C# vs. Db) synchronized with the active key signature.

### 🖼 UI & Layout
* **Professional Workspace:** Ultra-slim header with integrated MIDI controls.
* **Modal Hoisting:** Info and Settings modals are parented to the root DOM level for global stacking context.
* **Keyboard:** Static 88-key piano visualizer with imperative illumination.

## 4. Current Work-in-Progress
* **Maintenance:** Monitoring for edge-case MIDI loopbacks or hardware-specific timing issues.
* **Documentation Sync:** Finalizing the architectural summary.

## 5. Recent Evolution
* **2026-05-01:** Tuned accidental layout padding (multiplier 0.8) to resolve visual collisions in dense chromatic clusters. Stabilized dual-column layout pre-calculation logic.
* **2026-04-30:** Integrated the full PCS_LUT dataset and implemented real-time chord symbol notation with slash chord support.
* **2026-04-29:** Resolved "white screen" rendering issues by refactoring data ingestion to an async pattern and adding robust error boundaries to the rendering loop.
* **2026-04-24:** Resolved modal stacking context bug by hoisting overlays to root and enforcing `z-[100]`.
* **2026-04-24:** Finalized Ottava transposition logic and fine-tuned label Y-offsets.
