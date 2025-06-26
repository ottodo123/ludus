const fs = require('fs');
const path = require('path');

// Load the optimized index
const dataPath = path.join(__dirname, '../src/data/whitakersOptimized.json');
const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

console.log('🔍 Testing memento and memini forms...\n');

// Test various memini/memento forms
const testForms = ['memento', 'memini', 'meministi', 'meminit', 'memin'];

for (const form of testForms) {
  console.log(`=== Testing "${form}" ===`);
  const entryIds = data.morphIndex[form] || [];
  
  if (entryIds.length > 0) {
    console.log(`✅ FOUND ${entryIds.length} entries:`);
    for (const id of entryIds) {
      const entry = data.entries[id];
      if (entry) {
        console.log(`   - ${entry.dictionaryForm} (${entry.partOfSpeechDisplay})`);
        console.log(`     Definition: ${entry.meaning}`);
        console.log(`     Stems: [${entry.stems.join(', ')}]`);
        console.log(`     Declension: ${entry.declension}`);
      }
    }
  } else {
    console.log(`❌ NOT FOUND`);
  }
  console.log();
}

// Also check if memini entries exist at all
console.log('=== Searching for memini-related entries ===');
let meminiEntries = [];

for (let i = 0; i < data.entries.length; i++) {
  const entry = data.entries[i];
  if (entry && entry.stems) {
    // Check if any stem contains "memin"
    const hasMeminiStem = entry.stems.some(stem => 
      stem && stem.includes('memin')
    );
    
    if (hasMeminiStem && entry.partOfSpeech === 'V') {
      meminiEntries.push(entry);
      console.log(`Entry ${i}:`);
      console.log(`  Dictionary form: ${entry.dictionaryForm}`);
      console.log(`  Stems: [${entry.stems.join(', ')}]`);
      console.log(`  Declension: ${entry.declension}`);
      console.log(`  Meaning: ${entry.meaning}`);
      console.log();
    }
  }
}

console.log(`Found ${meminiEntries.length} memini-related entries in total`);