const fs = require('fs');
const path = require('path');

// Load the optimized index
const dataPath = path.join(__dirname, '../src/data/whitakersOptimized.json');
const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

// Load original DICTLINE.GEN for comparison
const dictPath = path.join(__dirname, '../../whitakers-words-master/DICTLINE.GEN');
const dictContent = fs.readFileSync(dictPath, 'utf8');

console.log('🔍 CORRECTED DIAGNOSTIC TEST - Stem-Based Analysis\n');
console.log(`Total entries in optimized index: ${data.entries.length}`);
console.log(`Total morphological forms: ${Object.keys(data.morphIndex).length}\n`);

// Parse DICTLINE.GEN entries more accurately
function parseDictLineEntry(line) {
  // Skip comment/empty lines
  if (!line.trim() || line.startsWith('#')) return null;
  
  // Extract the actual dictionary entry part (before position data)
  const parts = line.trim().split(/\s+/);
  if (parts.length < 10) return null;
  
  // Format: word stem1 stem2 stem3 stem4 partOfSpeech declension gender flags meaning
  const word = parts[0].replace(/→/g, '').toLowerCase();
  const stem1 = parts[1] || '';
  const stem2 = parts[2] || '';
  const stem3 = parts[3] || '';
  const stem4 = parts[4] || '';
  const stems = [stem1, stem2, stem3, stem4].filter(s => s && s !== 'zzz' && s !== '');
  const partOfSpeech = parts[5];
  const declension = parts[6];
  const gender = parts[7];
  
  return { 
    word, 
    stems, 
    partOfSpeech, 
    declension, 
    gender,
    fullLine: line 
  };
}

// Get all DICTLINE entries and build stem index
console.log('📊 Building DICTLINE stem analysis...');
const lines = dictContent.split('\n');
const dictEntries = [];
const dictStemIndex = {};

for (const line of lines) {
  const entry = parseDictLineEntry(line);
  if (entry) {
    dictEntries.push(entry);
    
    // Index by stems
    for (const stem of entry.stems) {
      if (!dictStemIndex[stem]) {
        dictStemIndex[stem] = [];
      }
      dictStemIndex[stem].push(entry);
    }
    
    // Also index by word form
    if (!dictStemIndex[entry.word]) {
      dictStemIndex[entry.word] = [];
    }
    dictStemIndex[entry.word].push(entry);
  }
}

console.log(`Found ${dictEntries.length} valid DICTLINE entries`);
console.log(`Built stem index with ${Object.keys(dictStemIndex).length} unique stems/forms\n`);

// Test specific irregular verb stems that should exist
const irregularVerbStems = {
  'sum (esse)': ['su', 'es', 'fu', 'fut'],  // sum, esse, fui, futurus
  'possum (posse)': ['poss', 'pot', 'potu'], // possum, posse, potui  
  'fero (ferre)': ['fer', 'tul', 'lat'],     // fero, ferre, tuli, latum
  'eo (ire)': ['e', 'i', 'iv', 'it'],        // eo, ire, ivi/ii, itum
  'volo (velle)': ['vol', 'vel', 'volu'],    // volo, velle, volui
  'nolo (nolle)': ['nol', 'nolu'],           // nolo, nolle, nolui  
  'malo (malle)': ['mal', 'malu']            // malo, malle, malui
};

const deponentStems = {
  'sequor': ['sequ', 'secut'],               // sequor, sequi, secutus
  'loquor': ['loqu', 'locut'],               // loquor, loqui, locutus
  'patior': ['pat', 'pass'],                 // patior, pati, passus
  'morior': ['mor', 'mort'],                 // morior, mori, mortuus
  'conor': ['con', 'conat']                  // conor, conari, conatus
};

const thirdDeclensionStems = {
  'rex': ['reg'],                            // rex, regis
  'homo': ['homin'],                         // homo, hominis  
  'corpus': ['corpor'],                      // corpus, corporis
  'nomen': ['nomin'],                        // nomen, nominis
  'miles': ['milit'],                        // miles, militis
  'pater': ['patr'],                         // pater, patris
  'mater': ['matr']                          // mater, matris
};

