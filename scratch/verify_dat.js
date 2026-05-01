
import fs from 'fs';

const filePath = './public/PCS_LUT.dat';
const buffer = fs.readFileSync(filePath);
const dataView = new DataView(buffer.buffer);

const magic = String.fromCharCode(buffer[0], buffer[1], buffer[2], buffer[3]);
if (magic !== 'PLUT') {
    console.error('Invalid magic number');
    process.exit(1);
}

const stringPoolOffset = dataView.getUint32(4, true);
const rowsCount = dataView.getUint32(8, true);

const stringPool = JSON.parse(buffer.slice(stringPoolOffset).toString());

function getRow(index) {
    const rowOffset = dataView.getUint32(12 + (index * 4), true);
    if (rowOffset === 0) return null;

    const decimal = dataView.getUint32(rowOffset, true);
    const root_pc = dataView.getUint8(rowOffset + 4);
    const cardinality = dataView.getUint8(rowOffset + 5);
    const chordTypeIdx = dataView.getUint16(rowOffset + 6, true);
    const baseTriadIdx = dataView.getUint16(rowOffset + 8, true);

    let nextOffset = stringPoolOffset;
    for (let j = index + 1; j < rowsCount; j++) {
        const off = dataView.getUint32(12 + (j * 4), true);
        if (off !== 0) {
            nextOffset = off;
            break;
        }
    }

    const intervalsCount = (nextOffset - (rowOffset + 10)) / 2;
    const intervals = [];
    for (let k = 0; k < intervalsCount; k++) {
        const sIdx = dataView.getUint16(rowOffset + 10 + (k * 2), true);
        intervals.push(stringPool[sIdx]);
    }

    return { decimal, chordType: stringPool[chordTypeIdx], intervals };
}

console.log('--- Checking Major Triad (145, 265, 545) ---');
[145, 265, 545].forEach(idx => {
    const row = getRow(idx);
    if (row) {
        console.log(`Index ${idx}: Decimal ${row.decimal}, Type: "${row.chordType}", Intervals: ${JSON.stringify(row.intervals)}`);
    } else {
        console.log(`Index ${idx}: Not found`);
    }
});

console.log('\n--- Checking Chromatic 3 (7) ---');
const row7 = getRow(7);
if (row7) {
    console.log(`Index 7: Decimal ${row7.decimal}, Type: "${row7.chordType}", Intervals: ${JSON.stringify(row7.intervals)}`);
}
