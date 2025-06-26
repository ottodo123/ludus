const fs = require('fs');
const path = require('path');

// Load the optimized index
const dataPath = path.join(__dirname, '../src/data/whitakersOptimized.json');
const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

console.log('🔍 Testing the 3 specific forms that were missing...\n');

// Test the 3 specific missing forms
const testCases = [
  { word: 'mavult', expected: 'malo, malle, malui', type: 'irregular verb form' },
  { word: 'patitur', expected: 'patior, patii, passus sum', type: 'deponent verb form' },
  { word: 'moritur', expected: 'morior, morii, mortuus sum', type: 'deponent verb form' }
];

let totalTests = testCases.length;
let passedTests = 0;

for (const testCase of testCases) {
  console.log(`=== Testing "${testCase.word}" ===`);
  
  const entryIds = data.morphIndex[testCase.word] || [];
  
  if (entryIds.length > 0) {
    console.log(`✅ FOUND ${entryIds.length} entries:`);
    for (const id of entryIds) {
      const entry = data.entries[id];
      if (entry) {
        console.log(`   - ${entry.dictionaryForm} (${entry.partOfSpeechDisplay})`);
        console.log(`     Definition: ${entry.meaning}`);
      }
    }
    passedTests++;
  } else {
    console.log(`❌ NOT FOUND - Expected: ${testCase.expected}`);
  }
  console.log();
}

console.log(`\n📊 SUMMARY:`);
console.log(`✅ Passed: ${passedTests}/${totalTests} (${(passedTests/totalTests*100).toFixed(1)}%)`);
console.log(`❌ Failed: ${totalTests - passedTests}/${totalTests}`);

if (passedTests === totalTests) {
  console.log(`\n🎉 ALL TESTS PASSED! The 3 missing forms have been fixed.`);
} else {
  console.log(`\n⚠️  Some tests still failing. Need further investigation.`);
}