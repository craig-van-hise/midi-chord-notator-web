# Grand Staff MIDI Notator

A high-performance, musically accurate MIDI notation web application. Designed for professional musicians and developers, this tool translates real-time MIDI input into elegant, SMuFL-compliant grand staff notation.

## ✨ Core Features
* **Real-Time Notation:** Low-latency rendering of musical notation on a grand staff using a custom "Clear and Redraw" imperative engine.
* **Transformations Drawer:** Animated, MIDI-mappable toolbar for real-time transposition, rotation, and playback control.
* **Integrated ROMPler:** High-fidelity audio engine (Tone.js) with ADSR envelope support and sample-based playback for immediate auditory feedback.
* **OMNI Input Engine:** "Dumb Pipe" architecture ensures notes from hardware devices and virtual keyboards are captured and routed instantly.
* **Theoretical Spelling:** Key-aware enharmonic spelling logic powered by a 56,000+ entry Pitch Class Set Look-Up Table (PCS LUT).
* **Headless Hit-Testing:** Advanced mathematical selection engine for pinpoint coordinate accuracy.
* **Dual-Column Layout:** Intelligent "zipper" architecture for handling dense chromatic unisons (cohemitonia).
* **Selection Mutations:** Supports diatonic transposition, PCS rotation, and tactile MIDI navigation via dedicated controllers.

## 🛠 Tech Stack
* **Framework:** React 19 + TypeScript
* **Audio:** Tone.js, Web Audio API, smplr
* **Build Tool:** Vite 8
* **Styling:** Tailwind CSS 4, Framer Motion (motion), lucide-react
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

## 📜 License
MIT
