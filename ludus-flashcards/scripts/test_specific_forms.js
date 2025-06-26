#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Read the generateBasicInflections function from the optimized index script
const optimizedIndexScript = fs.readFileSync('/Users/ottodo/Documents/GitHub/ludus/ludus-flashcards/scripts/createOptimizedIndex.js', 'utf8');

// Extract the function (this is a bit hacky but works for testing)
let generateBasicInflections;
try {
  // Use eval to get the function - this is safe since we control the source
  eval(optimizedIndexScript.replace('module.exports', '// module.exports'));
} catch (e) {
  console.error('Error loading function:', e.message);
  process.exit(1);
}

console.log('🧪 Testing inflection generation for specific entries...\n');

// Test entries for our three target verbs
const testEntries = [
  {
    name: 'malo',
    stems: ['mal', 'mal', 'malu', 'zzz'],
    partOfSpeech: 'V', 
    declension: '6 2 X',
    gender: '',
    meaning: 'prefer; incline toward, wish rather'
  },
  {
    name: 'patior', 
    stems: ['pati', 'pat', 'zzz', 'pass'],
    partOfSpeech: 'V',
    declension: '3 1 DEP', 
    gender: '',
    meaning: 'suffer; allow; undergo, endure; permit'
  },
  {
    name: 'morior',
    stems: ['mori', 'mor', 'zzz', 'mortu'],
    partOfSpeech: 'V',
    declension: '3 1 DEP',
    gender: '',
    meaning: 'die, expire, pass/die/wither away/out'
  }
];

testEntries.forEach((entry, index) => {
  console.log(`\n=== Testing ${entry.name} ===`);
  console.log(`Entry:`, {
    stems: entry.stems,
    partOfSpeech: entry.partOfSpeech,
    declension: entry.declension
  });
  
  try {
    const forms = generateBasicInflections(entry);
    console.log(`Generated ${forms.length} forms:`);
    
    // Sort and display the forms
    forms.sort().forEach(form => {
      console.log(`  - ${form}`);
    });
    
    // Check for our target forms
    const targetForms = ['mavult', 'patitur', 'moritur'];
    const hasTargetForm = targetForms.some(target => forms.includes(target));
    
    if (entry.name === 'malo') {
      console.log(`\n  🎯 Looking for "mavult": ${forms.includes('mavult') ? '✅ FOUND' : '❌ MISSING'}`);
    } else if (entry.name === 'patior') {
      console.log(`\n  🎯 Looking for "patitur": ${forms.includes('patitur') ? '✅ FOUND' : '❌ MISSING'}`);
    } else if (entry.name === 'morior') {
      console.log(`\n  🎯 Looking for "moritur": ${forms.includes('moritur') ? '✅ FOUND' : '❌ MISSING'}`);
    }
    
  } catch (error) {
    console.error(`❌ Error generating forms for ${entry.name}:`, error.message);
  }
});

console.log('\n🔍 Summary of Issues:\n');
console.log('1. MALO (V 6 2): Irregular verb not properly handled');
console.log('   - Current code assumes it follows "eo" pattern'); 
console.log('   - Need special case for malo -> mavult, mavis, etc.');
console.log('');
console.log('2. PATIOR (V 3 1 DEP): Deponent verb not handled');
console.log('   - Current code ignores DEP marker');
console.log('   - Should generate passive forms: patitur (not patit)');
console.log('');
console.log('3. MORIOR (V 3 1 DEP): Deponent verb not handled');
console.log('   - Current code ignores DEP marker');
console.log('   - Should generate passive forms: moritur (not morit)');