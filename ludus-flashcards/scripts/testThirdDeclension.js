const fs = require('fs');
const path = require('path');

// Load the optimized index
const dataPath = path.join(__dirname, '../src/data/whitakersOptimized.json');
const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

console.log('🔍 Testing third declension nouns...\n');

// Test some common third declension nouns
const thirdDeclensionNouns = ['rex', 'miles', 'homo', 'civitas', 'nomen', 'corpus', 'genus'];

for (const noun of thirdDeclensionNouns) {
  console.log(`=== ${noun.toUpperCase()} ===`);
  
  const entryIds = data.morphIndex[noun] || [];
  
  if (entryIds.length > 0) {
    for (const id of entryIds) {
      const entry = data.entries[id];
      if (entry && entry.partOfSpeech === 'N' && entry.declension.startsWith('3')) {
        console.log(`- ${entry.dictionaryForm}`);
        break; // Just show the first third declension noun entry
      }
    }
  } else {
    console.log('- Not found');
  }
  console.log();
}