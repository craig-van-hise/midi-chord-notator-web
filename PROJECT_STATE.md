# PROJECT_STATE: Grand Staff MIDI Notator

**Current System Status:** ✅ Stable - Transformations Suite, MIDI Learn & Web Deployment Hardened
**Last Updated:** 2026-05-17

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
│   ├── App.tsx
│   ├── audio
│   │   └── engine.ts
│   ├── components
│   │   ├── ErrorBoundary.tsx
│   │   ├── InfoModal.tsx
│   │   ├── KeySignatureSelector.tsx
│   │   ├── Keyboard.tsx
│   │   ├── Knob.tsx
│   │   ├── NavController.tsx
│   │   ├── NotationCanvas.tsx
│   │   ├── RomplerFooter.tsx
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
│   ├── lib
│   │   ├── usePersistentState.ts
│   │   └── utils.ts
│   ├── midi
│   │   ├── MIDIProvider.tsx
│   │   ├── MidiPortSelector.tsx
│   │   └── midiAccess.ts
│   ├── utils
│   │   ├── binaryLut.ts
│   │   ├── chordSpeller.ts
│   │   └── notationMath.ts
│   └── vitest.setup.ts
├── tsconfig.json
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
* **Integrated ROMPler:** Tabbed footer Sampler (`RomplerFooter.tsx`) powered by Tone.js and smplr with ADSR envelope support, sample-based playback, and `activePreviews` reference tracking to prevent orphaned sustain notes.
* **Dynamic PLAY Envelopes:** The Toolbar `PLAY` button behaves like a physical key, respecting hardware velocity and sustaining exactly as long as the key (or pointer) is held.
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
* **Anchor-Persistent Range Selection:** Supports shift-click selection with a stable origin, allowing users to expand or contract selections fluidly.
* **Diatonic Transposition:** `Alt + ArrowUp/Down` performs key-signature-aware pitch shifts.
* **Voicing-Aware PCS Rotation:** `Cmd + Alt + ArrowUp/Down` rotates the active pitch class set while maintaining voicing structure.
* **Navigation Controller:** Dedicated tactile controller (`NavController.tsx`) for traversing chord states and history.

### ⏳ Current Work-in-Progress
* **Prompt #131 / #132 (Active/Recent):** Resolved Bravura font binary corruption (`Bravura.woff2`) for GitHub Pages deployment and synchronized core documentation (`/docs-sync`).

## 4. Recent Evolution
**Recent Changes:** The codebase underwent structural and configuration refinements to support seamless web deployment, specifically resolving a Bravura font binary corruption issue that caused OTS parsing errors on GitHub Pages. Additionally, the Transformations toolbar drawer positioning and documentation were updated to ensure a stable, polished user experience and an accurate architectural representation of active modules.

## 5. Future Roadmap
* **Performance:** Optimizing accidental compaction for extremely dense (> 8 note) clusters.
* **UI:** Enhanced visual feedback for OMNI routing status in the main HUD.
