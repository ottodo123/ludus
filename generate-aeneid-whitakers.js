const fs = require('fs');
const path = require('path');

// Load Whitaker's dictionary
function loadWhitakersDict() {
  try {
    const whitakersPath = path.join(__dirname, 'ludus-flashcards', 'src', 'data', 'whitakersOptimized.json');
    const data = fs.readFileSync(whitakersPath, 'utf8');
    const parsed = JSON.parse(data);
    console.log(`📚 Loaded Whitaker's dictionary with ${parsed.entries.length} entries`);
    return parsed.entries;
  } catch (error) {
    console.error('❌ Error loading Whitaker\'s dictionary:', error.message);
    console.error('Tried path:', whitakersPath);
    return [];
  }
}

// Function to normalize Latin text (remove macrons, etc.)
function normalizeLatin(text) {
  return text.toLowerCase()
    .replace(/[āăâä]/g, 'a')
    .replace(/[ēĕêë]/g, 'e')
    .replace(/[īĭîï]/g, 'i')
    .replace(/[ōŏôö]/g, 'o')
    .replace(/[ūŭûü]/g, 'u')
    .replace(/[ȳŷÿ]/g, 'y');
}

// Function to find best match for a Latin word in Whitaker's
function findWhitakersMatch(headword, whitakersEntries) {
  const cleanHeadword = headword.toLowerCase().trim();
  
  // Skip enclitics and particles
  if (cleanHeadword.startsWith('-') || cleanHeadword.length <= 1) {
    return null;
  }
  
  // 1. Direct exact match with original text
  let exactMatch = whitakersEntries.find(entry => {
    if (entry.mainStem.toLowerCase() === cleanHeadword) return true;
    if (entry.stems.some(stem => stem.toLowerCase() === cleanHeadword)) return true;
    if (entry.dictionaryForm) {
      const dictForms = entry.dictionaryForm.toLowerCase().split(',').map(s => s.trim());
      if (dictForms.some(form => form.split(' ')[0] === cleanHeadword)) return true;
    }
    return false;
  });
  
  if (exactMatch) {
    return exactMatch;
  }
  
  // 2. Normalized match (without macrons)
  const normalizedHeadword = normalizeLatin(cleanHeadword);
  
  let normalizedMatch = whitakersEntries.find(entry => {
    const normalizedStem = normalizeLatin(entry.mainStem);
    if (normalizedStem === normalizedHeadword) return true;
    
    if (entry.stems.some(stem => normalizeLatin(stem) === normalizedHeadword)) return true;
    
    if (entry.dictionaryForm) {
      const dictForms = entry.dictionaryForm.toLowerCase().split(',').map(s => s.trim());
      if (dictForms.some(form => normalizeLatin(form.split(' ')[0]) === normalizedHeadword)) return true;
    }
    
    return false;
  });
  
  if (normalizedMatch) {
    return normalizedMatch;
  }
  
  // 3. Stem-based matches (for inflected forms)
  let stemMatch = whitakersEntries.find(entry => {
    // Check if headword starts with any stem (for inflected forms)
    return entry.stems.some(stem => {
      const normalizedStem = normalizeLatin(stem);
      return normalizedStem.length >= 3 && 
             normalizedHeadword.startsWith(normalizedStem) &&
             normalizedHeadword.length - normalizedStem.length <= 3; // Allow up to 3 char endings
    });
  });
  
  return stemMatch || null;
}

// Function to convert Whitaker's part of speech to our format
function convertPartOfSpeech(whitakersPOS) {
  const posMap = {
    'N': 'noun',
    'V': 'verb',
    'ADJ': 'adj',
    'ADV': 'adv',
    'PREP': 'prep',
    'CONJ': 'conj',
    'INTERJ': 'interj',
    'PRON': 'pron',
    'NUM': 'num',
    'PACK': 'particle'
  };
  
  return posMap[whitakersPOS] || 'misc';
}

// Function to process CSV line and extract fields
function parseCSVLine(line) {
  const fields = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      fields.push(current);
      current = '';
      continue;
    }
    current += char;
  }
  fields.push(current);
  
  return fields.map(field => field.replace(/^"|"$/g, ''));
}

