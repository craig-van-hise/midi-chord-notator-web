# PROJECT_STATE: Grand Staff MIDI Notator

**Current System Status:** ✅ Stable - Core Audio Gatekeeper, UI Streamlining & Web Deployment Hardened
**Last Updated:** 2026-05-19

## 1. Project Architecture (Level 3)
```text
.
├── # Prompts
├── public
│   ├── PCS_LUT.dat
│   ├── favicon.svg
│   ├── fonts
│   │   └── Bravura.woff2
│   └── icons.svg
├── src
│   ├── App.audioUnlock.test.tsx
│   ├── App.css
│   ├── App.test.tsx
│   ├── App.tsx
│   ├── assets
│   │   ├── fonts
│   │   ├── hero.png
│   │   ├── react.svg
│   │   └── vite.svg
│   ├── audio
│   │   └── engine.ts
│   ├── components
│   │   ├── ErrorBoundary.tsx
│   │   ├── InfoModal.tsx
│   │   ├── KeySignatureSelector.tsx
│   │   ├── Keyboard.test.tsx
│   │   ├── Keyboard.tsx
│   │   ├── Knob.tsx
│   │   ├── NavController.tsx
│   │   ├── NotationCanvas.bugs.test.tsx
│   │   ├── NotationCanvas.events.test.tsx
│   │   ├── NotationCanvas.headless.test.tsx
│   │   ├── NotationCanvas.history.test.tsx
│   │   ├── NotationCanvas.selection.test.tsx
│   │   ├── NotationCanvas.shortcutAudio.test.tsx
│   │   ├── NotationCanvas.test.tsx
│   │   ├── NotationCanvas.tsx
│   │   ├── RomplerFooter.tsx
│   │   ├── SettingsModal.test.tsx
│   │   ├── SettingsModal.tsx
│   │   ├── VUMeter.tsx
│   │   ├── navTypes.ts
│   │   └── toolbar
│   │       ├── ToolbarContextMenus.tsx
│   │       ├── ToolbarTypes.ts
│   │       ├── TransformationsContextMenus.tsx
│   │       ├── TransformationsDrawer.tsx
│   │       ├── TransformationsToolbar.tsx
│   │       └── TransformationsTypes.ts
│   ├── index.css
│   ├── lib
│   │   ├── usePersistentState.ts
│   │   └── utils.ts
│   ├── main.tsx
│   ├── midi
│   │   ├── MIDIProvider.test.tsx
│   │   ├── MIDIProvider.tsx
│   │   ├── MidiPortSelector.tsx
│   │   ├── midiAccess.test.ts
│   │   └── midiAccess.ts
│   ├── utils
│   │   ├── binaryLut.ts
│   │   ├── chordSpeller.test.ts
│   │   ├── chordSpeller.ts
│   │   ├── notationMath.test.ts
│   │   ├── notationMath.ts
│   │   ├── notationMath.xLevel.test.ts
│   │   ├── padding.test.ts
│   │   └── pipeline.test.ts
│   └── vitest.setup.ts
├── tsconfig.app.json
├── tsconfig.json
├── tsconfig.node.json
└── vite.config.ts
```

## 2. Tech Stack
* **Core:** React 19, TypeScript, Vite 8
* **Audio:** Tone.js, Web Audio API, smplr (`src/audio/engine.ts`)
* **Styling:** Tailwind CSS 4, Framer Motion (`motion`), `lucide-react`, `clsx`, `tailwind-merge`
* **Testing:** Vitest, React Testing Library, JSDOM
* **Notation:** SMuFL (Standard Music Font Layout) via Bravura font (`Bravura.woff2`)
* **MIDI:** Native Web MIDI API

## 3. System Capabilities

