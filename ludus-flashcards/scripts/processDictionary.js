#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Processes Whitaker's Words DICTLINE.GEN file and converts it to JSON format
 * for use in the React Glossary page
 */

// File paths
const INPUT_FILE = path.join(__dirname, '../../whitakers-words-master/DICTLINE.GEN');
const OUTPUT_FILE = path.join(__dirname, '../src/data/whitakersWords.json');

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
  console.log('🔄 Processing Whitaker\'s Words dictionary...');
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
  
  for (let i = 0; i < lines.length; i++) {
    const entry = parseDictLine(lines[i]);
    if (entry) {
      entries.push(entry);
      processed++;
    } else {
      skipped++;
    }
    
    // Progress indicator
    if ((i + 1) % 5000 === 0) {
      console.log(`⏳ Processed ${i + 1}/${lines.length} lines...`);
    }
  }
  
  console.log(`✅ Processing complete!`);
  console.log(`📈 Processed: ${processed} entries`);
  console.log(`⏭️  Skipped: ${skipped} entries`);
  
  // Create output directory if it doesn't exist
  const outputDir = path.dirname(OUTPUT_FILE);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  // Write JSON output
  const outputData = {
    metadata: {
      source: 'Whitaker\'s Words DICTLINE.GEN',
      processed: new Date().toISOString(),
      totalEntries: processed,
      version: '1.0.0'
    },
    entries: entries
  };
  
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(outputData, null, 2));
  console.log(`💾 Saved ${processed} entries to: ${OUTPUT_FILE}`);
  
  // Show sample entries
  console.log('\n📝 Sample entries:');
  entries.slice(0, 3).forEach((entry, i) => {
    console.log(`${i + 1}. ${entry.mainStem} (${entry.partOfSpeechDisplay}): ${entry.meaning.substring(0, 60)}...`);
  });
  
  return entries;
}

// Run if called directly
if (require.main === module) {
  processDictionary();
}

module.exports = { processDictionary, parseDictLine };