// Main processing function
function generateAeneidWhitakers() {
  const inputPath = path.join(__dirname, 'Aeneid_Required.csv');
  const outputPath = path.join(__dirname, 'Aeneid_Required_whitakers.csv');
  
  try {
    console.log('🚀 Starting Aeneid Whitaker\'s conversion...');
    
    // Load Whitaker's dictionary
    const whitakersEntries = loadWhitakersDict();
    if (whitakersEntries.length === 0) {
      throw new Error('Could not load Whitaker\'s dictionary');
    }
    
    // Read original CSV
    const csvContent = fs.readFileSync(inputPath, 'utf8');
    const lines = csvContent.split('\n');
    
    console.log(`📄 Processing ${lines.length - 1} entries from Aeneid CSV...`);
    
    // Prepare output CSV with new headers
    const newHeaders = [
      'Required_Order',
      'Book_Line_Ref', 
      'Chapter',
      'Headword',
      'Latin_Entry',
      'Part_of_Speech',
      'Definitions_Whitakers',
      'Dictionary_Form',
      'Occurrences_in_Aeneid'
    ];
    
    const outputLines = [newHeaders.join(',')];
    
    let foundCount = 0;
    let notFoundCount = 0;
    const notFoundWords = [];
    
    // Process each line (skip header)
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      const fields = parseCSVLine(line);
      if (fields.length < 7) continue;
      
      const [requiredOrder, bookLineRef, chapter, headword, latinEntry, originalDef, occurrences] = fields;
      
      // Clean headword for lookup
      const cleanHeadword = headword.replace(/^"|"$/g, '');
      
      // Find in Whitaker's
      const whitakersMatch = findWhitakersMatch(cleanHeadword, whitakersEntries);
      
      let whitakersDefinition = '';
      let partOfSpeech = '';
      let dictionaryForm = '';
      
      if (whitakersMatch) {
        whitakersDefinition = whitakersMatch.meaning || '';
        partOfSpeech = convertPartOfSpeech(whitakersMatch.partOfSpeech);
        dictionaryForm = whitakersMatch.dictionaryForm || '';
        foundCount++;
      } else {
        // Fallback: try to extract from original definition
        const originalDefClean = originalDef.replace(/^"|"$/g, '');
        whitakersDefinition = `[MANUAL] ${originalDefClean.split('.')[0]}.`; // Take first sentence
        
        // Extract part of speech from original
        if (originalDefClean.includes('(adj.)')) partOfSpeech = 'adj';
        else if (originalDefClean.includes('(n.)')) partOfSpeech = 'noun';
        else if (originalDefClean.includes('(v.)')) partOfSpeech = 'verb';
        else if (originalDefClean.includes('(adv.)')) partOfSpeech = 'adv';
        else if (originalDefClean.includes('(conj.)')) partOfSpeech = 'conj';
        else if (originalDefClean.includes('(prep.)')) partOfSpeech = 'prep';
        else if (originalDefClean.includes('(pron.)')) partOfSpeech = 'pron';
        else partOfSpeech = 'misc';
        
        // Create dictionary form from headword + latin entry
        dictionaryForm = `${cleanHeadword}${latinEntry ? ', ' + latinEntry.replace(/^"|"$/g, '') : ''}`;
        
        notFoundCount++;
        notFoundWords.push(cleanHeadword);
      }
      
      // Build new CSV line
      const newLine = [
        requiredOrder,
        `"${bookLineRef}"`,
        `"${chapter}"`,
        `"${cleanHeadword}"`,
        `"${latinEntry.replace(/^"|"$/g, '')}"`,
        `"${partOfSpeech}"`,
        `"${whitakersDefinition}"`,
        `"${dictionaryForm}"`,
        occurrences
      ].join(',');
      
      outputLines.push(newLine);
    }
    
    // Write output file
    fs.writeFileSync(outputPath, outputLines.join('\n'));
    
    console.log('✅ Aeneid Whitaker\'s conversion completed!');
    console.log(`📁 Output: ${outputPath}`);
    console.log(`📊 Statistics:`);
    console.log(`   ✅ Found in Whitaker's: ${foundCount}`);
    console.log(`   ❓ Not found (manual): ${notFoundCount}`);
    console.log(`   📈 Total processed: ${foundCount + notFoundCount}`);
    console.log(`   🎯 Whitaker's coverage: ${Math.round((foundCount / (foundCount + notFoundCount)) * 100)}%`);
    
    if (notFoundWords.length > 0) {
      console.log(`\n📝 Words not found in Whitaker's (first 10):`);
      notFoundWords.slice(0, 10).forEach((word, index) => {
        console.log(`   ${index + 1}. ${word}`);
      });
      if (notFoundWords.length > 10) {
        console.log(`   ... and ${notFoundWords.length - 10} more`);
      }
    }
    
  } catch (error) {
    console.error('❌ Error processing Aeneid CSV:', error.message);
  }
}

// Run the conversion
generateAeneidWhitakers();