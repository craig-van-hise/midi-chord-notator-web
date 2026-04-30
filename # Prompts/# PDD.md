
# Grand Staff MIDI Notation Web Application: Comprehensive Architectural and Product Requirements Report
**Status:** 🔘 Pending


### 1. Project Goal

The primary objective of this engineering initiative is the development of a high-performance, real-time web application capable of rendering incoming Musical Instrument Digital Interface (MIDI) signals as standard western musical notation. The system must operate simultaneously across two distinct visual interfaces: a real-time notation rendering engine and an interactive 88-key graphical keyboard. The visual representation of the musical data is strictly limited to a single, statically positioned bar of notation, configured exclusively as a Grand Staff. This system is not designed to function as a horizontal scrolling sequencer or a multi-measure sheet music generator. Instead, it serves as a highly focused, single-measure chord and note visualizer capable of capturing and displaying coincident notes struck simultaneously by a user via a connected MIDI hardware device.

The functional boundaries of the application are explicitly defined to eliminate unnecessary rendering complexity while preserving complete musical accuracy. The notation engine must dynamically accept and process key signature changes, correctly calculating the necessary enharmonic spellings and applying standard accidentals (sharps, flats, and naturals) to the rendered noteheads. Time signatures and rhythmic horizontal spacing algorithms are strictly excluded from the project scope, as the application relies on an overlapping, coincident rendering model where all notes struck concurrently occupy the same vertical axis within the single measure. The notation must default to displaying whole notes for all incoming MIDI data, but the underlying architectural configuration must be designed with extensibility in mind, allowing the system to draw other note values (e.g., half notes, quarter notes, black noteheads) via internal configuration changes. The physical layout of the single bar mandates the inclusion of a left-margin bracket encapsulating the two staves, accompanied by connecting barlines at both the absolute beginning and the absolute end of the measure.

Aesthetic and typographical fidelity is a foundational requirement, necessitating the exclusive use of the Standard Music Font Layout (SMuFL) specification. The application must leverage the Bravura font, a reference implementation designed to optimize the legibility and substantial visual weight of classical European music engraving for modern digital displays. The application's core layout must enforce a strict geometric hierarchy: the Grand Staff notation block must be perfectly centered on the screen, positioned directly above an interactive 88-key piano keyboard. The script for this keyboard component, identified as 88-key.tsx, is supplied by the user and must be structurally retrofitted to interpret incoming MIDI "Note On" events, subsequently illuminating the corresponding keys in a distinct blue color. Furthermore, the application requires a robust user interface mechanism for the enumeration, selection, and connection of both MIDI input and MIDI output ports, ensuring seamless communication with external hardware or virtual MIDI buses.

Operationally, the project must adhere to the absolute cutting-edge technology standards established in the 2026 frontend ecosystem. The application must be architected as a fully typed TypeScript application, utilizing React 19 for component orchestration, Tailwind CSS 4.1 for utility-first styling, and Vite as the high-speed build and development environment. This specific technological footprint guarantees that the software can function flawlessly as a native, browser-based static web application, while maintaining the lightweight, zero-runtime characteristics necessary for seamless embedding within a WebView for local desktop or mobile application wrappers.


### 2. Implementation Plan

The architectural strategy demands a sophisticated balance between modern declarative state management and imperative, high-frequency Document Object Model (DOM) manipulation. Processing polyphonic MIDI data in real-time introduces significant performance constraints, particularly when hardware interfaces generate dense clusters of simultaneous "Note On" and "Note Off" events with microsecond precision. The following subsections comprehensively detail the selected modern technology stack, the core system design, the mathematical rendering logic, and the rationale underlying these technical decisions based on current industry standards.

The foundational technology stack has been selected to align with the 2026 enterprise standards for high-performance frontend development. React 19, operating within a Vite build environment, forms the core of the application logic.<sup>1</sup> Vite serves as the execution context, ensuring near-instantaneous Hot Module Replacement (HMR) during the development lifecycle and providing highly optimized asset bundling for production environments.<sup>2</sup> A critical advancement in this stack is the native integration of the React Compiler, which fundamentally shifts the paradigm of component optimization. The historical reliance on manual memoization techniques, utilizing hooks such as useMemo and useCallback, is obsolete and heavily discouraged, as the compiler autonomously memoizes functional components to prevent unnecessary reconciliation cycles.<sup>3</sup> This autonomous optimization is vital for the notation application, as the top-level MIDI listener must not trigger cascading global application re-renders during high-frequency chord inputs.

