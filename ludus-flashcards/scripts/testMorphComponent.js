// Test the morphological analysis functions from the component
const fs = require('fs');

// Simulate the functions from GlossaryPageSimple.js
const decodeDeclension = (declension, partOfSpeech, gender) => {
  if (!declension) return null;
  
  const analysis = {
    type: '',
    details: []
  };
  
  if (partOfSpeech === 'N') {
    // Noun declensions
    if (declension.startsWith('1')) {
      analysis.type = '1st declension';
      analysis.details.push('typically feminine');
      analysis.details.push('ends in -a');
    } else if (declension.startsWith('2')) {
      analysis.type = '2nd declension';
      if (gender === 'M' || gender === 'C') {
        analysis.details.push('masculine');
        analysis.details.push('ends in -us');
      } else if (gender === 'N') {
        analysis.details.push('neuter');
        analysis.details.push('ends in -um');
      }
    } else if (declension.startsWith('3')) {
      analysis.type = '3rd declension';
      analysis.details.push('consonant stem');
      if (gender === 'M') analysis.details.push('masculine');
      else if (gender === 'F') analysis.details.push('feminine');
      else if (gender === 'N') analysis.details.push('neuter');
    }
  } else if (partOfSpeech === 'V') {
    // Verb conjugations
    if (declension.startsWith('1')) {
      analysis.type = '1st conjugation';
      analysis.details.push('infinitive: -āre');
      if (declension.includes('DEP')) {
        analysis.details.push('deponent');
      }
    } else if (declension.startsWith('3')) {
      analysis.type = '3rd conjugation';
      analysis.details.push('infinitive: -ere');
    }
  } else if (partOfSpeech === 'ADJ') {
    if (declension === '9 9') {
      analysis.type = 'indeclinable';
      analysis.details.push('unchanging form');
    }
  }
  
  return analysis;
};

const getGrammaticalInfo = (entry) => {
  const info = [];
  
  // Part of speech
  info.push({
    label: 'Part of Speech',
    value: entry.partOfSpeechDisplay
  });
  
  // Morphological analysis
  const morphAnalysis = decodeDeclension(entry.declension, entry.partOfSpeech, entry.gender);
  if (morphAnalysis) {
    info.push({
      label: morphAnalysis.type.includes('declension') ? 'Declension' : 
             morphAnalysis.type.includes('conjugation') ? 'Conjugation' : 'Type',
      value: morphAnalysis.type
    });
    
    if (morphAnalysis.details.length > 0) {
      info.push({
        label: 'Features',
        value: morphAnalysis.details.join(', ')
      });
    }
  }
  
  // Gender (for nouns and adjectives)
  if (entry.gender && (entry.partOfSpeech === 'N' || entry.partOfSpeech === 'ADJ')) {
    const genderMap = {
      'M': 'masculine',
      'F': 'feminine', 
      'N': 'neuter',
      'C': 'common (m/f)'
    };
    if (genderMap[entry.gender]) {
      info.push({
        label: 'Gender',
        value: genderMap[entry.gender]
      });
    }
  }
  
  return info;
};

// Test entries
const testEntries = [
  {
    id: 1,
    dictionaryForm: "aqua, aquae", 
    partOfSpeech: "N",
    partOfSpeechDisplay: "Noun",
    declension: "1 1", 
    gender: "F",
    meaning: "water"
  },
  {
    id: 2,
    dictionaryForm: "amo, amare, amavi, amatum",
    partOfSpeech: "V", 
    partOfSpeechDisplay: "Verb",
    declension: "1 1",
    gender: "",
    meaning: "love, like"
  },
  {
    id: 3,
    dictionaryForm: "satis",
    partOfSpeech: "ADJ",
    partOfSpeechDisplay: "Adjective", 
    declension: "9 9",
    gender: "",
    meaning: "enough, sufficient"
  }
];

console.log('🧪 Testing morphological analysis functions...\n');

for (const entry of testEntries) {
  console.log(`=== ${entry.dictionaryForm} ===`);
  const grammarInfo = getGrammaticalInfo(entry);
  
  console.log('Grammatical Analysis:');
  for (const info of grammarInfo) {
    console.log(`  ${info.label}: ${info.value}`);
  }
  console.log(`Meaning: ${entry.meaning}`);
  console.log();
}