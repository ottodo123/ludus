#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const INPUT_FILE = '/Users/ottodo/Documents/GitHub/ludus/whitakers-words-master/DICTLINE.GEN';

console.log('🔍 Analyzing malo, patior, morior entries...\n');

const rawData = fs.readFileSync(INPUT_FILE, 'utf8');
const lines = rawData.split('\n');

let targetEntries = [];

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  if (!line || line.length < 110) continue;
  
  const stems = line.substring(0, 75).trim();
  const posInfo = line.substring(76, 100).trim();
  const meaning = line.substring(110).trim();
  
  if (stems.includes('mal ') || stems.includes('pati ') || stems.includes('mori ')) {
    const stemArray = stems.split(/\s+/).filter(s => s.length > 0);
    const posParts = posInfo.split(/\s+/).filter(s => s.length > 0);
    
    const entry = {
      stems: stemArray,
      posInfo: posParts,
      meaning: meaning,
      rawLine: line
    };
    
    targetEntries.push(entry);
    
    console.log(`Entry ${targetEntries.length}:`);
    console.log('  Stems:', stemArray);
    console.log('  POS Info:', posParts);
    console.log('  Meaning:', meaning.substring(0, 60) + '...');
    console.log('  Raw line length:', line.length);
    console.log('---');
  }
}

console.log(`\n📊 Found ${targetEntries.length} target entries\n`);

// Now let's simulate what the generateBasicInflections function would do
// First let me read the actual function from the optimized index script
const optimizedIndexScript = fs.readFileSync('/Users/ottodo/Documents/GitHub/ludus/ludus-flashcards/scripts/createOptimizedIndex.js', 'utf8');

// Test if the function handles these cases
console.log('🧪 Testing inflection generation for target entries...\n');

targetEntries.forEach((entry, index) => {
  console.log(`\n=== Testing Entry ${index + 1}: ${entry.stems[0]} ===`);
  
  const partOfSpeech = entry.posInfo[0] || '';
  const declension = entry.posInfo.slice(1).join(' ');
  const isDeponent = entry.posInfo.includes('DEP');
  
  console.log(`Part of Speech: ${partOfSpeech}`);
  console.log(`Declension: ${declension}`);
  console.log(`Is Deponent: ${isDeponent}`);
  
  // Check what the current logic would generate
  const mainStem = entry.stems[0];
  
  if (partOfSpeech === 'V') {
    console.log(`\nMain stem: "${mainStem}"`);
    console.log('Expected forms:');
    
    if (mainStem === 'mal') {
      console.log('  - Should generate: mavult (3rd person singular)');
      console.log('  - This is irregular - need special handling');
    } else if (mainStem === 'pati') {
      console.log('  - Should generate: patitur (3rd person singular deponent)');
      console.log('  - Deponent verbs use passive forms with active meaning');
    } else if (mainStem === 'mori') {
      console.log('  - Should generate: moritur (3rd person singular deponent)');
      console.log('  - Deponent verbs use passive forms with active meaning');
    }
  }
});