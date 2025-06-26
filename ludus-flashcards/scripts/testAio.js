const fs = require('fs');
const path = require('path');

// Load the optimized index
const dataPath = path.join(__dirname, '../src/data/whitakersOptimized.json');
const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

console.log('🔍 Testing "aio" and other irregular words...\n');

// Test aio specifically
console.log('=== Testing "aio" ===');
const aioEntryIds = data.morphIndex['aio'] || [];

if (aioEntryIds.length > 0) {
  console.log(`✅ FOUND ${aioEntryIds.length} entries:`);
  for (const id of aioEntryIds) {
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

// Test other known irregular words
const irregularWords = [
  'inquam',  // irregular verb (I say)
  'fari',    // deponent verb (to speak)
  'quaeso',  // irregular verb (I beg)
  'cedo',    // irregular imperative
  'age',     // irregular imperative  
  'memento', // irregular imperative
  'fac',     // irregular imperative
  'dic',     // irregular imperative
  'duc',     // irregular imperative
  'fer',     // irregular imperative
];

console.log('=== Testing other irregular words ===');
for (const word of irregularWords) {
  const entryIds = data.morphIndex[word] || [];
  console.log(`${word}: ${entryIds.length > 0 ? `✅ Found (${entryIds.length} entries)` : '❌ NOT FOUND'}`);
}

console.log('\n=== Summary ===');
const totalWords = irregularWords.length + 1; // +1 for aio
const foundWords = irregularWords.filter(word => (data.morphIndex[word] || []).length > 0).length + (aioEntryIds.length > 0 ? 1 : 0);
console.log(`Found: ${foundWords}/${totalWords} irregular words (${(foundWords/totalWords*100).toFixed(1)}%)`);