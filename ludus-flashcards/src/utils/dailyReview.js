import { getDueCards } from './sm2Algorithm';

/**
 * Get cards for daily review based on user preferences
 * @param {Array} allCards - All available cards
 * @param {Object} preferences - User preferences for daily review
 * @returns {Object} - Object containing dailyCards, canStudyMore, and stats
 */
export const getDailyReviewCards = (allCards, preferences) => {
  const {
    dailyCardLimit = 20,
    includeStudySets = { ludus: true, caesar: false, cicero: false },
    prioritizeDue = true,
    includeNewCards = false,
    studyMoreIncrement = 10
  } = preferences;

  // Filter cards by included study sets
  const availableCards = allCards.filter(card => {
    if (includeStudySets.ludus && card.curriculum === 'LUDUS') return true;
    if (includeStudySets.caesar && card.curriculum === 'CAESAR') return true;
    if (includeStudySets.cicero && card.curriculum === 'CICERO') return true;
    return false;
  });

  // Only include cards that have been studied before (repetitions > 0)
  const studiedCards = availableCards.filter(card => card.repetitions > 0);
  
  // Get due cards from studied cards
  const dueCards = getDueCards(studiedCards);
  
  // Get learning cards (cards with 1-2 repetitions that might need more practice)
  const learningCards = studiedCards.filter(card => 
    card.repetitions > 0 && 
    card.repetitions < 3 && 
    !dueCards.includes(card)
  );

  let dailyCards = [];

  if (prioritizeDue) {
    // Start with due cards
    dailyCards.push(...dueCards);
    
    // If we need more cards and haven't reached the limit
    if (dailyCards.length < dailyCardLimit) {
      const remainingSlots = dailyCardLimit - dailyCards.length;
      
      // Add learning cards
      const learningToAdd = learningCards
        .sort((a, b) => (a.lastReviewed || '').localeCompare(b.lastReviewed || ''))
        .slice(0, remainingSlots);
      
      dailyCards.push(...learningToAdd);
      
      // If still need more cards and user allows new cards
      if (dailyCards.length < dailyCardLimit && includeNewCards) {
        const newCards = availableCards.filter(card => card.repetitions === 0);
        const newCardsToAdd = newCards
          .sort(() => Math.random() - 0.5) // Random selection of new cards
          .slice(0, dailyCardLimit - dailyCards.length);
        
        dailyCards.push(...newCardsToAdd);
      }
    }
  } else {
    // Mix due and learning cards randomly
    const mixedCards = [...dueCards, ...learningCards]
      .sort(() => Math.random() - 0.5);
    
    dailyCards = mixedCards.slice(0, dailyCardLimit);
    
    // Add new cards if needed and allowed
    if (dailyCards.length < dailyCardLimit && includeNewCards) {
      const newCards = availableCards.filter(card => card.repetitions === 0);
      const newCardsToAdd = newCards
        .sort(() => Math.random() - 0.5)
        .slice(0, dailyCardLimit - dailyCards.length);
      
      dailyCards.push(...newCardsToAdd);
    }
  }

  // Limit to daily card limit
  dailyCards = dailyCards.slice(0, dailyCardLimit);

  // Calculate if user can study more
  const remainingDueCards = dueCards.length - dailyCards.filter(card => dueCards.includes(card)).length;
  const remainingLearningCards = learningCards.length - dailyCards.filter(card => learningCards.includes(card)).length;
  const totalRemainingStudied = remainingDueCards + remainingLearningCards;
  
  const canStudyMore = totalRemainingStudied > 0;

  // Generate stats
  const stats = {
    total: dailyCards.length,
    due: dailyCards.filter(card => dueCards.includes(card)).length,
    learning: dailyCards.filter(card => learningCards.includes(card)).length,
    new: dailyCards.filter(card => card.repetitions === 0).length,
    remainingStudied: totalRemainingStudied,
    studyMoreIncrement
  };

  return {
    dailyCards,
    canStudyMore,
    stats,
    availableForMore: {
      due: remainingDueCards,
      learning: remainingLearningCards
    }
  };
};

/**
 * Get additional cards for "study more" functionality
 * @param {Array} allCards - All available cards
 * @param {Array} alreadyStudiedToday - Cards already studied in this session
 * @param {Object} preferences - User preferences
 * @returns {Array} - Additional cards to study
 */
export const getStudyMoreCards = (allCards, alreadyStudiedToday, preferences) => {
  const {
    includeStudySets = { ludus: true, caesar: false, cicero: false },
    studyMoreIncrement = 10,
    prioritizeDue = true
  } = preferences;

  // Filter cards by included study sets
  const availableCards = allCards.filter(card => {
    if (includeStudySets.ludus && card.curriculum === 'LUDUS') return true;
    if (includeStudySets.caesar && card.curriculum === 'CAESAR') return true;
    if (includeStudySets.cicero && card.curriculum === 'CICERO') return true;
    return false;
  });

  // Only include cards that have been studied before
  const studiedCards = availableCards.filter(card => card.repetitions > 0);
  
  // Exclude cards already studied today
  const alreadyStudiedIds = new Set(alreadyStudiedToday.map(card => card.id));
  const remainingCards = studiedCards.filter(card => !alreadyStudiedIds.has(card.id));

  // Get due and learning cards
  const dueCards = getDueCards(remainingCards);
  const learningCards = remainingCards.filter(card => 
    card.repetitions > 0 && 
    card.repetitions < 3 && 
    !dueCards.includes(card)
  );

  let moreCards = [];

  if (prioritizeDue) {
    // Prioritize due cards
    moreCards.push(...dueCards.slice(0, studyMoreIncrement));
    
    if (moreCards.length < studyMoreIncrement) {
      const remainingSlots = studyMoreIncrement - moreCards.length;
      moreCards.push(...learningCards.slice(0, remainingSlots));
    }
  } else {
    // Mix due and learning cards
    const mixedCards = [...dueCards, ...learningCards]
      .sort(() => Math.random() - 0.5);
    moreCards = mixedCards.slice(0, studyMoreIncrement);
  }

  return moreCards;
};

/**
 * Check if user has completed their daily review goal
 * @param {Array} studiedToday - Cards studied today
 * @param {Number} dailyCardLimit - User's daily card limit
 * @returns {Boolean} - Whether daily goal is completed
 */
export const isDailyGoalCompleted = (studiedToday, dailyCardLimit) => {
  return studiedToday.length >= dailyCardLimit;
};

/**
 * Get progress towards daily goal
 * @param {Array} studiedToday - Cards studied today
 * @param {Number} dailyCardLimit - User's daily card limit
 * @returns {Object} - Progress information
 */
export const getDailyProgress = (studiedToday, dailyCardLimit) => {
  const completed = studiedToday.length;
  const remaining = Math.max(0, dailyCardLimit - completed);
  const percentage = Math.min(100, Math.round((completed / dailyCardLimit) * 100));
  
  return {
    completed,
    remaining,
    percentage,
    isComplete: completed >= dailyCardLimit,
    total: dailyCardLimit
  };
}; 