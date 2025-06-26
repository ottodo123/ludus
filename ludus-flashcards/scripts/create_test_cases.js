#!/usr/bin/env node

console.log('🧪 TEST CASES for Missing Forms: mavult, patitur, moritur\n');

const testCases = [
  {
    verb: 'malo',
    dictlineEntry: 'mal                mal                malu               zzz                V      6 2 X            X X X A X prefer; incline toward, wish rather;',
    stems: ['mal', 'mal', 'malu', 'zzz'],
    posInfo: ['V', '6', '2', 'X'],
    issue: 'Missing special handling for irregular malo verb',
    currentBehavior: 'Treated as regular V 6 (like eo) - generates wrong forms',
    expectedForms: [
      'malo',      // 1sg: malo (I prefer)
      'mavis',     // 2sg: mavis (you prefer)  
      'mavult',    // 3sg: mavult (he/she/it prefers) ⭐ TARGET FORM
      'malumus',   // 1pl: malumus (we prefer)
      'mavultis',  // 2pl: mavultis (you all prefer)
      'malunt',    // 3pl: malunt (they prefer)
      'malle',     // infinitive: malle (to prefer)
      'malebam',   // 1sg impf: malebam (I was preferring)
      'malebas',   // 2sg impf: malebas
      'malebat',   // 3sg impf: malebat  
      'malui',     // 1sg perf: malui (I preferred)
      'maluisti',  // 2sg perf: maluisti
      'maluit'     // 3sg perf: maluit
    ],
    wrongFormsCurrentlyGenerated: [
      'eo', 'is', 'it', 'imus', 'itis', 'eunt', // from eo pattern
      'ibam', 'ibas', 'ibat', 'eam', 'eas', 'eat' // wrong conjugation
    ]
  },
  
  {
    verb: 'patior', 
    dictlineEntry: 'pati               pat                zzz                pass               V      3 1 DEP          X X X A X suffer; allow; undergo, endure; permit;',
    stems: ['pati', 'pat', 'zzz', 'pass'],
    posInfo: ['V', '3', '1', 'DEP'],
    issue: 'No handling for DEP (deponent) marker - generates active forms instead of passive',
    currentBehavior: 'Treated as regular V 3 1 - generates active forms that don\'t exist',
    expectedForms: [
      'patior',     // 1sg: patior (I suffer) - deponent passive form with active meaning
      'pateris',    // 2sg: pateris (you suffer)
      'patitur',    // 3sg: patitur (he/she/it suffers) ⭐ TARGET FORM
      'patimur',    // 1pl: patimur (we suffer)
      'patimini',   // 2pl: patimini (you all suffer)
      'patiuntur',  // 3pl: patiuntur (they suffer)
      'pati',       // infinitive: pati (to suffer)
      'patiebar',   // 1sg impf: patiebar (I was suffering)
      'patiebaris', // 2sg impf: patiebaris
      'patiebatur', // 3sg impf: patiebatur
      'passus',     // perfect participle: passus (having suffered)
      'passa',      // perfect participle fem: passa  
      'passum'      // perfect participle neut: passum
    ],
    wrongFormsCurrentlyGenerated: [
      'patio', 'patis', 'patit', 'patimus', 'patitis', 'patiunt', // active forms (wrong!)
      'patiebam', 'patiebas', 'patiebat', // active imperfect (wrong!)
      'patiam', 'patias', 'patiat' // active subjunctive (wrong!)
    ]
  },
  
  {
    verb: 'morior',
    dictlineEntry: 'mori               mor                zzz                mortu              V      3 1 DEP          X X X A O die, expire, pass/die/wither away/out; fail, come to an end; decay;',
    stems: ['mori', 'mor', 'zzz', 'mortu'],
    posInfo: ['V', '3', '1', 'DEP'],
    issue: 'No handling for DEP (deponent) marker - generates active forms instead of passive',
    currentBehavior: 'Treated as regular V 3 1 - generates active forms that don\'t exist',
    expectedForms: [
      'morior',     // 1sg: morior (I die) - deponent passive form with active meaning
      'moreris',    // 2sg: moreris (you die)
      'moritur',    // 3sg: moritur (he/she/it dies) ⭐ TARGET FORM
      'morimur',    // 1pl: morimur (we die)
      'morimini',   // 2pl: morimini (you all die)
      'moriuntur',  // 3pl: moriuntur (they die)
      'mori',       // infinitive: mori (to die)
      'moriebar',   // 1sg impf: moriebar (I was dying)
      'moriebaris', // 2sg impf: moriebaris
      'moriebatur', // 3sg impf: moriebatur
      'mortuus',    // perfect participle: mortuus (having died/dead)
      'mortua',     // perfect participle fem: mortua
      'mortuum',    // perfect participle neut: mortuum
      'moriturus',  // future participle: moriturus (about to die)
    ],
    wrongFormsCurrentlyGenerated: [
      'morio', 'moris', 'morit', 'morimus', 'moritis', 'moriunt', // active forms (wrong!)
      'moriebam', 'moriebas', 'moriebat', // active imperfect (wrong!)
      'moriam', 'morias', 'moriat' // active subjunctive (wrong!)
    ]
  }
];

