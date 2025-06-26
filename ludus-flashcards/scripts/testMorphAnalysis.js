const fs = require('fs');
const path = require('path');

// Load the optimized index
const dataPath = path.join(__dirname, '../src/data/whitakersOptimized.json');
const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

console.log('🔍 Testing morphological analysis for various words...\n');

const testWords = ['amo', 'aqua', 'satis', 'bonus', 'quaeso'];

for (const word of testWords) {
  console.log(`=== Testing "${word}" ===`);
  const entryIds = data.morphIndex[word] || [];
  
  if (entryIds.length > 0) {
    for (const id of entryIds.slice(0, 2)) { // Show first 2 entries max
      const entry = data.entries[id];
      if (entry) {
        console.log(`Dictionary form: ${entry.dictionaryForm}`);
        console.log(`Part of Speech: ${entry.partOfSpeechDisplay}`);
        console.log(`Declension: ${entry.declension}`);
        console.log(`Gender: ${entry.gender || 'N/A'}`);
        console.log(`Stems: [${entry.stems.join(', ')}]`);
        console.log(`Meaning: ${entry.meaning}`);
        console.log();
      }
    }
  } else {
    console.log('❌ NOT FOUND');
  }
  console.log();
}