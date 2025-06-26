#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Creates a morphological search index that mimics Whitaker's Words behavior
 * by processing all stems and forms to enable lookup of inflected words
 */

const INPUT_FILE = path.join(__dirname, '../../whitakers-words-master/DICTLINE.GEN');
const OUTPUT_FILE = path.join(__dirname, '../src/data/whitakersMorphIndex.json');

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

function createDictionaryForm(entry) {
  const { stems, partOfSpeech, declension, gender, meaning } = entry;
  
  // Create dictionary headword format like Whitaker's
  let dictForm = '';
  
  if (partOfSpeech === 'N') {
    // For nouns: stem + typical endings based on declension
    if (declension.startsWith('1')) {
      // 1st declension: -a, -ae
      dictForm = `${stems[0]}a, ${stems[0]}ae`;
    } else if (declension.startsWith('2')) {
      // 2nd declension: varies by gender
      if (gender === 'M' || gender === 'C') {
        dictForm = `${stems[0]}us, ${stems[0]}i`;
      } else {
        dictForm = `${stems[0]}um, ${stems[0]}i`;
      }
    } else if (declension.startsWith('3')) {
      // 3rd declension: use both stems if available
      if (stems.length > 1) {
        dictForm = `${stems[1]}, ${stems[0]}is`;
      } else {
        dictForm = `${stems[0]}, ${stems[0]}is`;
      }
    } else if (declension.startsWith('4')) {
      dictForm = `${stems[0]}us, ${stems[0]}us`;
    } else if (declension.startsWith('5')) {
      dictForm = `${stems[0]}es, ${stems[0]}ei`;
    } else {
      dictForm = stems.join(', ');
    }
  } else if (partOfSpeech === 'V') {
    // For verbs: show principal parts or infinitive
    if (stems.length >= 4) {
      dictForm = stems.slice(0, 4).join(', ');
    } else if (stems.length >= 2) {
      dictForm = stems.join(', ');
    } else {
      // Try to construct from stem
      const stem = stems[0];
      if (stem.endsWith('a')) {
        dictForm = `${stem}re`; // 1st conjugation infinitive
      } else {
        dictForm = stem;
      }
    }
  } else if (partOfSpeech === 'ADJ') {
    // For adjectives: show all forms
    if (declension.startsWith('1') || declension.startsWith('2')) {
      // 1st/2nd declension adjectives
      dictForm = `${stems[0]}us, ${stems[0]}a, ${stems[0]}um`;
    } else if (declension.startsWith('3')) {
      // 3rd declension adjectives
      if (stems.length > 1) {
        dictForm = `${stems[1]}, ${stems[0]}is`;
      } else {
        dictForm = `${stems[0]}, ${stems[0]}is`;
      }
    } else {
      dictForm = stems.join(', ');
    }
  } else {
    // Other parts of speech: just use the main stem
    dictForm = stems[0];
  }
  
  return dictForm;
}

function generateInflectedForms(entry) {
  const { stems, partOfSpeech, declension } = entry;
  const forms = new Set(stems); // Start with all given stems
  
  // Add the main stem
  const mainStem = stems[0];
  forms.add(mainStem);
  
  // Generate common inflected forms based on part of speech
  if (partOfSpeech === 'N') {
    if (declension.startsWith('1')) {
      // 1st declension noun endings
      forms.add(mainStem + 'a');     // nom/voc/abl sg
      forms.add(mainStem + 'ae');    // gen/dat sg, nom/voc pl
      forms.add(mainStem + 'am');    // acc sg
      forms.add(mainStem + 'as');    // acc pl
      forms.add(mainStem + 'arum');  // gen pl
      forms.add(mainStem + 'is');    // dat/abl pl
    } else if (declension.startsWith('2')) {
      // 2nd declension noun endings
      forms.add(mainStem + 'us');    // nom sg (masc)
      forms.add(mainStem + 'um');    // nom/acc sg (neut), acc sg (masc)
      forms.add(mainStem + 'i');     // gen sg, nom pl (masc), voc sg
      forms.add(mainStem + 'o');     // dat/abl sg
      forms.add(mainStem + 'os');    // acc pl (masc)
      forms.add(mainStem + 'orum');  // gen pl
      forms.add(mainStem + 'is');    // dat/abl pl
    } else if (declension.startsWith('3')) {
      // 3rd declension - more complex, use what we have
      if (stems.length > 1) {
        const stem2 = stems[1];
        forms.add(stem2);
        forms.add(mainStem + 'is');  // gen sg
        forms.add(mainStem + 'i');   // dat sg
        forms.add(mainStem + 'em');  // acc sg
        forms.add(mainStem + 'e');   // abl sg
        forms.add(mainStem + 'es');  // nom/acc pl
        forms.add(mainStem + 'um');  // gen pl
        forms.add(mainStem + 'ibus'); // dat/abl pl
      }
    }
  } else if (partOfSpeech === 'V') {
    // Add common verb forms
    forms.add(mainStem + 'o');      // 1st person sg present
    forms.add(mainStem + 's');      // 2nd person sg present
    forms.add(mainStem + 't');      // 3rd person sg present
    forms.add(mainStem + 'mus');    // 1st person pl present
    forms.add(mainStem + 'tis');    // 2nd person pl present
    forms.add(mainStem + 'nt');     // 3rd person pl present
    forms.add(mainStem + 're');     // infinitive (1st/2nd conj)
    forms.add(mainStem + 'ere');    // infinitive (3rd conj)
  } else if (partOfSpeech === 'ADJ') {
    // Add common adjective forms
    if (declension.startsWith('1') || declension.startsWith('2')) {
      forms.add(mainStem + 'us');   // masc nom sg
      forms.add(mainStem + 'a');    // fem nom sg
      forms.add(mainStem + 'um');   // neut nom sg
      forms.add(mainStem + 'i');    // various cases
      forms.add(mainStem + 'ae');   // various cases
      forms.add(mainStem + 'o');    // various cases
    }
  }
  
  return Array.from(forms);
}

