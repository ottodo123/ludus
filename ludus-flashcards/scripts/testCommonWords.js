#!/usr/bin/env node

// Test if common Latin words are in our dictionary
const fs = require('fs');
const path = require('path');

const WHITAKERS_FILE = path.join(__dirname, '../src/data/whitakersOptimized.json');

// Essential Latin words that students would expect to find
const ESSENTIAL_WORDS = [
  // Essential verbs
  'sum', 'es', 'est', 'sumus', 'estis', 'sunt', // esse (to be)
  'fero', 'fers', 'fert', 'ferimus', 'fertis', 'ferunt', // ferre (to carry)
  'eo', 'is', 'it', 'imus', 'itis', 'eunt', // ire (to go)
  'volo', 'vis', 'vult', 'volumus', 'vultis', 'volunt', // velle (to want)
  'nolo', 'non', 'nolle', // nolle (to not want)
  'possum', 'potes', 'potest', 'possumus', 'potestis', 'possunt', // posse (can)
  'do', 'das', 'dat', 'damus', 'datis', 'dant', // dare (to give)
  'fio', 'fis', 'fit', 'fimus', 'fitis', 'fiunt', // fieri (to become)
  'inquam', 'inquis', 'inquit', // inquam (I say)
  
  // Common regular verbs
  'amo', 'amas', 'amat', 'amamus', 'amatis', 'amant', // amare (to love)
  'habeo', 'habes', 'habet', 'habemus', 'habetis', 'habent', // habere (to have)
  'video', 'vides', 'videt', 'videmus', 'videtis', 'vident', // videre (to see)
  'dico', 'dicis', 'dicit', 'dicimus', 'dicitis', 'dicunt', // dicere (to say)
  'facio', 'facis', 'facit', 'facimus', 'facitis', 'faciunt', // facere (to make)
  'capio', 'capis', 'capit', 'capimus', 'capitis', 'capiunt', // capere (to take)
  'audio', 'audis', 'audit', 'audimus', 'auditis', 'audiunt', // audire (to hear)
  'venio', 'venis', 'venit', 'venimus', 'venitis', 'veniunt', // venire (to come)
  
  // Common nouns
  'rosa', 'rosae', 'rosam', 'rosarum', 'rosis', // rosa (rose)
  'puella', 'puellae', 'puellam', 'puellarum', 'puellis', // puella (girl)
  'dominus', 'domini', 'dominum', 'dominorum', 'dominis', // dominus (master)
  'bellum', 'belli', 'bella', 'bellorum', // bellum (war)
  'rex', 'regis', 'regem', 'reges', 'regum', 'regibus', // rex (king)
  'homo', 'hominis', 'hominem', 'homines', 'hominum', 'hominibus', // homo (man)
  'corpus', 'corporis', 'corpore', 'corpora', 'corporum', 'corporibus', // corpus (body)
  'tempus', 'temporis', 'tempore', 'tempora', 'temporum', 'temporibus', // tempus (time)
  
  // Common adjectives
  'bonus', 'bona', 'bonum', 'boni', 'bonae', 'bonis', // bonus (good)
  'magnus', 'magna', 'magnum', 'magni', 'magnae', 'magnis', // magnus (big)
  'parvus', 'parva', 'parvum', 'parvi', 'parvae', 'parvis', // parvus (small)
  'longus', 'longa', 'longum', 'longi', 'longae', 'longis', // longus (long)
  'fortis', 'forte', 'fortes', 'fortium', 'fortibus', // fortis (strong)
  
  // Pronouns and common words
  'ego', 'mei', 'mihi', 'me', // ego (I)
  'tu', 'tui', 'tibi', 'te', // tu (you)
  'hic', 'haec', 'hoc', 'huius', 'huic', 'hunc', 'hanc', // hic (this)
  'ille', 'illa', 'illud', 'illius', 'illi', 'illum', 'illam', // ille (that)
  'qui', 'quae', 'quod', 'cuius', 'cui', 'quem', 'quam', // qui (who/which)
  
  // Prepositions and particles
  'in', 'ad', 'ex', 'de', 'cum', 'sine', 'per', 'sub', 'super',
  'et', 'sed', 'aut', 'vel', 'enim', 'autem', 'igitur', 'ergo',
  'si', 'nisi', 'ut', 'ne', 'quod', 'quia', 'quando',
  
  // Numbers
  'unus', 'una', 'unum', 'duo', 'duae', 'tres', 'tria',
  'quattuor', 'quinque', 'sex', 'septem', 'octo', 'novem', 'decem',
  
  // Common adverbs
  'bene', 'male', 'saepe', 'semper', 'numquam', 'iam', 'adhuc',
  'hic', 'ibi', 'ubi', 'unde', 'quo', 'huc', 'illuc',
  'hodie', 'heri', 'cras', 'mox', 'iam', 'tunc', 'tum', 'nunc'
];

console.log('🔍 Testing essential Latin words in our dictionary...');

try {
  const data = JSON.parse(fs.readFileSync(WHITAKERS_FILE, 'utf8'));
  const morphIndex = data.morphIndex;
  
  let found = 0;
  let missing = 0;
  const missingWords = [];
  const foundSample = [];
  
  for (const word of ESSENTIAL_WORDS) {
    if (morphIndex[word]) {
      found++;
      if (foundSample.length < 5) {
        const entry = data.entries[morphIndex[word][0]];
        foundSample.push({
          word,
          form: entry.dictionaryForm,
          pos: entry.partOfSpeechDisplay,
          meaning: entry.meaning.substring(0, 40) + '...'
        });
      }
    } else {
      missing++;
      missingWords.push(word);
    }
  }
  
  console.log('\\n📊 Results:');
  console.log('Essential words tested:', ESSENTIAL_WORDS.length);
  console.log('Found:', found);
  console.log('Missing:', missing);
  console.log('Coverage:', ((found / ESSENTIAL_WORDS.length) * 100).toFixed(1) + '%');
  
  console.log('\\n❌ Missing essential words:');
  missingWords.slice(0, 50).forEach(word => console.log('  ', word));
  if (missingWords.length > 50) {
    console.log('  ... and', missingWords.length - 50, 'more');
  }
  
  console.log('\\n✅ Sample found words:');
  foundSample.forEach(entry => {
    console.log('  ', entry.word, '→', entry.form, '(' + entry.pos + ')', entry.meaning);
  });
  
  // Test specific high-frequency missing verbs
  console.log('\\n🔍 Testing specific important verbs:');
  const importantVerbs = ['sum', 'fero', 'eo', 'volo', 'possum', 'inquam', 'fio'];
  importantVerbs.forEach(verb => {
    if (morphIndex[verb]) {
      const entry = data.entries[morphIndex[verb][0]];
      console.log('  ✅', verb, '→', entry.dictionaryForm, '(' + entry.partOfSpeechDisplay + ')');
    } else {
      console.log('  ❌', verb, '→ NOT FOUND');
    }
  });
  
} catch (error) {
  console.error('Error reading dictionary:', error.message);
}