The styling layer relies entirely on Tailwind CSS 4.1, which introduces a modernized initialization pipeline utilizing the @tailwindcss/vite plugin, entirely replacing outdated PostCSS configurations.<sup>4</sup> This zero-runtime, utility-first CSS framework guarantees minimal payload sizes and enables rapid, responsive UI iterations for centering the notation block and scaling the 88-key layout across varying device resolutions. To guarantee absolute type safety across the Web MIDI API interfaces and the internal rendering state, TypeScript 5.x is enforced with maximum strictness.<sup>6</sup> The usage of the any type is strictly forbidden. The unknown type must be leveraged for unverified external payloads, and strict discriminated unions will be implemented to accurately model incoming MIDI message arrays, isolating Note On, Note Off, and Control Change events at compile time.

The data flow architecture requires a specialized approach to state management. The Web MIDI API facilitates direct, low-latency communication with hardware devices through the browser.<sup>7</sup> The system will establish a localized context provider to manage device enumeration, port selection, and global listener attachment.<sup>8</sup> However, routing high-frequency MIDI events directly into React's standard state management hooks (e.g., useState) will cause catastrophic rendering bottlenecks. A ten-note chord struck simultaneously generates twenty discrete events (ten Note On, ten Note Off messages) almost instantaneously. If each event triggers a React state update, the reconciliation engine will lag, resulting in dropped visual frames and unacceptable user latency.

To circumvent this latency, the architecture enforces an Imperative DOM Bridge for all real-time visual updates. As analyzed in the provided 88-key.tsx component, high-performance visual state changes are achieved through direct DOM manipulation via the exported updateKeyVisuals88 function. This function alters an element's backgroundColor and boxShadow directly by targeting unique DOM IDs (e.g., #pk88-60 for Middle C).<sup>9</sup> This design bypasses React's virtual DOM entirely for high-frequency updates. The notation rendering engine will adopt an identical imperative paradigm. React will be responsible solely for rendering the static "shell" of the Grand Staff—the horizontal lines, the bracket, the brace, and the clefs. Incoming MIDI notes will bypass the React state tree and invoke imperative JavaScript functions that directly inject, toggle visibility, or manipulate the vertical Y coordinates of pre-rendered Unicode text elements representing noteheads and accidentals.


<table>
  <tr>
   <td><strong>Architectural Component</strong>
   </td>
   <td><strong>React State (Declarative)</strong>
   </td>
   <td><strong>Imperative DOM Bridge</strong>
   </td>
  </tr>
  <tr>
   <td><strong>MIDI Port Selection</strong>
   </td>
   <td>Handled via useState for UI dropdowns.
   </td>
   <td>Not Applicable.
   </td>
  </tr>
  <tr>
   <td><strong>Key Signature UI</strong>
   </td>
   <td>Handled via useState for UI dropdowns.
   </td>
   <td>Not Applicable.
   </td>
  </tr>
  <tr>
   <td><strong>Static Staff Lines</strong>
   </td>
   <td>Rendered once on mount.
   </td>
   <td>Not Applicable.
   </td>
  </tr>
  <tr>
   <td><strong>88-Key Blue Illumination</strong>
   </td>
   <td>Bypassed to prevent re-renders.
   </td>
   <td>Handled via document.getElementById and inline styles.
   </td>
  </tr>
  <tr>
   <td><strong>Notehead Injection</strong>
   </td>
   <td>Bypassed to prevent re-renders.
   </td>
   <td>Handled via direct DOM element creation or class toggling.
   </td>
  </tr>
  <tr>
   <td><strong>Accidental Injection</strong>
   </td>
   <td>Bypassed to prevent re-renders.
   </td>
   <td>Handled via direct DOM element creation and coordinate math.
   </td>
  </tr>
