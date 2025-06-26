#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Creates a tiny morphological index for testing - just the most common words
 */

const INPUT_FILE = path.join(__dirname, '../../whitakers-words-master/DICTLINE.GEN');
const OUTPUT_FILE = path.join(__dirname, '../src/data/whitakersTiny.json');

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

// Only the most essential Latin words
const ESSENTIAL_WORDS = [
  'a', 'ab', 'ad', 'et', 'in', 'ex', 'de', 'cum', 'per', 'sub', 'super', 'inter',
  'amo', 'habeo', 'video', 'facio', 'dico', 'venio', 'do', 'sto', 'mitto', 'capio',
  'aqua', 'terra', 'vir', 'femina', 'puella', 'puer', 'dominus', 'servus', 'liber',
  'bonus', 'malus', 'magnus', 'parvus', 'altus', 'novus', 'longus', 'brevis',
  'ego', 'tu', 'is', 'hic', 'ille', 'qui', 'quis', 'quid',
  'unus', 'duo', 'tres', 'quattuor', 'quinque', 'sex', 'septem', 'octo', 'novem', 'decem'
];

function isValidEntry(stemArray, meaning) {
  // Filter out obviously fake/test entries
  for (const stem of stemArray) {
    if (stem.includes('zzz') || stem.includes('xxx') || stem.includes('ZZZ') || stem.includes('XXX')) {
      return false;
    }
    
    // Filter out entries with non-Latin characters or numbers
    if (!/^[a-zA-Z]+$/.test(stem) || stem.length > 20) {
      return false;
    }
  }
  
  // Filter out meanings that look like test data
  if (meaning.includes('zzz') || meaning.includes('xxx') || meaning.includes('test')) {
    return false;
  }
  
  return true;
}

function createDictionaryForm(entry) {
  const { stems, partOfSpeech, declension, gender } = entry;
  
  if (partOfSpeech === 'N') {
    if (declension.startsWith('1')) {
      // First declension: stem + a, stem + ae
      return `${stems[0]}a, ${stems[0]}ae`;
    } else if (declension.startsWith('2')) {
      // Second declension
      if (gender === 'M' || gender === 'C') {
        return `${stems[0]}us, ${stems[0]}i`;
      } else if (gender === 'N') {
        return `${stems[0]}um, ${stems[0]}i`;
      } else {
        return `${stems[0]}us, ${stems[0]}i`;
      }
    } else if (declension.startsWith('3')) {
      // Third declension: use nominative if available, otherwise construct
      if (stems.length > 1 && stems[1] !== stems[0]) {
        return `${stems[1]}, ${stems[0]}is`;
      } else {
        // Try to guess nominative from stem
        const stem = stems[0];
        if (stem.endsWith('n')) {
          return `${stem.slice(0, -1)}x, ${stem}is`;
        } else if (stem.endsWith('r')) {
          return `${stem}, ${stem}is`;
        } else {
          return `${stem}s, ${stem}is`;
        }
      }
    } else if (declension.startsWith('4')) {
      // Fourth declension
      if (gender === 'M' || gender === 'C') {
        return `${stems[0]}us, ${stems[0]}us`;
      } else {
        return `${stems[0]}u, ${stems[0]}us`;
      }
    } else if (declension.startsWith('5')) {
      // Fifth declension
      return `${stems[0]}es, ${stems[0]}ei`;
    } else {
      return stems.join(', ');
    }
  } else if (partOfSpeech === 'V') {
    if (stems.length >= 4) {
      // All four principal parts available: [present stem, present stem, perfect stem, participle stem]
      const presentStem = stems[0];
      const perfectStem = stems[2];
      const participleStem = stems[3];
      
      // For first conjugation (ends in 'a'): amo, amare, amavi, amatum
      if (declension.startsWith('1')) {
        return `${presentStem}o, ${presentStem}are, ${perfectStem}i, ${participleStem}um`;
      }
      // For other conjugations, try to determine the infinitive
      else if (declension.startsWith('2')) {
        return `${presentStem}eo, ${presentStem}ere, ${perfectStem}i, ${participleStem}um`;
      }
      else if (declension.startsWith('3')) {
        return `${presentStem}o, ${presentStem}ere, ${perfectStem}i, ${participleStem}um`;
      }
      else if (declension.startsWith('4')) {
        return `${presentStem}io, ${presentStem}ire, ${perfectStem}i, ${participleStem}um`;
      }
      else {
        // Default: assume first conjugation pattern
        return `${presentStem}o, ${presentStem}are, ${perfectStem}i, ${participleStem}um`;
      }
    } else if (stems.length >= 2) {
      // Try to construct from available stems
      const stem1 = stems[0];
      const stem2 = stems[1];
      if (declension.startsWith('1')) {
        return `${stem1}o, ${stem1}are, ${stem1}avi, ${stem1}atum`;
      } else {
        return `${stem1}o, ${stem1}ere, ${stem1}i, ${stem1}um`;
      }
    } else {
      // Single stem - guess conjugation
      const stem = stems[0];
      if (declension.startsWith('1')) {
        return `${stem}o, ${stem}are, ${stem}avi, ${stem}atum`;
      } else {
        return `${stem}o, ${stem}ere, ${stem}i, ${stem}um`;
      }
    }
  } else if (partOfSpeech === 'ADJ') {
    if (declension.includes('1') && declension.includes('2')) {
      // First/second declension adjectives
      return `${stems[0]}us, ${stems[0]}a, ${stems[0]}um`;
    } else if (declension.startsWith('3')) {
      // Third declension adjectives
      if (stems.length > 1) {
        return `${stems[1]}, ${stems[0]}is`;
      } else {
        return `${stems[0]}, ${stems[0]}is`;
      }
    } else {
      return stems.join(', ');
    }
  } else {
    // Other parts of speech - just return the first stem
    return stems[0];
  }
}

