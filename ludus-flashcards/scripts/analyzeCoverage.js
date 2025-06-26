#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const DICTLINE_FILE = path.join(__dirname, '../../whitakers-words-master/DICTLINE.GEN');

// Copy the exact filtering functions from our script
function isValidEntry(stemArray, meaning) {
  for (const stem of stemArray) {
    if (stem.includes('zzz') || stem.includes('xxx') || stem.includes('ZZZ') || stem.includes('XXX')) {
      return false;
    }
    if (!/^[a-zA-Z]+$/.test(stem) || stem.length > 20) {
      return false;
    }
  }
  if (meaning.includes('zzz') || meaning.includes('xxx') || meaning.includes('test')) {
    return false;
  }
  return true;
}

function isHighPriorityWord(stem, meaning) {
  const PRIORITY_PATTERNS = [
    /^(am|hab|vid|fac|dic|ven|da|sta|mitt|cap|duc|fer|ag|leg|scrib|curr|clam|laud|mon|put|ten|port|mov|sent|spect|aud|voc|ced|cred|fall|tim|vol|nol|mal|pos|sci|cogn|intelleg|memor|obl|viv|mor|nasc|cre|de|iac|rog|quaer|pet|orn|par|iub|vetu|sine|perm|prob|neg|aff|confirm)/,
    /^(aqu|terr|vir|feminn|puell|puer|domin|serv|liber|bell|pax|urb|domus|temp|ann|dies|nox|vita|mort|corp|caput|man|ped|ocul|aur|or|dent|coll|brachi|reg|rex|princep|civis|popul|patr|matr|fil|fili|frat|sor|ux|marit|ami|host|de|angel|loc|via|iter|camp|mont|vall|fluvi|mar|cael|sol|lun|stell|igni|aer|vent|pluvii|niv|glaci|arb|flor|fruct|anim|equ|bov|can|fel|av|pisc)/,
    /^(bon|mal|magn|parv|alt|nov|veter|pulchr|long|brev|lat|angust|mult|pauc|prim|ultim|medi|fort|deb|san|aegr|sap|stult|dives|pauper|nobil|humil|liber|serv|sacr|profan|viv|mortu|alb|nigr|rub|virid|flav|celer|tard|facil|difficil|dul|amar|cal|frig|sicc|humid|plan|acut|rect|curv|den|rar)/,
    /^(ego|tu|nos|vos|hic|haec|hoc|ille|illa|illud|ipse|ipsa|ipsum|qui|quae|quod|quis|quid|aliqui|nullus|omn|tot|tant|quot|quant|uter|neuter|alter|ali|ceteri|reliq)/,
    /^(un|du|tre|quattu|quin|sex|septe|octo|nove|dece|undece|duodece|tredece|quattuordece|quindece|sedece|septendece|duodevigint|undevigint|vigint|trigint|quadragint|quinquagint|sexagint|septuagint|octogint|nonagint|cent|mill)/,
    /^(ad|ab|ex|de|in|cum|sine|per|sub|super|inter|ante|post|circum|contra|prop|secund|et|que|sed|autem|enim|nam|igitur|ergo|itaque|tamen|quamquam|cum|si|nisi|ut|ne|an|vel|aut)/
  ];
  
  if (PRIORITY_PATTERNS.some(pattern => pattern.test(stem.toLowerCase()))) {
    return true;
  }
  
  const commonMeanings = ['love', 'have', 'see', 'make', 'say', 'come', 'give', 'go', 'water', 'earth', 'man', 'woman', 'good', 'bad', 'big', 'small'];
  return commonMeanings.some(word => meaning.toLowerCase().includes(word));
}

// Test specific common Latin words
const COMMON_LATIN_WORDS = [
  'sum', 'es', 'est', 'sumus', 'estis', 'sunt', // esse (to be)
  'fero', 'fers', 'fert', 'ferimus', 'fertis', 'ferunt', // ferre (to carry)
  'eo', 'is', 'it', 'imus', 'itis', 'eunt', // ire (to go)
  'volo', 'vis', 'vult', 'volumus', 'vultis', 'volunt', // velle (to want)
  'nolo', 'non', 'vis', 'non', 'vult', 'nolumus', 'non', 'vultis', 'nolunt', // nolle (to not want)
  'possum', 'potes', 'potest', 'possumus', 'potestis', 'possunt', // posse (can)
  'do', 'das', 'dat', 'damus', 'datis', 'dant', // dare (to give)
  'fio', 'fis', 'fit', 'fimus', 'fitis', 'fiunt', // fieri (to become)
  'inquam', 'inquis', 'inquit', // inquam (I say)
  'audio', 'audis', 'audit', 'audimus', 'auditis', 'audiunt', // audire (to hear)
  'venio', 'venis', 'venit', 'venimus', 'venitis', 'veniunt', // venire (to come)
  'video', 'vides', 'videt', 'videmus', 'videtis', 'vident', // videre (to see)
  'dico', 'dicis', 'dicit', 'dicimus', 'dicitis', 'dicunt', // dicere (to say)
  'facio', 'facis', 'facit', 'facimus', 'facitis', 'faciunt', // facere (to make)
  'capio', 'capis', 'capit', 'capimus', 'capitis', 'capiunt', // capere (to take)
];

