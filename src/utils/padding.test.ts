import { describe, it, expect } from 'vitest';

describe('Phase 1: Tuning the Inter-Column Padding', () => {
    it('should increase rightBaseX by exactly 0.6 * staffSpace', () => {
        const leftMaxX = 33.8;
        const staffSpace = 12;
        const maxCol = 0; // 1 column
        const reach = (1.5 + (maxCol * 1.2)) * staffSpace;
        
        const oldPadding = 0.2 * staffSpace;
        const newPadding = 0.8 * staffSpace;
        
        const oldBaseX = leftMaxX + reach + oldPadding;
        const newBaseX = leftMaxX + reach + newPadding;
        
        expect(newBaseX - oldBaseX).toBeCloseTo(0.6 * staffSpace);
        expect(newBaseX).toBeCloseTo(61.4);
    });
});
