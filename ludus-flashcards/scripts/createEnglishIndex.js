#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Creates an English→Latin reverse dictionary index
 */

const INPUT_FILE = path.join(__dirname, '../src/data/whitakersOptimized.json');
const OUTPUT_FILE = path.join(__dirname, '../src/data/englishIndex.json');

// Common English words to filter out (articles, prepositions, etc.)
const STOP_WORDS = new Set([
  'a', 'an', 'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by',
  'from', 'up', 'about', 'into', 'through', 'during', 'before', 'after', 'above', 'below',
  'between', 'among', 'around', 'over', 'under', 'beside', 'beyond', 'within', 'without',
  'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did',
  'will', 'would', 'could', 'should', 'may', 'might', 'can', 'must', 'shall', 'ought',
  'this', 'that', 'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him',
  'her', 'us', 'them', 'my', 'your', 'his', 'her', 'its', 'our', 'their', 'mine', 'yours',
  'ours', 'theirs', 'myself', 'yourself', 'himself', 'herself', 'itself', 'ourselves',
  'yourselves', 'themselves', 'what', 'which', 'who', 'whom', 'whose', 'where', 'when',
  'why', 'how', 'all', 'any', 'both', 'each', 'few', 'more', 'most', 'other', 'some',
  'such', 'no', 'nor', 'not', 'only', 'own', 'same', 'so', 'than', 'too', 'very', 'just',
  'now', 'here', 'there', 'then', 'also', 'still', 'again', 'back', 'down', 'off', 'out',
  'away', 'once', 'never', 'always', 'often', 'sometimes', 'usually', 'rarely', 'hardly',
  'almost', 'quite', 'rather', 'really', 'truly', 'certainly', 'perhaps', 'maybe', 'probably',
  'possibly', 'indeed', 'actually', 'definitely', 'absolutely', 'completely', 'entirely',
  'totally', 'exactly', 'particularly', 'especially', 'specifically', 'generally', 'usually',
  'etc', 'eg', 'ie', 'pl', 'sg', 'usu', 'archaic', 'w', 'esp', 'lit', 'fig', 'abbr',
  'fem', 'masc', 'neut', 'inf', 'fut', 'perf', 'pass', 'act', 'subj', 'ind', 'imp'
]);

function extractEnglishWords(meaning) {
  if (!meaning) return [];
  
  // Clean the meaning text
  let cleaned = meaning.toLowerCase()
    // Remove Latin text in brackets
    .replace(/\[.*?\]/g, ' ')
    // Remove parenthetical notes
    .replace(/\([^)]*\)/g, ' ')
    // Remove semicolon phrases that are often explanatory
    .replace(/;.*$/, '')
    // Remove punctuation but keep apostrophes in words
    .replace(/[^\w\s'\/\-]/g, ' ')
    // Normalize whitespace
    .replace(/\s+/g, ' ')
    .trim();
  
  // Split into individual words and phrases
  const words = [];
  
  // Extract individual words
  const individualWords = cleaned.split(/[\s\/\-]+/)
    .filter(word => word.length > 2) // Filter out very short words
    .filter(word => !STOP_WORDS.has(word))
    .filter(word => !/^\d+$/.test(word)) // Filter out pure numbers
    .filter(word => /^[a-z']+$/.test(word)); // Only English letters and apostrophes
  
  words.push(...individualWords);
  
  // Extract meaningful phrases (2-3 words)
  const phrases = cleaned.split(/[;,\.]/)
    .map(phrase => phrase.trim())
    .filter(phrase => phrase.length > 3 && phrase.length < 50)
    .filter(phrase => phrase.split(' ').length >= 2 && phrase.split(' ').length <= 3)
    .filter(phrase => !phrase.includes('/'))
    .filter(phrase => !/\b(pl|sg|usu|esp|lit|fig|abbr|fem|masc|neut)\b/.test(phrase));
  
  words.push(...phrases);
  
  // Deduplicate
  return [...new Set(words)];
}

function createEnglishIndex() {
  console.log('🔄 Creating English→Latin reverse index...');
  
  // Load the optimized Latin dictionary
  const data = JSON.parse(fs.readFileSync(INPUT_FILE, 'utf8'));
  
  const englishIndex = {};
  let totalWords = 0;
  let processedEntries = 0;
  
  for (const entry of data.entries) {
    if (processedEntries % 5000 === 0) {
      console.log(`⏳ Processed ${processedEntries} entries, found ${totalWords} English terms...`);
    }
    
    const englishWords = extractEnglishWords(entry.meaning);
    
    for (const word of englishWords) {
      if (!englishIndex[word]) {
        englishIndex[word] = [];
      }
      
      // Avoid duplicates for the same entry
      if (!englishIndex[word].includes(entry.id)) {
        englishIndex[word].push(entry.id);
        totalWords++;
      }
    }
    
    processedEntries++;
  }
  
  console.log(`✅ Created English index with ${Object.keys(englishIndex).length} English terms`);
  console.log(`📊 Total mappings: ${totalWords}`);
  
  // Create the output data structure
  const outputData = {
    metadata: {
      source: "Whitaker's Words English→Latin Index",
      processed: new Date().toISOString(),
      totalEnglishTerms: Object.keys(englishIndex).length,
      totalMappings: totalWords,
      version: "1.0.0"
    },
    englishIndex: englishIndex,
    // Include entry lookup for convenience
    entries: data.entries
  };
  
  // Save the index
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(outputData, null, 2));
  console.log(`💾 Saved English index to: ${OUTPUT_FILE}`);
  
  // Show some sample mappings
  console.log('\n🔍 Sample English→Latin mappings:');
  const sampleWords = ['love', 'water', 'good', 'man', 'war'].filter(word => englishIndex[word]);
  for (const word of sampleWords.slice(0, 5)) {
    const entryIds = englishIndex[word].slice(0, 3); // Show first 3 matches
    console.log(`"${word}" →`);
    for (const id of entryIds) {
      const entry = data.entries[id];
      console.log(`  ${entry.dictionaryForm} (${entry.partOfSpeechDisplay})`);
    }
  }
}

if (require.main === module) {
  createEnglishIndex();
}