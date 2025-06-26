const fs = require('fs');
const path = require('path');

// Load the optimized index
const dataPath = path.join(__dirname, '../src/data/whitakersOptimized.json');
const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

console.log('🔍 Testing "voluntas" search in optimized index...\n');

// Search for "voluntas"
const term = 'voluntas';
const entryIds = data.morphIndex[term] || [];

console.log(`Found ${entryIds.length} entries for "${term}":`);

for (const id of entryIds) {
  const entry = data.entries[id];
  if (entry) {
    console.log(`Entry ID ${id}:`);
    console.log(`- ${entry.dictionaryForm} (${entry.partOfSpeechDisplay})`);
    console.log(`  Definition: "${entry.meaning}"`);
    console.log(`  Stems: ${entry.stems.join(', ')}`);
    console.log(`  Declension: ${entry.declension}`);
    console.log();
  }
}