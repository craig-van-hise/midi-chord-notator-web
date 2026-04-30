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
