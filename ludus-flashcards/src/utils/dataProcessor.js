// Function to check if a card is due
export const isDue = (card) => {
  if (!card.nextReview) return true; // New cards are always due
  
  const now = new Date();
  const reviewDate = new Date(card.nextReview);
  return now >= reviewDate;
};

// Parse CSV data for a specific curriculum
const parseCSVData = (csvData, curriculum, idPrefix) => {
  const lines = csvData.trim().split('\n');
  const cards = [];
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    // More robust CSV parsing using a simple split and quote cleaning
    const values = line.split(',');
    
    // Clean up quotes and rejoin values that were split incorrectly due to commas inside quotes
    const cleanValues = [];
    let current = '';
    let inQuotedField = false;
    
    for (let j = 0; j < values.length; j++) {
      const value = values[j];
      
      if (inQuotedField) {
        current += ',' + value;
        if (value.endsWith('"')) {
          cleanValues.push(current.slice(0, -1)); // Remove ending quote
          current = '';
          inQuotedField = false;
        }
      } else if (value.startsWith('"') && !value.endsWith('"')) {
        current = value.slice(1); // Remove starting quote
        inQuotedField = true;
      } else if (value.startsWith('"') && value.endsWith('"')) {
        cleanValues.push(value.slice(1, -1)); // Remove both quotes
      } else {
        cleanValues.push(value);
      }
    }
    
    // Handle different CSV formats
    let lessonNum, headword, endings, partOfSpeech, english, requiredOrder, bookLineRef, chapter;
    
    if (curriculum === 'LUDUS') {
      // LUDUS format: lesson_number,latin_headword,latin_endings,part_of_speech,english
      if (cleanValues.length >= 5) {
        lessonNum = parseInt(cleanValues[0]) || 0;
        headword = cleanValues[1] || '';
        endings = cleanValues[2] || '';
        partOfSpeech = cleanValues[3] || '';
        english = cleanValues[4] || '';
      }
    } else if (curriculum === 'AENEID') {
      // AENEID format: Required_Order,Book_Line_Ref,Chapter,Headword,Latin_Entry,Definitions,Occurrences
      if (cleanValues.length >= 6) {
        requiredOrder = parseInt(cleanValues[0]) || 0;
        bookLineRef = cleanValues[1] || '';
        chapter = cleanValues[2] || '';
        headword = cleanValues[3] || '';
        endings = cleanValues[4] || '';
        english = cleanValues[5] || '';
        
        // For Aeneid, we'll use the chapter (like "I.1-25") as the lesson identifier
        lessonNum = requiredOrder; // Use required order for sorting within sections
        
        // Extract part of speech from English definitions if present
        partOfSpeech = '';
        if (english.includes('(adj.)')) partOfSpeech = 'adj';
        else if (english.includes('(n.)')) partOfSpeech = 'n';
        else if (english.includes('(v.)')) partOfSpeech = 'v';
        else if (english.includes('(adv.)')) partOfSpeech = 'adv';
        else if (english.includes('(conj.)')) partOfSpeech = 'conj';
        else if (english.includes('(prep.)')) partOfSpeech = 'prep';
        else if (english.includes('(pron.)')) partOfSpeech = 'pron';
        else partOfSpeech = 'misc';
      }
    } else {
      // Other curricula format: Chapter,Headword,Latin_Entry,Part_of_Speech,English
      // or lesson_number,latin_headword,latin_endings,part_of_speech,english
      if (cleanValues.length >= 5) {
        // Try to determine the format by checking first column
        const firstCol = cleanValues[0];
        if (firstCol.toLowerCase().includes('chapter') || firstCol === 'Chapter') {
          // Skip header row
          continue;
        } else if (isNaN(parseInt(firstCol))) {
          // Probably a chapter identifier like "D&I (1-199)" - keep as string for Ovid
          if (curriculum === 'OVID') {
            lessonNum = firstCol; // Keep original section name
          } else {
            lessonNum = 1; // Default to 1 for other curricula
          }
        } else {
          lessonNum = parseInt(firstCol) || 1;
        }
        
        // Determine column mapping
        if (curriculum === 'CAESAR' || curriculum === 'CICERO') {
          // Format: lesson_number,latin_headword,latin_endings,part_of_speech,english
          headword = cleanValues[1] || '';
          endings = cleanValues[2] || '';
          partOfSpeech = cleanValues[3] || '';
          english = cleanValues[4] || '';
        } else {
          // Format: Chapter,Headword,Latin_Entry,Part_of_Speech,English
          headword = cleanValues[1] || '';
          endings = cleanValues[2] || '';
          partOfSpeech = cleanValues[3] || '';
          english = cleanValues[4] || '';
        }
      }
    }
    
    // Create card if we have valid data
    if (headword && cleanValues.length >= 5) {
      const card = {
        id: `${idPrefix}-${i}`,
        curriculum: curriculum,
        lesson_number: lessonNum,
        latin_headword: headword,
        latin_endings: endings,
        part_of_speech: partOfSpeech,
        english: english,
        // SM-2 algorithm fields
        easeFactor: 2.5,
        interval: 0,
        repetitions: 0,
        nextReview: null,
        lastReviewed: null,
        // User preferences
        displayMode: 'full', // 'basic' or 'full'
        isKnown: false,
        createdAt: new Date().toISOString()
      };
      
      // Add Aeneid-specific fields
      if (curriculum === 'AENEID') {
        card.required_order = requiredOrder;
        card.book_line_ref = bookLineRef;
        card.chapter = chapter;
      }
      
      cards.push(card);
    }
  }
  
  return cards;
};

