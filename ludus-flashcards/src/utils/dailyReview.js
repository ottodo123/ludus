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
    selectionMode = 'auto',
    autoIncludeStudied = true,
    manualSelections = {},
    prioritizeDue = true,
    includeNewCards = false,
    studyMoreIncrement = 10
  } = preferences;

  let availableCards = [];

  // Automatic selection
  if (selectionMode === 'auto' || selectionMode === 'both') {
    if (autoIncludeStudied) {
      // Include all previously studied cards
      const studiedCards = allCards.filter(card => card.repetitions > 0);
      availableCards.push(...studiedCards);
    }
  }

  // Manual selection
  if (selectionMode === 'manual' || selectionMode === 'both') {
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

  // Generate stats
  const stats = {
    total: dailyCards.length,
    due: dailyCards.filter(card => dueCards.includes(card)).length,
    learning: dailyCards.filter(card => learningCards.includes(card)).length,
    new: dailyCards.filter(card => card.repetitions === 0).length,
    remainingStudied: totalRemainingStudied,
    studyMoreIncrement,
    availableTotal: availableCards.length
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
 * @param {Array} allCards - All available cards
 * @param {Array} alreadyStudiedToday - Cards already studied in this session
 * @param {Object} preferences - User preferences
 * @returns {Array} - Additional cards to study
 */
export const getStudyMoreCards = (allCards, alreadyStudiedToday, preferences) => {
  const {
    selectionMode = 'auto',
    autoIncludeStudied = true,
    manualSelections = {},
    studyMoreIncrement = 10,
    prioritizeDue = true
  } = preferences;

  let availableCards = [];

  // Apply same selection logic as daily review
  if (selectionMode === 'auto' || selectionMode === 'both') {
    if (autoIncludeStudied) {
      const studiedCards = allCards.filter(card => card.repetitions > 0);
      availableCards.push(...studiedCards);
    }
  }

  if (selectionMode === 'manual' || selectionMode === 'both') {
    const manualCards = getManuallySelectedCards(allCards, manualSelections);
    const existingIds = new Set(availableCards.map(card => card.id));
    const newManualCards = manualCards.filter(card => !existingIds.has(card.id));
    availableCards.push(...newManualCards);
  }

  // If no selection criteria, fall back to studied cards
  if (availableCards.length === 0) {
    availableCards = allCards.filter(card => card.repetitions > 0);
  }

  // Exclude cards already studied today
  const alreadyStudiedIds = new Set(alreadyStudiedToday.map(card => card.id));
  const remainingCards = availableCards.filter(card => !alreadyStudiedIds.has(card.id));

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

/**
 * Get a summary of current selection criteria
 * @param {Object} preferences - User preferences
 * @param {Array} allCards - All available cards  
 * @returns {Object} - Selection summary
 */
export const getSelectionSummary = (preferences, allCards) => {
  const {
    selectionMode = 'auto',
    autoIncludeStudied = true,
    manualSelections = {}
  } = preferences;

  let autoCount = 0;
  let manualCount = 0;
  let totalSelected = 0;

  if (selectionMode === 'auto' || selectionMode === 'both') {
    if (autoIncludeStudied) {
      autoCount = allCards.filter(card => card.repetitions > 0).length;
    }
  }

  if (selectionMode === 'manual' || selectionMode === 'both') {
    const manualCards = getManuallySelectedCards(allCards, manualSelections);
    manualCount = manualCards.length;
  }

  // Calculate total with overlap consideration
  if (selectionMode === 'both') {
    const autoCards = autoIncludeStudied ? allCards.filter(card => card.repetitions > 0) : [];
    const manualCards = getManuallySelectedCards(allCards, manualSelections);
    const combinedCards = [...autoCards];
    const existingIds = new Set(combinedCards.map(card => card.id));
    const newManualCards = manualCards.filter(card => !existingIds.has(card.id));
    combinedCards.push(...newManualCards);
    totalSelected = combinedCards.length;
  } else {
    totalSelected = autoCount + manualCount;
  }

  return {
    mode: selectionMode,
    autoCount,
    manualCount,
    totalSelected,
    hasSelection: totalSelected > 0
  };
}; 