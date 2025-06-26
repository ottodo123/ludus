const fs = require('fs');
const path = require('path');

// Load the optimized index
const dataPath = path.join(__dirname, '../src/data/whitakersOptimized.json');
const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

console.log('🔍 Testing all irregular verbs for "zzz" issues...\n');

// Test key irregular verbs
const irregularVerbs = [
  'aio',      // defective verb (say)
  'inquam',   // defective verb (I say)  
  'fari',     // deponent verb (to speak)
  'quaeso',   // irregular verb (I beg)
  'memento',  // PERFDEF imperative (remember!)
  'memini',   // PERFDEF verb (I remember)
  'possum',   // irregular verb (I can)
  'sum',      // irregular verb (I am)
  'fero',     // irregular verb (I carry)
  'eo',       // irregular verb (I go)
  'volo',     // irregular verb (I want)
  'nolo',     // irregular verb (I don't want)
  'malo'      // irregular verb (I prefer)
];

console.log('=== Checking dictionary forms for "zzz" issues ===\n');

for (const verb of irregularVerbs) {
  console.log(`--- ${verb.toUpperCase()} ---`);
  
  const entryIds = data.morphIndex[verb] || [];
  
  if (entryIds.length > 0) {
    console.log(`✅ Found ${entryIds.length} entries:`);
    
    for (const id of entryIds) {
      const entry = data.entries[id];
      if (entry) {
        const hasZzz = entry.dictionaryForm.includes('zzz');
        const statusIcon = hasZzz ? '❌' : '✅';
        
        console.log(`  ${statusIcon} "${entry.dictionaryForm}" (${entry.partOfSpeechDisplay})`);
        
        if (hasZzz) {
          console.log(`     ⚠️  ISSUE: Contains "zzz" placeholders`);
          console.log(`     Stems: [${entry.stems.join(', ')}]`);
          console.log(`     Declension: ${entry.declension}`);
        }
      }
    }
  } else {
    console.log(`❌ NOT FOUND`);
  }
  console.log();
}

console.log('=== Summary ===');
let totalVerbs = 0;
let verbsWithIssues = 0;

for (const verb of irregularVerbs) {
  const entryIds = data.morphIndex[verb] || [];
  
  if (entryIds.length > 0) {
    totalVerbs++;
    
    for (const id of entryIds) {
      const entry = data.entries[id];
      if (entry && entry.dictionaryForm.includes('zzz')) {
        verbsWithIssues++;
        break; // Count verb once even if multiple entries have issues
      }
    }
  }
}

console.log(`📊 Total irregular verbs tested: ${totalVerbs}`);
console.log(`❌ Verbs with "zzz" issues: ${verbsWithIssues}`);
console.log(`✅ Clean verbs: ${totalVerbs - verbsWithIssues}`);
console.log(`🎯 Success rate: ${((totalVerbs - verbsWithIssues) / totalVerbs * 100).toFixed(1)}%`);

if (verbsWithIssues > 0) {
  console.log(`\n⚠️  ${verbsWithIssues} verbs still have "zzz" placeholders in dictionary forms that need fixing.`);
}