const fs = require('fs');
const path = require('path');

// Load the optimized index
const dataPath = path.join(__dirname, '../src/data/whitakersOptimized.json');
const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

console.log('🔍 Testing "conor" search in optimized index...\n');

// Search for "conor"
const term = 'conor';
const entryIds = data.morphIndex[term] || [];

console.log(`Found ${entryIds.length} entries for "${term}":`);

for (const id of entryIds) {
  const entry = data.entries[id];
  if (entry) {
    console.log(`- ${entry.dictionaryForm} (${entry.partOfSpeechDisplay})`);
    console.log(`  Definition: ${entry.meaning}`);
    console.log(`  Stems: ${entry.stems.join(', ')}`);
    console.log(`  Declension: ${entry.declension}`);
    console.log();
  }
}