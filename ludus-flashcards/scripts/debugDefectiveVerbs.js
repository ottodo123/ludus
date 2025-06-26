const fs = require('fs');
const path = require('path');

// Test the filtering logic for defective verbs
function isValidEntry(stemArray, meaning) {
  // Filter out meanings that look like test data
  if (meaning.includes('zzz') || meaning.includes('xxx') || meaning.includes('test')) {
    return false;
  }
  
  // Count zzz/xxx stems - if ALL stems are zzz/xxx, it's test data
  let zzzCount = 0;
  let validStems = 0;
  
  for (const stem of stemArray) {
    if (stem === 'zzz' || stem === 'xxx' || stem === 'ZZZ' || stem === 'XXX') {
      zzzCount++;
    } else if (/^[a-zA-Z]+$/.test(stem) && stem.length <= 20) {
      validStems++;
    } else {
      // Filter out entries with non-Latin characters or numbers in valid stems
      return false;
    }
  }
  
  // Only reject if ALL stems are zzz/xxx (obvious test data)
  // Allow entries with some zzz stems (defective verbs with missing principal parts)
  if (zzzCount > 0 && validStems === 0) {
    return false;
  }
  
  return true;
}

console.log('🔍 Testing defective verb filtering...\n');

// Test aio entry
const aioEntry = {
  stems: ['ai', 'a', 'zzz', 'zzz'],
  meaning: 'say (defective), assert; say yes/so, affirm, assent; prescribe/lay down (law)',
  declension: '7 1 X'
};

console.log('=== Testing aio entry ===');
console.log('Stems:', aioEntry.stems);
console.log('Meaning:', aioEntry.meaning);
console.log('Declension:', aioEntry.declension);
console.log('isValidEntry result:', isValidEntry(aioEntry.stems, aioEntry.meaning));
console.log();

// Test memini entry
const meminiEntry = {
  stems: ['zzz', 'zzz', 'memin', 'zzz'],
  meaning: 'remember (PERF form, PRES force); keep in mind, pay heed to; be sure; recall',
  declension: '2 1 PERFDEF'
};

console.log('=== Testing memini entry ===');
console.log('Stems:', meminiEntry.stems);
console.log('Meaning:', meminiEntry.meaning);
console.log('Declension:', meminiEntry.declension);
console.log('isValidEntry result:', isValidEntry(meminiEntry.stems, meminiEntry.meaning));
console.log();

// Count stems analysis
function analyzeStemCounts(stems) {
  let zzzCount = 0;
  let validStems = 0;
  
  for (const stem of stems) {
    if (stem === 'zzz' || stem === 'xxx' || stem === 'ZZZ' || stem === 'XXX') {
      zzzCount++;
    } else if (/^[a-zA-Z]+$/.test(stem) && stem.length <= 20) {
      validStems++;
    }
  }
  
  return { zzzCount, validStems };
}

console.log('=== Stem analysis ===');
console.log('aio stems analysis:', analyzeStemCounts(aioEntry.stems));
console.log('memini stems analysis:', analyzeStemCounts(meminiEntry.stems));
console.log();

console.log('=== Conclusion ===');
console.log('Both entries should be valid because they have at least one valid stem.');
console.log('If they\'re still missing, the issue is in inflection generation, not filtering.');