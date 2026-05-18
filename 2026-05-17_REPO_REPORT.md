# 2026-05-17 REPO REPORT: Grand Staff MIDI Notator

## 📋 Executive Summary
An exhaustive architectural and forensic audit of the **Grand Staff MIDI Notator** codebase as of May 17, 2026. Built on **React 19**, **Vite 8**, **TypeScript**, and **Tailwind CSS 4**, the application functions as a professional-grade, low-latency MIDI notation tool and integrated ROMPler audio synthesizer. It leverages a highly specialized imperative rendering engine (`NotationCanvas`) and an OMNI-input Web MIDI architecture (`MIDIProvider`) backed by a 2MB binary Pitch Class Set Look-Up Table (`PCS_LUT.dat`) for real-time enharmonic spelling and chord identification.

Recent architectural evolutions have significantly hardened the application's stability and execution determinism. Key advancements include an explicit click-to-start Web Audio gatekeeper overlay to eliminate buffer corruption race conditions, direct audio singleton plumbing for PC keyboard transformation shortcuts (bypassing React closure traps), and UI streamlining that centralizes keyboard mode toggles into a dedicated settings modal. The audit confirms a highly robust core rendering pipeline, verifies a 100% passing 23-file Vitest test harness (125/125 tests passing across 21 active component suites and 2 legacy micro-tests), and identifies newly superseded toolbar components, orphaned tests, and root diagnostic logs for future cleanup.

## 🔄 Changes Since Last Key Report (2026-05-11)
A comprehensive changelog tracking architectural modifications, new component additions, and file relocations since the baseline report on May 11, 2026:

### 🟢 New Additions & Architectural Enhancements
- **`src/audio/engine.ts` (Audio Engine Hardening):** Expanded Tone.js/smplr ROMPler integration with robust ADSR envelope handling, sample-based playback, active preview tracking, and strict monophonic choke group logic for hardware-mapped toolbar keys to prevent note stacking during legato performance.
- **`src/components/toolbar/Transformations*` Suite:** Scaffolding and integration of a fully refactored, dynamic transformations suite:
  - `TransformationsToolbar.tsx` & `TransformationsToolbar.test.tsx`: Replaced static, hardcoded toolbar instances with a dynamic component registry, supporting Y-axis vertical velocity sensitivity on the PLAY action.
  - `TransformationsDrawer.tsx` & `TransformationsDrawer.test.tsx`: Implemented collapsible drawer UI with corrected Y-axis hidden state translation.
  - `TransformationsContextMenus.tsx` & `TransformationsContextMenus.edit.test.tsx`: Added per-button context menus for MIDI learn mapping, step sizes, and channel/note filtering.
  - `TransformationsTypes.ts`: Centralized TypeScript definitions and custom window event bus declarations (`APP_TRANSFORM`, `APP_PLAY`, etc.).
