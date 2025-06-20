import React, { useState, useEffect, useMemo } from 'react';
import { useFlashcards } from '../contexts/FlashcardContext';
import { 
  getDailyReviewCards, 
  getStudyMoreCards, 
  getDailyProgress, 
  isDailyGoalCompleted,
  getSelectionSummary 
} from '../utils/dailyReview';
import LudusFolder from './LudusFolder';
import StudySession from './StudySession';
import DailyReviewSettings from './DailyReviewSettings';
import '../styles/FlashcardsPage.css';

const FlashcardsPage = () => {
  const { cards, preferences } = useFlashcards();
  const [currentView, setCurrentView] = useState('main'); // 'main', 'ludus', 'study'
  const [studyCards, setStudyCards] = useState([]);
  const [showSettings, setShowSettings] = useState(false);
  const [studiedToday, setStudiedToday] = useState([]);
  const [isStudyMoreSession, setIsStudyMoreSession] = useState(false);
  const [isStudying, setIsStudying] = useState(false);
  const [currentStudyCards, setCurrentStudyCards] = useState([]);
  const [hasStudiedMore, setHasStudiedMore] = useState(false);

  // Get daily review data
  const dailyReviewData = useMemo(() => {
    return getDailyReviewCards(cards, preferences);
  }, [cards, preferences]);

  // Get selection summary
  const selectionSummary = useMemo(() => {
    return getSelectionSummary(preferences, cards);
  }, [preferences, cards]);
  
  // Get daily progress
  const dailyProgress = useMemo(() => {
    return getDailyProgress(studiedToday, preferences.dailyCardLimit || 20);
  }, [studiedToday, preferences.dailyCardLimit]);

  // Check if daily goal is completed
  const goalCompleted = useMemo(() => {
    return isDailyGoalCompleted(studiedToday, preferences.dailyCardLimit || 20);
  }, [studiedToday, preferences.dailyCardLimit]);

  // Reset studied today at midnight
  useEffect(() => {
    const now = new Date();
    const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    const msUntilMidnight = tomorrow.getTime() - now.getTime();

    const timer = setTimeout(() => {
      setStudiedToday([]);
      setHasStudiedMore(false);
    }, msUntilMidnight);

    return () => clearTimeout(timer);
  }, []);

  const handleStartDailyReview = () => {
    if (dailyReviewData.dailyCards.length === 0) {
      alert('No cards available for daily review. Please check your selection settings.');
      return;
    }
    
    setCurrentStudyCards(dailyReviewData.dailyCards);
    setIsStudying(true);
  };

  const handleStudyMore = () => {
    const moreCards = getStudyMoreCards(cards, studiedToday, preferences);
    
    if (moreCards.length === 0) {
      alert('No additional cards available for study. Great job completing your available content!');
      return;
    }
    
    setCurrentStudyCards(moreCards);
    setIsStudying(true);
    setHasStudiedMore(true);
  };

  const handleFolderClick = (folder) => {
    if (folder === 'ludus') {
      setCurrentView('ludus');
    }
  };

  const handleBackToMain = () => {
    setCurrentView('main');
    setStudyCards([]);
    setIsStudyMoreSession(false);
  };

  const handleStartLessonStudy = (lessonCards) => {
    setStudyCards(lessonCards);
    setCurrentView('study');
    setIsStudyMoreSession(false);
  };

  const handleStudyComplete = (results) => {
    // Add studied cards to today's list
    const newStudiedCards = results.map(result => result.card);
    setStudiedToday(prev => [...prev, ...newStudiedCards]);
    setIsStudying(false);
    setCurrentStudyCards([]);
  };

  const handleBackToFlashcards = () => {
    setIsStudying(false);
    setCurrentStudyCards([]);
  };

  const handleOpenSettings = () => {
    setShowSettings(true);
  };

  const handleSettingsSaved = () => {
    console.log('Settings saved, daily review will update with new preferences');
  };

  const getSelectionModeDescription = () => {
    const { mode, autoCount, manualCount, totalSelected } = selectionSummary;
    
    if (!selectionSummary.hasSelection) {
      return "⚠️ No selection criteria set - using all studied cards as fallback";
    }

    switch (mode) {
      case 'auto':
        return `🤖 Automatic: ${autoCount} previously studied cards`;
      case 'manual':
        return `✋ Manual: ${manualCount} manually selected cards`;
      case 'both':
        return `🤖✋ Auto + Manual: ${totalSelected} cards total`;
      default:
        return `${totalSelected} cards selected`;
    }
  };

  if (currentView === 'study') {
    return (
      <StudySession
        cards={studyCards}
        onComplete={handleStudyComplete}
        onBack={handleBackToMain}
      />
    );
  }

  if (currentView === 'ludus') {
    return (
      <LudusFolder
        onBack={handleBackToMain}
        onStartStudy={handleStartLessonStudy}
      />
    );
  }

  if (isStudying) {
    return (
      <StudySession 
        cards={currentStudyCards}
        onComplete={handleStudyComplete}
        onBack={handleBackToFlashcards}
      />
    );
  }

  return (
    <div className="flashcards-page">
      <div className="page-container">
        {/* SECTION 1: Daily Review - Consolidated */}
        <div className="daily-review-section">
          <div className="review-header">
            <div className="review-title">
              <h1>📚 Daily Review</h1>
              <p className="review-subtitle">
                {getSelectionModeDescription()}
              </p>
            </div>
            <button 
              className="settings-btn"
              onClick={handleOpenSettings}
              title="Adjust daily review settings"
            >
              ⚙️
            </button>
          </div>

          <div className="review-content">
            {/* Progress and Actions Row */}
            <div className="progress-actions-row">
              {/* Progress Column */}
              <div className="progress-column">
                <div className="progress-info">
                  <span className="progress-label">Today's Progress</span>
                  <span className="progress-text">
                    {dailyProgress.completed} / {dailyProgress.total} cards
                  </span>
                </div>
                <div className="progress-bar-container">
                  <div 
                    className="progress-bar"
                    style={{
                      width: `${dailyProgress.percentage}%`,
                      background: goalCompleted 
                        ? 'linear-gradient(90deg, #10b981, #059669)'
                        : 'linear-gradient(90deg, #3b82f6, #1d4ed8)'
                    }}
                  />
                </div>
                {goalCompleted && (
                  <div className="goal-completed-compact">
                    🎉 Goal completed!
                  </div>
                )}
              </div>

              {/* Actions Column */}
              <div className="actions-column">
                <button 
                  className="primary-study-btn"
                  onClick={handleStartDailyReview}
                  disabled={dailyReviewData.dailyCards.length === 0}
                >
                  <span className="btn-icon">📚</span>
                  <div className="btn-text">
                    <span className="btn-title">
                      {goalCompleted ? 'Review Again' : 'Start Daily Review'}
                    </span>
                    <span className="btn-subtitle">
                      {dailyReviewData.dailyCards.length === 0 
                        ? 'No cards available'
                        : `${dailyReviewData.dailyCards.length} cards ready`
                      }
                    </span>
                  </div>
                </button>

                {goalCompleted && dailyReviewData.canStudyMore && (
                  <button 
                    className="study-more-btn"
                    onClick={handleStudyMore}
                  >
                    <span className="btn-icon">➕</span>
                    Study More (+{preferences.studyMoreIncrement || 10})
                  </button>
                )}
              </div>
            </div>

            {/* Stats Row - Compact */}
            <div className="stats-row">
              <div className="stat-item">
                <span className="stat-number">{studiedToday.length}</span>
                <span className="stat-label">Studied Today</span>
              </div>
              <div className="stat-item">
                <span className="stat-number">{dailyProgress.percentage}%</span>
                <span className="stat-label">Goal Progress</span>
              </div>
              {dailyReviewData.stats.availableTotal > 0 && (
                <div className="stat-item">
                  <span className="stat-number">{dailyReviewData.stats.availableTotal}</span>
                  <span className="stat-label">Available Cards</span>
                </div>
              )}
              {hasStudiedMore && (
                <div className="stat-item extra">
                  <span className="stat-number">✨</span>
                  <span className="stat-label">Extra Effort!</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* SECTION 2: Browse by Curriculum */}
        <div className="curriculum-section">
          <h2>📖 Browse by Curriculum</h2>
          <div className="folders-grid">
            
            {/* LUDUS Folder */}
            <div className="folder-card active" onClick={() => handleFolderClick('ludus')}>
              <div className="folder-icon">📚</div>
              <div className="folder-content">
                <h3>LUDUS</h3>
                <p className="folder-description">680 words • 64 chapters</p>
                <div className="folder-stats">
                  <span className="stat-item">✓ Fully Available</span>
                </div>
              </div>
              <div className="folder-arrow">→</div>
            </div>

            {/* CAESAR Folder */}
            <div className="folder-card disabled">
              <div className="folder-icon">🏛️</div>
              <div className="folder-content">
                <h3>CAESAR</h3>
                <p className="folder-description">Coming Soon</p>
                <div className="folder-stats">
                  <span className="stat-item coming-soon">⏳ In Development</span>
                </div>
              </div>
            </div>

            {/* CICERO Folder */}
            <div className="folder-card disabled">
              <div className="folder-icon">🗣️</div>
              <div className="folder-content">
                <h3>CICERO</h3>
                <p className="folder-description">Coming Soon</p>
                <div className="folder-stats">
                  <span className="stat-item coming-soon">⏳ In Development</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <DailyReviewSettings 
          onClose={() => setShowSettings(false)}
          onSave={handleSettingsSaved}
        />
      )}
    </div>
  );
};

export default FlashcardsPage; 