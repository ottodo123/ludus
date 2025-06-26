const fs = require('fs');
const path = require('path');

// Load the optimized index
const dataPath = path.join(__dirname, '../src/data/whitakersOptimized.json');
const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

console.log('🔍 Testing "satis" search with updated logic...\n');

const term = 'satis';
const entryIds = data.morphIndex[term] || [];

console.log(`Found ${entryIds.length} entries for "${term}":`);

const matches = entryIds.map(id => data.entries[id]).filter(entry => entry != null);

// Apply the same filtering logic as GlossaryPageSimple.js
const exactMatches = matches.filter(entry => 
  entry.stems.includes(term) || entry.dictionaryForm.toLowerCase().includes(term)
);
const derivativeMatches = matches.filter(entry => 
  !entry.stems.includes(term) && !entry.dictionaryForm.toLowerCase().includes(term)
);

console.log(`\n=== EXACT MATCHES (${exactMatches.length}) ===`);
for (const entry of exactMatches) {
  console.log(`✅ "${entry.dictionaryForm}" (${entry.partOfSpeechDisplay})`);
  console.log(`   Meaning: ${entry.meaning}`);
  console.log(`   Stems: [${entry.stems.join(', ')}]`);
  console.log();
}

console.log(`=== DERIVATIVE MATCHES (${derivativeMatches.length}) ===`);
for (const entry of derivativeMatches) {
  const isFiltered = entry.dictionaryForm.includes('sero') || entry.dictionaryForm.includes('serere');
  const status = isFiltered ? '❌ FILTERED OUT' : '⚠️  INCLUDED';
  console.log(`${status} "${entry.dictionaryForm}" (${entry.partOfSpeechDisplay})`);
  console.log(`   Meaning: ${entry.meaning}`);
  console.log(`   Stems: [${entry.stems.join(', ')}]`);
  console.log();
}

// Show final results after filtering
let filteredMatches = [...exactMatches];
if (term === 'satis') {
  const relevantDerivatives = derivativeMatches.filter(entry => 
    entry.dictionaryForm !== 'sat, sat' // Only filter out the unrelated "sprung from" word
  );
  filteredMatches.push(...relevantDerivatives);
}

// Sort by part of speech priority
filteredMatches.sort((a, b) => {
  const posOrder = { 'ADJ': 1, 'ADV': 2, 'N': 3, 'V': 4, 'PREP': 5 };
  const aPriority = posOrder[a.partOfSpeech] || 6;
  const bPriority = posOrder[b.partOfSpeech] || 6;
  
  return aPriority - bPriority;
});

// Deduplicate by dictionary form AND part of speech
const uniqueMatches = [];
const seenForms = new Set();

for (const entry of filteredMatches) {
  const key = `${entry.dictionaryForm}|${entry.partOfSpeech}`;
  if (!seenForms.has(key)) {
    seenForms.add(key);
    uniqueMatches.push(entry);
  }
}

console.log(`=== FINAL RESULTS AFTER FILTERING & DEDUPLICATION (${uniqueMatches.length}) ===`);
for (let i = 0; i < uniqueMatches.length; i++) {
  const entry = uniqueMatches[i];
  console.log(`${i + 1}. "${entry.dictionaryForm}" (${entry.partOfSpeechDisplay})`);
  console.log(`   ${entry.meaning}`);
  console.log();
}