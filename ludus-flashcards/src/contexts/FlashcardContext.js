import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { parseVocabularyData } from '../utils/dataProcessor';
import { loadCards, saveCards, loadPreferences, savePreferences, loadStatistics, saveStatistics } from '../utils/storage';
import { calculateNextReview } from '../utils/sm2Algorithm';

// Create context
const FlashcardContext = createContext();

// Action types
const actionTypes = {
  SET_CARDS: 'SET_CARDS',
  UPDATE_CARD: 'UPDATE_CARD',
  SET_PREFERENCES: 'SET_PREFERENCES',
  UPDATE_PREFERENCE: 'UPDATE_PREFERENCE',
  SET_STATISTICS: 'SET_STATISTICS',
  UPDATE_STATISTICS: 'UPDATE_STATISTICS',
  SET_LOADING: 'SET_LOADING',
  SET_ERROR: 'SET_ERROR',
  GRADE_CARD: 'GRADE_CARD',
  RESET_PROGRESS: 'RESET_PROGRESS',
  MARK_AS_KNOWN: 'MARK_AS_KNOWN'
};

// Initial state
const initialState = {
  cards: [],
  preferences: {
    displayMode: 'full',
    studyDirection: 'latin-to-english',
    showHints: true,
    autoAdvance: false,
    cardsPerSession: 20,
    enableSound: false,
    theme: 'light'
  },
  statistics: {
    totalCardsStudied: 0,
    totalReviews: 0,
    correctAnswers: 0,
    incorrectAnswers: 0,
    longestStreak: 0,
    timeSpentStudying: 0,
    sessionsCompleted: 0,
    lastStudyDate: null,
    dailyGoal: 20,
    weeklyGoal: 100
  },
  loading: true,
  error: null
};

// Reducer function
const flashcardReducer = (state, action) => {
  switch (action.type) {
    case actionTypes.SET_CARDS:
      return {
        ...state,
        cards: action.payload,
        loading: false
      };

    case actionTypes.UPDATE_CARD:
      return {
        ...state,
        cards: state.cards.map(card =>
          card.id === action.payload.id ? { ...card, ...action.payload } : card
        )
      };

    case actionTypes.SET_PREFERENCES:
      return {
        ...state,
        preferences: action.payload
      };

    case actionTypes.UPDATE_PREFERENCE:
      return {
        ...state,
        preferences: {
          ...state.preferences,
          [action.payload.key]: action.payload.value
        }
      };

    case actionTypes.SET_STATISTICS:
      return {
        ...state,
        statistics: action.payload
      };

    case actionTypes.UPDATE_STATISTICS:
      return {
        ...state,
        statistics: {
          ...state.statistics,
          ...action.payload
        }
      };

    case actionTypes.SET_LOADING:
      return {
        ...state,
        loading: action.payload
      };

    case actionTypes.SET_ERROR:
      return {
        ...state,
        error: action.payload,
        loading: false
      };

    case actionTypes.GRADE_CARD:
      const { cardId, grade } = action.payload;
      const cardToUpdate = state.cards.find(card => card.id === cardId);
      
      if (!cardToUpdate) return state;

      const updatedCard = calculateNextReview(cardToUpdate, grade);
      const isCorrect = grade >= 3;

      return {
        ...state,
        cards: state.cards.map(card =>
          card.id === cardId ? updatedCard : card
        ),
        statistics: {
          ...state.statistics,
          totalReviews: state.statistics.totalReviews + 1,
          correctAnswers: isCorrect ? state.statistics.correctAnswers + 1 : state.statistics.correctAnswers,
          incorrectAnswers: !isCorrect ? state.statistics.incorrectAnswers + 1 : state.statistics.incorrectAnswers,
          lastStudyDate: new Date().toISOString()
        }
      };

    case actionTypes.RESET_PROGRESS:
      const { cardIds } = action.payload;
      return {
        ...state,
        cards: state.cards.map(card =>
          cardIds.includes(card.id) ? {
            ...card,
            easeFactor: 2.5,
            interval: 0,
            repetitions: 0,
            nextReview: null,
            lastReviewed: null,
            isKnown: false
          } : card
        )
      };

    case actionTypes.MARK_AS_KNOWN:
      const { cardIds: knownCardIds, isKnown } = action.payload;
      return {
        ...state,
        cards: state.cards.map(card =>
          knownCardIds.includes(card.id) ? { ...card, isKnown } : card
        )
      };

    default:
      return state;
  }
};

// Context provider component
export const FlashcardProvider = ({ children }) => {
  const [state, dispatch] = useReducer(flashcardReducer, initialState);

  // Initialize data on mount
  useEffect(() => {
    const initializeData = async () => {
      try {
        dispatch({ type: actionTypes.SET_LOADING, payload: true });

        // Load preferences
        const preferences = loadPreferences();
        dispatch({ type: actionTypes.SET_PREFERENCES, payload: preferences });

        // Load statistics
        const statistics = loadStatistics();
        dispatch({ type: actionTypes.SET_STATISTICS, payload: statistics });

        // Try to load cards from localStorage first
        let cards = loadCards();
        
        if (!cards) {
          // If no cards in localStorage, parse from CSV
          cards = await parseVocabularyData();
          // Save to localStorage for future use
          saveCards(cards);
        }

        dispatch({ type: actionTypes.SET_CARDS, payload: cards });
      } catch (error) {
        console.error('Error initializing data:', error);
        dispatch({ type: actionTypes.SET_ERROR, payload: error.message });
      }
    };

    initializeData();
  }, []);

  // Save to localStorage whenever state changes
  useEffect(() => {
    if (state.cards.length > 0) {
      saveCards(state.cards);
    }
  }, [state.cards]);

  useEffect(() => {
    savePreferences(state.preferences);
  }, [state.preferences]);

  useEffect(() => {
    saveStatistics(state.statistics);
  }, [state.statistics]);

  // Action creators
  const actions = {
    updateCard: (cardId, updates) => {
      dispatch({
        type: actionTypes.UPDATE_CARD,
        payload: { id: cardId, ...updates }
      });
    },

    updatePreference: (key, value) => {
      dispatch({
        type: actionTypes.UPDATE_PREFERENCE,
        payload: { key, value }
      });
    },

    updateStatistics: (updates) => {
      dispatch({
        type: actionTypes.UPDATE_STATISTICS,
        payload: updates
      });
    },

    gradeCard: (cardId, grade) => {
      dispatch({
        type: actionTypes.GRADE_CARD,
        payload: { cardId, grade }
      });
    },

    resetProgress: (cardIds) => {
      dispatch({
        type: actionTypes.RESET_PROGRESS,
        payload: { cardIds }
      });
    },

    markAsKnown: (cardIds, isKnown = true) => {
      dispatch({
        type: actionTypes.MARK_AS_KNOWN,
        payload: { cardIds, isKnown }
      });
    },

    setError: (error) => {
      dispatch({
        type: actionTypes.SET_ERROR,
        payload: error
      });
    }
  };

  const contextValue = {
    ...state,
    ...actions
  };

  return (
    <FlashcardContext.Provider value={contextValue}>
      {children}
    </FlashcardContext.Provider>
  );
};

// Custom hook to use the context
export const useFlashcards = () => {
  const context = useContext(FlashcardContext);
  
  if (!context) {
    throw new Error('useFlashcards must be used within a FlashcardProvider');
  }
  
  return context;
}; 