console.log('=== DETAILED TEST CASES ===\n');

testCases.forEach((test, index) => {
  console.log(`${index + 1}. ${test.verb.toUpperCase()}`);
  console.log(`   DICTLINE.GEN: ${test.dictlineEntry.substring(0, 100)}...`);
  console.log(`   Stems: [${test.stems.map(s => `"${s}"`).join(', ')}]`);
  console.log(`   POS Info: [${test.posInfo.map(s => `"${s}"`).join(', ')}]`);
  console.log(`   Issue: ${test.issue}`);
  console.log(`   Current Behavior: ${test.currentBehavior}`);
  console.log(`   `);
  console.log(`   ✅ Expected Forms (${test.expectedForms.length}):`);
  test.expectedForms.forEach(form => {
    const isTarget = (test.verb === 'malo' && form === 'mavult') ||
                    (test.verb === 'patior' && form === 'patitur') ||
                    (test.verb === 'morior' && form === 'moritur');
    console.log(`      ${form}${isTarget ? ' ⭐ TARGET' : ''}`);
  });
  console.log(`   `);
  console.log(`   ❌ Wrong Forms Currently Generated (${test.wrongFormsCurrentlyGenerated.length}):`);
  test.wrongFormsCurrentlyGenerated.forEach(form => {
    console.log(`      ${form}`);
  });
  console.log('   ');
});

console.log('=== IMPLEMENTATION REQUIREMENTS ===\n');

console.log('1. 🔧 MALO VERB SPECIAL CASE');
console.log('   - Check if mainStem === "mal" && declension includes "6" && declension includes "2"');
console.log('   - Generate irregular forms: malo, mavis, mavult, malumus, mavultis, malunt');
console.log('   - Generate infinitive: malle'); 
console.log('');

console.log('2. 🔧 DEPONENT VERB DETECTION');
console.log('   - Check if declension.includes("DEP")');
console.log('   - For deponent verbs, generate PASSIVE forms instead of active forms');
console.log('   - 3rd conjugation deponent: stem + or, eris, itur, imur, imini, iuntur');
console.log('');

console.log('3. 🔧 DEPONENT VERB FORMS');
console.log('   - Present passive endings: -or, -eris/-re, -itur, -imur, -imini, -iuntur');
console.log('   - Imperfect passive: -ebar, -ebaris, -ebatur, -ebamur, -ebamini, -ebantur');
console.log('   - Perfect participle from 4th stem (if available)');
console.log('');

console.log('4. 🧪 VERIFICATION');
console.log('   - After fixes, test that mavult, patitur, moritur are in the generated index');
console.log('   - Verify no incorrect active forms are generated for deponents');
console.log('   - Check that malo doesn\'t follow eo pattern');