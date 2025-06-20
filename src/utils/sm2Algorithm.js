// SM-2 Algorithm Implementation
// Based on SuperMemo's SM-2 algorithm

// Grade constants
export const GRADES = {
  AGAIN: 1,    // Complete blackout
  HARD: 2,     // Incorrect response but remembered with hint
  GOOD: 3,     // Correct response with hesitation  
  EASY: 4      // Perfect response
};

export const GRADE_LABELS = {
  [GRADES.AGAIN]: 'Again',
  [GRADES.HARD]: 'Hard', 
  [GRADES.GOOD]: 'Good',
  [GRADES.EASY]: 'Easy'
};

// Calculate next review date based on SM-2 algorithm
export const calculateNextReview = (card, grade) => {
  let { easeFactor, interval, repetitions } = card;
  
  // If grade is less than 3 (Again or Hard), reset repetitions
  if (grade < 3) {
    repetitions = 0;
    interval = 0;
  } else {
    // Update ease factor based on grade
    easeFactor = Math.max(1.3, easeFactor + (0.1 - (5 - grade) * (0.08 + (5 - grade) * 0.02)));
    
    // Calculate new interval
    if (repetitions === 0) {
      interval = 1;
    } else if (repetitions === 1) {
      interval = 6;
    } else {
      interval = Math.round(interval * easeFactor);
    }
    
    repetitions += 1;
  }
  
  // Calculate next review date
  const nextReview = new Date();
  nextReview.setDate(nextReview.getDate() + interval);
  
  return {
    ...card,
    easeFactor: Math.round(easeFactor * 100) / 100, // Round to 2 decimal places
    interval,
    repetitions,
    nextReview: nextReview.toISOString(),
    lastReviewed: new Date().toISOString()
  };
};

// Check if a card is due for review
export const isDue = (card) => {
  if (!card.nextReview) return true; // New cards are always due
  
  const now = new Date();
  const reviewDate = new Date(card.nextReview);
  return now >= reviewDate;
};

// Get cards due for review
export const getDueCards = (cards) => {
  return cards.filter(isDue);
};

// Get cards due today specifically
export const getCardsToday = (cards) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  return cards.filter(card => {
    if (!card.nextReview) return true; // New cards count as today
    
    const reviewDate = new Date(card.nextReview);
    return reviewDate >= today && reviewDate < tomorrow;
  });
};

// Get new cards (never reviewed)
export const getNewCards = (cards) => {
  return cards.filter(card => card.repetitions === 0);
};

// Get learning cards (in learning phase)
export const getLearningCards = (cards) => {
  return cards.filter(card => card.repetitions > 0 && card.repetitions < 3);
};

// Get mature cards (graduated cards)
export const getMatureCards = (cards) => {
  return cards.filter(card => card.repetitions >= 3);
};

// Calculate retention rate
export const calculateRetentionRate = (cards) => {
  const reviewedCards = cards.filter(card => card.repetitions > 0);
  if (reviewedCards.length === 0) return 0;
  
  const correctCards = reviewedCards.filter(card => card.easeFactor >= 2.5);
  return Math.round((correctCards.length / reviewedCards.length) * 100);
};

// Get difficulty analysis
export const getDifficultyAnalysis = (cards) => {
  const difficulties = {
    easy: cards.filter(card => card.easeFactor > 3.0).length,
    medium: cards.filter(card => card.easeFactor >= 2.0 && card.easeFactor <= 3.0).length,
    hard: cards.filter(card => card.easeFactor < 2.0).length
  };
  
  return difficulties;
};

// Preview next intervals for each grade
export const previewIntervals = (card) => {
  const previews = {};
  
  Object.values(GRADES).forEach(grade => {
    const tempCard = calculateNextReview(card, grade);
    previews[grade] = {
      interval: tempCard.interval,
      nextReview: tempCard.nextReview,
      label: GRADE_LABELS[grade]
    };
  });
  
  return previews;
};

// Calculate study streak
export const calculateStudyStreak = (cards) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  let streak = 0;
  let currentDate = new Date(today);
  
  while (true) {
    const dayStart = new Date(currentDate);
    const dayEnd = new Date(currentDate);
    dayEnd.setDate(dayEnd.getDate() + 1);
    
    const studiedToday = cards.some(card => {
      if (!card.lastReviewed) return false;
      const reviewDate = new Date(card.lastReviewed);
      return reviewDate >= dayStart && reviewDate < dayEnd;
    });
    
    if (studiedToday) {
      streak++;
      currentDate.setDate(currentDate.getDate() - 1);
    } else {
      break;
    }
  }
  
  return streak;
}; 