# FAILURE REPORT - Ticket #68

- Report by agent

## Goal
The primary objective was to harden the **Notation Selection Engine** and **Rendering Pipeline** in the `midi-chord-notator-web` application. Specifically:
1.  **Selection Precision**: Implement a robust, coordinate-aware selection layer using Pythagorean distance-based hit-testing (threshold of `staffSpace * 0.75`).
2.  **Rendering Stability**: Ensure the canvas never goes blank by wrapping the layout engine in defensive `try/catch/finally` blocks.
3.  **Marquee Accuracy**: Synchronize absolute viewport coordinates (for UI dragging) with relative canvas-center coordinates (for note intersection).
4.  **Font Assets**: Resolve the `invalid sfntVersion` error by ensuring the Bravura SMuFL font loads correctly under Vite's dev and production environments.

## Current State
The project is currently in a "Nuclear Override" diagnostic state:
*   **Blank Canvas**: Despite the data pipeline appearing intact, the notation canvas is rendering blank. The React state lifecycle or MIDI listeners may be silently failing or deadlocked.
*   **Font Asset Failure**: The Bravura font continues to return `404` or HTML fallback contents, resulting in `OTS parsing error: invalid sfntVersion` in the browser console. This indicates a persistent Vite asset resolution mismatch.
*   **Diagnostic HUD**: A physical green debug overlay has been injected into the UI to track `activeNotes`, `renderedNotes`, and `selectionState` in real-time, bypassing console limitations.
*   **Vite Pipeline**: Assets have been moved from `public/` to `src/assets/` to attempt to force Rollup-native bundling, but resolution remains unstable.

## Attempted Fixes (Chronological)

1.  **Refactor Selection Engine**: Removed DOM-level `onClick` handlers and moved to a centralized canvas interaction layer using Pythagorean math.
    *   *Result*: Improved theoretical precision but introduced coordinate space fragmentation.
2.  **Defensive Rendering**: Wrapped `updateSpellings` and `recalculateLayout` in `try/catch/finally` blocks.
    *   *Result*: Prevented some silent crashes but the canvas still failed to render notes.
3.  **Marquee Precision Refactor**: Separated absolute viewport tracking (for visual dragging) from relative math (for intersection).
    *   *Result*: Marquee box visual alignment fixed, but intersection testing remains unverified due to blank canvas.
4.  **Font Pathing (Initial Attempt)**: Changed CSS font URLs to reference `public/` and `../public/`.
    *   *Result*: FAILED. Vite served `index.html` as a fallback, causing font parsing errors.
5.  **Error Unmasking**: Replaced empty `catch` blocks with explicit `console.error("[Layout Engine Crash]")` logs.
    *   *Result*: No immediate logs appeared in the console during test runs, suggesting the code path might not be reached or state is deadlocked earlier.
6.  **Fallback Math Implementation**: Added `(n.stepOffset || 0)` and `(note.xOffset || 0)` to CSS `calc()` expressions in the JSX.
    *   *Result*: Attempted to prevent `NaN` values from breaking the CSS box model, but canvas remains empty.
7.  **Asset Pipeline Hard-Reset (Nuclear Override)**:
    *   Moved `Bravura.woff2` to `src/assets/fonts/`.
    *   Updated `index.css` to use relative bundler paths.
    *   Injected a physical **Diagnostic HUD** directly into the React DOM.
    *   *Result*: System in transition; font resolution and MIDI-to-HUD pipeline currently being monitored by the user.

## Relevant Scripts
- `src/components/NotationCanvas.tsx`: Core layout engine, MIDI listeners, and selection logic.
- `src/index.css`: Global styles, CSS variables, and SMuFL font declarations.
- `vite.config.ts`: Base path and asset resolution configuration.
- `src/midi/MIDIProvider.tsx`: Global MIDI event broadcasting.

## Unresolved Blockers
- **Vite Asset Resolution**: The specific interaction between Vite's `base` path and CSS `url()` resolution is still corrupting font delivery.
- **State/Ref Synchronization**: Possible race condition or stale ref usage between `activeNotes.current` and the `renderedNotes` state array during high-frequency MIDI input.
