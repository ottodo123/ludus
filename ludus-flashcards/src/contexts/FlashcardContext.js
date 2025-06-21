import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { parseVocabularyData } from '../utils/dataProcessor';
import { loadCards, saveCards, loadPreferences, savePreferences, loadStatistics, saveStatistics } from '../utils/storage';
import { getUserProgress, updateCardStats, saveUserProfile, getUserProfile } from '../services/userDataService';
import { calculateNextReview } from '../utils/sm2Algorithm';
import { useAuth } from './AuthContext';

// Create context
const FlashcardContext = createContext();

// Module-level variable for debouncing statistics saves
let statsTimeout = null;

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
          card.id === action.payload.id
            ? { ...card, ...action.payload }
            : card
        )
      };

    case actionTypes.SET_PREFERENCES:
      return {
        ...state,
        preferences: action.payload
      };

    case actionTypes.UPDATE_PREFERENCE:
      const { key, value } = action.payload;
      return {
        ...state,
        preferences: {
          ...state.preferences,
          [key]: value
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
  const { user } = useAuth();
  const [state, dispatch] = useReducer(flashcardReducer, initialState);

  // Initialize data on mount or when user changes
  useEffect(() => {
    const initializeData = async () => {
      try {
        dispatch({ type: actionTypes.SET_LOADING, payload: true });

        if (user) {
          console.log('🔥 Loading data from Firebase for user:', user.uid);
          console.log('🔍 User authentication status:', { 
            uid: user.uid, 
            email: user.email, 
            isAnonymous: user.isAnonymous 
          });
          
          // Test Firebase connection with timeout
          try {
            console.log('🧪 Testing Firebase connection...');
            const timeoutPromise = new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Firebase connection timeout')), 10000)
            );
            await Promise.race([getUserProfile(user.uid), timeoutPromise]);
            console.log('✅ Firebase connection test successful');
          } catch (testError) {
            console.error('❌ Firebase connection test failed:', testError);
            if (testError.message?.includes('CORS') || testError.message?.includes('access control')) {
              console.log('🌐 CORS issue detected - this may resolve automatically');
            }
          }
          
          // Load user profile from Firebase
          try {
            const userProfile = await getUserProfile(user.uid);
            if (userProfile) {
              dispatch({ type: actionTypes.SET_PREFERENCES, payload: userProfile.preferences || state.preferences });
              
              // Handle daily statistics - reset if it's a new day
              const today = new Date().toISOString().split('T')[0];
              const loadedStats = userProfile.statistics || state.statistics;
              const statsToUse = loadedStats.studiedTodayDate === today ? 
                loadedStats : 
                { ...loadedStats, studiedToday: 0, studiedTodayDate: today };
              
              dispatch({ type: actionTypes.SET_STATISTICS, payload: statsToUse });
            }
          } catch (error) {
            console.error('Error loading user profile:', error);
          }

          // Load user progress from Firebase
          try {
            console.log('📖 Attempting to load progress from Firebase...');
            const progress = await getUserProgress(user.uid);
            console.log('📋 Firebase progress loaded:', progress ? Object.keys(progress).length : 'null', 'cards');
            
            // Get base cards from CSV
            let cards = await parseVocabularyData();
            
            // Merge with user progress
            if (progress && Object.keys(progress).length > 0) {
              console.log('📚 Merging Firebase progress with cards:', Object.keys(progress).length, 'cards with progress');
              cards = cards.map(card => {
                const cardProgress = progress[card.id];
                if (cardProgress) {
                  console.log(`🔀 Merging progress for card ${card.id}:`, {
                    original: { repetitions: card.repetitions, easeFactor: card.easeFactor },
                    fromFirebase: { repetitions: cardProgress.repetitions, easeFactor: cardProgress.easeFactor }
                  });
                  
                  // Data integrity check and repair
                  const repairedProgress = {
                    ...cardProgress,
                    // Ensure easeFactor is within reasonable bounds
                    easeFactor: cardProgress.easeFactor < 1.5 ? 2.5 : cardProgress.easeFactor,
                    // Ensure repetitions is not negative
                    repetitions: Math.max(0, cardProgress.repetitions || 0),
                    // Ensure interval is positive
                    interval: Math.max(1, cardProgress.interval || 1)
                  };
                  
                  // Log if we repaired corrupted data
                  if (repairedProgress.easeFactor !== cardProgress.easeFactor) {
                    console.log(`🔧 Repaired corrupted easeFactor for card ${card.id}: ${cardProgress.easeFactor} → ${repairedProgress.easeFactor}`);
                  }
                  
                  return { ...card, ...repairedProgress };
                }
                return card;
              });
              console.log('✅ Merge complete. Sample merged card:', cards.find(c => progress[c.id]));
            } else {
              console.log('⚠️ No Firebase progress found, using fresh CSV data');
            }

            dispatch({ type: actionTypes.SET_CARDS, payload: cards });
          } catch (error) {
            console.error('Error loading Firebase progress:', error);
            // Fallback to CSV data
            const cards = await parseVocabularyData();
            dispatch({ type: actionTypes.SET_CARDS, payload: cards });
          }
        } else {
          console.log('💾 Loading data from localStorage (no user signed in)');
          
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
        }
      } catch (error) {
        console.error('Error initializing data:', error);
        dispatch({ type: actionTypes.SET_ERROR, payload: error.message });
      } finally {
        dispatch({ type: actionTypes.SET_LOADING, payload: false });
      }
    };

    initializeData();
  }, [user]); // Re-run when user changes

  // Save to storage whenever state changes
  useEffect(() => {
    const saveData = async () => {
      if (state.cards.length === 0) return; // Don't save empty state
      
      if (user) {
        // Save to Firebase
        try {
          console.log('🔥 Saving user profile to Firebase');
          await saveUserProfile(user.uid, {
            preferences: state.preferences,
            statistics: state.statistics,
            displayName: user.displayName,
            email: user.email,
            photoURL: user.photoURL
          });
        } catch (error) {
          console.error('Error saving user profile to Firebase:', error);
        }
      } else {
        // Save to localStorage
        saveCards(state.cards);
        savePreferences(state.preferences);
        saveStatistics(state.statistics);
      }
    };

    saveData();
  }, [state.preferences, state.statistics, state.cards, user]);

  // Save cards to localStorage only for non-Firebase users
  useEffect(() => {
    const saveCardsData = async () => {
      if (state.cards.length === 0 || state.loading || user) return;
      
      // Only save to localStorage for non-Firebase users
      saveCards(state.cards);
    };

    // Debounce card saves to avoid too frequent writes
    const timeoutId = setTimeout(saveCardsData, 1000);
    return () => clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.cards, user, state.loading]);

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

    gradeCard: async (cardId, grade) => {
      const startTime = Date.now();
      
      // Update daily statistics first
      const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
      const isCorrect = grade >= 3;
      
      // Update statistics including daily tracking
      const updatedStats = {
        ...state.statistics,
        totalReviews: state.statistics.totalReviews + 1,
        correctAnswers: isCorrect ? state.statistics.correctAnswers + 1 : state.statistics.correctAnswers,
        incorrectAnswers: !isCorrect ? state.statistics.incorrectAnswers + 1 : state.statistics.incorrectAnswers,
        lastStudyDate: new Date().toISOString(),
        // Daily tracking - check if it's a new day
        studiedToday: state.statistics.studiedTodayDate === today ? 
          (state.statistics.studiedToday || 0) + 1 : 1,
        studiedTodayDate: today
      };
      
      // Update local state immediately for responsive UI
      dispatch({
        type: actionTypes.UPDATE_STATISTICS,
        payload: updatedStats
      });
      
      if (user) {
        // For Firebase users - update UI immediately, save to Firebase asynchronously
        try {
          // First, update local state immediately using the SM-2 algorithm
          dispatch({
            type: actionTypes.GRADE_CARD,
            payload: { cardId, grade }
          });
          
          // Then save to Firebase asynchronously without blocking the UI
          const timeTaken = Date.now() - startTime;
          console.log('🔥 Starting async save to Firebase for card:', cardId);
          
          // Don't await this - let it happen in the background
          updateCardStats(user.uid, cardId, grade, timeTaken)
            .then((updatedCardData) => {
              console.log('💾 Firebase card save successful:', cardId);
              // Optionally sync the Firebase result back to local state
              dispatch({
                type: actionTypes.UPDATE_CARD,
                payload: { id: cardId, ...updatedCardData }
              });
            })
            .catch((error) => {
              console.error('❌ Firebase card save failed:', cardId, error);
              // UI already updated locally, so this doesn't affect user experience
            });
          
          // Also save statistics asynchronously (debounced to avoid too many calls)
          if (statsTimeout) {
            clearTimeout(statsTimeout);
          }
          statsTimeout = setTimeout(async () => {
            try {
              await saveUserProfile(user.uid, {
                preferences: state.preferences,
                statistics: updatedStats,
                displayName: user.displayName,
                email: user.email,
                photoURL: user.photoURL
              });
              console.log('📊 Statistics batch saved to Firebase');
            } catch (statsError) {
              console.error('Error batch saving statistics to Firebase:', statsError);
            }
            statsTimeout = null;
          }, 1000); // Batch save statistics every 1 second
          
        } catch (error) {
          console.error('❌ Error in Firebase operation setup:', error);
          // Fallback - local update already happened above
        }
      } else {
        console.log('💾 No user signed in, using local storage');
        // For non-Firebase users, use local algorithm
        dispatch({
          type: actionTypes.GRADE_CARD,
          payload: { cardId, grade }
        });
      }
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
    },

    // Helper function for getting today's study count
    getStudiedToday: () => {
      const today = new Date().toISOString().split('T')[0];
      return state.statistics.studiedTodayDate === today ? 
        (state.statistics.studiedToday || 0) : 0;
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

// Hook to use flashcard context
export const useFlashcards = () => {
  const context = useContext(FlashcardContext);
  if (!context) {
    throw new Error('useFlashcards must be used within a FlashcardProvider');
  }
  return context;
}; 