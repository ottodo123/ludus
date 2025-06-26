#!/usr/bin/env node

console.log('🔍 ANALYSIS: Why mavult, patitur, moritur are missing\n');

console.log('=== ENTRIES IN DICTLINE.GEN ===');
console.log('1. malo: "mal mal malu zzz V 6 2 X"');
console.log('   - Irregular verb (6th conjugation, type 2)');
console.log('   - Should generate: malo, mavis, mavult, etc.');
console.log('');

console.log('2. patior: "pati pat zzz pass V 3 1 DEP"');
console.log('   - Deponent verb (3rd conjugation, type 1, marked DEP)');
console.log('   - Should generate: patior, pateris, patitur, etc.');
console.log('');

console.log('3. morior: "mori mor zzz mortu V 3 1 DEP"');
console.log('   - Deponent verb (3rd conjugation, type 1, marked DEP)');
console.log('   - Should generate: morior, moreris, moritur, etc.');
console.log('');

console.log('=== ISSUES IN generateBasicInflections FUNCTION ===');
console.log('');

console.log('🚨 ISSUE 1: MALO (V 6 2) - Incorrect handling');
console.log('   Current code (line 914-957):');
console.log('   - Assumes all "6" conjugation verbs follow "eo" pattern');
console.log('   - Generates: eo, is, it, imus, itis, eunt');
console.log('   - But malo is irregular: malo, mavis, mavult, malumus, mavultis, malunt');
console.log('   - MISSING: Special case for malo verb');
console.log('');

console.log('🚨 ISSUE 2: PATIOR (V 3 1 DEP) - No deponent handling');
console.log('   Current code (line 824-863):');
console.log('   - Handles regular 3rd conjugation: stem + o, s, t, mus, tis, nt');
console.log('   - Would generate: patio, patis, patit (WRONG - these don\'t exist)');
console.log('   - Deponent verbs use PASSIVE forms with ACTIVE meaning');
console.log('   - Should generate: patior, pateris, patitur, patimur, patimini, patiuntur');
console.log('   - MISSING: Check for DEP marker and use passive endings');
console.log('');

console.log('🚨 ISSUE 3: MORIOR (V 3 1 DEP) - No deponent handling');
console.log('   Current code (line 824-863):');
console.log('   - Same issue as patior');
console.log('   - Would generate: morio, moris, morit (WRONG - these don\'t exist)');
console.log('   - Should generate: morior, moreris, moritur, morimur, morimini, moriuntur');
console.log('   - MISSING: Check for DEP marker and use passive endings');
console.log('');

console.log('=== ROOT CAUSES ===');
console.log('');
console.log('1. ❌ No special handling for "malo" irregular verb');
console.log('2. ❌ No detection of DEP (deponent) marker in POS info');
console.log('3. ❌ No generation of passive verb forms for deponent verbs');
console.log('');

console.log('=== REQUIRED FIXES ===');
console.log('');
console.log('1. 🔧 Add special case for malo verb in V 6 2 section');
console.log('2. 🔧 Detect DEP marker in declension string');  
console.log('3. 🔧 For deponent verbs, generate passive forms instead of active forms');
console.log('4. 🔧 Add test cases to verify mavult, patitur, moritur are generated');
console.log('');

console.log('=== EXPECTED FORMS ===');
console.log('');
console.log('malo (irregular):');
console.log('  Present: malo, mavis, mavult, malumus, mavultis, malunt');
console.log('  Infinitive: malle');
console.log('');
console.log('patior (deponent):');
console.log('  Present: patior, pateris, patitur, patimur, patimini, patiuntur');
console.log('  Infinitive: pati');
console.log('');
console.log('morior (deponent):');
console.log('  Present: morior, moreris, moritur, morimur, morimini, moriuntur');
console.log('  Infinitive: mori');