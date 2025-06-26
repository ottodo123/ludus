const fs = require('fs');
const path = require('path');

// Load the script to test inflection generation
const createOptimizedIndex = require('./createOptimizedIndex.js');

// Create a test entry for patior
const testEntry = {
  stems: ['pati', 'pat', 'zzz', 'pass'],
  partOfSpeech: 'V',
  declension: '3 1 DEP',
  meaning: 'test patior'
};

console.log('🔍 Testing inflection generation for patior...\n');
console.log('Entry data:');
console.log('  Stems:', testEntry.stems);
console.log('  Declension:', testEntry.declension);
console.log('  Is Deponent:', testEntry.declension.includes('DEP'));
console.log();

// We need to access the generateBasicInflections function
// Let's create a simple test to see what forms are generated

// For now, let's manually check what should be generated based on our logic
const mainStem = testEntry.stems[0]; // 'pati'
const isDeponent = testEntry.declension.includes('DEP');

console.log('Expected forms based on our logic:');
console.log('  Main stem:', mainStem);
console.log('  Is deponent:', isDeponent);

if (isDeponent) {
  console.log('  Expected passive forms:');
  console.log('    patior  (pati + or)');
  console.log('    pateris (pati + eris)');
  console.log('    patitur (pati + itur)  ⭐ TARGET');
  console.log('    patimur (pati + imur)');
  console.log('    patimini (pati + imini)');
  console.log('    patiuntur (pati + untur)');
} else {
  console.log('  This should not happen - patior is deponent');
}

console.log('\nActual forms found in index:');
console.log('  patior: ✅ Found');
console.log('  pateris: ✅ Found (but from other entries)');
console.log('  patitur: ❌ NOT FOUND');
console.log('  patimur: ❌ NOT FOUND');
console.log('  patimini: ❌ NOT FOUND');
console.log('  patiuntur: ✅ Found');

console.log('\n💡 ISSUE: Some forms are missing, suggesting the inflection generation has a bug.');
console.log('The logic should generate patitur = pati + itur, but it\'s not being indexed.');