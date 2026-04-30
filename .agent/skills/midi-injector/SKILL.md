---
name: midi-injector
description: Simulates an incoming MIDI hardware message for testing imperative DOM updates in the browser or test runner.

# Goal

To bypass physical hardware constraints by injecting synthetic MIDIMessageEvent payloads directly into the global window object, triggering the imperative DOM bridge.

# Standard Operating Procedure

When a test scenario requires you to "test a chord" or "simulate a MIDI Note On", you must execute the accompanying Node.js script to dispatch a CustomEvent that perfectly maps to the native Web MIDI API signature (Status Byte, Data1 for pitch, Data2 for velocity).