function generateBasicInflections(entry) {
  const { stems, partOfSpeech, declension } = entry;
  const forms = new Set(stems);
  const mainStem = stems[0];
  
  if (partOfSpeech === 'N') {
    if (declension.startsWith('1')) {
      forms.add(mainStem + 'a');
      forms.add(mainStem + 'ae');
      forms.add(mainStem + 'am');
      forms.add(mainStem + 'as');
    } else if (declension.startsWith('2')) {
      forms.add(mainStem + 'us');
      forms.add(mainStem + 'um');
      forms.add(mainStem + 'i');
      forms.add(mainStem + 'o');
      forms.add(mainStem + 'os');
    }
  } else if (partOfSpeech === 'V') {
    forms.add(mainStem + 'o');
    forms.add(mainStem + 's');
    forms.add(mainStem + 't');
    forms.add(mainStem + 'nt');
    forms.add(mainStem + 're');
    forms.add(mainStem + 'ere');
  } else if (partOfSpeech === 'ADJ') {
    forms.add(mainStem + 'us');
    forms.add(mainStem + 'a');
    forms.add(mainStem + 'um');
    forms.add(mainStem + 'i');
  }
  
  return Array.from(forms);
}

function processTiny() {
  console.log('🔄 Creating tiny morphological index for testing...');
  
  if (!fs.existsSync(INPUT_FILE)) {
    console.error(`❌ Dictionary file not found: ${INPUT_FILE}`);
    process.exit(1);
  }
  
  const rawData = fs.readFileSync(INPUT_FILE, 'utf8');
  const lines = rawData.split('\n');
  
  const morphIndex = {};
  const dictEntries = [];
  let processed = 0;
  let included = 0;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line || line.length < 110) continue;
    
    const stems = line.substring(0, 75).trim();
    const posInfo = line.substring(76, 100).trim();
    const meaning = line.substring(110).trim();
    
    if (!stems || !meaning) continue;
    
    const stemArray = stems.split(/\s+/).filter(s => s.length > 0);
    const posParts = posInfo.split(/\s+/).filter(s => s.length > 0);
    const partOfSpeech = posParts[0] || '';
    
    // Filter out invalid entries first
    if (!isValidEntry(stemArray, meaning)) {
      processed++;
      continue;
    }
    
    // Only include essential words
    if (!ESSENTIAL_WORDS.some(word => stemArray[0].toLowerCase().startsWith(word.toLowerCase()))) {
      processed++;
      continue;
    }
    
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
    
    let cleanMeaning = meaning
      .replace(/\|/g, '; ')
      .replace(/\s+/g, ' ')
      .trim()
      .replace(/^[;\s]+/, '')
      .replace(/[;\s]+$/, '');
    
    const entry = {
      id: included,
      stems: stemArray,
      mainStem: stemArray[0],
      partOfSpeech: partOfSpeech,
      partOfSpeechDisplay: posDisplay,
      declension: declension,
      gender: gender,
      meaning: cleanMeaning,
      dictionaryForm: ''
    };
    
    entry.dictionaryForm = createDictionaryForm(entry);
    dictEntries.push(entry);
    
    // Generate inflections and add to index
    const inflectedForms = generateBasicInflections(entry);
    
    for (const form of inflectedForms) {
      const normalizedForm = form.toLowerCase();
      if (!morphIndex[normalizedForm]) {
        morphIndex[normalizedForm] = [];
      }
      morphIndex[normalizedForm].push(included);
    }
    
    included++;
    processed++;
  }
  
  console.log(`✅ Created tiny index with ${included} entries`);
  console.log(`📊 Index covers ${Object.keys(morphIndex).length} word forms`);
  console.log(`🎯 Filtered from ${processed} total entries`);
  
  const outputData = {
    metadata: {
      source: 'Whitaker\'s Words Tiny Test Index',
      processed: new Date().toISOString(),
      totalEntries: included,
      totalForms: Object.keys(morphIndex).length,
      version: '1.0.0-tiny'
    },
    entries: dictEntries,
    morphIndex: morphIndex
  };
  
  const outputDir = path.dirname(OUTPUT_FILE);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(outputData, null, 2));
  console.log(`💾 Saved tiny index to: ${OUTPUT_FILE}`);
  
  // Test lookups
  console.log('\n🔍 Testing tiny lookups:');
  const testWords = ['amo', 'aqua', 'bonus', 'terra', 'vir'];
  for (const word of testWords) {
    const results = morphIndex[word.toLowerCase()];
    if (results && results.length > 0) {
      const entry = dictEntries[results[0]];
      console.log(`${word} → ${entry.dictionaryForm} (${entry.partOfSpeechDisplay})`);
    } else {
      console.log(`${word} → Not found`);
    }
  }
}

if (require.main === module) {
  processTiny();
}