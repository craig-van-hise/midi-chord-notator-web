import { describe, it, expect } from 'vitest';
import { applyNoteFilter } from './midiProcessing';

describe('applyNoteFilter', () => {
  it('Test Case 1 (Limit): clamps out-of-bounds notes to min/max', () => {
    const notes = [130, -5];
    const result = applyNoteFilter(notes, 'limit', [0, 127]);
    expect(result).toEqual([127, 0]);
  });

  it('Test Case 2 (Octave Wrap): wraps out-of-bounds notes by octaves', () => {
    const notes = [130, -2];
    const result = applyNoteFilter(notes, 'octave_wrap', [0, 127]);
    expect(result).toEqual([118, 10]);
  });

  it('Test Case 3 (Block): drops out-of-bounds notes', () => {
    const notes = [130, 60, -5];
    const result = applyNoteFilter(notes, 'block', [0, 127]);
    expect(result).toEqual([60]);
  });
});