- **`src/components/NavController.tsx` & `navTypes.ts`:** Migrated and refactored the MIDI Navigation Controller suite from prototype, establishing a tactile D-pad UI for chord state traversal and history navigation (currently staged for active development in Prompt #140).
- **`src/midi/MIDIProvider.playable.test.tsx`:** Added targeted TDD verification for playable velocity/duration passthrough actions.
- **`src/components/NotationCanvas.*.test.tsx` (Expanded Test Harness):** Introduced `NotationCanvas.events.test.tsx`, `NotationCanvas.listenMode.test.tsx`, and `NotationCanvas.shortcutAudio.test.tsx` to rigorously verify gatekeeper overlays, audio bypass modes, and direct singleton plumbing.
- **Active AI Tooling & Context Bundles:** Introduced `PROJECT_CONTEXT_BUNDLE.md`, `CHORD_SPELLING_REGRESSION_REPORT.md`, `ROOT_SPELLING_ALGORITHM.md`, `project_context_bundle.txt`, and `llms.txt`. These serve as vital, active context items for LLM agent workflows (`/agent-init`, `/docs-sync`) and maintain architectural alignment across development sessions.

### 🟡 Modifications & Refactoring
- **`src/App.tsx`:** Purged the hardcoded static instance of `TransformationsContainer`, restoring dynamic component rendering. Integrated `MidiKeyboardUpdater` side-effect to directly invoke DOM manipulation (`updateKeyVisuals88`) for zero-latency 88-key visual feedback.
- **`src/components/Keyboard.tsx` & `Keyboard.test.tsx`:** Streamlined UI by stripping the redundant "KEYBOARD MODES" header panel and mode buttons, centralizing all mode toggles into `SettingsModal.tsx`.
- **`src/utils/chordSpeller.ts`:** Patched a critical chord spelling regression where inverted chords displayed identical note names (e.g., "E E E E"), enforcing strict null-safety guards.
- **`public/PCS_LUT.dat` & `scripts/pack_lut.js`:** Updated LUT generator script to incorporate and persist manual chord overrides from dictionaries, regenerating the 2MB binary database.
- **`public/fonts/Bravura.woff2`:** Replaced a corrupted HTML-wrapper version of the SMuFL font with the correct raw binary file via direct CDN curl.

### 🔴 Deletions & Relocations (Cleanup Execution)
- **`xCleanup/` Migration:** Executed `/cleanup-safe` workflow, successfully relocating previously identified root dead code and legacy directories into the git-ignored `xCleanup` staging folder:
  - `src/components/NotationCanvasV2.tsx` → `xCleanup/src/components/NotationCanvasV2.tsx`
  - `Chord Spelling/` → `xCleanup/Chord Spelling/`
  - `FAILURE_REPORT.md` → `xCleanup/FAILURE_REPORT.md`
  - `# Post-Mortem- Selection Engine Failure Report.md` → `xCleanup/# Post-Mortem- Selection Engine Failure Report.md`
  - `test_output_main.txt` → `xCleanup/test_output_main.txt`
  - `temp_downloaded.dat` → `xCleanup/temp_downloaded.dat`

## 🏗 Detailed Tree & Architecture Explanation

### Core Architecture & Design Patterns
The application operates on a highly decoupled, imperative-reactive hybrid architecture designed to bypass React reconciliation bottlenecks during high-frequency polyphonic MIDI input:

```text
               +----------------------------------+
               |          Web MIDI API            |
               +----------------------------------+
                                |
                                v
               +----------------------------------+
               |    MIDIProvider (React Context)  |
               +----------------------------------+
                 /                              \
                / (Global State)                 \ (Custom DOM Event)
               v                                  v
+------------------------------+   +------------------------------+
|     NotationCanvas (UI)      |   |  MidiKeyboardUpdater (App)   |
+------------------------------+   +------------------------------+
| - useRef for active notation |   | - Direct DOM manipulation    |
| - Imperative Clear & Redraw  |   |   via updateKeyVisuals88()   |
| - Headless Hit-Testing       |   +------------------------------+
+------------------------------+                  |
               |                                  v
               | (Raw Pitch Sets)  +------------------------------+
               v                   |        Keyboard (UI)         |
+------------------------------+   +------------------------------+
|     chordSpeller (Pure)      |
+------------------------------+
| - Binary LUT Access          |
| - Enharmonic String Spelling |
+------------------------------+
               |
               | (Spelled Chords & Offsets)
               v
+------------------------------+
|    HTML5 Canvas Redraw       |
+------------------------------+
```

1. **OMNI Input Engine (`MIDIProvider.tsx`):** Acts as the "Dumb Pipe" gatekeeper. It establishes Web MIDI connections, loads the 2MB binary `PCS_LUT.dat` into memory, and broadcasts incoming MIDI messages globally via custom `MIDI_MESSAGE_RECEIVED` window events. This decouples hardware ingestion from React's virtual DOM.
2. **Imperative Rendering Engine (`NotationCanvas.tsx`):** Maintains performance-critical notation state entirely within React `useRef` hooks. Upon receiving MIDI note events or UI transformation triggers, it invokes an imperative "Clear and Redraw" loop using native HTML5 canvas 2D context. It implements advanced musical math (`notationMath.ts`) for staff geometry, cohemitonia zippering (dual-column chromatic unisons), and dynamic ottava (8va/15ma) shifts.
3. **Enharmonic Spelling Engine (`chordSpeller.ts` & `binaryLut.ts`):** Translates raw MIDI pitch class sets into musically accurate enharmonic strings and staff offsets by querying the 56,000+ entry binary Look-Up Table.
4. **Direct Audio Singleton Plumbing (`engine.ts`):** To guarantee deterministic audio feedback and bypass React closure stale-state traps, keyboard shortcut transformations (`Alt + ArrowUp/Down`, `Cmd + Alt + ArrowUp/Down`) and UI buttons communicate directly with the exported `audioEngine` singleton.
5. **Zero-Latency Keyboard Visualizer (`Keyboard.tsx` & `App.tsx`):** `App.tsx` mounts a headless `MidiKeyboardUpdater` component that listens to `MIDI_MESSAGE_RECEIVED` events and executes direct DOM class manipulation (`updateKeyVisuals88`) on the SVG/HTML piano keys, achieving instantaneous visual feedback without triggering component re-renders.

### Comprehensive Directory Breakdown
```text
.
├── # Prompts/                 # Active and historical Product Requirements Prompts (PRPs)
├── public/                    # Static assets
│   ├── PCS_LUT.dat            # 2MB Binary Look-Up Table for chord spelling
│   ├── fonts/Bravura.woff2    # SMuFL-compliant music font
│   ├── favicon.svg            # Site favicon
│   └── icons.svg              # SVG icon sprites
├── scripts/
│   └── pack_lut.js            # Standalone Node.js script for packing/generating PCS_LUT.dat
├── src/
│   ├── assets/                # Static frontend images and icons (react.svg, vite.svg, hero.png)
│   ├── audio/
│   │   └── engine.ts          # Tone.js & smplr audio synthesizer singleton (ROMPler)
│   ├── components/            # React UI Component Layer
│   │   ├── toolbar/           # Collapsible drawer, toolbar, and context menu suite
│   │   ├── ErrorBoundary.tsx  # Production error boundary wrapper
│   │   ├── InfoModal.tsx      # Informational modal UI
│   │   ├── KeySignatureSelector.tsx # Key signature selection dropdown
│   │   ├── Keyboard.tsx       # 88-key interactive piano keyboard UI
│   │   ├── Knob.tsx           # Rotary knob UI component for sampler parameters
│   │   ├── NavController.tsx  # Tactile D-pad navigation controller
│   │   ├── NotationCanvas.tsx # Core grand staff notation rendering canvas
│   │   ├── RomplerFooter.tsx  # Tabbed Tone.js sampler footer UI
│   │   ├── SettingsModal.tsx  # Centralized configuration modal
│   │   └── VUMeter.tsx        # Canvas-based VU meter for audio monitoring
│   ├── lib/
│   │   ├── usePersistentState.ts # Custom hook for localStorage state persistence
│   │   └── utils.ts           # Tailwind CSS class merging utilities (cn, twMerge, clsx)
│   ├── midi/                  # Web MIDI API Interface Layer
│   │   ├── MIDIProvider.tsx   # Global MIDI Context Provider and OMNI listener
│   │   ├── MidiPortSelector.tsx # UI dropdowns for selecting MIDI input/output ports
│   │   └── midiAccess.ts      # Browser Web MIDI API wrapper utilities
│   ├── utils/                 # Pure TypeScript Mathematical & Musical Utilities
│   │   ├── binaryLut.ts       # Binary buffer reader for PCS_LUT.dat
│   │   ├── chordSpeller.ts    # Enharmonic chord spelling and inversion logic
│   │   └── notationMath.ts    # Coordinate geometry, hit-testing, and staff spacing math
│   ├── App.tsx                # Root application layout and side-effect manager
│   ├── main.tsx               # React DOM entry point
│   └── *.test.tsx / *.test.ts # Comprehensive Vitest / RTL test suites
├── WOs/                       # Structured Work Orders and Scorecards
├── xCleanup/                  # Staging directory for deprecated dead code and legacy files
├── *.json / *.js / *.ts       # TypeScript, Vite, ESLint, and Package configuration files
└── *.md / *.txt               # Overarching documentation, AI context bundles, and test logs
```

## 🔗 Component Interaction Analysis
A deep-dive analysis of specific import graphs, data contracts, and runtime event loops governing component relationships:

```text
+-------------------------------------------------------------------------------+
|                                App.tsx (Root)                                 |
|                                                                               |
|  +-----------------------+                         +-----------------------+  |
|  |     MIDIProvider      |                         |  MidiKeyboardUpdater  |  |
|  +-----------------------+                         +-----------------------+  |
|              |                                                 |              |
|              | (Context: LUT, Ports, KeySig)                   | (Direct DOM) |
|              v                                                 v              |
|  +-----------------------+                         +-----------------------+  |
|  |    NotationCanvas     |<---(Window Event Bus)--->|       Keyboard        |  |
|  +-----------------------+  (APP_TRANSFORM, etc.)  +-----------------------+  |
|              |                                                 ^              |
|              | (Raw Pitches)                                   | (updateKey)  |
|              v                                                 |              |
|  +-----------------------+                                     |              |
|  |     chordSpeller      |                                     |              |
|  +-----------------------+                                     |              |
|              |                                                 |              |
|              | (Spelled Chords)                                |              |
|              v                                                 |              |
|  +-----------------------+                                     |              |
|  |   HTML5 Canvas 2D     |                                     |              |
|  +-----------------------+                                     |              |
|              |                                                 |              |
|              | (Direct Audio Call: triggerAttack)              |              |
|              v                                                 |              |
|  +-----------------------+                                     |              |
|  |   audioEngine (Tone)  |-------------------------------------+              |
|  +-----------------------+                                                    |
+-------------------------------------------------------------------------------+
```

### 1. `MIDIProvider` ↔ `NotationCanvas` ↔ `Keyboard` (The Triad Event Loop)
- **Contract:** `MIDIProvider` encapsulates the global state required for musical interpretation (`keySignature`, `midiInputs`, `lutData`). `NotationCanvas` consumes this context to configure its rendering math.
- **Interaction:** When `NotationCanvas` detects internal note changes (via UI clicks or transformations), it invokes `setActiveNotes` on the `MIDIProvider` context. This triggers a synchronized state update that propagates to the virtual `Keyboard` component, keeping the on-screen piano keys highlighted in perfect harmony with the staff notation.

### 2. `NotationCanvas` ↔ `chordSpeller` ↔ `binaryLut.ts` (The Spelling Pipeline)
- **Contract:** `NotationCanvas` maintains an array of active MIDI pitch numbers (e.g., `[60, 64, 67]`). To render these on the grand staff, it passes the pitch class set to `chordSpeller.spellChord()`.
- **Interaction:** `chordSpeller` extracts the root and pitch class set bitmap, calls `binaryLut.lookup()` to fetch the pre-calculated interval structures from the 2MB `PCS_LUT.dat` buffer, applies key-signature-aware enharmonic spelling rules (handling double sharps/flats and inversions), and returns an array of fully spelled `SpelledNote` objects containing precise staff Y-offsets (`staffOffset`) and accidental strings. `NotationCanvas` iterates over this array to execute `ctx.fillText()` using the Bravura font.

### 3. `App.tsx` ↔ `MidiKeyboardUpdater` ↔ `Keyboard.tsx` (Zero-Latency Visual Bridge)
- **Contract:** To prevent DOM lag during rapid MIDI performances, `Keyboard.tsx` exports a standalone imperative function `updateKeyVisuals88(note, color)`.
- **Interaction:** `App.tsx` mounts `MidiKeyboardUpdater`, which attaches a listener to `window` for `MIDI_MESSAGE_RECEIVED`. Upon receiving a Note On event, the updater bypasses React entirely, invoking `updateKeyVisuals88()` to directly mutate the `fill` attribute of the corresponding `<rect>` element in the DOM.

### 4. `TransformationsToolbar` ↔ `NotationCanvas` ↔ `engine.ts` (The Event Bus & Audio Bridge)
- **Contract:** `TransformationsToolbar` renders interactive buttons for pitch mutations (`SEMI_UP`, `OCT_DOWN`, `ROT_UP`, `PLAY`, `HOME`).
- **Interaction:** When a user clicks a transformation button, the toolbar dispatches custom window events (`APP_TRANSFORM`, `APP_PLAY`, `APP_HISTORY`). `NotationCanvas` listens to these events, executes the corresponding pure mathematical mutation via `notationMath.ts`, updates its internal `useRef` state, and redraws the canvas. Simultaneously, for actions like `PLAY` or direct shortcut triggers, the components invoke `audioEngine.triggerAttackRelease()` directly, passing the active note array and calculated velocity to Tone.js for immediate, phase-aligned acoustic playback.

## 🗑 Vestigial File Report

### 🔴 High Confidence (Dead Source / Orphaned Tests / Unused Boilerplate)
*These files are completely unimported within the active build pipeline, lack entry point or configuration status, and represent superseded legacy code, orphaned tests for deleted utilities, or extraneous root log dumps.*

- **`src/components/toolbar/ToolbarContextMenus.tsx`**: Legacy toolbar context menu implementation. Fully superseded by `TransformationsContextMenus.tsx` during the dynamic toolbar overhaul. Unimported and dead.
- **`src/components/toolbar/ToolbarTypes.ts`**: Legacy TypeScript definitions for the old toolbar. Fully superseded by `TransformationsTypes.ts`. Unimported and dead.
- **`src/utils/padding.test.ts`**: Orphaned micro-test asserting basic padding logic. There is no corresponding `padding.ts` utility file in the active codebase.
- **`src/utils/pipeline.test.ts`**: Orphaned micro-test asserting an obsolete data pipeline structure. There is no corresponding `pipeline.ts` utility file in the active codebase.
- **`test_output.txt`**: Root test execution log resulting from diagnostic batch runs on May 14. Extraneous build residue.
- **`project_tree.txt`**: Root text file containing a static snapshot of the directory tree. Extraneous residue.

### 🟡 Medium Confidence (Review Needed / Disconnected Assets)
*These files are located within designated staging/cleanup directories or represent unimported components currently undergoing active PRP staging. They require review before permanent archival or integration.*

- **`xCleanup/`**: Staging directory housing all previously deprecated dead code, prototype components, and failure reports. It is correctly isolated and git-ignored but represents accumulated repository bloat:
  - `xCleanup/src/components/NotationCanvasV2.tsx`: Obsolete V2 notation canvas prototype.
  - `xCleanup/Chord Spelling/README.md`: Legacy spelling documentation.
  - `xCleanup/Chord Spelling/chord_speller.ts`: Superseded spelling engine.
  - `xCleanup/FAILURE_REPORT.md`: Historical diagnostic failure report.
  - `xCleanup/# Post-Mortem- Selection Engine Failure Report.md`: Historical post-mortem analysis.
  - `xCleanup/test_output_main.txt`: Historical test log.
  - `xCleanup/test_output.txt`: Historical test log.
  - `xCleanup/temp_downloaded.dat`: Temporary binary download artifact.
  - `xCleanup/project_tree.txt`: Old tree snapshot.
  - `xCleanup/scratch/phase1_test.ts`: Obsolete scratch test script.
  - `xCleanup/scratch/verify_dat.js`: Obsolete scratch verification script.
- **`src/components/NavController.tsx`**: Tactile D-pad navigation controller UI. While currently unimported in `App.tsx`, it is actively referenced in `PROJECT_STATE.md` and Prompt `# 140.md` as the core component for an upcoming navigation UI cleanup, velocity parameter integration, and home chord tracking overhaul.
- **`src/components/navTypes.ts`**: TypeScript definitions imported exclusively by `NavController.tsx`. Essential for the upcoming navigation controller integration.

### 🟢 Low Confidence (Likely Useful but Isolated)
*These files are unimported by the primary production application bundle (`App.tsx` / `main.tsx`) but represent the active, essential Vitest test harness. All 21 active test suites actively execute and achieve a 100% passing status (125/125 tests passing), safeguarding the codebase against regressions.*

- **`src/App.test.tsx`**: Root application rendering and integration test suite.
- **`src/App.audioUnlock.test.tsx`**: Verifies Web Audio user-interaction unlock overlay mechanics.
- **`src/components/Keyboard.test.tsx`**: Verifies interactive 88-key piano rendering and streamlined mode settings.
- **`src/components/NotationCanvas.test.tsx`**: Comprehensive core notation canvas rendering test suite.
- **`src/components/NotationCanvas.bugs.test.tsx`**: Targeted regression test suite preventing recurrence of resolved canvas bugs.
- **`src/components/NotationCanvas.events.test.tsx`**: Verifies custom window event bus dispatch and handling within the canvas.
- **`src/components/NotationCanvas.headless.test.tsx`**: Pure mathematical test suite verifying canvas coordinate geometry and layout math without JSDOM.
- **`src/components/NotationCanvas.history.test.tsx`**: Verifies chord history tracking and navigation state mutations.
- **`src/components/NotationCanvas.listenMode.test.tsx`**: Verifies audio bypass and listen mode toggle mechanics.
- **`src/components/NotationCanvas.selection.test.tsx`**: Verifies mathematical hit-testing and note selection bounding boxes.
- **`src/components/NotationCanvas.shortcutAudio.test.tsx`**: Verifies direct audio singleton plumbing for PC keyboard transformation shortcuts.
- **`src/components/SettingsModal.test.tsx`**: Verifies centralized configuration modal state management.
- **`src/components/toolbar/TransformationsContextMenus.edit.test.tsx`**: Verifies per-button context menu configuration and MIDI learn state.
- **`src/components/toolbar/TransformationsDrawer.test.tsx`**: Verifies collapsible drawer UI state and Y-axis translation.
- **`src/components/toolbar/TransformationsToolbar.test.tsx`**: Verifies dynamic toolbar transformation event dispatch and vertical velocity sensitivity.
- **`src/midi/MIDIProvider.test.tsx`**: Verifies global MIDI context provider, port selection, and active note broadcasting.
- **`src/midi/MIDIProvider.playable.test.tsx`**: Verifies playable velocity and duration passthrough transformation actions.
- **`src/midi/midiAccess.test.ts`**: Verifies browser Web MIDI API access requests and error handling.
- `src/utils/chordSpeller.test.ts`: Exhaustive test suite verifying enharmonic spelling, Look-Up Table queries, and inversion logic.
- **`src/utils/notationMath.test.ts`**: Verifies coordinate geometry, staff spacing, and transposition math.
- **`src/utils/notationMath.xLevel.test.ts`**: Verifies advanced X-level horizontal spacing and accidental compaction math.
