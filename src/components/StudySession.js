import React, { useState, useEffect, useCallback } from 'react';
import { useFlashcards } from '../contexts/FlashcardContext';
import { GRADES, GRADE_LABELS, previewIntervals } from '../utils/sm2Algorithm';
import '../styles/StudySession.css';

const StudySession = ({ cards, onComplete, onBack }) => {
  const { preferences, gradeCard, updatePreference } = useFlashcards();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isRevealed, setIsRevealed] = useState(false);
  const [sessionStats, setSessionStats] = useState({
    correct: 0,
    incorrect: 0,
    startTime: Date.now()
  });

  const currentCard = cards[currentIndex];
  const isLastCard = currentIndex === cards.length - 1;
  const progressPercent = ((currentIndex + (isRevealed ? 1 : 0)) / cards.length) * 100;

  // Keyboard shortcuts
  const handleKeyPress = useCallback((event) => {
    if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') {
      return; // Don't interfere with input fields
    }

    event.preventDefault();
    
    if (!isRevealed && event.code === 'Space') {
      setIsRevealed(true);
    } else if (isRevealed) {
      switch (event.key) {
        case '1':
          handleGrade(GRADES.AGAIN);
          break;
        case '2':
          handleGrade(GRADES.HARD);
          break;
        case '3':
          handleGrade(GRADES.GOOD);
          break;
        case '4':
          handleGrade(GRADES.EASY);
          break;
        case 'ArrowLeft':
          if (currentIndex > 0) {
            setCurrentIndex(currentIndex - 1);
            setIsRevealed(false);
          }
          break;
        case 'ArrowRight':
          if (currentIndex < cards.length - 1) {
            setCurrentIndex(currentIndex + 1);
            setIsRevealed(false);
          }
          break;
        default:
          break;
      }
    }
  }, [isRevealed, currentIndex, cards.length]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [handleKeyPress]);

  const handleGrade = (grade) => {
    if (!currentCard) return;

    // Update statistics
    const isCorrect = grade >= GRADES.GOOD;
    setSessionStats(prev => ({
      ...prev,
      correct: prev.correct + (isCorrect ? 1 : 0),
      incorrect: prev.incorrect + (isCorrect ? 0 : 1)
    }));

    // Grade the card using SM-2 algorithm
    gradeCard(currentCard.id, grade);

    // Move to next card or complete session
    if (isLastCard) {
      onComplete();
    } else {
      setCurrentIndex(currentIndex + 1);
      setIsRevealed(false);
    }
  };

  const handleRevealCard = () => {
    setIsRevealed(true);
  };

  const handlePreviousCard = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setIsRevealed(false);
    }
  };

  const handleNextCard = () => {
    if (currentIndex < cards.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setIsRevealed(false);
    }
  };

  const toggleDisplayMode = () => {
    const newMode = preferences.displayMode === 'full' ? 'basic' : 'full';
    updatePreference('displayMode', newMode);
  };

  const toggleStudyDirection = () => {
    const newDirection = preferences.studyDirection === 'latin-to-english' 
      ? 'english-to-latin' 
      : 'latin-to-english';
    updatePreference('studyDirection', newDirection);
  };

  const getCardFront = () => {
    if (preferences.studyDirection === 'latin-to-english') {
      return preferences.displayMode === 'full' 
        ? `${currentCard.latin_headword}${currentCard.latin_endings ? ', ' + currentCard.latin_endings : ''}`
        : currentCard.latin_headword;
    } else {
      return currentCard.english;
    }
  };

  const getCardBack = () => {
    if (preferences.studyDirection === 'latin-to-english') {
      return currentCard.english;
    } else {
      return preferences.displayMode === 'full'
        ? `${currentCard.latin_headword}${currentCard.latin_endings ? ', ' + currentCard.latin_endings : ''}`
        : currentCard.latin_headword;
    }
  };

  if (!currentCard) {
    return (
      <div className="study-session">
        <div className="session-container">
          <h2>No cards to study</h2>
          <button className="btn primary" onClick={onComplete}>
            Return to Flashcards
          </button>
        </div>
      </div>
    );
  }

  const intervals = previewIntervals(currentCard);

  return (
    <div className="study-session">
      <div className="session-header">
        <button className="back-btn" onClick={onBack}>
          ← Exit Session
        </button>
        
        <div className="session-progress">
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <span className="progress-text">
            {currentIndex + 1} of {cards.length}
          </span>
        </div>

        <div className="session-stats">
          <span className="stat correct">✓ {sessionStats.correct}</span>
          <span className="stat incorrect">✗ {sessionStats.incorrect}</span>
        </div>
      </div>

      <div className="session-controls">
        <div className="display-controls">
          <button 
            className={`control-btn ${preferences.displayMode === 'full' ? 'active' : ''}`}
            onClick={toggleDisplayMode}
            title="Toggle between basic (headword only) and full (headword + endings) display"
          >
            {preferences.displayMode === 'full' ? 'Full Display' : 'Basic Display'}
          </button>
          
          <button 
            className="control-btn"
            onClick={toggleStudyDirection}
            title="Switch study direction"
          >
            {preferences.studyDirection === 'latin-to-english' ? 'Latin → English' : 'English → Latin'}
          </button>
        </div>
      </div>

      <div className="flashcard-container">
        <div className={`flashcard ${isRevealed ? 'revealed' : ''}`}>
          <div className="card-content">
            <div className="card-front">
              <div className="card-text">{getCardFront()}</div>
              {preferences.showHints && currentCard.part_of_speech && (
                <div className="card-hint">
                  ({currentCard.part_of_speech})
                </div>
              )}
            </div>
            
            {isRevealed && (
              <div className="card-back">
                <div className="card-text">{getCardBack()}</div>
                <div className="card-meta">
                  <span className="lesson-info">Chapter {currentCard.lesson_number}</span>
                  <span className="pos-info">{currentCard.part_of_speech}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="session-actions">
        {!isRevealed ? (
          <div className="reveal-section">
            <button 
              className="btn large primary"
              onClick={handleRevealCard}
            >
              Reveal Answer (Space)
            </button>
          </div>
        ) : (
          <div className="grading-section">
            <h3>How well did you know this?</h3>
            <div className="grade-buttons">
              {Object.values(GRADES).map(grade => (
                <button
                  key={grade}
                  className={`grade-btn grade-${grade}`}
                  onClick={() => handleGrade(grade)}
                >
                  <span className="grade-key">{grade}</span>
                  <span className="grade-label">{GRADE_LABELS[grade]}</span>
                  <span className="grade-interval">
                    {intervals[grade]?.interval}d
                  </span>
                </button>
              ))}
            </div>
            <div className="grade-help">
              <p>Use keyboard shortcuts: 1 (Again) | 2 (Hard) | 3 (Good) | 4 (Easy)</p>
            </div>
          </div>
        )}
      </div>

      <div className="navigation-controls">
        <button 
          className={`nav-btn ${currentIndex === 0 ? 'disabled' : ''}`}
          onClick={handlePreviousCard}
          disabled={currentIndex === 0}
        >
          ← Previous
        </button>
        
        <button 
          className={`nav-btn ${isLastCard ? 'disabled' : ''}`}
          onClick={handleNextCard}
          disabled={isLastCard}
        >
          Next →
        </button>
      </div>

      <div className="keyboard-shortcuts">
        <details>
          <summary>Keyboard Shortcuts</summary>
          <div className="shortcuts-list">
            <div className="shortcut">
              <kbd>Space</kbd> - Reveal answer
            </div>
            <div className="shortcut">
              <kbd>1</kbd> - Again (didn't know)
            </div>
            <div className="shortcut">
              <kbd>2</kbd> - Hard (difficult)
            </div>
            <div className="shortcut">
              <kbd>3</kbd> - Good (knew it)
            </div>
            <div className="shortcut">
              <kbd>4</kbd> - Easy (very easy)
            </div>
            <div className="shortcut">
              <kbd>←/→</kbd> - Navigate cards
            </div>
          </div>
        </details>
      </div>
    </div>
  );
};

export default StudySession; 