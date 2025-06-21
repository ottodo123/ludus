// Function to check if a card is due
export const isDue = (card) => {
  if (!card.nextReview) return true; // New cards are always due
  
  const now = new Date();
  const reviewDate = new Date(card.nextReview);
  return now >= reviewDate;
};

// Parse CSV data and convert to card objects  
export const parseVocabularyData = async () => {
  try {
    // Load CSV data from the public folder (works for both localhost and GitHub Pages)
    const response = await fetch(`${process.env.PUBLIC_URL}/data/Ludus_Vocabulary_Final.csv`);
    const csvData = await response.text();
    
    const lines = csvData.trim().split('\n');
    // Skip headers and process the data
    
    console.log(`📚 Loading vocabulary data: ${lines.length} lines found`);
    
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
      
      // If we have at least 5 fields, create a card
      if (cleanValues.length >= 5) {
        const lessonNum = parseInt(cleanValues[0]) || 0;
        
        const card = {
          id: `ludus-${i}`,
          curriculum: 'LUDUS',
          lesson_number: lessonNum,
          latin_headword: cleanValues[1] || '',
          latin_endings: cleanValues[2] || '',
          part_of_speech: cleanValues[3] || '',
          english: cleanValues[4] || '',
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
        cards.push(card);
        
        // Debug log for first few cards and chapter 14 specifically
        if (i <= 5 || lessonNum === 14) {
          console.log(`Card ${i}: Lesson ${lessonNum} - ${cleanValues[1]}`);
        }
      }
    }
    
    console.log(`✅ Successfully loaded ${cards.length} vocabulary cards`);
    return cards;
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