console.log('📊 Analyzing Whitaker\'s Words filtering...');

const rawData = fs.readFileSync(DICTLINE_FILE, 'utf8');
const lines = rawData.split('\n');

let totalLines = 0;
let validLines = 0;
let invalidReasons = {
  'zzz/xxx stems': 0,
  'non-Latin characters': 0,
  'too long stems': 0,
  'test meanings': 0,
  'short lines': 0
};
let filteredByPriority = 0;
let included = 0;

const sampleFiltered = [];
const sampleIncluded = [];
const importantMissing = [];

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  totalLines++;
  
  if (!line || line.length < 110) {
    invalidReasons['short lines']++;
    continue;
  }
  
  const stems = line.substring(0, 75).trim();
  const posInfo = line.substring(76, 100).trim();
  const meaning = line.substring(110).trim();
  
  if (!stems || !meaning) continue;
  
  const stemArray = stems.split(/\s+/).filter(s => s.length > 0);
  const posParts = posInfo.split(/\s+/).filter(s => s.length > 0);
  const partOfSpeech = posParts[0] || '';
  
  // Check validity
  let isValid = true;
  let reason = '';
  
  for (const stem of stemArray) {
    if (stem.includes('zzz') || stem.includes('xxx') || stem.includes('ZZZ') || stem.includes('XXX')) {
      isValid = false;
      reason = 'zzz/xxx stems';
      break;
    }
    if (!/^[a-zA-Z]+$/.test(stem)) {
      isValid = false;
      reason = 'non-Latin characters';
      break;
    }
    if (stem.length > 20) {
      isValid = false;
      reason = 'too long stems';
      break;
    }
  }
  
  if (meaning.includes('zzz') || meaning.includes('xxx') || meaning.includes('test')) {
    isValid = false;
    reason = 'test meanings';
  }
  
  if (!isValid) {
    invalidReasons[reason]++;
    if (sampleFiltered.length < 5) {
      sampleFiltered.push({line: i+1, stems, meaning: meaning.substring(0, 50), reason});
    }
    
    // Check if we're filtering out important words
    const hasImportantWord = stemArray.some(stem => 
      COMMON_LATIN_WORDS.includes(stem) || 
      meaning.toLowerCase().includes(' be ') ||
      meaning.toLowerCase().includes(' go ') ||
      meaning.toLowerCase().includes(' want ') ||
      meaning.toLowerCase().includes(' can ')
    );
    if (hasImportantWord && importantMissing.length < 10) {
      importantMissing.push({line: i+1, stems, meaning: meaning.substring(0, 80), reason});
    }
    continue;
  }
  
  validLines++;
  
  // Check priority
  if (!isHighPriorityWord(stemArray[0], meaning)) {
    filteredByPriority++;
    
    // Check if we're filtering out important words
    const hasImportantWord = stemArray.some(stem => COMMON_LATIN_WORDS.includes(stem));
    if (hasImportantWord && importantMissing.length < 10) {
      importantMissing.push({line: i+1, stems, meaning: meaning.substring(0, 80), reason: 'low priority'});
    }
    
    if (sampleFiltered.length < 10) {
      sampleFiltered.push({line: i+1, stems, meaning: meaning.substring(0, 50), reason: 'low priority'});
    }
    continue;
  }
  
  included++;
  if (sampleIncluded.length < 5) {
    sampleIncluded.push({line: i+1, stems, meaning: meaning.substring(0, 50)});
  }
}

console.log('\n📈 Statistics:');
console.log('Total lines:', totalLines);
console.log('Valid entries:', validLines);
console.log('Included entries:', included);
console.log('Filtered by priority:', filteredByPriority);
console.log('Coverage percentage:', ((included / totalLines) * 100).toFixed(1) + '%');
console.log('');
console.log('🚫 Invalid reasons:');
Object.entries(invalidReasons).forEach(([reason, count]) => {
  console.log('  ', reason + ':', count);
});

console.log('\n⚠️  Important words we might be missing:');
importantMissing.forEach(entry => {
  console.log('  Line', entry.line + ':', entry.stems, '→', entry.meaning, '(', entry.reason, ')');
});

console.log('\n🔍 Sample filtered entries:');
sampleFiltered.slice(0, 5).forEach(entry => {
  console.log('  Line', entry.line + ':', entry.stems, '→', entry.meaning, '(', entry.reason, ')');
});

console.log('\n✅ Sample included entries:');
sampleIncluded.forEach(entry => {
  console.log('  Line', entry.line + ':', entry.stems, '→', entry.meaning);
});