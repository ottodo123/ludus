#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Improved processor for Whitaker's Words that filters out bare stems
 * and prioritizes complete dictionary headwords
 */

// File paths
const INPUT_FILE = path.join(__dirname, '../../whitakers-words-master/DICTLINE.GEN');
const OUTPUT_FILE = path.join(__dirname, '../src/data/whitakersWordsFiltered.json');

// Part of speech mapping for cleaner display
const POS_MAPPING = {
  'N': 'Noun',
  'V': 'Verb', 
  'ADJ': 'Adjective',
  'ADV': 'Adverb',
  'PREP': 'Preposition',
  'CONJ': 'Conjunction',
  'INTERJ': 'Interjection',
  'PRON': 'Pronoun',
  'NUM': 'Numeral',
  'PACK': 'Packon'
};

/**
 * Determines if a word looks like a complete Latin dictionary headword
 * rather than just an inflectional stem
 */
function isCompleteDictionaryWord(word, partOfSpeech, meaning) {
  const stem = word.toLowerCase();
  
  // Skip very short entries that are likely abbreviations or particles
  if (stem.length <= 2) {
    return ['a', 'ab', 'ad', 'de', 'ex', 'in', 'ob', 'per', 're', 'sub', 'pro'].includes(stem);
  }
  
  // Always include prepositions, conjunctions, interjections (usually complete)
  if (['PREP', 'CONJ', 'INTERJ', 'ADV'].includes(partOfSpeech)) {
    return true;
  }
  
  // For nouns, prefer words ending in typical noun endings
  if (partOfSpeech === 'N') {
    return stem.match(/^[a-z]+(us|a|um|o|es|is|as|itas|tio|sio|atio|men|ment|tor|trix|sor|x)$/) ||
           stem.length >= 6; // Longer words are more likely to be complete
  }
  
  // For verbs, prefer infinitive forms or longer stems
  if (partOfSpeech === 'V') {
    return stem.match(/^[a-z]+(are|ere|ire|ari|eri|iri|o|or)$/) ||
           stem.length >= 5;
  }
  
  // For adjectives, prefer words with typical adjective endings
  if (partOfSpeech === 'ADJ') {
    return stem.match(/^[a-z]+(us|a|um|is|e|x|ax|ox|alis|aris|icus|inus|osus|bundus|atus|itus|utus)$/) ||
           stem.length >= 5;
  }
  
  // For other parts of speech, include if reasonably long
  return stem.length >= 4;
}

function parseDictLine(line) {
  if (!line || line.length < 110) return null;
  
  // Extract fixed-width fields
  const stems = line.substring(0, 75).trim();
  const posInfo = line.substring(76, 100).trim();
  const meaning = line.substring(110).trim();
  
  if (!stems || !meaning) return null;
  
  // Parse stems - multiple forms separated by spaces
  const stemArray = stems.split(/\s+/).filter(s => s.length > 0);
  const mainStem = stemArray[0];
  
  // Parse part of speech info
  const posParts = posInfo.split(/\s+/).filter(s => s.length > 0);
  const partOfSpeech = posParts[0] || '';
  const posDisplay = POS_MAPPING[partOfSpeech] || partOfSpeech;
  
  // Filter out incomplete stems
  if (!isCompleteDictionaryWord(mainStem, partOfSpeech, meaning)) {
    return null;
  }
  
  // Parse declension/conjugation info
  let declension = '';
  let gender = '';
  if (posParts.length > 1) {
    if (partOfSpeech === 'N') {
      declension = posParts[1] + (posParts[2] ? ` ${posParts[2]}` : '');
      gender = posParts[3] || '';
    } else if (partOfSpeech === 'V') {
      declension = posParts[1] + (posParts[2] ? ` ${posParts[2]}` : '');
    } else if (partOfSpeech === 'ADJ') {
      declension = posParts[1] + (posParts[2] ? ` ${posParts[2]}` : '');
    }
  }
  
  // Clean up meaning - remove brackets and format
  let cleanMeaning = meaning
    .replace(/\|/g, '; ')  // Replace | with semicolon
    .replace(/\s+/g, ' ')  // Normalize whitespace
    .trim();
  
  // Extract usage notes in brackets
  const bracketed = cleanMeaning.match(/\[([^\]]+)\]/g);
  const usageNotes = bracketed ? bracketed.map(b => b.slice(1, -1)) : [];
  cleanMeaning = cleanMeaning.replace(/\[([^\]]+)\]/g, '').trim();
  
  // Remove leading semicolons and clean up
  cleanMeaning = cleanMeaning.replace(/^[;\s]+/, '').replace(/[;\s]+$/, '');
  
  return {
    id: `${mainStem}_${stemArray.length > 1 ? stemArray[1] : 'base'}`,
    stems: stemArray,
    mainStem: mainStem,
    partOfSpeech: partOfSpeech,
    partOfSpeechDisplay: posDisplay,
    declension: declension,
    gender: gender,
    meaning: cleanMeaning,
    usageNotes: usageNotes,
    searchTerms: [
      ...stemArray,
      ...cleanMeaning.toLowerCase().split(/[;,\s]+/).filter(w => w.length > 2)
    ]
  };
}

function processDictionary() {
  console.log('🔄 Processing Whitaker\'s Words dictionary (improved filtering)...');
  console.log(`📖 Reading from: ${INPUT_FILE}`);
  
  if (!fs.existsSync(INPUT_FILE)) {
    console.error(`❌ Dictionary file not found: ${INPUT_FILE}`);
    process.exit(1);
  }
  
  const rawData = fs.readFileSync(INPUT_FILE, 'utf8');
  const lines = rawData.split('\n');
  
  console.log(`📊 Total lines to process: ${lines.length}`);
  
  const entries = [];
  let processed = 0;
  let skipped = 0;
  let filtered = 0;
  
  for (let i = 0; i < lines.length; i++) {
    const entry = parseDictLine(lines[i]);
    if (entry) {
      entries.push(entry);
      processed++;
    } else if (lines[i].trim().length > 0) {
      // Line had content but was filtered out
      filtered++;
    } else {
      skipped++;
    }
    
    // Progress indicator
    if ((i + 1) % 5000 === 0) {
      console.log(`⏳ Processed ${i + 1}/${lines.length} lines...`);
    }
  }
  
  console.log(`✅ Processing complete!`);
  console.log(`📈 Kept: ${processed} entries`);
  console.log(`🚫 Filtered out: ${filtered} incomplete stems`);
  console.log(`⏭️  Skipped: ${skipped} empty lines`);
  
  // Create output directory if it doesn't exist
  const outputDir = path.dirname(OUTPUT_FILE);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  // Write JSON output
  const outputData = {
    metadata: {
      source: 'Whitaker\'s Words DICTLINE.GEN (Filtered)',
      processed: new Date().toISOString(),
      totalEntries: processed,
      filteredOut: filtered,
      version: '1.1.0'
    },
    entries: entries
  };
  
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(outputData, null, 2));
  console.log(`💾 Saved ${processed} entries to: ${OUTPUT_FILE}`);
  
  // Show sample entries
  console.log('\n📝 Sample entries:');
  entries.slice(0, 5).forEach((entry, i) => {
    console.log(`${i + 1}. ${entry.mainStem} (${entry.partOfSpeechDisplay}): ${entry.meaning.substring(0, 60)}...`);
  });
  
  return entries;
}

// Run if called directly
if (require.main === module) {
  processDictionary();
}

module.exports = { processDictionary, parseDictLine };