</table>


The notation rendering engine utilizes the Standard Music Font Layout (SMuFL) specification, which provides a universal, standardized hexadecimal mapping for thousands of musical symbols, resolving decades of incompatibility caused by legacy fonts like Adobe Sonata.<sup>10</sup> The application will implement the Bravura font, specifically utilizing the highly optimized WOFF2 format.<sup>12</sup> Rather than relying on complex and computationally heavy Scalable Vector Graphics (SVG) paths for individual noteheads, the system treats musical notation as a typography-driven coordinate system.

The mathematical foundation of this rendering model relies on the traditional unit of music notation layout: the "space".<sup>13</sup> The vertical distance between two adjacent lines on a musical staff is defined as exactly one space. The application will define a CSS custom property, --staff-space (e.g., 10px or 12px), which serves as the multiplier for all vertical and horizontal positioning. The Treble (G) Clef (U+E050) and Bass (F) Clef (U+E061) will be positioned absolutely within their respective staves.<sup>14</sup> The Grand Staff requires a precise vertical distance between the bottom line of the treble staff and the top line of the bass staff, which must be set to exactly 10 spaces. This standard distance accommodates up to four independent ledger lines for both the treble and bass staves without risking glyph collision in the center margin.<sup>15</sup>

Coincident notes will be processed by a highly optimized rendering algorithm that calculates the physical Y offset based on the integer value of the incoming MIDI note. The algorithm pivots on the constant that Middle C (MIDI integer 60) resides mathematically in the exact center of the Grand Staff system. By default, the engine will render the standard whole notehead (U+E0A2) based on the underlying configuration state.<sup>16</sup> Accidentals will be calculated based on the active key signature state and rendered utilizing standard SMuFL hex codes for flats (U+E260), naturals (U+E261), and sharps (U+E262).<sup>17</sup>

The structural bounding of the single measure is achieved using SMuFL layout glyphs. The extreme left margin will feature a Brace (U+E000) and a Bracket (U+E002) spanning the entire height of the system.<sup>18</sup> Connecting single barlines (U+E030) will encapsulate the measure at both the left margin (positioned immediately after the clefs and key signatures) and the extreme right margin.<sup>19</sup>


<table>
  <tr>
   <td><strong>Notation Element</strong>
   </td>
   <td><strong>SMuFL Glyph Name</strong>
   </td>
   <td><strong>Unicode Hexadecimal</strong>
   </td>
  </tr>
  <tr>
   <td><strong>Treble Clef</strong>
   </td>
   <td>gClef
   </td>
   <td>U+E050
   </td>
  </tr>
  <tr>
   <td><strong>Bass Clef</strong>
   </td>
   <td>fClef
   </td>
   <td>U+E061
   </td>
  </tr>
  <tr>
   <td><strong>Brace</strong>
   </td>
   <td>brace
   </td>
   <td>U+E000
   </td>
  </tr>
  <tr>
   <td><strong>Bracket</strong>
   </td>
   <td>bracket
   </td>
   <td>U+E002
   </td>
  </tr>
  <tr>
   <td><strong>Single Barline</strong>
   </td>
   <td>barlineSingle
   </td>
   <td>U+E030
   </td>
  </tr>
  <tr>
   <td><strong>Whole Notehead</strong>
   </td>
   <td>noteheadWhole
   </td>
   <td>U+E0A2
   </td>
  </tr>
  <tr>
   <td><strong>Black Notehead</strong>
   </td>
   <td>noteheadBlack
   </td>
   <td>U+E0A4
   </td>
  </tr>
  <tr>
   <td><strong>Standard Sharp</strong>
   </td>
   <td>accidentalSharp
   </td>
   <td>U+E262
   </td>
  </tr>
  <tr>
   <td><strong>Standard Flat</strong>
   </td>
   <td>accidentalFlat
   </td>
   <td>U+E260
   </td>
  </tr>
  <tr>
   <td><strong>Standard Natural</strong>
   </td>
   <td>accidentalNatural
   </td>
   <td>U+E261
   </td>
  </tr>
</table>


