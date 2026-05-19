export type FilterMode = 'block' | 'octave_wrap' | 'wrap' | 'limit';

export const applyNoteFilter = (notes: number[], mode: FilterMode, range: [number, number]): number[] => {
  const [min, max] = range;
  const span = max - min + 1;
  const result: number[] = [];

  for (const n of notes) {
    if (n >= min && n <= max) {
      result.push(n);
      continue;
    }

    switch (mode) {
      case 'block':
        break; // drop note
      case 'limit':
        result.push(Math.max(min, Math.min(max, n)));
        break;
      case 'octave_wrap': {
        let octN = n;
        // Guard against infinite loops if range is smaller than 1 octave
        if (max - min >= 11) { 
          while (octN < min) octN += 12;
          while (octN > max) octN -= 12;
          if (octN >= min && octN <= max) result.push(octN);
        }
        break;
      }
      case 'wrap': {
        const wrapped = min + (((n - min) % span) + span) % span;
        result.push(wrapped);
        break;
      }
    }
  }
  // Deduplicate notes that resolved to the same pitch
  return Array.from(new Set(result));
};
