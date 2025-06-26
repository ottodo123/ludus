const fs = require('fs');
const path = require('path');

// Load the optimized index to see what's actually generated
const dataPath = path.join(__dirname, '../src/data/whitakersOptimized.json');
const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

console.log('🔍 Debugging memento generation...\n');

// Find the memini entry
let meminiEntry = null;
for (const entry of data.entries) {
  if (entry.stems && entry.stems[2] === 'memin' && entry.declension.includes('PERFDEF')) {
    meminiEntry = entry;
    break;
  }
}

if (meminiEntry) {
  console.log('=== Found memini entry ===');
  console.log('Dictionary form:', meminiEntry.dictionaryForm);
  console.log('Stems:', meminiEntry.stems);
  console.log('Declension:', meminiEntry.declension);
  console.log('Perfect stem:', meminiEntry.stems[2]);
  console.log('Entry ID:', meminiEntry.id);
  console.log();
  
  // Check what forms are indexed under this entry ID
  console.log('=== Forms indexed under this entry ===');
  const formsPointingToThisEntry = [];
  
  for (const [form, entryIds] of Object.entries(data.morphIndex)) {
    if (entryIds.includes(meminiEntry.id)) {
      formsPointingToThisEntry.push(form);
    }
  }
  
  console.log('Total forms found:', formsPointingToThisEntry.length);
  console.log('Forms generated:', formsPointingToThisEntry.sort());
  
  // Check specifically for memento-related forms
  const mementoForms = formsPointingToThisEntry.filter(form => form.includes('memento'));
  console.log('\nMemento-related forms:', mementoForms);
  
  // Expected PERFDEF forms based on my logic
  const perfectStem = meminiEntry.stems[2]; // 'memin'
  const expectedForms = [
    perfectStem + 'i',        // memini
    perfectStem + 'isti',     // meministi
    perfectStem + 'it',       // meminit
    perfectStem + 'imus',     // meminimus
    perfectStem + 'istis',    // meministis
    perfectStem + 'erunt',    // meminerunt
    perfectStem + 'ento',     // memento ⭐ TARGET
    perfectStem + 'entote',   // mementote
    perfectStem             // memin
  ];
  
  console.log('\n=== Expected vs Actual forms ===');
  for (const expected of expectedForms) {
    const found = formsPointingToThisEntry.includes(expected);
    console.log(`${expected}: ${found ? '✅ Found' : '❌ Missing'}`);
  }
  
} else {
  console.log('❌ Could not find memini PERFDEF entry');
}