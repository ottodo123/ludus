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
    useAutomatic = true,
    useManual = false,
    manualSelections = {},
    prioritizeDue = true,
    includeNewCards = false,
    studyMoreIncrement = 10
  } = preferences;

  let availableCards = [];

  // Automatic selection
  if (useAutomatic) {
    // Include all previously studied cards
    const studiedCards = allCards.filter(card => card.repetitions > 0);
    availableCards.push(...studiedCards);
  }

  // Manual selection
  if (useManual) {
    const manualCards = getManuallySelectedCards(allCards, manualSelections);
    
    // Merge with automatic cards (avoiding duplicates)
    const existingIds = new Set(availableCards.map(card => card.id));
    const newManualCards = manualCards.filter(card => !existingIds.has(card.id));
    availableCards.push(...newManualCards);
  }

  // If no selection criteria are met, fall back to all studied cards
  if (availableCards.length === 0) {
    availableCards = allCards.filter(card => card.repetitions > 0);
  }

  // Get due cards from available cards
  const dueCards = getDueCards(availableCards);
  
  // Get learning cards (cards with 1-2 repetitions that might need more practice)
  const learningCards = availableCards.filter(card => 
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

  // Check if user has effectively completed their goal by studying all available cards previously
  // This handles the case where all selected cards are marked as "easy" and not due today
  const hasStudiedAllSelected = availableCards.length > 0 && 
                               dailyCards.length === 0 &&
                               dueCards.length === 0 &&
                               learningCards.length === 0;



  // Generate stats
  const stats = {
    total: dailyCards.length,
    due: dailyCards.filter(card => dueCards.includes(card)).length,
    learning: dailyCards.filter(card => learningCards.includes(card)).length,
    new: dailyCards.filter(card => card.repetitions === 0).length,
    remainingStudied: totalRemainingStudied,
    studyMoreIncrement,
    availableTotal: availableCards.length,
    hasStudiedAllSelected // Flag to indicate goal completion
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
 * Get manually selected cards based on user selections
 * @param {Array} allCards - All available cards
 * @param {Object} manualSelections - Manual selection preferences
 * @returns {Array} - Manually selected cards
 */
export const getManuallySelectedCards = (allCards, manualSelections) => {
  let selectedCards = [];

  // Process each curriculum
  Object.keys(manualSelections).forEach(curriculum => {
    const selection = manualSelections[curriculum];
    
    if (!selection.enabled) return;

    // Filter cards by curriculum
    const curriculumCards = allCards.filter(card => 
      card.curriculum === curriculum.toUpperCase()
    );

    if (selection.allChapters) {
      // Include all chapters from this curriculum
      selectedCards.push(...curriculumCards);
    } else if (selection.selectedChapters && selection.selectedChapters.length > 0) {
      // Include only selected chapters
      const chapterCards = curriculumCards.filter(card => 
        selection.selectedChapters.includes(card.lesson_number)
      );
      selectedCards.push(...chapterCards);
    }
  });

  return selectedCards;
};

/**
 * Get additional cards for "study more" functionality
 * Intelligently finds cards to study, prioritizing challenging ones
 * @param {Array} allCards - All available cards
 * @param {Array} alreadyStudiedToday - Cards already studied in this session
 * @param {Object} preferences - User preferences
 * @returns {Array} - Additional cards to study
 */
export const getStudyMoreCards = (allCards, alreadyStudiedToday, preferences) => {
  const {
    useAutomatic = true,
    useManual = false,
    manualSelections = {},
    studyMoreIncrement = 10,
    prioritizeDue = true
  } = preferences;

  // Get all cards that match selection criteria
  let availableCards = [];

  if (useAutomatic) {
    const studiedCards = allCards.filter(card => card.repetitions > 0);
    availableCards.push(...studiedCards);
  }

  if (useManual) {
    const manualCards = getManuallySelectedCards(allCards, manualSelections);
    const existingIds = new Set(availableCards.map(card => card.id));
    const newManualCards = manualCards.filter(card => !existingIds.has(card.id));
    availableCards.push(...newManualCards);
  }

  // If no selection criteria, fall back to studied cards
  if (availableCards.length === 0) {
    availableCards = allCards.filter(card => card.repetitions > 0);
  }

  // Exclude cards already studied today (but only from the final selection)
  const alreadyStudiedIds = new Set(alreadyStudiedToday.map(card => card.id));
  const remainingCards = availableCards.filter(card => !alreadyStudiedIds.has(card.id));

  let moreCards = [];

  // Priority 1: Cards that are due for review
  const dueCards = getDueCards(remainingCards);
  
  // Priority 2: Cards that are still learning (repetitions < 3)
  const learningCards = remainingCards.filter(card => 
    card.repetitions > 0 && 
    card.repetitions < 3 && 
    !dueCards.includes(card)
  );

  // Priority 3: Cards with low success rates (easeFactor < 2.5 indicates difficulty)
  const challengingCards = remainingCards.filter(card => 
    card.easeFactor && card.easeFactor < 2.5 && 
    !dueCards.includes(card) && 
    !learningCards.includes(card)
  );

  // Priority 4: Cards not studied recently (older lastReviewed dates)
  const olderCards = remainingCards.filter(card =>
    !dueCards.includes(card) && 
    !learningCards.includes(card) && 
    !challengingCards.includes(card)
  ).sort((a, b) => {
    const aDate = a.lastReviewed ? new Date(a.lastReviewed) : new Date(0);
    const bDate = b.lastReviewed ? new Date(b.lastReviewed) : new Date(0);
    return aDate - bDate; // Oldest first
  });

  // Build the study set with intelligent prioritization
  if (prioritizeDue) {
    moreCards.push(...dueCards.slice(0, studyMoreIncrement));
    
    if (moreCards.length < studyMoreIncrement) {
      const remaining = studyMoreIncrement - moreCards.length;
      moreCards.push(...learningCards.slice(0, remaining));
    }
    
    if (moreCards.length < studyMoreIncrement) {
      const remaining = studyMoreIncrement - moreCards.length;
      moreCards.push(...challengingCards.slice(0, remaining));
    }
    
    if (moreCards.length < studyMoreIncrement) {
      const remaining = studyMoreIncrement - moreCards.length;
      moreCards.push(...olderCards.slice(0, remaining));
    }
  } else {
    // Mix all available cards but still prioritize challenging ones
    const weightedCards = [
      ...dueCards,
      ...learningCards,
      ...challengingCards.slice(0, Math.max(2, studyMoreIncrement / 3)), // Include some challenging cards
      ...olderCards.slice(0, Math.max(2, studyMoreIncrement / 2)) // Include some older cards
    ].sort(() => Math.random() - 0.5);
    
    moreCards = weightedCards.slice(0, studyMoreIncrement);
  }

  // If we still don't have enough cards, and user has truly mastered everything in their selection,
  // then recycle some cards but with preference for less mastered ones
  if (moreCards.length < studyMoreIncrement && remainingCards.length === 0) {
    const allSelectedCards = availableCards.filter(card => !alreadyStudiedIds.has(card.id) || 
      alreadyStudiedToday.length > availableCards.length * 0.8); // Only if they've studied most of their cards today
    
    if (allSelectedCards.length > 0) {
      // Recycle cards, prioritizing those with lower ease factors (more challenging)
      const recyclableCards = allSelectedCards
        .sort((a, b) => {
          const aEase = a.easeFactor || 2.5;
          const bEase = b.easeFactor || 2.5;
          return aEase - bEase; // Lower ease factor first (more challenging)
        })
        .slice(0, studyMoreIncrement - moreCards.length);
      
      moreCards.push(...recyclableCards);
    }
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

/**
 * Get a summary of current selection criteria
 * @param {Object} preferences - User preferences
 * @param {Array} allCards - All available cards  
 * @returns {Object} - Selection summary
 */
export const getSelectionSummary = (preferences, allCards) => {
  const {
    useAutomatic = true,
    useManual = false,

    manualSelections = {}
  } = preferences;

  let autoCount = 0;
  let manualCount = 0;
  let totalSelected = 0;

  if (useAutomatic) {
    autoCount = allCards.filter(card => card.repetitions > 0).length;
  }

  if (useManual) {
    const manualCards = getManuallySelectedCards(allCards, manualSelections);
    manualCount = manualCards.length;
  }

  // Calculate total with overlap consideration
  if (useAutomatic && useManual) {
    const autoCards = allCards.filter(card => card.repetitions > 0);
    const manualCards = getManuallySelectedCards(allCards, manualSelections);
    const combinedCards = [...autoCards];
    const existingIds = new Set(combinedCards.map(card => card.id));
    const newManualCards = manualCards.filter(card => !existingIds.has(card.id));
    combinedCards.push(...newManualCards);
    totalSelected = combinedCards.length;
  } else {
    totalSelected = autoCount + manualCount;
  }

  const mode = useAutomatic && useManual ? 'both' : useAutomatic ? 'auto' : useManual ? 'manual' : 'none';

  return {
    mode,
    autoCount,
    manualCount,
    totalSelected,
    hasSelection: totalSelected > 0
  };
}; 