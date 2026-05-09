# Grand Staff MIDI Notator

A high-performance, musically accurate MIDI notation web application. Designed for professional musicians and developers, this tool translates real-time MIDI input into elegant, SMuFL-compliant grand staff notation.

## ✨ Core Features
* **Real-Time Notation:** Low-latency rendering of musical notation on a grand staff using a custom "Clear and Redraw" imperative engine.
* **Pipeline Integrity:** Uses immutable note objects and UUID-based identity to ensure perfectly synchronized state across the notation canvas, selection engine, and virtual piano.
* **Headless Hit-Testing:** Advanced mathematical selection engine that calculates interaction coordinates in memory for pinpoint accuracy.
* **Selection Scaling:** Supports anchor-persistent range selection (Shift-Click), marquee selection, and multi-select (Cmd/Ctrl).
* **Dual-Column Layout:** Intelligent "zipper" architecture for handling dense chromatic unisons (cohemitonia).
* **Chord Identification:** Real-time analysis of pitch sets using a 56,000+ entry Pitch Class Set Look-Up Table.
* **Theoretical Spelling:** Key-aware enharmonic spelling logic including compound intervals (9ths, 11ths, 13ths).
* **Selection & Mutations:** Supports diatonic transposition, PCS rotation, and selection traversal.

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
|  |  ├── KeySignatureSelector.tsx
|  |  └── SettingsModal.tsx
|  ├── midi
|  |  ├── MIDIProvider.tsx
|  |  ├── MidiPortSelector.tsx
|  |  └── midiAccess.ts
|  └── utils
|     ├── chordSpeller.ts
|     ├── notationMath.ts
|     └── binaryLut.ts
└── vite.config.ts
```

## 📜 License
MIT