### 🎹 Audio Engine
* **Click-to-Start Gatekeeper:** Explicit absolute-positioned overlay in `NotationCanvas.tsx` requiring a user click to execute `Tone.start()`, eliminating UX ambiguity and race conditions.
* **MIDI Bouncer Guard:** `handleMidiMessage` actively drops MIDI playback requests if `Tone.context.state !== 'running'`, preventing premature buffer corruption.
* **Direct Transformation Plumbing:** `applyChromaticShift`, `applyDiatonicShift`, and `applyPcsRotation` invoke `audioEngine` directly, bypassing React closure traps for deterministic keyboard shortcut audio.
* **Integrated ROMPler:** Tabbed footer Sampler (`RomplerFooter.tsx`) powered by Tone.js and smplr with ADSR envelope support, sample-based playback, and `activePreviews` reference tracking.
* **Choke Group (Monophony):** Enforces strict monophony for mapped hardware keys to prevent transformation stacking and ensure clean audio transitions.

### 📡 Tracking Engine (MIDI & Input)
* **"Dumb Pipe" Provider:** Streamlined OMNI MIDI input thread (`MIDIProvider.tsx`) that routes hardware and virtual events instantly to the canvas, bypassing legacy caching to prevent sustain hangs.
* **MIDI Learn Mode:** Intuitive mapping system for binding hardware MIDI notes to UI transformation actions, with `localStorage` persistence.
* **Context-Aware Menus:** Per-button configuration for step sizes and MIDI channel/note filtering.

### 👁️ Visualizer Modes & Notation Engine
* **Headless Mathematical Hit-Testing:** Calculates intersections in memory based on staff-space coordinates (`notationMath.ts`), bypassing the DOM for 100% selection accuracy.
* **Pipeline Integrity:** Uses immutable UUID-based note identities to prevent React reconciliation artifacts during dynamic canvas redraws.
* **Dual-Column Layout (Cohemitonia):** Automatically zippers dense chromatic unisons into a legible two-column stack.
* **Intelligent Ottava Engine:** Dynamically evaluates staff density to apply 8va/15ma/8vb/15mb shifts.

### 🧠 UI State Logic & Editing Engine
* **Streamlined Keyboard Layout:** Removed redundant "KEYBOARD MODES" header block and mode buttons above the piano layout in `Keyboard.tsx`, centralizing all mode toggles cleanly inside `SettingsModal.tsx`.
* **Anchor-Persistent Range Selection:** Supports shift-click selection with a stable origin, allowing users to expand or contract selections fluidly.
* **Diatonic Transposition:** `Alt + ArrowUp/Down` performs key-signature-aware pitch shifts.
* **Voicing-Aware PCS Rotation:** `Cmd + Alt + ArrowUp/Down` rotates the active pitch class set while maintaining voicing structure.
* **Tactile Boundaries & Voicing Preservation:** Enforces strict 88-key piano boundaries (`[21, 108]`) via `enforcePianoRange`. If any single note in a chord transformation (chromatic, diatonic, or PCS rotation) falls out of bounds, the entire transformation is rejected to preserve chord voicing intact, preventing voicing compaction.
* **Undo History Safeguard:** Intercepts out-of-bounds transpositions and aborts early before committing state changes, keeping the undo/redo stack free of redundant, blocked frames.
* **Navigation Controller:** Dedicated tactile controller (`NavController.tsx`) for traversing chord states and history.

### ⏳ Current Work-in-Progress
* **Math Utility Overhaul & Upstream Integration (Completed)**: Overhauled the boundaries check to enforce strict 88-key boundaries (`[21, 108]`) using `enforcePianoRange`, rejecting whole-chord shifts when any note exceeds limits to prevent voicing compaction.

## 4. Recent Evolution
**Recent Changes:** The codebase transitioned from element-wise octave wrapping to a strict chord-level boundary blocking system (`enforcePianoRange`), protecting chord voicing from collapsing when transposing near standard 88-key boundaries. Upstream handlers in both `MIDIProvider.tsx` and `NotationCanvas.tsx` were refactored to intercept out-of-bound shifts, aborting state changes early to ensure undo stack cleanliness.

## 5. Future Roadmap
* **Performance:** Optimizing accidental compaction for extremely dense (> 8 note) clusters.
* **UI:** Enhanced visual feedback for OMNI routing status in the main HUD.
