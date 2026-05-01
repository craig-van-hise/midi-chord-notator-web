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
