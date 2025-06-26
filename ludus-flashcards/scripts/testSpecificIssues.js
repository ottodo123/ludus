const fs = require('fs');
const path = require('path');

// Load the optimized index
const dataPath = path.join(__dirname, '../src/data/whitakersOptimized.json');
const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

console.log('🔍 Testing specific issues with irregular verbs...\n');

// Test cases the user mentioned
const testCases = [
  { word: 'quaeso', issue: 'Only shows first principal part, should show full conjugation' },
  { word: 'ode', issue: 'Should show odeo entry' },
  { word: 'odeo', issue: 'Entry disappears when typing full word' }
];

for (const testCase of testCases) {
  console.log(`=== Testing "${testCase.word}" ===`);
  console.log(`Issue: ${testCase.issue}`);
  
  const entryIds = data.morphIndex[testCase.word] || [];
  
  if (entryIds.length > 0) {
    console.log(`✅ Found ${entryIds.length} entries:`);
    for (const id of entryIds) {
      const entry = data.entries[id];
      if (entry) {
        console.log(`  - Dictionary form: "${entry.dictionaryForm}"`);
        console.log(`    Part of speech: ${entry.partOfSpeechDisplay}`);
        console.log(`    Definition: ${entry.meaning}`);
        console.log(`    Stems: [${entry.stems.join(', ')}]`);
        console.log(`    Declension: ${entry.declension}`);
        console.log();
      }
    }
  } else {
    console.log(`❌ NOT FOUND`);
  }
  console.log();
}

// Test more comprehensive irregular verb forms
console.log('=== Testing comprehensive irregular verb forms ===');

const irregularTests = [
  // quaeso forms
  { base: 'quaeso', forms: ['quaeso', 'quaesis', 'quaesit', 'quaesimus', 'quaesitis', 'quaesunt'] },
  // odeo forms  
  { base: 'odeo', forms: ['odeo', 'odes', 'odet', 'odemus', 'odetis', 'odent', 'ode', 'odis', 'odit'] },
  // inquam forms
  { base: 'inquam', forms: ['inquam', 'inquis', 'inquit', 'inquimus', 'inquitis', 'inquiunt'] },
  // fero forms
  { base: 'fero', forms: ['fero', 'fers', 'fert', 'ferimus', 'fertis', 'ferunt', 'tuli', 'tulisti', 'tulit'] }
];

for (const test of irregularTests) {
  console.log(`--- ${test.base.toUpperCase()} forms ---`);
  
  let foundForms = 0;
  let totalForms = test.forms.length;
  
  for (const form of test.forms) {
    const entryIds = data.morphIndex[form] || [];
    const found = entryIds.length > 0;
    
    if (found) {
      foundForms++;
      // Check if the entry is actually related to the base verb
      const relatedEntry = entryIds.find(id => {
        const entry = data.entries[id];
        return entry && (
          entry.dictionaryForm.includes(test.base) || 
          entry.stems.some(stem => test.base.startsWith(stem) || stem.startsWith(test.base.slice(0, 3)))
        );
      });
      
      console.log(`  ${form}: ${relatedEntry ? '✅ Found & Related' : '⚠️ Found but not related'}`);
    } else {
      console.log(`  ${form}: ❌ NOT FOUND`);
    }
  }
  
  const coverage = (foundForms / totalForms * 100).toFixed(1);
  console.log(`  Coverage: ${foundForms}/${totalForms} (${coverage}%)`);
  console.log();
}

console.log('=== Summary ===');
console.log('Issues found that need fixing:');
console.log('1. quaeso - needs proper conjugation, not just first principal part');
console.log('2. odeo - needs proper form generation and indexing');
console.log('3. Need to verify all irregular verb forms are properly generated and indexed');