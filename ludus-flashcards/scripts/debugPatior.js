const fs = require('fs');
const path = require('path');

// Load the optimized index
const dataPath = path.join(__dirname, '../src/data/whitakersOptimized.json');
const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

console.log('🔍 Debugging patior entries...\n');

// Search for any entries containing "pati"
console.log('=== Searching for entries with "pati" in stems ===');
let patiorEntries = [];

for (let i = 0; i < data.entries.length; i++) {
  const entry = data.entries[i];
  if (entry && entry.stems) {
    // Check if any stem contains "pati"
    const hasPatiorStem = entry.stems.some(stem => 
      stem && (stem.includes('pati') || stem.includes('pat'))
    );
    
    if (hasPatiorStem && entry.partOfSpeech === 'V') {
      patiorEntries.push(entry);
      console.log(`Entry ${i}:`);
      console.log(`  Dictionary form: ${entry.dictionaryForm}`);
      console.log(`  Stems: [${entry.stems.join(', ')}]`);
      console.log(`  Declension: ${entry.declension}`);
      console.log(`  Meaning: ${entry.meaning}`);
      console.log();
    }
  }
}

console.log(`Found ${patiorEntries.length} patior-related entries\n`);

// Check what forms are indexed under various patior stems
console.log('=== Checking morphological index for patior forms ===');
const testForms = ['patior', 'pateris', 'patitur', 'patimur', 'patimini', 'patiuntur'];

for (const form of testForms) {
  const entryIds = data.morphIndex[form] || [];
  console.log(`${form}: ${entryIds.length > 0 ? `Found (IDs: ${entryIds.join(', ')})` : 'NOT FOUND'}`);
}