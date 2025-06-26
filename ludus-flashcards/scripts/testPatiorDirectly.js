// Manually test the patior inflection logic

const mainStem = 'pati';
const declension = '3 1 DEP';
const isDeponent = declension.includes('DEP');

console.log('🔍 Testing patior inflection logic directly...\n');
console.log(`Main stem: ${mainStem}`);
console.log(`Declension: ${declension}`);
console.log(`Is deponent: ${isDeponent}`);
console.log(`Starts with '3': ${declension.startsWith('3')}`);

const forms = new Set();

if (declension.startsWith('3')) {
  console.log('\n✅ Enters 3rd conjugation block');
  
  if (isDeponent) {
    console.log('✅ Recognized as deponent - generating passive forms only');
    
    // Present Passive Indicative (for deponent verbs, these are the ONLY forms)
    forms.add(mainStem + 'or');       // 1sg: patior
    forms.add(mainStem + 'eris');     // 2sg: pateris  
    forms.add(mainStem + 'itur');     // 3sg: patitur ⭐ TARGET
    forms.add(mainStem + 'imur');     // 1pl: patimur
    forms.add(mainStem + 'imini');    // 2pl: patimini
    forms.add(mainStem + 'untur');    // 3pl: patiuntur
    
    console.log('\n✅ Generated forms:');
    Array.from(forms).sort().forEach(form => console.log(`  ${form}`));
    
  } else {
    console.log('❌ Not recognized as deponent');
  }
} else {
  console.log('❌ Does not enter 3rd conjugation block');
}

console.log(`\n🎯 Key check: Does forms contain 'patitur'? ${forms.has('patitur')}`);

// The forms should be generated correctly, so the issue must be elsewhere
// Either in the indexing process or the entry processing