const fs = require('fs');
const path = require('path');

// Load the optimized index
const dataPath = path.join(__dirname, '../src/data/whitakersOptimized.json');
const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

console.log('🔍 Testing irregular verbs in optimized index...\n');

// Test irregular verbs
const irregularVerbs = ['nolo', 'malo', 'volo', 'conor', 'sum', 'eo'];

for (const verb of irregularVerbs) {
  console.log(`=== ${verb.toUpperCase()} ===`);
  
  const entryIds = data.morphIndex[verb] || [];
  console.log(`Found ${entryIds.length} entries:`);
  
  for (const id of entryIds) {
    const entry = data.entries[id];
    if (entry) {
      console.log(`- ${entry.dictionaryForm}`);
    }
  }
  console.log();
}