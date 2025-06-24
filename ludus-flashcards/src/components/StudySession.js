import React, { useState, useEffect, useCallback } from 'react';
import { useFlashcards } from '../contexts/FlashcardContext';
import { GRADES, GRADE_LABELS, previewIntervals } from '../utils/sm2Algorithm';
import StudyCompletionScreen from './StudyCompletionScreen';
import '../styles/StudySession.css';

const StudySession = ({ 
  cards, 
  onComplete, 
  onBack, 
  onStudyMore, 
  canStudyMore = false, 
  isFromDailyReview = false 
}) => {
  const { preferences, gradeCard, updatePreference } = useFlashcards();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isRevealed, setIsRevealed] = useState(false);
  const [isFlipped, setIsFlipped] = useState(false);
  const [cardKey, setCardKey] = useState(0);
  const [showCompletion, setShowCompletion] = useState(false);
  const [sessionStats, setSessionStats] = useState({
    correct: 0,
    incorrect: 0,
    startTime: Date.now(),
    endTime: null
  });
  const [isGrading, setIsGrading] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const currentCard = cards[currentIndex];
  const isLastCard = currentIndex === cards.length - 1;
  const progressPercent = ((currentIndex + (isRevealed ? 1 : 0)) / cards.length) * 100;

  const handleGrade = useCallback(async (grade) => {
    // Prevent grading if completion screen is showing or during grading process
    if (!currentCard || isGrading || showCompletion) return;

    setIsGrading(true);
    console.log(`🎯 Grading card ${currentCard.id} with grade ${grade}`);

    // Update statistics
    const isCorrect = grade >= GRADES.GOOD;
    setSessionStats(prev => ({
      ...prev,
      correct: prev.correct + (isCorrect ? 1 : 0),
      incorrect: prev.incorrect + (isCorrect ? 0 : 1)
    }));

    try {
      // Grade the card using SM-2 algorithm - WAIT for it to complete
      console.log(`🎯 About to call gradeCard for ${currentCard.id} with grade ${grade}`);
      await gradeCard(currentCard.id, grade);
      console.log(`✅ Successfully graded card ${currentCard.id}`);
    } catch (error) {
      console.error('❌ Error grading card:', currentCard.id, error);
      // Continue with session even if save fails
    }

    // Move to next card or complete session
    if (isLastCard) {
      setSessionStats(prev => ({ ...prev, endTime: Date.now() }));
      setShowCompletion(true);
    } else {
      setCurrentIndex(currentIndex + 1);
      setIsRevealed(false);
      setIsFlipped(false);
    }
    
    setIsGrading(false);
  }, [currentCard, isLastCard, gradeCard, currentIndex, isGrading, showCompletion]);

  // Keyboard shortcuts
  const handleKeyPress = useCallback((event) => {
    // Don't handle keyboard events if completion screen is showing
    if (showCompletion) {
      return;
    }
    
    if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') {
      return; // Don't interfere with input fields
    }

    event.preventDefault();
    
    if (event.code === 'Space') {
      if (!isRevealed) {
        // Reveal answer and flip to back
        setIsRevealed(true);
        setIsFlipped(true);
      } else {
        // Hide answer and reset to front
        setIsRevealed(false);
        setIsFlipped(false);
      }
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
            setIsFlipped(false);
            setCardKey(prev => prev + 1);
          }
          break;
        case 'ArrowRight':
          if (currentIndex < cards.length - 1) {
            setCurrentIndex(currentIndex + 1);
            setIsRevealed(false);
            setIsFlipped(false);
            setCardKey(prev => prev + 1);
          }
          break;
        default:
          break;
      }
    }
  }, [isRevealed, isFlipped, currentIndex, cards.length, handleGrade, showCompletion]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [handleKeyPress]);

  // Reset completion state when cards change (new session starting)
  useEffect(() => {
    if (cards.length > 0) {
      setShowCompletion(false);
      setCurrentIndex(0);
      setIsRevealed(false);
      setIsFlipped(false);
      setCardKey(prev => prev + 1);
      setSessionStats({
        correct: 0,
        incorrect: 0,
        startTime: Date.now(),
        endTime: null
      });
    }
  }, [cards]);

  const handleRevealCard = () => {
    setIsRevealed(true);
    setIsFlipped(true);
  };

  const handleCardClick = () => {
    if (!isRevealed) {
      // Reveal answer and flip to back
      setIsRevealed(true);
      setIsFlipped(true);
    } else {
      // Flip card back and forth
      setIsFlipped(!isFlipped);
    }
  };

  const handlePreviousCard = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setIsRevealed(false);
      setIsFlipped(false);
      setCardKey(prev => prev + 1);
    }
  };

  const handleNextCard = () => {
    if (currentIndex < cards.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setIsRevealed(false);
      setIsFlipped(false);
      setCardKey(prev => prev + 1);
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
      // When studying Latin to English, show English on back
      // In basic mode, also show Latin endings if available
      if (preferences.displayMode === 'basic' && currentCard.latin_endings) {
        return (
          <div>
            <div className="card-answer">{currentCard.english}</div>
            <div className="card-endings">{currentCard.latin_endings}</div>
          </div>
        );
      }
      return currentCard.english;
    } else {
      // When studying English to Latin
      return preferences.displayMode === 'full'
        ? `${currentCard.latin_headword}${currentCard.latin_endings ? ', ' + currentCard.latin_endings : ''}`
        : currentCard.latin_headword;
    }
  };

  const handleCompletionComplete = () => {
    // Create results in the format expected by FlashcardsPage
    const results = cards.map(card => ({ card }));
    onComplete(results);
  };

  const handleStudyMoreFromCompletion = () => {
    // Create results and pass them to the study more handler
    const results = cards.map(card => ({ card }));
    
    // Reset completion state immediately so we don't show completion screen again
    setShowCompletion(false);
    
    // Call the study more handler
    onStudyMore(results);
  };

  // Show completion screen when session is finished
  if (showCompletion) {
    return (
      <StudyCompletionScreen
        sessionStats={sessionStats}
        onComplete={handleCompletionComplete}
        onStudyMore={handleStudyMoreFromCompletion}
        canStudyMore={canStudyMore}
        studyMoreIncrement={preferences.studyMoreIncrement || 10}
        isFromDailyReview={isFromDailyReview}
      />
    );
  }

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
        <div className="header-left">
          <button className="settings-btn exit-btn" onClick={onBack}>
            ← Exit
          </button>
        </div>
        
        <div className="header-center-group">
          <span className="stat incorrect">✗ {sessionStats.incorrect}</span>
          
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
          
          <span className="stat correct">✓ {sessionStats.correct}</span>
        </div>

        <div className="header-right">
          <div className="settings-container">
            <button 
              className="settings-btn"
              onClick={() => setShowSettings(!showSettings)}
              title="Study Settings"
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
              </svg>
            </button>
            {showSettings && (
              <div className="settings-dropdown">
                <button 
                  className={`settings-item ${preferences.displayMode === 'full' ? 'active' : ''}`}
                  onClick={toggleDisplayMode}
                  title="Toggle between basic (headword only) and full (headword + endings) display"
                >
                  {preferences.displayMode === 'full' ? 'Full Display' : 'Basic Display'}
                </button>
                
                <button 
                  className="settings-item"
                  onClick={toggleStudyDirection}
                  title="Switch study direction"
                >
                  {preferences.studyDirection === 'latin-to-english' ? 'Latin → English' : 'English → Latin'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>


      <div className="flashcard-container">
        <div className={`flashcard ${isFlipped ? 'flipped' : ''}`} onClick={handleCardClick} key={cardKey}>
          <div className="card-content">
            {/* Card Front */}
            <div className={`card-side card-front ${isFlipped ? 'hidden' : 'visible'}`}>
              <div className="card-text">{getCardFront()}</div>
              {preferences.showHints && currentCard.part_of_speech && (
                <div className="card-hint">
                  ({currentCard.part_of_speech})
                </div>
              )}
            </div>
            
            {/* Card Back */}
            <div className={`card-side card-back ${isFlipped ? 'visible' : 'hidden'}`}>
              <div className="card-text">{getCardBack()}</div>
              <div className="card-meta">
                <span className="lesson-info">Chapter {currentCard.lesson_number}</span>
                <span className="pos-info">{currentCard.part_of_speech}</span>
              </div>
            </div>
          </div>
          
          <div className="flip-hint">
            {isRevealed ? 'Click card or press Space to flip' : 'Click card or press Space to reveal'}
          </div>
        </div>
      </div>

      {isRevealed && (
        <div className="grading-actions">
          <div className="grading-section">
            {isGrading && <div className="grading-indicator">Saving progress...</div>}
            <div className="grade-buttons">
              {Object.values(GRADES).map(grade => (
                <button
                  key={grade}
                  className={`grade-btn grade-${grade} ${isGrading ? 'grading' : ''}`}
                  onClick={() => handleGrade(grade)}
                  disabled={isGrading}
                >
                  <span className="grade-label">{GRADE_LABELS[grade]} ({grade})</span>
                  <span className="grade-interval">
                    {intervals[grade]?.interval}d
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="session-actions">
        <div className="reveal-section">
          <button 
            className={`nav-btn ${currentIndex === 0 ? 'disabled' : ''}`}
            onClick={handlePreviousCard}
            disabled={currentIndex === 0}
          >
            ← Previous
          </button>
          
          <button 
            className="btn large primary reveal-btn"
            onClick={isRevealed ? () => setIsRevealed(false) : handleRevealCard}
          >
            {isRevealed ? 'Hide Answer (Space)' : 'Reveal Answer (Space)'}
          </button>
          
          <button 
            className={`nav-btn ${isLastCard ? 'disabled' : ''}`}
            onClick={handleNextCard}
            disabled={isLastCard}
          >
            Next →
          </button>
        </div>
      </div>


    </div>
  );
};

export default StudySession; 