import React, { useState, useEffect, useMemo } from 'react';
import { useFlashcards } from '../contexts/FlashcardContext';
import { 
  getDailyReviewCards, 
  getStudyMoreCards, 
  getSelectionSummary 
} from '../utils/dailyReview';
import LudusFolder from './LudusFolder';
import StudySession from './StudySession';
import DailyReviewSettings from './DailyReviewSettings';
import '../styles/FlashcardsPage.css';

const FlashcardsPage = () => {
  const { cards, preferences, getStudiedToday, statistics } = useFlashcards();
  const [currentView, setCurrentView] = useState('main'); // 'main', 'ludus', 'study'
  const [studyCards, setStudyCards] = useState([]);
  const [showSettings, setShowSettings] = useState(false);
  const [isPracticeMode, setIsPracticeMode] = useState(false);

  const [isStudying, setIsStudying] = useState(false);
  const [currentStudyCards, setCurrentStudyCards] = useState([]);
  const [hasStudiedMore, setHasStudiedMore] = useState(false);
  const [isInDailyReviewFlow, setIsInDailyReviewFlow] = useState(false);

  // Get today's studied count from context
  const studiedTodayCount = getStudiedToday();

  // Get daily review data
  const dailyReviewData = useMemo(() => {
    return getDailyReviewCards(cards, preferences);
  }, [cards, preferences]);

  // Get selection summary
  const selectionSummary = useMemo(() => {
    return getSelectionSummary(preferences, cards);
  }, [preferences, cards]);
  
  // Get daily progress using context statistics
  const dailyProgress = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const studiedToday = statistics.studiedTodayDate === today ? 
      (statistics.studiedToday || 0) : 0;
    const dailyGoal = preferences.dailyCardLimit || 20;
    const percentage = Math.min(100, Math.round((studiedToday / dailyGoal) * 100));
    
    return {
      completed: studiedToday,
      remaining: Math.max(0, dailyGoal - studiedToday),
      percentage,
      isComplete: studiedToday >= dailyGoal,
      total: dailyGoal
    };
  }, [statistics, preferences.dailyCardLimit]);

  // Check if daily goal is completed (either by studying enough cards OR studying all available)
  const goalCompleted = useMemo(() => {
    const standardGoalCompleted = dailyProgress.isComplete;
    const hasStudiedAllSelected = dailyReviewData.stats.hasStudiedAllSelected;
    return standardGoalCompleted || hasStudiedAllSelected;
  }, [dailyProgress.isComplete, dailyReviewData.stats.hasStudiedAllSelected]);

  // Reset studied today at midnight
  useEffect(() => {
    const now = new Date();
    const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    const msUntilMidnight = tomorrow.getTime() - now.getTime();

    const timer = setTimeout(() => {
      setHasStudiedMore(false);
    }, msUntilMidnight);

    return () => clearTimeout(timer);
  }, []);

  const handleStartDailyReview = () => {
    if (dailyReviewData.dailyCards.length === 0) {
      // If no daily cards, always try to find study more cards (since user clicked the button)
      const moreCards = getStudyMoreCards(cards, [], preferences); // Use empty array since context tracks the count
      if (moreCards.length > 0) {
        setCurrentStudyCards(moreCards);
        setIsInDailyReviewFlow(true);
        setIsStudying(true);
        setHasStudiedMore(true);
        return;
      }
      alert('Excellent work! You\'ve studied all available vocabulary in your selection. Consider adjusting your selection settings to include more content.');
      return;
    }
    
    setCurrentStudyCards(dailyReviewData.dailyCards);
    setIsInDailyReviewFlow(true);
    setIsStudying(true);
  };

  const handleStudyMoreFromSession = async (completedCards) => {
    // First, process the completed session - the grading happens in the StudySession component
    // So we just need to wait for Firebase writes and then get fresh study more cards
    
    // Wait a moment to ensure all Firebase writes from the completed session are processed
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Find study more cards
    const moreCards = getStudyMoreCards(cards, [], preferences); // Empty array since we're checking Firebase data
    
    if (moreCards.length === 0) {
      alert('Excellent work! You\'ve studied all available vocabulary. You\'ve achieved mastery of your selected content!');
      setIsStudying(false);
      setCurrentStudyCards([]);
      setIsInDailyReviewFlow(false);
      return;
    }
    
    // Start the new session with proper state management
    setCurrentStudyCards([]); // Clear first to force re-render
    // Keep setIsInDailyReviewFlow(true) - we're still in the daily review flow
    setHasStudiedMore(true);
    
    // Use setTimeout to ensure state updates are processed before starting new session
    setTimeout(() => {
      setCurrentStudyCards(moreCards);
    }, 100);
  };

  const handleFolderClick = (folder) => {
    if (folder === 'ludus') {
      setCurrentView('ludus');
    }
  };

  const handleBackToMain = () => {
    setCurrentView('main');
    setStudyCards([]);
    setIsPracticeMode(false);
  };

  const handleStartLessonStudy = (lessonCards, isPracticeMode = false) => {
    setStudyCards(lessonCards);
    setIsPracticeMode(isPracticeMode);
    setCurrentView('study');
  };

  const handleStudyComplete = (results) => {
    // Study session complete - the grading has already been handled by the context
    // No need to manually update studied today count as it's handled in gradeCard
    setIsStudying(false);
    setCurrentStudyCards([]);
    setIsInDailyReviewFlow(false);
  };

  const handleBackToFlashcards = () => {
    setIsStudying(false);
    setCurrentStudyCards([]);
    setIsInDailyReviewFlow(false);
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
        isPracticeMode={isPracticeMode}
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
        onStudyMore={handleStudyMoreFromSession}
        canStudyMore={isInDailyReviewFlow} // Always allow study more for any session in daily review flow
        isFromDailyReview={isInDailyReviewFlow}
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
                    {dailyReviewData.stats.hasStudiedAllSelected 
                      ? `Goal completed! (${dailyReviewData.stats.availableTotal} cards studied)`
                      : `${dailyProgress.completed} / ${dailyProgress.total} cards`
                    }
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
                  disabled={false}
                >
                  <span className="btn-icon">📚</span>
                  <div className="btn-text">
                    <span className="btn-title">
                      {dailyReviewData.dailyCards.length === 0 ? 'Study More' : goalCompleted ? 'Study More' : 'Start Daily Review'}
                    </span>
                    <span className="btn-subtitle">
                      {dailyReviewData.dailyCards.length === 0 
                        ? 'Continue studying additional vocabulary'
                        : `${dailyReviewData.dailyCards.length} cards ready`
                      }
                    </span>
                  </div>
                </button>


              </div>
            </div>

            {/* Stats Row - Compact */}
            <div className="stats-row">
              <div className="stat-item">
                <span className="stat-number">{studiedTodayCount}</span>
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