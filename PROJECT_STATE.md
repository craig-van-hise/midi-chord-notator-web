# PROJECT_STATE: Grand Staff MIDI Notator

**Current System Status:** ✅ Phase 8 Complete - Compound Interval Spelling & Extension Support
**Last Updated:** 2026-05-01

## 1. Project Architecture (Level 3)
```text
.
├── # Prompts
├── .agent
├── .conductor_logs
├── public
|  ├── PCS_LUT.dat
|  ├── favicon.svg
|  ├── fonts
|  └── icons.svg
├── src
|  ├── App.css
|  ├── App.test.tsx
|  ├── App.tsx
|  ├── assets
|  |  ├── hero.png
|  |  ├── react.svg
|  |  └── vite.svg
|  ├── components
|  |  ├── ErrorBoundary.tsx
|  |  ├── InfoModal.tsx
|  |  ├── KeySignatureSelector.tsx
|  |  ├── Keyboard.tsx
|  |  ├── NotationCanvas.tsx
|  |  └── SettingsModal.tsx
|  ├── index.css
|  ├── main.tsx
|  ├── midi
|  |  ├── MIDIProvider.tsx
|  |  ├── MidiPortSelector.tsx
|  |  └── midiAccess.ts
|  ├── utils
|  |  ├── binaryLut.ts
|  |  ├── chordSpeller.ts
|  |  ├── notationMath.ts
|  |  ├── notationMath.xLevel.test.ts
|  |  ├── padding.test.ts
|  |  └── pipeline.test.ts
|  └── vitest.setup.ts
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
* **Event Decoupling:** Uses a Custom Event bridge (`MIDI_MESSAGE_RECEIVED`) to communicate between the React provider and imperative rendering layers.
* **Panic System:** Global "All Notes Off" trigger to clear the canvas and keyboard state.

### 🎼 Notation Engine (Imperative)
* **Grand Staff System:** Renders treble and bass staves using SMuFL glyphs.
* **Dual-Column Layout (Cohemitonia):** Handles dense chromatic unisons (e.g., Db and D natural) using a two-stack zippering architecture with dynamic gap injection.
* **Intelligent Ottava Transposition:** Implements group-wide staff shifts (8va/15ma/8vb/15mb).
* **Collision Detection:** Accidental stacking logic with tuned 0.8 staff-space padding and "zipper pattern" for notehead clusters.

### 🧠 Chord Identification & Spelling Engine
* **PCS LUT Integration:** Utilizes a 2MB Pitch Class Set Look-Up Table (56,000+ entries) for instant identification.
* **Compound Interval Spelling:** Refactored interval engine supporting 9ths, 11ths, and 13ths. Implements modulo-7 mapping to simple diatonic degrees for accurate notation spelling.
* **Theoretical Spelling:** Key-aware logic that determines musically correct names relative to the active key signature.
* **Chord Symbols & Slash Notation:** Professional labels (e.g., "Cm9", "G7/B") with automated inversion detection.

### 📐 Enharmonic & Key Logic
* **Key Signature Selector:** UI support for 7 flats to 7 sharps.
* **Synchronized Naming:** Algorithm-driven note naming (e.g., C# vs. Db) locked to the key signature.

## 4. Recent Evolution
* **2026-05-01:** Overhauled the interval parsing engine to support compound intervals (extensions). Implemented modulo math for diatonic degree reduction, enabling accurate spelling of 9ths, 11ths, and 13ths on the staff.
* **2026-05-01:** Architected and implemented the "Dual-Column" layout engine to resolve collision issues in chromatic clusters (cohemitonia).
* **2026-04-30:** Integrated the full PCS_LUT dataset and implemented real-time chord symbol notation.
* **2026-04-29:** Resolved rendering stability issues by refactoring data ingestion to an async pattern.
* **2026-04-24:** Resolved modal stacking context bug by hoisting overlays to root and enforcing `z-[100]`.
* **2026-04-24:** Finalized Ottava transposition logic and fine-tuned label Y-offsets.

## 5. Future Roadmap
* **Maintenance:** Monitoring for hardware-specific MIDI timing variations.
* **UI Polish:** Finalizing accidental compaction alignment.
