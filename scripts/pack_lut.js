import fs from 'fs';
import path from 'path';

const SOURCE_PATH = '/Users/vv2024/Documents/Repos - vv2024/PCS_LUT Editor/src/data/PCS_LUT.json';
const TARGET_PATH = './src/assets/PCS_LUT.dat';

async function pack() {
    console.log(`Reading from ${SOURCE_PATH}...`);
    const rawData = JSON.parse(fs.readFileSync(SOURCE_PATH, 'utf8'));
    
    // String Pool
    const stringPool = [];
    function getStringIndex(s) {
        if (s === null || s === undefined) return 65535; // Null sentinel
        let idx = stringPool.indexOf(s);
        if (idx === -1) {
            idx = stringPool.length;
            stringPool.push(s);
        }
        return idx;
    }

    const packedRows = [];
    let maxDecimal = 0;

    for (let i = 0; i < rawData.length; i++) {
        const row = rawData[i];
        if (!row) {
            packedRows.push(null);
            continue;
        }

        if (row.decimal > maxDecimal) maxDecimal = row.decimal;

        const packed = {
            decimal: row.decimal,
            root_pc: row.root_pc,
            cardinality: row.cardinality,
            chord_type_idx: getStringIndex(row.chord_type),
            base_triad_idx: getStringIndex(row.base_triad),
            intervals_indices: (row.chord_intervals || []).map(getStringIndex)
        };
        packedRows.push(packed);
    }

    console.log(`String pool size: ${stringPool.length}`);
    
    // Binary Buffer Construction
    // Format:
    // [4 bytes] Magic Number 'PLUT'
    // [4 bytes] String pool offset
    // [4 bytes] Rows count
    // [Rows...]
    // [String Pool...]

    const rowsCount = packedRows.length;
    const headerSize = 12;
    
    // Each row: decimal(4), root_pc(1), cardinality(1), chord_type_idx(2), base_triad_idx(2), intervals_ptr(4)
    // Actually let's make it simpler: fixed size if possible, or use an offset table.
    // Let's use an offset table for rows to support variable interval counts.
    
    const rowTableOffset = headerSize;
    const rowDataOffset = rowTableOffset + (rowsCount * 4);
    
    const rowBuffers = [];
    const rowOffsets = [];
    let currentDataPos = rowDataOffset;

    packedRows.forEach(row => {
        if (!row) {
            rowOffsets.push(0); // 0 means null row
            return;
        }

        rowOffsets.push(currentDataPos);
        
        const intervalsCount = row.intervals_indices.length;
        const buffer = Buffer.alloc(10 + (intervalsCount * 2));
        buffer.writeUInt32LE(row.decimal, 0);
        buffer.writeUInt8(row.root_pc, 4);
        buffer.writeUInt8(row.cardinality, 5);
        buffer.writeUInt16LE(row.chord_type_idx, 6);
        buffer.writeUInt16LE(row.base_triad_idx, 8);
        
        row.intervals_indices.forEach((idx, i) => {
            buffer.writeUInt16LE(idx, 10 + (i * 2));
        });
        
        rowBuffers.push(buffer);
        currentDataPos += buffer.length;
    });

    const stringPoolOffset = currentDataPos;
    const stringPoolBuffer = Buffer.from(JSON.stringify(stringPool), 'utf8');

    const totalSize = stringPoolOffset + stringPoolBuffer.length;
    const finalBuffer = Buffer.alloc(totalSize);

    // Header
    finalBuffer.write('PLUT', 0);
    finalBuffer.writeUInt32LE(stringPoolOffset, 4);
    finalBuffer.writeUInt32LE(rowsCount, 8);

    // Row Offsets Table
    rowOffsets.forEach((offset, i) => {
        finalBuffer.writeUInt32LE(offset, rowTableOffset + (i * 4));
    });

    // Row Data
    let writePos = rowDataOffset;
    rowBuffers.forEach(buf => {
        buf.copy(finalBuffer, writePos);
        writePos += buf.length;
    });

    // String Pool
    stringPoolBuffer.copy(finalBuffer, stringPoolOffset);

    fs.writeFileSync(TARGET_PATH, finalBuffer);
    console.log(`Packed ${rowsCount} rows into ${finalBuffer.length} bytes.`);
    console.log(`Saved to ${TARGET_PATH}`);
}

pack().catch(console.error);
