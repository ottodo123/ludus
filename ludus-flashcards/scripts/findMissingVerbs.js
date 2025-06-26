#!/usr/bin/env node

// Search for specific missing irregular verbs in the original dictionary
const fs = require('fs');
const path = require('path');

const DICTLINE_FILE = path.join(__dirname, '../../whitakers-words-master/DICTLINE.GEN');

const MISSING_VERBS = [
  { search: ['possum', 'potes', 'potest', 'possim'], meaning: 'can', english: 'be able' },
  { search: ['inquam', 'inquis', 'inquit'], meaning: 'I say', english: 'say' },
  { search: ['fio', 'fis', 'fit', 'fieri'], meaning: 'become', english: 'become' },
  { search: ['sum', 'es', 'est', 'esse'], meaning: 'I am', english: 'be' },
  { search: ['eo', 'is', 'it', 'ire'], meaning: 'I go', english: 'go' },
  { search: ['fero', 'fers', 'fert', 'ferre'], meaning: 'I carry', english: 'carry' },
  { search: ['volo', 'vis', 'vult', 'velle'], meaning: 'I want', english: 'want' },
  { search: ['nolo', 'non', 'vult', 'nolle'], meaning: 'I do not want', english: 'not want' }
];

console.log('🔍 Searching for missing irregular verbs...');

const rawData = fs.readFileSync(DICTLINE_FILE, 'utf8');
const lines = rawData.split('\n');

const found = {};
const possibleMatches = {};

// Initialize tracking
MISSING_VERBS.forEach(verb => {
  found[verb.meaning] = [];
  possibleMatches[verb.meaning] = [];
});

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  if (!line || line.length < 110) continue;
  
  const stems = line.substring(0, 75).trim();
  const posInfo = line.substring(76, 100).trim();
  const meaning = line.substring(110).trim();
  
  const stemArray = stems.split(/\s+/).filter(s => s.length > 0);
  const lowerMeaning = meaning.toLowerCase();
  
  // Check each missing verb
  MISSING_VERBS.forEach(verb => {
    // Direct stem matches
    const hasDirectMatch = verb.search.some(searchTerm => 
      stemArray.some(stem => stem.toLowerCase() === searchTerm.toLowerCase())
    );
    
    // Meaning matches
    const hasMeaningMatch = verb.english && lowerMeaning.includes(verb.english.toLowerCase());
    
    if (hasDirectMatch) {
      found[verb.meaning].push({
        line: i + 1,
        stems: stemArray,
        pos: posInfo,
        meaning: meaning.substring(0, 80),
        type: 'direct stem match'
      });
    } else if (hasMeaningMatch && stemArray.length > 0) {
      // Check if stem is close to what we're looking for
      const closeMatch = verb.search.some(searchTerm => {
        return stemArray.some(stem => {
          const stemLower = stem.toLowerCase();
          const searchLower = searchTerm.toLowerCase();
          return stemLower.includes(searchLower.substring(0, 3)) || 
                 searchLower.includes(stemLower.substring(0, 3));
        });
      });
      
      if (closeMatch) {
        possibleMatches[verb.meaning].push({
          line: i + 1,
          stems: stemArray,
          pos: posInfo,
          meaning: meaning.substring(0, 80),
          type: 'meaning + partial stem match'
        });
      }
    }
  });
}

console.log('\\n📊 Results:');
MISSING_VERBS.forEach(verb => {
  console.log('\\n🔍 Searching for:', verb.meaning, '(' + verb.english + ')');
  
  if (found[verb.meaning].length > 0) {
    console.log('  ✅ Direct matches found:', found[verb.meaning].length);
    found[verb.meaning].slice(0, 3).forEach(match => {
      console.log('    Line', match.line + ':', match.stems.join(' '), '|', match.pos, '|', match.meaning);
    });
  } else {
    console.log('  ❌ No direct matches found');
  }
  
  if (possibleMatches[verb.meaning].length > 0) {
    console.log('  🔍 Possible matches:', possibleMatches[verb.meaning].length);
    possibleMatches[verb.meaning].slice(0, 2).forEach(match => {
      console.log('    Line', match.line + ':', match.stems.join(' '), '|', match.pos, '|', match.meaning);
    });
  }
});

// Special search for forms that might be filtered
console.log('\\n🚫 Checking if important verbs are being filtered...');
const filteredImportant = [];

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  if (!line || line.length < 110) continue;
  
  const stems = line.substring(0, 75).trim();
  const meaning = line.substring(110).trim();
  const stemArray = stems.split(/\s+/).filter(s => s.length > 0);
  
  // Check if it contains zzz but has important meanings
  const hasZzz = stemArray.some(stem => stem.includes('zzz') || stem.includes('xxx'));
  const hasImportantMeaning = meaning.toLowerCase().includes(' be ') || 
                              meaning.toLowerCase().includes(' can ') ||
                              meaning.toLowerCase().includes(' say ') ||
                              meaning.toLowerCase().includes(' go ') ||
                              meaning.toLowerCase().includes(' want ') ||
                              meaning.toLowerCase().includes(' become ');
  
  if (hasZzz && hasImportantMeaning && filteredImportant.length < 10) {
    filteredImportant.push({
      line: i + 1,
      stems: stemArray,
      meaning: meaning.substring(0, 80)
    });
  }
}

if (filteredImportant.length > 0) {
  console.log('\\n⚠️  Important verbs being filtered due to zzz:');
  filteredImportant.forEach(entry => {
    console.log('  Line', entry.line + ':', entry.stems.join(' '), '→', entry.meaning);
  });
}