// LocalStorage utilities for persisting data

const STORAGE_KEYS = {
  CARDS: 'ludus_flashcards_cards',
  PREFERENCES: 'ludus_flashcards_preferences',
  STATISTICS: 'ludus_flashcards_statistics'
};

// Save cards to localStorage
export const saveCards = (cards) => {
  try {
    localStorage.setItem(STORAGE_KEYS.CARDS, JSON.stringify(cards));
    return true;
  } catch (error) {
    console.error('Error saving cards to localStorage:', error);
    return false;
  }
};

// Load cards from localStorage
export const loadCards = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.CARDS);
    return stored ? JSON.parse(stored) : null;
  } catch (error) {
    console.error('Error loading cards from localStorage:', error);
    return null;
  }
};

// Save user preferences
export const savePreferences = (preferences) => {
  try {
    localStorage.setItem(STORAGE_KEYS.PREFERENCES, JSON.stringify(preferences));
    return true;
  } catch (error) {
    console.error('Error saving preferences:', error);
    return false;
  }
};

// Load user preferences
export const loadPreferences = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.PREFERENCES);
    return stored ? JSON.parse(stored) : getDefaultPreferences();
  } catch (error) {
    console.error('Error loading preferences:', error);
    return getDefaultPreferences();
  }
};

// Default preferences
export const getDefaultPreferences = () => ({
  displayMode: 'full', // 'basic' or 'full'
  studyDirection: 'latin-to-english', // 'latin-to-english' or 'english-to-latin'
  showHints: true,
  autoAdvance: false,
  cardsPerSession: 20,
  enableSound: false,
  theme: 'light' // 'light' or 'dark'
});

// Save statistics
export const saveStatistics = (statistics) => {
  try {
    localStorage.setItem(STORAGE_KEYS.STATISTICS, JSON.stringify(statistics));
    return true;
  } catch (error) {
    console.error('Error saving statistics:', error);
    return false;
  }
};

// Load statistics
export const loadStatistics = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.STATISTICS);
    return stored ? JSON.parse(stored) : getDefaultStatistics();
  } catch (error) {
    console.error('Error loading statistics:', error);
    return getDefaultStatistics();
  }
};

// Default statistics
export const getDefaultStatistics = () => ({
  totalCardsStudied: 0,
  totalReviews: 0,
  correctAnswers: 0,
  incorrectAnswers: 0,
  longestStreak: 0,
  timeSpentStudying: 0, // in milliseconds
  sessionsCompleted: 0,
  lastStudyDate: null,
  dailyGoal: 20,
  weeklyGoal: 100,
  // Daily tracking
  studiedToday: 0,
  studiedTodayDate: new Date().toISOString().split('T')[0] // YYYY-MM-DD
});

// Update a single card in storage
export const updateCardInStorage = (cardId, updatedCard) => {
  const cards = loadCards();
  if (!cards) return false;
  
  const cardIndex = cards.findIndex(card => card.id === cardId);
  if (cardIndex === -1) return false;
  
  cards[cardIndex] = { ...cards[cardIndex], ...updatedCard };
  return saveCards(cards);
};

// Clear all stored data
export const clearAllData = () => {
  try {
    Object.values(STORAGE_KEYS).forEach(key => {
      localStorage.removeItem(key);
    });
    return true;
  } catch (error) {
    console.error('Error clearing stored data:', error);
    return false;
  }
};

// Export data for backup
export const exportData = () => {
  try {
    const data = {
      cards: loadCards(),
      preferences: loadPreferences(),
      statistics: loadStatistics(),
      exportDate: new Date().toISOString(),
      version: '1.0'
    };
    return JSON.stringify(data, null, 2);
  } catch (error) {
    console.error('Error exporting data:', error);
    return null;
  }
};

// Import data from backup
export const importData = (jsonData) => {
  try {
    const data = JSON.parse(jsonData);
    
    if (data.cards) saveCards(data.cards);
    if (data.preferences) savePreferences(data.preferences);
    if (data.statistics) saveStatistics(data.statistics);
    
    return true;
  } catch (error) {
    console.error('Error importing data:', error);
    return false;
  }
};

// Get storage usage
export const getStorageUsage = () => {
  try {
    let totalSize = 0;
    const sizes = {};
    
    Object.entries(STORAGE_KEYS).forEach(([key, storageKey]) => {
      const data = localStorage.getItem(storageKey);
      const size = data ? new Blob([data]).size : 0;
      sizes[key] = size;
      totalSize += size;
    });
    
    return {
      total: totalSize,
      breakdown: sizes,
      totalFormatted: formatBytes(totalSize)
    };
  } catch (error) {
    console.error('Error calculating storage usage:', error);
    return null;
  }
};

// Format bytes to human readable format
const formatBytes = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}; 