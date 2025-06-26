const fs = require('fs');
const path = require('path');

// Load the optimized index
const dataPath = path.join(__dirname, '../src/data/whitakersOptimized.json');
const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

console.log('🔍 Testing aio entry specifically...\n');

// Test aio
console.log('=== Testing "aio" ===');
const aioEntryIds = data.morphIndex['aio'] || [];

if (aioEntryIds.length > 0) {
  console.log(`✅ FOUND ${aioEntryIds.length} entries:`);
  for (const id of aioEntryIds) {
    const entry = data.entries[id];
    if (entry) {
      console.log(`Entry ID ${id}:`);
      console.log(`- Dictionary form: "${entry.dictionaryForm}"`);
      console.log(`- Part of speech: ${entry.partOfSpeechDisplay}`);
      console.log(`- Definition: ${entry.meaning}`);
      console.log(`- Stems: [${entry.stems.join(', ')}]`);
      console.log(`- Declension: ${entry.declension}`);
      console.log();
    }
  }
} else {
  console.log(`❌ NOT FOUND`);
}

// Also test other aio forms
console.log('=== Testing other aio forms ===');
const aioForms = ['ais', 'ait', 'aiunt'];

for (const form of aioForms) {
  const entryIds = data.morphIndex[form] || [];
  console.log(`${form}: ${entryIds.length > 0 ? `✅ Found (${entryIds.length} entries)` : '❌ NOT FOUND'}`);
  
  if (entryIds.length > 0) {
    for (const id of entryIds) {
      const entry = data.entries[id];
      if (entry && entry.stems && entry.stems[0] === 'ai') {
        console.log(`  → ${entry.dictionaryForm}`);
        break; // Just show one aio-related entry
      }
    }
  }
}