To ensure absolute reliability, the project mandates strict Test-Driven Development (TDD) utilizing Vitest, React Testing Library, and sophisticated mocking patterns. Because Vitest operates entirely within a Node.js environment, the native Web MIDI API (navigator.requestMIDIAccess) is unavailable during test execution.<sup>20</sup> The architecture dictates the creation of a robust mock interface inside the global setupTests.ts configuration. This mock will simulate MIDI device enumeration and dispatch synthetic MIDIMessageEvent objects, allowing the test runner to validate the imperative rendering functions and coordinate mathematics without requiring physical MIDI hardware.<sup>21</sup>


### 3. Product Requirements Document (PRD)

The following sections provide the exhaustive, mathematically precise instructions, and environmental configurations required for an AI developer agent operating within the Google Antigravity IDE.<sup>23</sup> This document is designed to alleviate all architectural cognitive load from the agent, allowing its reasoning engine to focus entirely on code synthesis and imperative DOM optimization.


#### A. Agent IDE Configuration

Google Antigravity utilizes a sophisticated hierarchical configuration system consisting of Rules, Workflows, Skills, and Context to govern agent behavior and establish guardrails.<sup>24</sup> This shift toward "Progressive Disclosure" prevents context saturation by only loading heavy procedural knowledge when specifically required by the active task.<sup>25</sup> The developer agent must parse and install the following configurations exactly as formatted into the designated project workspace paths.

**1. Global Project Rules:** (.agent/rules/01-react-vite-standards.md) The rules file acts as a passive, always-on directive injected into the system prompt.<sup>9</sup> It defines the technological boundaries for the Vite and Tailwind environments.


## 

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

**2. SMuFL Notation Engine Rules:** (.agent/rules/02-smufl-engine.md)

This ruleset enforces the exact mathematical layout logic and Unicode constants required to render the Grand Staff accurately using the Bravura font.


## 

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

**3. TDD Workflow Verification:** (.agent/workflows/tdd-validation.md) Workflows represent user-triggered sequences invoked via slash commands.<sup>9</sup> This macro automates the strict testing verification process required at the conclusion of each development phase.


    YAML

--- \
command: /test-and-verify \
description: Executes the Vitest test suite and strictly verifies coverage for the current implementation phase. \
permissions: \
  terminal: write \
  filesystem: read \
--- \
# Agent Persona \
You act as a ruthless QA automation engineer. You accept no code implementations that lack comprehensive unit and integration test coverage. \
 \
# Execution Standard \
1. Execute the command `npm run test run` in the terminal. \
2. Analyze the standard output for any failing test suites or missing assertions. \
3. If ANY test fails, you must output a detailed failure report, halt your execution immediately, and refuse to proceed to the next development phase until the test successfully passes. \


**4. MIDI Simulation Skill:** (.agent/skills/midi-injector/SKILL.md) Skills are agent-triggered capabilities.<sup>24</sup> Because the Vitest environment operates without a physical MIDI keyboard, the agent requires a specialized tool to inject synthetic payloads into the DOM.<sup>22</sup>


## 

---
name: midi-injector description: Simulates an incoming MIDI hardware message for testing imperative DOM updates in the browser or test runner.


# Goal

To bypass physical hardware constraints by injecting synthetic MIDIMessageEvent payloads directly into the global window object, triggering the imperative DOM bridge.


# Standard Operating Procedure

When a test scenario requires you to "test a chord" or "simulate a MIDI Note On", you must execute the accompanying Node.js script to dispatch a CustomEvent that perfectly maps to the native Web MIDI API signature (Status Byte, Data1 for pitch, Data2 for velocity).

**5. Contextual Knowledge Mapping:** (llms.txt) This file provides the knowledge base required to prevent model hallucinations regarding repository architecture, specific API signatures, or standard documentation.<sup>9</sup>


# Project Documentation Context



