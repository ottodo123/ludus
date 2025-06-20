// Import the CSV file as raw text
const csvData = `lesson_number,latin_headword,latin_endings,part_of_speech,english
1,terra incognita,,idiom,unknown land
1,amant,,verb,"they love, like"
1,est,,verb,"he, she, it is"
1,habet,,verb,"he, she, it has, holds"
1,laudant,,verb,they praise
1,sunt,,verb,they are
1,vident,,verb,they see
1,videt,,verb,"he, she, it sees"
1,agricola,-ae,noun,farmer
1,incola,-ae,noun,inhabitant
1,īnsula,-ae,noun,island
1,puella,-ae,noun,girl
1,silva,-ae,noun,"forest, woods"
1,terra,-ae,noun,"land, earth"
1,vīta,-ae,noun,life
1,bona,,adjective,good
1,magna,,adjective,"large, great"
1,multae,,adjective,many
1,parva,,adjective,small
1,perīculōsa,,adjective,dangerous
1,et,,conjunction,and
1,nōn,,adverb,not
1,quod,,conjunction,because
1,quoque,,adverb,"also, too"
1,saepe,,adverb,often
1,sed,,conjunction,but
2,prō bonō pūblicō,,idiom,for the public good
2,ambulō,ambulāre (1),verb,walk
2,amō,amāre (1),verb,"love, like"
2,exspectō,exspectāre (1),verb,"wait for, await"
2,habitō,habitāre (1),verb,"dwell, live (in)"
2,laudō,laudāre (1),verb,praise
2,narrō,narrāre (1),verb,"tell, relate, say"
2,portō,portāre (1),verb,"carry, bring"
2,scrībit,,verb,"he, she, it writes"
2,spectō,spectāre (1),verb,"look at, watch"
2,sum,esse,verb,be
2,epistula,-ae,noun,letter
2,fābula,-ae,noun,story
2,fīlia,-ae,noun,daughter
2,nauta,-ae,noun,sailor
2,pecūnia,-ae,noun,money
2,longa,,adjective,long
2,multa,,adjective,much
2,bene,,adverb,well
2,cūr,,adverb,why?
3,persōna nōn grāta,,idiom,unwelcome person
3,clāmō,clāmāre (1),verb,shout
3,dō,dare (1),verb,give
3,labōrō,labōrāre (1),verb,"work, toil"
3,mōnstrō,mōnstrāre (1),verb,"show, display"
3,necō,necāre (1),verb,kill
3,occupō,occupāre (1),verb,"seize, capture"
3,pugnō,pugnāre (1),verb,fight
3,servō,servāre (1),verb,"save, preserve"
3,superō,superāre (1),verb,"defeat, conquer, overcome, surpass; win"
3,vocō,vocāre (1),verb,"call, summon"
3,fēmina,-ae,noun,woman
3,mihi,,pronoun,"to me, for me"
3,grāta,,adjective,pleasing (to)
3,propinqua,,adjective,"near (to), nearby"
3,pulchra,,adjective,"beautiful, handsome"
3,hodiē,,adverb,today
3,ibi,,adverb,"there, in that place"
3,nunc,,adverb,now`;

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
    // For now, we'll use the sample data above
    // In production, you would fetch this from the actual CSV file
    const lines = csvData.trim().split('\n');
    const headers = lines[0].split(',');
    
    const cards = [];
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      // Parse CSV line with proper quote handling
      const values = [];
      let current = '';
      let inQuotes = false;
      
      for (let j = 0; j < line.length; j++) {
        const char = line[j];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          values.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      values.push(current.trim());
      
      if (values.length >= 5) {
        const card = {
          id: `ludus-${i}`,
          curriculum: 'LUDUS',
          lesson_number: parseInt(values[0]) || 0,
          latin_headword: values[1] || '',
          latin_endings: values[2] || '',
          part_of_speech: values[3] || '',
          english: values[4] || '',
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
      }
    }
    
    // For demo purposes, let's add some sample cards from all 64 lessons
    const sampleCards = generateSampleCards();
    
    return [...cards, ...sampleCards];
  } catch (error) {
    console.error('Error parsing vocabulary data:', error);
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