// Parse CSV data and convert to card objects from all curricula
export const parseVocabularyData = async () => {
  try {
    const allCards = [];
    
    // Define curriculum files
    const curricula = [
      { name: 'LUDUS', file: 'Ludus_Vocabulary_Final.csv', prefix: 'ludus' },
      { name: 'CAESAR', file: 'caesar_required_perfect.csv', prefix: 'caesar' },
      { name: 'CICERO', file: 'Cicero_Required_perfect.csv', prefix: 'cicero' },
      { name: 'APULEIUS', file: 'Apuleius_Required_perfect.csv', prefix: 'apuleius' },
      { name: 'OVID', file: 'Ovid_Required_perfect.csv', prefix: 'ovid' },
      { name: 'AENEID', file: 'Aeneid_Required.csv', prefix: 'aeneid' }
    ];
    
    // Load each curriculum
    for (const curriculum of curricula) {
      try {
        console.log(`📚 Loading ${curriculum.name} vocabulary...`);
        const response = await fetch(`${process.env.PUBLIC_URL}/data/${curriculum.file}`);
        
        if (response.ok) {
          const csvData = await response.text();
          const cards = parseCSVData(csvData, curriculum.name, curriculum.prefix);
          allCards.push(...cards);
          console.log(`✅ Loaded ${cards.length} ${curriculum.name} cards`);
        } else {
          console.log(`⚠️ ${curriculum.name} data not available yet (${response.status})`);
        }
      } catch (error) {
        console.log(`⚠️ ${curriculum.name} data not available yet:`, error.message);
      }
    }
    
    if (allCards.length === 0) {
      console.log('🔄 No vocabulary data found, falling back to sample data');
      return generateSampleCards();
    }
    
    console.log(`✅ Successfully loaded ${allCards.length} total vocabulary cards from ${curricula.filter(c => allCards.some(card => card.curriculum === c.name)).length} curricula`);
    return allCards;
  } catch (error) {
    console.error('❌ Error parsing vocabulary data:', error);
    console.log('🔄 Falling back to sample data');
    return generateSampleCards(); // Fallback to sample data
  }
};

// Generate sample cards for demonstration
const generateSampleCards = () => {
  const sampleData = [
    // Add some cards from different lessons for demonstration
    { lesson: 4, latin: 'aqua', endings: '-ae', pos: 'noun', english: 'water' },
    { lesson: 5, latin: 'lūna', endings: '-ae', pos: 'noun', english: 'moon' },
    { lesson: 6, latin: 'mē', endings: '', pos: 'pronoun', english: 'me' },
    { lesson: 7, latin: 'via', endings: '-ae', pos: 'noun', english: 'road, way' },
    { lesson: 8, latin: 'caelum', endings: '-ī', pos: 'noun', english: 'sky, heaven' },
    { lesson: 9, latin: 'equus', endings: '-ī', pos: 'noun', english: 'horse' },
    { lesson: 10, latin: 'aurum', endings: '-ī', pos: 'noun', english: 'gold' },
    { lesson: 11, latin: 'bellum', endings: '-ī', pos: 'noun', english: 'war' },
    { lesson: 12, latin: 'timeō', endings: 'timēre (2)', pos: 'verb', english: 'fear, be afraid of' },
    { lesson: 13, latin: 'arma', endings: '-ōrum', pos: 'noun', english: 'weapons' },
    { lesson: 20, latin: 'corpus', endings: 'corporis', pos: 'noun', english: 'body' },
    { lesson: 30, latin: 'veritas', endings: 'veritatis', pos: 'noun', english: 'truth' },
    { lesson: 40, latin: 'accipiō', endings: 'accipere (3)', pos: 'verb', english: 'receive' },
    { lesson: 50, latin: 'labor', endings: 'labōris', pos: 'noun', english: 'work, effort' },
    { lesson: 60, latin: 'legō', endings: 'legere (3)', pos: 'verb', english: 'read, choose' },
    { lesson: 64, latin: 'integer', endings: 'integra, integrum', pos: 'adjective', english: 'whole, complete' }
  ];

  return sampleData.map((item, index) => ({
    id: `ludus-sample-${index + 100}`,
    curriculum: 'LUDUS',
    lesson_number: item.lesson,
    latin_headword: item.latin,
    latin_endings: item.endings,
    part_of_speech: item.pos,
    english: item.english,
    easeFactor: 2.5,
    interval: 0,
    repetitions: 0,
    nextReview: null,
    lastReviewed: null,
    displayMode: 'full',
    isKnown: false,
    createdAt: new Date().toISOString()
  }));
};

// Group cards by lesson
export const groupCardsByLesson = (cards) => {
  const lessons = {};
  
  cards.forEach(card => {
    const lessonNum = card.lesson_number;
    if (!lessons[lessonNum]) {
      lessons[lessonNum] = [];
    }
    lessons[lessonNum].push(card);
  });
  
  return lessons;
};

// Filter cards by part of speech
export const filterCardsByPartOfSpeech = (cards, partOfSpeech) => {
  if (partOfSpeech === 'all' || !partOfSpeech) return cards;
  return cards.filter(card => card.part_of_speech === partOfSpeech);
};

// Get unique parts of speech with counts
export const getPartsOfSpeechWithCounts = (cards) => {
  const counts = {};
  
  cards.forEach(card => {
    const pos = card.part_of_speech;
    counts[pos] = (counts[pos] || 0) + 1;
  });
  
  return Object.entries(counts)
    .map(([pos, count]) => ({ label: pos, value: pos, count }))
    .sort((a, b) => b.count - a.count);
};

// Calculate lesson statistics
export const calculateLessonStats = (lessonCards) => {
  const total = lessonCards.length;
  const due = lessonCards.filter(card => isDue(card)).length;
  const known = lessonCards.filter(card => card.isKnown).length;
  const new_cards = lessonCards.filter(card => card.repetitions === 0).length;
  
  return { total, due, known, new: new_cards };
}; 