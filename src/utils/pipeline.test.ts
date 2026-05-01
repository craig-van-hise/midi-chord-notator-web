import { describe, it, expect } from 'vitest';
import { assignXLevels } from './notationMath';

describe('Phase 1: Pipeline Tracing & Math Verification', () => {
    it('should mutate xOffset and preserve it in the merged array', () => {
        const notes = [
            { note: 61, ySteps: 1 }, // Db
            { note: 62, ySteps: 1 }, // Dn -> Right
        ];
        
        const assigned = assignXLevels(notes);
        const leftNotes = assigned.filter(n => !n.isRightColumn);
        const rightNotes = assigned.filter(n => n.isRightColumn);
        
        expect(leftNotes.length).toBe(1);
        expect(rightNotes.length).toBe(1);
        expect(rightNotes[0].isRightColumn).toBe(true);
        
        // Simulate recalculateLayout mutation
        rightNotes[0].xOffset = 50.6;
        
        // Find it in the merged result
        const mergedNote = assigned.find(n => n.note === 62);
        expect(mergedNote?.xOffset).toBe(50.6);
    });
});
