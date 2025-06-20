import React, { createContext, useContext, useState } from 'react';

const FlashcardContext = createContext();

export const FlashcardProvider = ({ children }) => {
  const [cards] = useState([
    {
      id: 'test-1',
      curriculum: 'LUDUS',
      lesson_number: 1,
      latin_headword: 'terra',
      latin_endings: '-ae',
      part_of_speech: 'noun',
      english: 'earth, land',
      easeFactor: 2.5,
      interval: 0,
      repetitions: 0,
      nextReview: null,
      lastReviewed: null,
      isKnown: false
    }
  ]);

  const [preferences] = useState({
    displayMode: 'full',
    studyDirection: 'latin-to-english',
    showHints: true,
    autoAdvance: false,
    cardsPerSession: 20,
    enableSound: false,
    theme: 'light'
  });

  const [statistics] = useState({
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
  });

  const gradeCard = (cardId, grade) => {
    console.log('Grading card:', cardId, 'with grade:', grade);
  };

  const updatePreference = (key, value) => {
    console.log('Updating preference:', key, 'to:', value);
  };

  const contextValue = {
    cards,
    preferences,
    statistics,
    loading: false,
    error: null,
    gradeCard,
    updatePreference
  };

  return (
    <FlashcardContext.Provider value={contextValue}>
      {children}
    </FlashcardContext.Provider>
  );
};

export const useFlashcards = () => {
  const context = useContext(FlashcardContext);
  if (!context) {
    throw new Error('useFlashcards must be used within a FlashcardProvider');
  }
  return context;
}; 