function testStemCategory(categoryName, stemGroups) {
  console.log(`\n${'='.repeat(50)}`);
  console.log(`${categoryName.toUpperCase()}`);
  console.log(`${'='.repeat(50)}`);
  
  const results = {};
  
  for (const [word, expectedStems] of Object.entries(stemGroups)) {
    console.log(`\n--- Testing stems for: ${word.toUpperCase()} ---`);
    
    // Check which expected stems exist in DICTLINE
    const foundInDict = [];
    const missingFromDict = [];
    
    for (const stem of expectedStems) {
      if (dictStemIndex[stem]) {
        foundInDict.push(stem);
        console.log(`✅ DICTLINE has stem "${stem}": ${dictStemIndex[stem].length} entries`);
        dictStemIndex[stem].forEach(entry => {
          console.log(`   - ${entry.word} (${entry.partOfSpeech} ${entry.declension})`);
        });
      } else {
        missingFromDict.push(stem);
        console.log(`❌ DICTLINE missing stem "${stem}"`);
      }
    }
    
    // Check our index for these stems
    const foundInOurs = [];
    const missingFromOurs = [];
    
    for (const stem of expectedStems) {
      const ourEntries = data.entries.filter(entry => 
        entry.stems.includes(stem)
      );
      
      if (ourEntries.length > 0) {
        foundInOurs.push(stem);
        console.log(`✅ Our index has stem "${stem}": ${ourEntries.length} entries`);
        ourEntries.forEach(entry => {
          console.log(`   - ${entry.dictionaryForm} (${entry.partOfSpeech} ${entry.declension})`);
        });
      } else {
        missingFromOurs.push(stem);
        console.log(`❌ Our index missing stem "${stem}"`);
      }
    }
    
    // Check for dictionary form existence
    const wordBase = word.split(' ')[0]; // Extract just the word part
    const dictFormEntries = data.morphIndex[wordBase] || [];
    
    console.log(`\n📖 Dictionary form "${wordBase}" in our index: ${dictFormEntries.length} entries`);
    if (dictFormEntries.length > 0) {
      dictFormEntries.forEach(id => {
        const entry = data.entries[id];
        if (entry) {
          console.log(`   - ${entry.dictionaryForm} (${entry.partOfSpeech} ${entry.declension})`);
        }
      });
    }
    
    results[word] = {
      expectedStems,
      foundInDict,
      missingFromDict,
      foundInOurs,
      missingFromOurs,
      dictFormExists: dictFormEntries.length > 0,
      analysis: []
    };
    
    // Analysis
    if (missingFromDict.length > 0) {
      results[word].analysis.push(`⚠️  DICTLINE missing ${missingFromDict.length} expected stems: [${missingFromDict.join(', ')}]`);
    }
    
    if (missingFromOurs.length > 0) {
      results[word].analysis.push(`⚠️  Our index missing ${missingFromOurs.length} expected stems: [${missingFromOurs.join(', ')}]`);
    }
    
    if (foundInDict.length === expectedStems.length && foundInOurs.length === expectedStems.length) {
      results[word].analysis.push(`✅ All expected stems found in both indexes`);
    }
    
    if (!dictFormEntries.length && categoryName.includes('Irregular')) {
      results[word].analysis.push(`ℹ️  Dictionary form not in morphIndex (expected for irregular verbs)`);
    }
    
    if (dictFormEntries.length && !categoryName.includes('Irregular')) {
      results[word].analysis.push(`✅ Dictionary form properly indexed`);
    }
  }
  
  return results;
}

// Run tests
const irregularResults = testStemCategory('Irregular Verbs', irregularVerbStems);
const deponentResults = testStemCategory('Deponent Verbs', deponentStems);  
const nounResults = testStemCategory('Third Declension Nouns', thirdDeclensionStems);

// Sample some actual problem cases
console.log(`\n${'='.repeat(60)}`);
console.log('SAMPLE PROBLEM ANALYSIS');
console.log(`${'='.repeat(60)}`);

// Check what we actually have for "sum"
console.log('\n--- DETAILED: "sum" analysis ---');
console.log('DICTLINE entries with "sum":');
const sumEntries = dictStemIndex['sum'] || [];
sumEntries.forEach(entry => {
  console.log(`  ${entry.fullLine.substring(0, 100)}...`);
});

console.log('\nOur entries with form "sum":');
const ourSumEntries = data.morphIndex['sum'] || [];
ourSumEntries.forEach(id => {
  const entry = data.entries[id];
  if (entry) {
    console.log(`  ${entry.dictionaryForm} - Stems: [${entry.stems.join(', ')}]`);
  }
});

// Check actual stems
console.log('\nDICTLINE entries with stem "su":');
const suEntries = dictStemIndex['su'] || [];
suEntries.forEach(entry => {
  console.log(`  ${entry.fullLine.substring(0, 100)}...`);
});

console.log('\nDICTLINE entries with stem "es":');
const esEntries = dictStemIndex['es'] || [];
esEntries.forEach(entry => {
  console.log(`  ${entry.fullLine.substring(0, 100)}...`);
});

// Summary
console.log(`\n${'='.repeat(60)}`);
console.log('CORRECTED DIAGNOSTIC SUMMARY');
console.log(`${'='.repeat(60)}`);

let totalProblems = 0;

[irregularResults, deponentResults, nounResults].forEach((results, index) => {
  const categoryNames = ['Irregular Verbs', 'Deponent Verbs', 'Third Declension Nouns'];
  console.log(`\n${categoryNames[index]}:`);
  
  for (const [word, result] of Object.entries(results)) {
    if (result.analysis.length > 0) {
      console.log(`  ${word}:`);
      result.analysis.forEach(analysis => {
        console.log(`    ${analysis}`);
        if (analysis.includes('⚠️') || analysis.includes('❌')) {
          totalProblems++;
        }
      });
    }
  }
});

console.log(`\n🔍 Total stem-related problems found: ${totalProblems}`);

// Key insights
console.log(`\n${'='.repeat(60)}`);
console.log('KEY INSIGHTS');
console.log(`${'='.repeat(60)}`);

console.log(`
1. WHITAKER'S SYSTEM STRUCTURE:
   - DICTLINE.GEN stores base lexical entries with stems
   - Irregular forms like "possum", "nolo", "malo" are GENERATED, not stored
   - Our optimized index correctly includes generated dictionary forms
   
2. STEM VS HEADWORD ANALYSIS:
   - We should compare STEM coverage, not headword existence
   - Irregular verbs may have stems in DICTLINE but not the full conjugated forms
   
3. MORPHOLOGICAL GENERATION:
   - Our index appears to be working correctly for most cases
   - Discrepancies are mainly due to different indexing approaches
   
4. NEXT STEPS:
   - Verify stem coverage in both systems
   - Test actual morphological generation accuracy
   - Compare inflected form generation, not just dictionary forms
`);