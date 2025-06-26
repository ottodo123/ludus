const fs = require('fs');
const path = require('path');

// Load the optimized index
const dataPath = path.join(__dirname, '../src/data/whitakersOptimized.json');
const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

// Load original DICTLINE.GEN for comparison
const dictPath = path.join(__dirname, '../../whitakers-words-master/DICTLINE.GEN');
const dictContent = fs.readFileSync(dictPath, 'utf8');

console.log('🔍 COMPREHENSIVE DIAGNOSTIC TEST\n');
console.log(`Total entries in optimized index: ${data.entries.length}`);
console.log(`Total morphological forms: ${Object.keys(data.morphIndex).length}\n`);

// Parse DICTLINE.GEN entries for specific words
function parseDictLineEntry(line) {
  const parts = line.trim().split(/\s+/);
  if (parts.length < 6) return null;
  
  const word = parts[0].replace(/→/g, '').toLowerCase();
  const stems = [parts[1], parts[2], parts[3], parts[4]].filter(s => s && s !== 'zzz');
  const partOfSpeech = parts[5];
  const declension = parts[6];
  
  return { word, stems, partOfSpeech, declension, fullLine: line };
}

// Get all DICTLINE entries for a specific word
function getDictLineEntries(word) {
  const lines = dictContent.split('\n');
  const entries = [];
  
  for (const line of lines) {
    if (line.includes('→' + word) || line.startsWith(word)) {
      const entry = parseDictLineEntry(line);
      if (entry && entry.word === word.toLowerCase()) {
        entries.push(entry);
      }
    }
  }
  
  return entries;
}

// Test categories
const testCategories = {
  'Irregular Verbs': [
    'possum', 'sum', 'fero', 'eo', 'volo', 'nolo', 'malo'
  ],
  'Deponent Verbs': [
    'sequor', 'loquor', 'patior', 'morior', 'conor'
  ],
  'Third Declension Nouns': [
    'rex', 'homo', 'corpus', 'nomen', 'miles', 'pater', 'mater'
  ],
  'Irregular Adjectives': [
    'bonus', 'magnus', 'multus', 'malus', 'parvus'
  ],
  'Common Particles': [
    'que', 'ne', 'an', 'num', 'si', 'ut'
  ]
};

// Main diagnostic function
function runDiagnostic() {
  const results = {};
  
  for (const [category, words] of Object.entries(testCategories)) {
    console.log(`\n${'='.repeat(50)}`);
    console.log(`${category.toUpperCase()}`);
    console.log(`${'='.repeat(50)}`);
    
    results[category] = {};
    
    for (const word of words) {
      console.log(`\n--- Testing: ${word.toUpperCase()} ---`);
      
      // Check our optimized index
      const ourEntries = data.morphIndex[word] || [];
      console.log(`Our index has ${ourEntries.length} entries for "${word}"`);
      
      if (ourEntries.length > 0) {
        console.log('Our entries:');
        ourEntries.forEach(id => {
          const entry = data.entries[id];
          if (entry) {
            console.log(`  - ${entry.dictionaryForm} (${entry.partOfSpeech} ${entry.declension})`);
            console.log(`    Stems: [${entry.stems.join(', ')}]`);
            console.log(`    Meaning: ${entry.meaning.substring(0, 80)}...`);
          }
        });
      }
      
      // Check original DICTLINE.GEN
      const dictEntries = getDictLineEntries(word);
      console.log(`\nDICTLINE.GEN has ${dictEntries.length} entries for "${word}"`);
      
      if (dictEntries.length > 0) {
        console.log('DICTLINE entries:');
        dictEntries.forEach(entry => {
          console.log(`  - ${entry.partOfSpeech} ${entry.declension}`);
          console.log(`    Stems: [${entry.stems.join(', ')}]`);
          console.log(`    Line: ${entry.fullLine.substring(0, 100)}...`);
        });
      }
      
      // Analysis
      const discrepancies = [];
      
      if (ourEntries.length === 0 && dictEntries.length > 0) {
        discrepancies.push('MISSING: Word not found in our index but exists in DICTLINE');
      }
      
      if (ourEntries.length > 0 && dictEntries.length === 0) {
        discrepancies.push('EXTRA: Word found in our index but not in DICTLINE');
      }
      
      if (ourEntries.length !== dictEntries.length) {
        discrepancies.push(`COUNT MISMATCH: Our index has ${ourEntries.length} entries, DICTLINE has ${dictEntries.length}`);
      }
      
      // Check for stem discrepancies
      if (ourEntries.length > 0 && dictEntries.length > 0) {
        const ourMainEntry = data.entries[ourEntries[0]];
        const dictMainEntry = dictEntries[0];
        
        if (ourMainEntry && dictMainEntry) {
          const ourStems = new Set(ourMainEntry.stems.filter(s => s !== 'zzz'));
          const dictStems = new Set(dictMainEntry.stems.filter(s => s !== 'zzz'));
          
          const ourStemsArray = Array.from(ourStems);
          const dictStemsArray = Array.from(dictStems);
          
          if (ourStemsArray.length !== dictStemsArray.length) {
            discrepancies.push(`STEM COUNT: Our ${ourStemsArray.length} vs DICT ${dictStemsArray.length}`);
          }
          
          for (const stem of dictStemsArray) {
            if (!ourStems.has(stem)) {
              discrepancies.push(`MISSING STEM: "${stem}" from DICTLINE not in our index`);
            }
          }
          
          for (const stem of ourStemsArray) {
            if (!dictStems.has(stem)) {
              discrepancies.push(`EXTRA STEM: "${stem}" in our index but not in DICTLINE`);
            }
          }
        }
      }
      
      if (discrepancies.length > 0) {
        console.log('\n🚨 DISCREPANCIES FOUND:');
        discrepancies.forEach(d => console.log(`  ❌ ${d}`));
      } else {
        console.log('\n✅ No major discrepancies detected');
      }
      
      results[category][word] = {
        ourCount: ourEntries.length,
        dictCount: dictEntries.length,
        discrepancies: discrepancies
      };
    }
  }
  
  // Summary report
  console.log(`\n${'='.repeat(60)}`);
  console.log('SUMMARY REPORT');
  console.log(`${'='.repeat(60)}`);
  
  let totalIssues = 0;
  
  for (const [category, categoryResults] of Object.entries(results)) {
    console.log(`\n${category}:`);
    let categoryIssues = 0;
    
    for (const [word, result] of Object.entries(categoryResults)) {
      if (result.discrepancies.length > 0) {
        categoryIssues++;
        console.log(`  ❌ ${word}: ${result.discrepancies.length} issues`);
        result.discrepancies.forEach(d => console.log(`    - ${d}`));
      } else {
        console.log(`  ✅ ${word}: OK`);
      }
    }
    
    totalIssues += categoryIssues;
    console.log(`  → ${categoryIssues} words with issues in ${category}`);
  }
  
  console.log(`\n🔍 TOTAL: ${totalIssues} words with discrepancies found`);
  
  return results;
}

