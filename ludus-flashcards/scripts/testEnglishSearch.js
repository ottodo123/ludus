const fs = require('fs');
const path = require('path');

// Load the English index
const englishDataPath = path.join(__dirname, '../src/data/englishIndex.json');
const englishData = JSON.parse(fs.readFileSync(englishDataPath, 'utf8'));

console.log('🔍 Testing English→Latin reverse dictionary search...\n');

const testWords = ['love', 'water', 'good', 'war', 'man', 'woman', 'house', 'tree', 'eat'];

for (const word of testWords) {
  console.log(`=== Searching English: "${word}" ===`);
  const entryIds = englishData.englishIndex[word] || [];
  
  if (entryIds.length > 0) {
    console.log(`✅ Found ${entryIds.length} Latin entries:`);
    
    // Show first 5 results
    for (const id of entryIds.slice(0, 5)) {
      const entry = englishData.entries[id];
      if (entry) {
        console.log(`  ${entry.dictionaryForm} (${entry.partOfSpeechDisplay})`);
        console.log(`    ${entry.meaning}`);
      }
    }
    
    if (entryIds.length > 5) {
      console.log(`  ... and ${entryIds.length - 5} more`);
    }
  } else {
    console.log(`❌ NOT FOUND`);
  }
  console.log();
}

// Test partial matching
console.log('=== Testing partial matching ===');
const partialTerm = 'lov'; // Should match "love", "loving", etc.
const partialMatches = Object.keys(englishData.englishIndex)
  .filter(englishTerm => englishTerm.includes(partialTerm))
  .slice(0, 10);

console.log(`Partial matches for "${partialTerm}":`);
for (const match of partialMatches) {
  console.log(`  "${match}" → ${englishData.englishIndex[match].length} entries`);
}