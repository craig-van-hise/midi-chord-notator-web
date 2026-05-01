import { assignXLevels, NotePosition } from '../src/utils/notationMath';

const testCase1 = [
    { ySteps: 0 }, // C
    { ySteps: 2 }, // E
    { ySteps: 4 }  // G
];

const result1 = assignXLevels(testCase1 as NotePosition[]);
console.log('Test Case 1 (C Major):');
console.log(result1.map(n => n.xLevel));
const pass1 = result1.every(n => n.xLevel === 0);
console.log('Pass:', pass1);

const testCase2 = [
    { ySteps: 0 }, // C
    { ySteps: 0 }, // Db (Step 0 fallback)
    { ySteps: 1 }  // D natural
];
// Wait, C, Db, D natural in C Major:
// C: Step 0
// Db: Step 0 (fallback)
// D: Step 1
// Collision: 1st 0 vs 2nd 0 (diff 0 <= 1). 1st 0 Level 0, 2nd 0 Level 1.
// 3rd note (Step 1): diff with 1st 0 is 1 (<= 1) -> Level 0 collision. diff with 2nd 0 is 1 (<= 1) -> Level 1 collision.
// So D Level 2.

const result2 = assignXLevels(testCase2 as NotePosition[]);
console.log('\nTest Case 2 (C, Db, D):');
console.log(result2.map(n => n.xLevel));
const pass2 = result2[0].xLevel === 0 && result2[1].xLevel === 1 && result2[2].xLevel === 2;
console.log('Pass:', pass2);

if (!pass1 || !pass2) {
    process.exit(1);
}
