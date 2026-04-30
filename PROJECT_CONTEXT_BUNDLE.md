### FILE: project_tree.txt

.
./llms.txt
./tsconfig.node.json
./project_tree.txt
./index.html
./tsconfig.app.json
./PROJECT_CONTEXT_BUNDLE.md
./README.md
./Chord Spelling
./Chord Spelling/README.md
./Chord Spelling/chord_speller.ts
./public
./public/fonts
./public/fonts/Bravura.woff2
./public/icons.svg
./public/favicon.svg
./package-lock.json
./package.json
./PROJECT_STATE.md
./tsconfig.json
./WOs
./WOs/grand-staff-app
./WOs/grand-staff-app/Phase_3
./WOs/grand-staff-app/Phase_3/3-11_ui-architect.md
./WOs/grand-staff-app/Phase_3/3-12_frontend-state.md
./WOs/grand-staff-app/Phase_4
./WOs/grand-staff-app/Phase_4/4-13_ui-coder.md
./WOs/grand-staff-app/Phase_4/4-14_styling-specialist.md
./WOs/grand-staff-app/Phase_5
./WOs/grand-staff-app/Phase_5/5-13_ui-coder.md
./WOs/grand-staff-app/Phase_5/5-7_core-algorithm.md
./WOs/grand-staff-app/Phase_2
./WOs/grand-staff-app/Phase_2/2-13_ui-coder.md
./WOs/grand-staff-app/Phase_2/2-12_frontend-state.md
./WOs/grand-staff-app/Phase_2/2-8_api-integrator.md
./WOs/grand-staff-app/_scorecard.md
./WOs/grand-staff-app/Phase_1
./WOs/grand-staff-app/Phase_1/1-10_test-engineer.md
./WOs/grand-staff-app/Phase_1/1-13_ui-coder.md
./WOs/grand-staff-app/Phase_1/1-14_styling-specialist.md
./WOs/grand-staff-app/Phase_1/1-1_workspace-setup.md
./WOs/grand-staff-app/Phase_6
./WOs/grand-staff-app/Phase_6/6-13_ui-coder.md
./WOs/grand-staff-app/Phase_6/6-12_frontend-state.md
./WOs/grand-staff-app/Phase_6/6-7_core-algorithm.md
./test_output.txt
./eslint.config.js
./vite.config.ts
./# Prompts
./# Prompts/# 20.md
./# Prompts/# 21.md
./# Prompts/x Older
./# Prompts/x Older/# 10.md
./# Prompts/x Older/# 14.md
./# Prompts/x Older/# 15.md
./# Prompts/x Older/# 11.md
./# Prompts/x Older/# 4.md
./# Prompts/x Older/# 5.md
./# Prompts/x Older/# 1.md
./# Prompts/x Older/# 6.md
./# Prompts/x Older/# 2.md
./# Prompts/x Older/# 3.md
./# Prompts/x Older/# 7.md
./# Prompts/x Older/# 16.md
./# Prompts/x Older/# 8.md
./# Prompts/x Older/# 12.md
./# Prompts/x Older/# 9.md
./# Prompts/x Older/# 13.md
./# Prompts/x Older/# 17.md
./# Prompts/# PDD.md
./# Prompts/# 18.md
./# Prompts/# 19.md
./# Prompts/# 22.md
./src
./src/App.tsx
./src/main.tsx
./src/midi
./src/midi/MidiPortSelector.tsx
./src/midi/MIDIProvider.test.tsx
./src/midi/midiAccess.ts
./src/midi/midiAccess.test.ts
./src/midi/MIDIProvider.tsx
./src/App.test.tsx
./src/App.css
./src/utils
./src/utils/notationMath.ts
./src/utils/chordSpeller.ts
./src/utils/notationMath.test.ts
./src/index.css
./src/components
./src/components/KeySignatureSelector.tsx
./src/components/Keyboard.tsx
./src/components/NotationCanvas.test.tsx
./src/components/NotationCanvas.tsx
./src/components/InfoModal.tsx
./src/components/SettingsModal.test.tsx
./src/components/SettingsModal.tsx
./src/assets
./src/assets/hero.png
./src/assets/vite.svg
./src/assets/PCS_LUT.json
./src/assets/react.svg
./src/vitest.setup.ts


### FILE: PROJECT_STATE.md

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
* **2026-04-30:** Integrated the full PCS_LUT dataset and implemented real-time chord symbol notation with slash chord support.
* **2026-04-29:** Resolved "white screen" rendering issues by refactoring data ingestion to an async pattern and adding robust error boundaries to the rendering loop.
* **2026-04-24:** Resolved modal stacking context bug by hoisting overlays to root and enforcing `z-[100]`.
* **2026-04-24:** Finalized Ottava transposition logic and fine-tuned label Y-offsets.


### FILE: README.md

# Grand Staff MIDI Notator

A high-performance, musically accurate MIDI notation web application. Designed for professional musicians and developers, this tool translates real-time MIDI input into elegant, SMuFL-compliant grand staff notation.

