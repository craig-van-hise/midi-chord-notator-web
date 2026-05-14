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
* **Audio:** Tone.js, Web Audio API
* **Build Tool:** Vite 8
* **Styling:** Tailwind CSS 4, Framer Motion
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
|  ├── PCS_LUT.dat
|  ├── fonts
|  |  ├── Bravura.woff2
|  |  └── Bravura_metadata.json
|  └── icons.svg
├── src
|  ├── App.tsx
|  ├── components
|  |  ├── NotationCanvas.tsx
|  |  ├── ROMPler
|  |  |  ├── AudioProvider.tsx
|  |  |  └── SimpleSampler.ts
|  |  └── toolbar
|  |     ├── TransformationsDrawer.tsx
|  |     └── ...
|  ├── midi
|  |  ├── MIDIProvider.tsx
|  |  └── midiAccess.ts
|  ├── utils
|  |  ├── chordSpeller.ts
|  |  └── notationMath.ts
|  └── vitest.setup.ts
├── tsconfig.json
└── vite.config.ts
```

## 📜 License
MIT