function processEntries() {
  console.log('🔄 Creating morphological search index...');
  console.log(`📖 Reading from: ${INPUT_FILE}`);
  
  if (!fs.existsSync(INPUT_FILE)) {
    console.error(`❌ Dictionary file not found: ${INPUT_FILE}`);
    process.exit(1);
  }
  
  const rawData = fs.readFileSync(INPUT_FILE, 'utf8');
  const lines = rawData.split('\n');
  
  const morphIndex = {}; // word form -> array of possible entries
  const dictEntries = []; // all dictionary entries
  let processed = 0;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line || line.length < 110) continue;
    
    // Parse the line
    const stems = line.substring(0, 75).trim();
    const posInfo = line.substring(76, 100).trim();
    const meaning = line.substring(110).trim();
    
    if (!stems || !meaning) continue;
    
    const stemArray = stems.split(/\s+/).filter(s => s.length > 0);
    const posParts = posInfo.split(/\s+/).filter(s => s.length > 0);
    const partOfSpeech = posParts[0] || '';
    const posDisplay = POS_MAPPING[partOfSpeech] || partOfSpeech;
    
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
    
    // Clean up meaning
    let cleanMeaning = meaning
      .replace(/\|/g, '; ')
      .replace(/\s+/g, ' ')
      .trim()
      .replace(/^[;\s]+/, '')
      .replace(/[;\s]+$/, '');
    
    const entry = {
      id: processed,
      stems: stemArray,
      mainStem: stemArray[0],
      partOfSpeech: partOfSpeech,
      partOfSpeechDisplay: posDisplay,
      declension: declension,
      gender: gender,
      meaning: cleanMeaning,
      dictionaryForm: ''
    };
    
    // Create dictionary form
    entry.dictionaryForm = createDictionaryForm(entry);
    
    dictEntries.push(entry);
    
    // Generate all possible inflected forms and add to index
    const inflectedForms = generateInflectedForms(entry);
    
    for (const form of inflectedForms) {
      const normalizedForm = form.toLowerCase();
      if (!morphIndex[normalizedForm]) {
        morphIndex[normalizedForm] = [];
      }
      morphIndex[normalizedForm].push(entry.id);
    }
    
    processed++;
    
    if (processed % 5000 === 0) {
      console.log(`⏳ Processed ${processed} entries...`);
    }
  }
  
  console.log(`✅ Created morphological index with ${processed} entries`);
  console.log(`📊 Index covers ${Object.keys(morphIndex).length} word forms`);
  
  // Create output
  const outputData = {
    metadata: {
      source: 'Whitaker\'s Words Morphological Index',
      processed: new Date().toISOString(),
      totalEntries: processed,
      totalForms: Object.keys(morphIndex).length,
      version: '2.0.0'
    },
    entries: dictEntries,
    morphIndex: morphIndex
  };
  
  // Create output directory if it doesn't exist
  const outputDir = path.dirname(OUTPUT_FILE);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(outputData, null, 2));
  console.log(`💾 Saved morphological index to: ${OUTPUT_FILE}`);
  
  // Test some lookups
  console.log('\n🔍 Testing morphological lookups:');
  const testWords = ['regina', 'amat', 'bonus', 'aqua', 'terra'];
  for (const word of testWords) {
    const results = morphIndex[word.toLowerCase()];
    if (results && results.length > 0) {
      const entry = dictEntries[results[0]];
      console.log(`${word} → ${entry.dictionaryForm} (${entry.partOfSpeechDisplay}): ${entry.meaning.substring(0, 40)}...`);
    } else {
      console.log(`${word} → No match found`);
    }
  }
}

if (require.main === module) {
  processEntries();
}

module.exports = { processEntries };