## ✨ Core Features
* **Real-Time Notation:** Low-latency rendering of musical notation on a grand staff using a custom "Clear and Redraw" imperative engine.
* **Chord Identification:** Real-time analysis of pitch sets using a 56,000+ entry Look-Up Table to display professional chord symbols (e.g., "Cm9", "G7/B").
* **Theoretical Spelling:** Key-aware enharmonic spelling logic that translates MIDI pitches into musically correct note names.
* **Intelligent Ottava Transposition:** Automated group-wide staff shifts (8va/15ma/8vb/15mb) for extreme registers.
* **88-Key Virtual Piano:** Integrated visualizer with performance-optimized imperative updates.
* **Pro-Audio Layout:** Ultra-slim header and hoisted modals for an unobstructed, professional workspace.

## 🛠 Tech Stack
* **Framework:** React 19 + TypeScript
* **Build Tool:** Vite 8
* **Styling:** Tailwind CSS 4
* **Music Font:** Bravura (SMuFL)
* **API:** Native Web MIDI

## 🚀 Quick Start
1. **Clone the repository.**
2. **Install dependencies:**
   ```bash
   npm install
   ```
3. **Start development server:**
   ```bash
   npm run dev
   ```

## 📂 Project Structure
```text
.
├── src
|  ├── components
|  |  ├── InfoModal.tsx
|  |  ├── KeySignatureSelector.tsx
|  |  ├── Keyboard.tsx
|  |  ├── NotationCanvas.tsx
|  |  └── SettingsModal.tsx
|  ├── midi
|  |  ├── MIDIProvider.tsx
|  |  ├── MidiPortSelector.tsx
|  |  └── midiAccess.ts
|  └── utils
|     ├── chordSpeller.ts
|     └── notationMath.ts
└── vite.config.ts
```

## 📜 License
MIT


### FILE: .agent/workflows/tdd-validation.md

---
command: /test-and-verify
description: Executes the Vitest test suite and strictly verifies coverage for the current implementation phase.
permissions:
  terminal: write
  filesystem: read
---
# Agent Persona
You act as a ruthless QA automation engineer. You accept no code implementations that lack comprehensive unit and integration test coverage.

# Execution Standard
1. Execute the command `npm run test run` in the terminal.
2. Analyze the standard output for any failing test suites or missing assertions.
3. If ANY test fails, you must output a detailed failure report, halt your execution immediately, and refuse to proceed to the next development phase until the test successfully passes.


### FILE: .agent/rules/01-react-vite-standards.md

---
trigger: always_on

# React 19, Vite, and Tailwind 4.1 Development Standards

## Architecture Protocols

* You must utilize functional components strictly across the entire application architecture.
* You are forbidden from utilizing useMemo or useCallback manually; you must assume the React Compiler is actively handling component memoization.
* Tailwind CSS 4.1 MUST be installed and configured using the @tailwindcss/vite plugin. You are strictly forbidden from generating legacy files such as postcss.config.js or tailwind.config.js. You must use @import "tailwindcss"; in the primary entry CSS file.
* State management for high-frequency events (MIDI) must bypass React state entirely in favor of imperative DOM manipulation to avoid reconciliation lag.

## TypeScript Mandates

* The any type is strictly forbidden across the entire repository.
* All MIDI data payloads must be typed using strict discriminated unions based on the MIDI status byte (e.g., isolating Note On, Note Off, and Control Change events).


### FILE: .agent/rules/02-smufl-engine.md

---
trigger: always_on

# SMuFL Bravura Font Protocols and Notation Mathematics

## Unicode Constants

You must utilize the following SMuFL standard hex codes exclusively for rendering text nodes:

* Treble Clef (G-Clef): U+E050
* Bass Clef (F-Clef): U+E061
* Brace: U+E000
* Bracket: U+E002
* Single Barline: U+E030
* Standard Notehead (Black): U+E0A4
* Standard Notehead (Whole): U+E0A2
* Sharp: U+E262
* Flat: U+E260
* Natural: U+E261

## Layout Mathematics

* The baseline unit for all notation CSS positioning is the CSS custom property var(--staff-space).
* The Grand Staff consists of two independent 5-line staves.
* The vertical distance separating the bottom line of the Treble staff and the top line of the Bass staff must be mathematically defined as exactly 10 spaces.
* Middle C (MIDI 60) resides mathematically at the exact vertical midpoint between the two staves. All pitch Y-coordinate calculations must originate from this anchor point.


### FILE: .agent/skills/midi-injector/SKILL.md

---
name: midi-injector
description: Simulates an incoming MIDI hardware message for testing imperative DOM updates in the browser or test runner.

# Goal

To bypass physical hardware constraints by injecting synthetic MIDIMessageEvent payloads directly into the global window object, triggering the imperative DOM bridge.

# Standard Operating Procedure

When a test scenario requires you to "test a chord" or "simulate a MIDI Note On", you must execute the accompanying Node.js script to dispatch a CustomEvent that perfectly maps to the native Web MIDI API signature (Status Byte, Data1 for pitch, Data2 for velocity).