* SMuFL 1.4 Specification: [https://w3c.github.io/smufl/latest/](https://w3c.github.io/smufl/latest/)
* Vite 5 Configuration Guide: [https://vite.dev/guide/](https://vite.dev/guide/)
* Tailwind 4.1 Vite Integration: [https://tailwindcss.com/docs/installation/framework-guides](https://tailwindcss.com/docs/installation/framework-guides)
* Web MIDI API Interface MDN: [https://developer.mozilla.org/en-US/docs/Web/API/Web_MIDI_API](https://developer.mozilla.org/en-US/docs/Web/API/Web_MIDI_API)
* Vitest Component Testing: [https://vitest.dev/guide/browser/component-testing](https://vitest.dev/guide/browser/component-testing)

<table>
  <tr>
   <td>
<strong>Configuration Type</strong>
   </td>
   <td><strong>Target Workspace Path</strong>
   </td>
   <td><strong>Purpose</strong>
   </td>
  </tr>
  <tr>
   <td><strong>Rules (React)</strong>
   </td>
   <td>.agent/rules/01-react-vite-standards.md
   </td>
   <td>Enforces functional components, Tailwind 4.1 limits, and strict TS.
   </td>
  </tr>
  <tr>
   <td><strong>Rules (SMuFL)</strong>
   </td>
   <td>.agent/rules/02-smufl-engine.md
   </td>
   <td>Dictates Unicode constants and vertical spacing logic.
   </td>
  </tr>
  <tr>
   <td><strong>Workflows</strong>
   </td>
   <td>.agent/workflows/tdd-validation.md
   </td>
   <td>Establishes the /test-and-verify command for phase gating.
   </td>
  </tr>
  <tr>
   <td><strong>Skills</strong>
   </td>
   <td>.agent/skills/midi-injector/SKILL.md
   </td>
   <td>Provides a tool to synthesize MIDI hardware signals during tests.
   </td>
  </tr>
  <tr>
   <td><strong>Context</strong>
   </td>
   <td>llms.txt
   </td>
   <td>Supplies external documentation routing.
   </td>
  </tr>
</table>



#### B. Initialization Instructions

The Antigravity developer agent is explicitly commanded to execute the following initialization sequence sequentially, strictly prior to authoring any application logic or React components. The scaffolding ensures the environment perfectly matches the ruleset defined above.

First, the agent must generate the foundational workspace by executing the command npm create vite@latest grand-staff-app -- --template react-ts within the terminal. Following the generation of the boilerplate, the agent must traverse into the grand-staff-app directory. The dependency installation phase requires two distinct steps: the agent must first install the styling framework by executing npm install tailwindcss @tailwindcss/vite, followed by the installation of the rigorous testing suite via npm install -D vitest jsdom @testing-library/react @testing-library/jest-dom @types/webmidi.

Once dependencies are resolved, the agent must construct the internal architecture required for its own governance. It must create the .agent/rules/, .agent/workflows/, and .agent/skills/midi-injector/ directories at the project root. The agent is then instructed to copy the exact Markdown code blocks provided in Section 3.A of this report and write them into their corresponding file paths. Finally, the agent must modify the vite.config.ts file to import and inject the @tailwindcss/vite plugin into the Vite pipeline, while simultaneously defining the test environment parameter as jsdom to support the execution of React Testing Library.


#### C. Phased Implementation & TDD Checkpoints

The architectural roadmap is systematically divided into seven highly specialized, sequential phases. The developer agent must process these phases linearly, focusing entirely on a single domain of logic before advancing. This phased approach prevents context saturation and guarantees the structural integrity of the application.

**Checkpoint Law:** The developer agent is hereby explicitly instructed: *"You are strictly forbidden from moving to the next phase until all tests for the current phase successfully PASS."*


### Phase 1: Foundation Scaffold and Typography Loading
**Status:** 🔘 Pending | **HITL Required:** True

The initial objective is to establish the React rendering tree, inject the foundational CSS custom properties dictating the notation spacing mathematics, and ensure the Bravura font payload is successfully loaded and resolvable by the DOM. The agent must clear all default boilerplate from App.tsx and index.css. It must establish a global stylesheet containing the @import "tailwindcss"; directive. Within the :root pseudo-class, the agent must define the CSS variables: --staff-space: 12px; and --staff-line-thickness: 1px;. The agent must then implement a standard @font-face declaration that downloads the Bravura WOFF2 file from an accessible local or remote directory, strictly mapping it to font-family: 'Bravura'. The agent will then construct a minimal div element designed to render the Treble Clef (U+E050) utilizing the Bravura font class.



* **TDD Mandate:** The agent must write a Vitest specification inside App.test.tsx that mounts the application in the virtual DOM. The test must utilize standard queries to verify the presence of an element possessing the font-family: Bravura computed style and containing the exact \uE050 hexadecimal character string.
* **Checkpoint Law:** *"You are strictly forbidden from moving to the next phase until all tests for the current phase successfully PASS."*


### Phase 2: Web MIDI API Context and Port Management
**Status:** 🔘 Pending | **HITL Required:** True

The second objective is the engineering of a highly robust context provider component (MIDIProvider) that interfaces securely with the native navigator.requestMIDIAccess API. The agent must implement standard React state declarations to house inputs (an array of available MIDI input devices), outputs (an array of available output devices), and the respective selectedInputId and selectedOutputId. The Provider must attach a global onmidimessage listener to the selected input device. Crucially, when hardware data arrives, this listener must not update React state. Instead, it must trigger a custom window event (MIDI_MESSAGE_RECEIVED) containing the payload. This custom event mechanism acts as the critical decoupling layer between the React component lifecycle and the imperative DOM bridge. Finally, the agent must construct a user interface header allowing the user to view and select the input and output ports via native HTML &lt;select> dropdowns.



* **TDD Mandate:** In the setupTests.ts file, the agent must mock the global navigator.requestMIDIAccess function to return a resolved Promise containing mock input and output port objects. The agent must author a test that mounts MIDIProvider, verifying that the dropdown elements successfully populate with the mocked port names, and confirming that selecting a port updates the internal React selection state accurately.
* **Checkpoint Law:** *"You are strictly forbidden from moving to the next phase until all tests for the current phase successfully PASS."*


### Phase 3: The 88-Key Component Integration and Imperative Bridge
**Status:** 🔘 Pending | **HITL Required:** True

The third objective centers on integrating the user-supplied 88-key.tsx component into the application layout and establishing the imperative DOM bridge required to process the custom MIDI events. The agent must mount the 88-key.tsx component at the absolute bottom of the main viewport. The agent must then implement an imperative event listener within the parent container that actively listens for the MIDI_MESSAGE_RECEIVED custom event dispatched by the Context Provider. The listener must decode the MIDI status byte. When a MIDI "Note On" message (identified by a status byte of 144 and a velocity greater than 0) is received, the listener must extract the note integer and invoke the exported updateKeyVisuals88(note, '#0000FF') function to illuminate the key in blue. Conversely, when a MIDI "Note Off" message (identified by a status byte of 128, or 144 with a velocity of 0) is received, the listener must invoke updateKeyVisuals88(note, '') to reset the key to its default visual state.



* **TDD Mandate:** The agent must write an integration test that renders the entire application tree. The test must manually dispatch a synthetic MIDI_MESSAGE_RECEIVED CustomEvent to the window (simulating a Note On for MIDI note 60 with velocity 100). The test must then assert that the DOM element possessing the attribute id="pk88-60" has had its inline backgroundColor style successfully mutated to #0000FF.
* **Checkpoint Law:** *"You are strictly forbidden from moving to the next phase until all tests for the current phase successfully PASS."*


### Phase 4: Static Grand Staff Canvas Rendering
**Status:** 🔘 Pending | **HITL Required:** True

The fourth objective is the construction of the visual structural shell representing the musical notation, utilizing standard React elements and absolute CSS positioning. This rendering must remain completely devoid of React state for noteheads to preserve performance. The agent must construct a NotationCanvas component occupying the exact center of the screen above the keyboard. Utilizing absolute div positioning or an SVG wrapper, the agent must render the two staves. Each staff consists of exactly 5 horizontal lines, spaced exactly var(--staff-space) apart. The bottom line of the Treble staff and the top line of the Bass staff must be separated by calc(var(--staff-space) * 10). The agent must render the Bracket (U+E002) and Brace (U+E000) on the extreme left margin, scaling them to span the combined height of both staves. Connecting single barlines (U+E030) must be rendered at the left margin (immediately post-clef) and the extreme right margin. The Treble Clef (U+E050) must be positioned so its bottom curl rests precisely on the bottom line of the top staff. The Bass Clef (U+E061) must be positioned so its defining dots perfectly straddle the second-to-top line of the bottom staff.



* **TDD Mandate:** The agent must author a test that renders the NotationCanvas component and rigorously verifies the structural integrity of the DOM. The test must utilize DOM traversal to count and assert the presence of exactly 10 staff line elements, exactly one Treble Clef text node, exactly one Bass Clef text node, and the encapsulating left and right barlines.
* **Checkpoint Law:** *"You are strictly forbidden from moving to the next phase until all tests for the current phase successfully PASS."*


### Phase 5: Real-Time Notation Rendering Engine (Noteheads)
**Status:** 🔘 Pending | **HITL Required:** True

The fifth objective involves translating incoming MIDI integers into mathematical Y-coordinates on the Grand Staff plane, subsequently rendering the coincident noteheads. The agent must establish an imperative rendering controller directly within the NotationCanvas. This controller must maintain a lightweight JavaScript Map of currently active MIDI notes to accurately handle polyphonic chords simultaneously. The agent must engineer a function titled calculateStaffPosition(midiNote). Operating on the mathematical constant that MIDI 60 (Middle C) rests exactly halfway between the staves, this function must calculate the required Y-offset. Every diatonic scale step equates to a vertical shift of calc(var(--staff-space) / 2). Upon receiving a Note On event, the engine must dynamically generate and inject a text element containing the whole note character (U+E0A2) at the calculated Y-coordinate, utilizing a centralized X-coordinate to position the chord in the middle of the measure. If the incoming note exceeds the staff boundaries (e.g., higher than MIDI 77 or lower than MIDI 43), the engine must dynamically generate short horizontal ledger lines at integer intervals of var(--staff-space), positioning them directly behind the notehead. The underlying configuration state must allow swapping the Unicode representation from whole notes to standard black noteheads (U+E0A4), while strictly defaulting to the whole note representation.



* **TDD Mandate:** The agent must write a mathematical validation suite targeting the calculateStaffPosition function. The test must pass MIDI note 60 and assert that the function returns the exact vertical midpoint coordinate. The test must then pass MIDI note 77 (Treble F5) and assert it returns the precise coordinate corresponding to the top line of the treble staff.
* **Checkpoint Law:** *"You are strictly forbidden from moving to the next phase until all tests for the current phase successfully PASS."*


### Phase 6: Key Signatures and Enharmonic Spelling Algorithms
**Status:** 🔘 Pending | **HITL Required:** True

The final objective introduces user-selectable key signatures, enabling the application to calculate and render the appropriate standard SMuFL accidentals adjacent to the noteheads. The agent must implement a UI state selector allowing the user to define a Key Signature ranging from 7 flats to 7 sharps. Concurrently, the agent must implement an enharmonic spelling algorithm within the imperative renderer. When a MIDI note (e.g., MIDI 61) is registered, the algorithm must verify the active key signature. If the user has selected D Major, the algorithm must spell the note as C-sharp, rendering the sharp glyph (U+E262) immediately preceding the notehead at the C-position. If the user has selected D-flat Major, the algorithm must spell the note as D-flat, rendering the flat glyph (U+E260) at the D-position. If the incoming pitch is naturally diatonic to the selected key signature, no accidental glyph is rendered. When an accidental is mathematically required, it must be absolutely positioned at calc(X - 1.5 * var(--staff-space)) to the left of the corresponding coincident notehead.



* **TDD Mandate:** The agent must write a behavioral test that sets the active key signature state to F Major (1 flat). The test will dispatch a MIDI Note On for integer 60 (C natural). The test must assert that no accidental text node is injected into the DOM. The test will then dispatch MIDI integer 61. The test must assert that the algorithm correctly identifies this pitch as D-flat within the context of F Major, subsequently verifying the injection of the flat glyph (U+E260) at the corresponding D4 staff coordinate.
* **Checkpoint Law:** *"You are strictly forbidden from moving to the next phase until all tests for the current phase successfully PASS."*


