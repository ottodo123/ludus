#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Very strict processor for Whitaker's Words that only includes
 * entries that look like proper dictionary headwords
 */

// File paths
const INPUT_FILE = path.join(__dirname, '../../whitakers-words-master/DICTLINE.GEN');
const OUTPUT_FILE = path.join(__dirname, '../src/data/whitakersWordsStrict.json');

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
 * Very strict check for complete dictionary headwords
 */
function isProperDictionaryHeadword(word, partOfSpeech, meaning) {
  const stem = word.toLowerCase();
  
  // Allow common short prepositions, conjunctions, etc.
  const commonShortWords = [
    'a', 'ab', 'ad', 'de', 'ex', 'in', 'ob', 'per', 're', 'sub', 'pro', 'cum', 'sine',
    'et', 'ac', 'vel', 'aut', 'sed', 'at', 'ut', 'ne', 'si', 'ni', 'an', 'num',
    'o', 'ah', 'heu', 'oh', 'vae', 'io', 'eia', 'age'
  ];
  
  if (commonShortWords.includes(stem)) {
    return true;
  }
  
  // For nouns: must end with proper noun endings
  if (partOfSpeech === 'N') {
    // 1st declension: -a
    // 2nd declension: -us, -um, -er, -ir
    // 3rd declension: consonant + s, -es, -is, -as, -us, -um + long words
    // 4th declension: -us (masc), -u (neut)
    // 5th declension: -es
    // Also -io/-tio/-sio endings (abstract nouns)
    if (stem.match(/^[a-z]+(a|us|um|er|ir|es|is|as|men|ment|or|tor|sor|trix|io|tio|sio|atio|itas|udo|edo|ies|aries)$/)) {
      return true;
    }
    // Long nouns (6+ chars) ending in consonants (3rd declension)
    if (stem.length >= 6 && stem.match(/^[a-z]+[bcdfghjklmnpqrstvwxyz]$/)) {
      return true;
    }
    return false;
  }
  
  // For verbs: must be infinitive forms or very clear verb forms
  if (partOfSpeech === 'V') {
    // Infinitives: -are, -ere, -ire (active), -ari, -eri, -iri (passive)
    // 1st person singular: -o, -or
    if (stem.match(/^[a-z]+(are|ere|ire|ari|eri|iri)$/) && stem.length >= 4) {
      return true;
    }
    // Only include -o/-or forms if they're reasonably long
    if (stem.match(/^[a-z]+(o|or)$/) && stem.length >= 4) {
      return true;
    }
    return false;
  }
  
  // For adjectives: must end with proper adjective endings
  if (partOfSpeech === 'ADJ') {
    // 1st/2nd declension: -us/-a/-um, -er/-a/-um
    // 3rd declension: -is/-is/-e, or consonant ending + long
    if (stem.match(/^[a-z]+(us|a|um|er|is|e|alis|aris|icus|inus|osus|bundus|atus|itus|utus|ax|ox|eps|ans|ens)$/)) {
      return true;
    }
    // Long adjectives ending in consonants (3rd declension)
    if (stem.length >= 6 && stem.match(/^[a-z]+[bcdfghjklmnpqrstvwxyz]$/)) {
      return true;
    }
    return false;
  }
  
  // For adverbs: typically longer and end in -e, -iter, -im, etc.
  if (partOfSpeech === 'ADV') {
    if (stem.length >= 4 && stem.match(/^[a-z]+(e|iter|im|ter|itus|enter|biliter|anter|aliter)$/)) {
      return true;
    }
    // Common short adverbs
    if (['ita', 'sic', 'tam', 'non', 'hic', 'nunc', 'tum', 'iam', 'mox', 'diu', 'bene', 'male'].includes(stem)) {
      return true;
    }
    return stem.length >= 5; // Other adverbs must be reasonably long
  }
  
  // Always include prepositions, conjunctions, interjections (usually complete)
  if (['PREP', 'CONJ', 'INTERJ'].includes(partOfSpeech)) {
    return true;
  }
  
  // For pronouns: usually complete forms
  if (partOfSpeech === 'PRON') {
    return true;
  }
  
  // For numerals: usually complete
  if (partOfSpeech === 'NUM') {
    return true;
  }
  
  // Default: reject
  return false;
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
  
  // Apply strict filtering
  if (!isProperDictionaryHeadword(mainStem, partOfSpeech, meaning)) {
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
  console.log('🔄 Processing Whitaker\'s Words dictionary (strict filtering)...');
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
      source: 'Whitaker\'s Words DICTLINE.GEN (Strict Filtering)',
      processed: new Date().toISOString(),
      totalEntries: processed,
      filteredOut: filtered,
      version: '1.2.0'
    },
    entries: entries
  };
  
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(outputData, null, 2));
  console.log(`💾 Saved ${processed} entries to: ${OUTPUT_FILE}`);
  
  // Show sample entries
  console.log('\n📝 Sample entries:');
  entries.slice(0, 10).forEach((entry, i) => {
    console.log(`${i + 1}. ${entry.mainStem} (${entry.partOfSpeechDisplay}): ${entry.meaning.substring(0, 50)}...`);
  });
  
  return entries;
}

// Run if called directly
if (require.main === module) {
  processDictionary();
}

module.exports = { processDictionary, parseDictLine };