// Create specific test cases for failed words
function createTestCases(results) {
  console.log(`\n${'='.repeat(60)}`);
  console.log('SPECIFIC TEST CASES FOR FAILED WORDS');
  console.log(`${'='.repeat(60)}`);
  
  const testCases = [];
  
  for (const [category, categoryResults] of Object.entries(results)) {
    for (const [word, result] of Object.entries(categoryResults)) {
      if (result.discrepancies.length > 0) {
        // Create test case
        const dictEntries = getDictLineEntries(word);
        const ourEntries = (data.morphIndex[word] || []).map(id => data.entries[id]);
        
        const testCase = {
          word: word,
          category: category,
          input: word,
          expectedDictEntries: dictEntries.length,
          expectedStems: dictEntries.length > 0 ? dictEntries[0].stems : [],
          expectedPOS: dictEntries.length > 0 ? dictEntries[0].partOfSpeech : '',
          actualEntries: ourEntries.length,
          actualStems: ourEntries.length > 0 ? ourEntries[0].stems : [],
          actualPOS: ourEntries.length > 0 ? ourEntries[0].partOfSpeech : '',
          issues: result.discrepancies
        };
        
        testCases.push(testCase);
        
        console.log(`\nTest Case: ${word.toUpperCase()}`);
        console.log(`Category: ${category}`);
        console.log(`Input: "${word}"`);
        console.log(`Expected: ${testCase.expectedDictEntries} entries, POS: ${testCase.expectedPOS}`);
        console.log(`Expected stems: [${testCase.expectedStems.join(', ')}]`);
        console.log(`Actual: ${testCase.actualEntries} entries, POS: ${testCase.actualPOS}`);
        console.log(`Actual stems: [${testCase.actualStems.join(', ')}]`);
        console.log(`Issues: ${testCase.issues.join('; ')}`);
      }
    }
  }
  
  return testCases;
}

// Run the diagnostic
const results = runDiagnostic();
const testCases = createTestCases(results);

// Save detailed results to file
const outputPath = path.join(__dirname, 'diagnostic_results.json');
fs.writeFileSync(outputPath, JSON.stringify({
  timestamp: new Date().toISOString(),
  summary: results,
  testCases: testCases,
  metadata: {
    totalWordsTested: Object.values(testCategories).flat().length,
    totalIssuesFound: testCases.length
  }
}, null, 2));

console.log(`\n📁 Detailed results saved to: ${outputPath}`);