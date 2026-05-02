
import fs from 'fs';

const SOURCE_PATH = '/Users/vv2024/Documents/Repos - vv2024/MIDI/PCS_LUT Editor/src/data/PCS_LUT.json';

function extract() {
    const rawData = JSON.parse(fs.readFileSync(SOURCE_PATH, 'utf8'));
    
    const minorPattern = [];
    const dominantPattern = [];

    rawData.forEach(entry => {
        if (!entry) return;

        const isMinor = entry.chord_type.includes("m");
        const base7thNum = Number(entry.base_7th);
        const isDominant = base7thNum === 7 || (
            entry.chord_type.includes("7") && 
            entry.chord_type.includes("no5") && 
            !entry.chord_type.includes("m")
        );

        if (isMinor) {
            minorPattern.push(entry.decimal);
        }
        if (isDominant) {
            dominantPattern.push(entry.decimal);
        }
    });

    console.log("MINOR_PATTERN_DECIMALS:");
    console.log(JSON.stringify(minorPattern));
    console.log("\nDOMINANT_PATTERN_DECIMALS:");
    console.log(JSON.stringify(dominantPattern));
}

extract();
