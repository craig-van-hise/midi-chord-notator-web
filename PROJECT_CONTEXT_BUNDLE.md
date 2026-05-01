### FILE: project_tree.txt


/Users/vv2024/Documents/Repos - vv2024/MIDI/WebApps/midi-chord-notator-web
├── # Prompts
|  ├── # 31.md
|  ├── # 32.md
|  ├── # 33.md
|  ├── # 34.md
|  ├── # 35.md
|  ├── # 36.md
|  ├── # 37.md
|  ├── # PDD.md
|  └── x Older
|     ├── # 1.md
|     ├── # 10.md
|     ├── # 11.md
|     ├── # 12.md
|     ├── # 13.md
|     ├── # 14.md
|     ├── # 15.md
|     ├── # 16.md
|     ├── # 17.md
|     ├── # 18.md
|     ├── # 19.md
|     ├── # 2.md
|     ├── # 20.md
|     ├── # 21.md
|     ├── # 22.md
|     ├── # 23.md
|     ├── # 24.md
|     ├── # 25.md
|     ├── # 26.md
|     ├── # 27.md
|     ├── # 28.md
|     ├── # 29.md
|     ├── # 3.md
|     ├── # 30.md
|     ├── # 4.md
|     ├── # 5.md
|     ├── # 6.md
|     ├── # 7.md
|     ├── # 8.md
|     └── # 9.md
├── Chord Spelling
|  ├── README.md
|  └── chord_speller.ts
├── PROJECT_CONTEXT_BUNDLE.md
├── PROJECT_STATE.md
├── README.md
├── WOs
|  └── grand-staff-app
|     ├── Phase_1
|     |  ├── 1-10_test-engineer.md
|     |  ├── 1-13_ui-coder.md
|     |  ├── 1-14_styling-specialist.md
|     |  └── 1-1_workspace-setup.md
|     ├── Phase_2
|     |  ├── 2-12_frontend-state.md
|     |  ├── 2-13_ui-coder.md
|     |  └── 2-8_api-integrator.md
|     ├── Phase_3
|     |  ├── 3-11_ui-architect.md
|     |  └── 3-12_frontend-state.md
|     ├── Phase_4
|     |  ├── 4-13_ui-coder.md
|     |  └── 4-14_styling-specialist.md
|     ├── Phase_5
|     |  ├── 5-13_ui-coder.md
|     |  └── 5-7_core-algorithm.md
|     ├── Phase_6
|     |  ├── 6-12_frontend-state.md
|     |  ├── 6-13_ui-coder.md
|     |  └── 6-7_core-algorithm.md
|     └── _scorecard.md
├── eslint.config.js
├── index.html
├── llms.txt
├── package-lock.json
├── package.json
├── project_tree.txt
├── public
|  ├── PCS_LUT.dat
|  ├── favicon.svg
|  ├── fonts
|  |  └── Bravura.woff2
|  └── icons.svg
├── scratch
|  ├── phase1_test.ts
|  └── verify_dat.js
├── scripts
|  └── pack_lut.js
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
|  |  ├── Keyboard.test.tsx
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
|  |  ├── binaryLut.ts
|  |  ├── chordSpeller.test.ts
|  |  ├── chordSpeller.ts
|  |  ├── notationMath.test.ts
|  |  ├── notationMath.ts
|  |  ├── notationMath.xLevel.test.ts
|  |  ├── padding.test.ts
|  |  └── pipeline.test.ts
|  └── vitest.setup.ts
├── temp_downloaded.dat
├── test_output.txt
├── tsconfig.app.json
├── tsconfig.json
├── tsconfig.node.json
└── vite.config.ts

directory: 733 file: 5378

ignored: directory (105)


[2K[1G

### FILE: PROJECT_STATE.md

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


### FILE: README.md

# Grand Staff MIDI Notator

A high-performance, musically accurate MIDI notation web application. Designed for professional musicians and developers, this tool translates real-time MIDI input into elegant, SMuFL-compliant grand staff notation.

## ✨ Core Features
* **Real-Time Notation:** Low-latency rendering of musical notation on a grand staff using a custom "Clear and Redraw" imperative engine.
* **Dual-Column Layout:** Intelligent handling of dense chromatic unisons (cohemitonia) with dynamic accidental bounding boxes and independent column zippering.
* **Chord Identification:** Real-time analysis of pitch sets using a 56,000+ entry Look-Up Table to display professional chord symbols with full extension support (e.g., "Cm9", "G13").
* **Theoretical Spelling:** Key-aware enharmonic spelling logic that translates MIDI pitches into musically correct note names, now supporting compound intervals (9ths, 11ths, 13ths).
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
|  |  ├── Keyboard.tsx
|  |  ├── NotationCanvas.tsx
|  |  └── KeySignatureSelector.tsx
|  ├── midi
|  |  ├── MIDIProvider.tsx
|  |  └── midiAccess.ts
|  └── utils
|     ├── chordSpeller.ts
|     ├── notationMath.ts
|     └── binaryLut.ts
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


### FILE: .agent/workflows/git-deploy.md

---
command: /git-deploy
description: "Regenerates the binary LUT from the source JSON and pushes the update to GitHub Pages."
permissions:
  terminal: write
  filesystem: write
---

# Agent Persona
You are a Database Automation Specialist. Your goal is to ensure the theoretical data in the MIDI Notator is perfectly synchronized with the master source while maintaining the security of the underlying JSON data.

# Execution Standard
- **Integrity First:** Always verify that the binary packer completes without errors before attempting to commit.
- **Atomic Commits:** If the database has not changed, do not perform a commit or push.
- **Path Awareness:** Ensure the packer script is pointing to the absolute path of the `PCS_LUT.json` in the Editor project.

# Workflow Steps

1. **Repack Binary Database**
   - Delete the existing binary file to force dev server refresh: `rm -f public/PCS_LUT.dat`
   - Execute the packing script: `node scripts/pack_lut.js`
   - Capture any errors in the conversion process and report them immediately.

2. **Verify Change State**
   - Check for any changes in the repository using `git status --porcelain`.
   - If no changes are detected in either the database or the source code, inform the user and terminate.

3. **Commit and Deploy**
   - Stage all changes: `git add .`
   - Commit with a descriptive message. If the database was updated, use: `chore: update theoretical database`.
   - Push to the `main` branch: `git push origin main`

# Output
1. A summary of the packing results (row count, file size).
2. The Git commit hash for the update.
3. A confirmation that the GitHub Actions deployment has been triggered.


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


