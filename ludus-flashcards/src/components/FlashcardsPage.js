import React, { useState, useEffect, useMemo } from 'react';
import { useFlashcards } from '../contexts/FlashcardContext';
import { useAuth } from '../contexts/AuthContext';
import { 
  getDailyReviewCards, 
  getStudyMoreCards, 
  getSelectionSummary 
} from '../utils/dailyReview';
import LudusFolder from './LudusFolder';
import CaesarFolder from './CaesarFolder';
import CiceroFolder from './CiceroFolder';
import ApuleiusFolder from './ApuleiusFolder';
import OvidFolder from './OvidFolder';
import AeneidFolder from './AeneidFolder';
import StudySession from './StudySession';
import SettingsPage from './SettingsPage';
import SavedListsFolder from './SavedListsFolder';
import { getSavedWordSessions } from '../services/userDataService';
import '../styles/FlashcardsPage.css';

const FlashcardsPage = () => {
  const { cards, preferences, getStudiedToday, statistics } = useFlashcards();
  const { user } = useAuth();
  const [currentView, setCurrentView] = useState('main'); // 'main', 'ludus', 'caesar', 'cicero', 'apuleius', 'ovid', 'aeneid', 'study', 'settings', 'savedLists'
  const [studyCards, setStudyCards] = useState([]);
  const [isPracticeMode, setIsPracticeMode] = useState(false);

  const [isStudying, setIsStudying] = useState(false);
  const [currentStudyCards, setCurrentStudyCards] = useState([]);
  const [hasStudiedMore, setHasStudiedMore] = useState(false);
  const [isInDailyReviewFlow, setIsInDailyReviewFlow] = useState(false);
  
  const [savedSessions, setSavedSessions] = useState([]);
  const [savedWordsCount, setSavedWordsCount] = useState(0);
  const [selectedSession, setSelectedSession] = useState(null);

  // Load saved sessions data when component mounts
  useEffect(() => {
    const loadSavedSessions = async () => {
      if (user) {
        try {
          const sessionsData = await getSavedWordSessions(user.uid);
          setSavedSessions(sessionsData.sessions || []);
          const totalWords = sessionsData.sessions.reduce((count, session) => count + session.words.length, 0);
          setSavedWordsCount(totalWords);
        } catch (error) {
          console.error('Error loading saved sessions:', error);
          setSavedSessions([]);
          setSavedWordsCount(0);
        }
      } else {
        setSavedSessions([]);
        setSavedWordsCount(0);
      }
    };

    loadSavedSessions();
  }, [user]);

  // Get today's studied count from context
  const studiedTodayCount = getStudiedToday();

  // Get card counts for each curriculum
  const curriculumCounts = useMemo(() => {
    const counts = {};
    ['LUDUS', 'CAESAR', 'CICERO', 'APULEIUS', 'OVID', 'AENEID'].forEach(curriculum => {
      const curriculumCards = cards.filter(card => card.curriculum === curriculum);
      if (curriculum === 'AENEID') {
        // For Aeneid, count unique sections instead of max lesson number
        const uniqueSections = [...new Set(curriculumCards.map(card => card.chapter))].length;
        counts[curriculum] = {
          total: curriculumCards.length,
          chapters: uniqueSections
        };
      } else {
        counts[curriculum] = {
          total: curriculumCards.length,
          chapters: curriculumCards.length > 0 ? Math.max(...curriculumCards.map(card => card.lesson_number)) : 0
        };
      }
    });
    return counts;
  }, [cards]);

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
    setCurrentView(folder);
  };

  const handleBackToMain = () => {
    setCurrentView('main');
    setStudyCards([]);
    setIsPracticeMode(false);
    setSelectedSession(null);
  };

  const handleBackToLudus = () => {
    setCurrentView('ludus');
    setStudyCards([]);
    setIsPracticeMode(false);
  };

  const handleBackToSavedLists = () => {
    setCurrentView('savedLists');
    setStudyCards([]);
    setIsPracticeMode(false);
  };

  const handleStartLessonStudy = (lessonCards, isPracticeMode = false) => {
    setStudyCards(lessonCards);
    setIsPracticeMode(isPracticeMode);
    setCurrentView('study');
  };

  const handleStartSavedListStudy = (lessonCards, isPracticeMode = false) => {
    setStudyCards(lessonCards);
    setIsPracticeMode(isPracticeMode);
    setCurrentView('savedListStudy');
  };

  const handleRecentListClick = (session) => {
    setSelectedSession(session);
    setCurrentView('savedLists');
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
    setCurrentView('settings');
  };

  const handleSettingsBack = () => {
    setCurrentView('main');
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
        onBack={handleBackToLudus}
        isPracticeMode={isPracticeMode}
      />
    );
  }

  if (currentView === 'savedListStudy') {
    return (
      <StudySession
        cards={studyCards}
        onComplete={handleStudyComplete}
        onBack={handleBackToSavedLists}
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

  if (currentView === 'caesar') {
    return (
      <CaesarFolder
        onBack={handleBackToMain}
        onStartStudy={handleStartLessonStudy}
      />
    );
  }

  if (currentView === 'cicero') {
    return (
      <CiceroFolder
        onBack={handleBackToMain}
        onStartStudy={handleStartLessonStudy}
      />
    );
  }

  if (currentView === 'apuleius') {
    return (
      <ApuleiusFolder
        onBack={handleBackToMain}
        onStartStudy={handleStartLessonStudy}
      />
    );
  }

  if (currentView === 'ovid') {
    return (
      <OvidFolder
        onBack={handleBackToMain}
        onStartStudy={handleStartLessonStudy}
      />
    );
  }

  if (currentView === 'aeneid') {
    return (
      <AeneidFolder
        onBack={handleBackToMain}
        onStartStudy={handleStartLessonStudy}
      />
    );
  }

  if (currentView === 'settings') {
    return (
      <SettingsPage
        onBack={handleSettingsBack}
      />
    );
  }

  if (currentView === 'savedLists') {
    return (
      <SavedListsFolder
        savedSessions={savedSessions}
        onBack={handleBackToMain}
        onStartStudy={handleStartSavedListStudy}
        selectedSession={selectedSession}
        onSessionSelect={setSelectedSession}
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
                <p className="folder-description">{curriculumCounts.LUDUS.total} words • {curriculumCounts.LUDUS.chapters} chapters</p>
                <div className="folder-stats">
                  <span className="stat-item">✓ Fully Available</span>
                </div>
              </div>
              <div className="folder-arrow">→</div>
            </div>

            {/* CAESAR Folder */}
            <div className={`folder-card ${curriculumCounts.CAESAR.total > 0 ? 'active' : 'disabled'}`} 
                 onClick={() => curriculumCounts.CAESAR.total > 0 && handleFolderClick('caesar')}>
              <div className="folder-icon">🏛️</div>
              <div className="folder-content">
                <h3>CAESAR</h3>
                <p className="folder-description">
                  {curriculumCounts.CAESAR.total > 0 
                    ? `${curriculumCounts.CAESAR.total} words • De Bello Gallico`
                    : 'Coming Soon'
                  }
                </p>
                <div className="folder-stats">
                  {curriculumCounts.CAESAR.total > 0 ? (
                    <span className="stat-item">✓ Available</span>
                  ) : (
                    <span className="stat-item coming-soon">⏳ In Development</span>
                  )}
                </div>
              </div>
              {curriculumCounts.CAESAR.total > 0 && <div className="folder-arrow">→</div>}
            </div>

            {/* CICERO Folder */}
            <div className={`folder-card ${curriculumCounts.CICERO.total > 0 ? 'active' : 'disabled'}`}
                 onClick={() => curriculumCounts.CICERO.total > 0 && handleFolderClick('cicero')}>
              <div className="folder-icon">🗣️</div>
              <div className="folder-content">
                <h3>CICERO</h3>
                <p className="folder-description">
                  {curriculumCounts.CICERO.total > 0 
                    ? `${curriculumCounts.CICERO.total} words • In Catilinam`
                    : 'Coming Soon'
                  }
                </p>
                <div className="folder-stats">
                  {curriculumCounts.CICERO.total > 0 ? (
                    <span className="stat-item">✓ Available</span>
                  ) : (
                    <span className="stat-item coming-soon">⏳ In Development</span>
                  )}
                </div>
              </div>
              {curriculumCounts.CICERO.total > 0 && <div className="folder-arrow">→</div>}
            </div>

            {/* APULEIUS Folder */}
            <div className={`folder-card ${curriculumCounts.APULEIUS.total > 0 ? 'active' : 'disabled'}`}
                 onClick={() => curriculumCounts.APULEIUS.total > 0 && handleFolderClick('apuleius')}>
              <div className="folder-icon">🏺</div>
              <div className="folder-content">
                <h3>APULEIUS</h3>
                <p className="folder-description">
                  {curriculumCounts.APULEIUS.total > 0 
                    ? `${curriculumCounts.APULEIUS.total} words • Metamorphoses`
                    : 'Coming Soon'
                  }
                </p>
                <div className="folder-stats">
                  {curriculumCounts.APULEIUS.total > 0 ? (
                    <span className="stat-item">✓ Available</span>
                  ) : (
                    <span className="stat-item coming-soon">⏳ In Development</span>
                  )}
                </div>
              </div>
              {curriculumCounts.APULEIUS.total > 0 && <div className="folder-arrow">→</div>}
            </div>

            {/* OVID Folder */}
            <div className={`folder-card ${curriculumCounts.OVID.total > 0 ? 'active' : 'disabled'}`}
                 onClick={() => curriculumCounts.OVID.total > 0 && handleFolderClick('ovid')}>
              <div className="folder-icon">🌟</div>
              <div className="folder-content">
                <h3>OVID</h3>
                <p className="folder-description">
                  {curriculumCounts.OVID.total > 0 
                    ? `${curriculumCounts.OVID.total} words • Metamorphoses`
                    : 'Coming Soon'
                  }
                </p>
                <div className="folder-stats">
                  {curriculumCounts.OVID.total > 0 ? (
                    <span className="stat-item">✓ Available</span>
                  ) : (
                    <span className="stat-item coming-soon">⏳ In Development</span>
                  )}
                </div>
              </div>
              {curriculumCounts.OVID.total > 0 && <div className="folder-arrow">→</div>}
            </div>

            {/* AENEID Folder */}
            <div className={`folder-card ${curriculumCounts.AENEID.total > 0 ? 'active' : 'disabled'}`}
                 onClick={() => curriculumCounts.AENEID.total > 0 && handleFolderClick('aeneid')}>
              <div className="folder-icon">⚔️</div>
              <div className="folder-content">
                <h3>AENEID</h3>
                <p className="folder-description">
                  {curriculumCounts.AENEID.total > 0 
                    ? `${curriculumCounts.AENEID.total} words • ${curriculumCounts.AENEID.chapters} sections`
                    : 'Coming Soon'
                  }
                </p>
                <div className="folder-stats">
                  {curriculumCounts.AENEID.total > 0 ? (
                    <span className="stat-item">✓ Available</span>
                  ) : (
                    <span className="stat-item coming-soon">⏳ In Development</span>
                  )}
                </div>
              </div>
              {curriculumCounts.AENEID.total > 0 && <div className="folder-arrow">→</div>}
            </div>
          </div>
        </div>

        {/* SECTION 3: Browse Saved Lists */}
        <div className="saved-lists-section">
          <div className="saved-lists-header">
            <h2>📝 Browse Saved Lists</h2>
            {user && savedSessions.length > 0 && (
              <h3 className="recent-lists-title">Recent Lists</h3>
            )}
          </div>
          <div className="saved-lists-content">
            {!user ? (
              <div className="auth-required">
                <p>Sign in to access your saved vocabulary lists</p>
              </div>
            ) : savedSessions.length === 0 ? (
              <div className="no-saved-lists">
                <div className="no-lists-icon">📚</div>
                <p>No saved lists yet</p>
                <p className="hint">Visit the glossary and save some words to create your first study list!</p>
              </div>
            ) : (
              <div className="saved-lists-grid">
                <div className="saved-lists-overview">
                  <button 
                    className="browse-saved-btn"
                    onClick={() => setCurrentView('savedLists')}
                  >
                    <span className="btn-icon">📝</span>
                    <div className="btn-text">
                      <span className="btn-title">Browse All Lists</span>
                      <span className="btn-subtitle">Study your saved vocabulary</span>
                    </div>
                    <div className="btn-arrow">→</div>
                  </button>
                  <div className="overview-stats">
                    <div className="stat-item">
                      <span className="stat-number">{savedSessions.length}</span>
                      <span className="stat-label">Saved Lists</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-number">{savedWordsCount}</span>
                      <span className="stat-label">Total Words</span>
                    </div>
                  </div>
                </div>
                
                {/* Preview of recent lists */}
                <div className="recent-lists">
                  <div className="recent-lists-preview">
                    {savedSessions
                      .sort((a, b) => new Date(b.startedAt) - new Date(a.startedAt))
                      .slice(0, 3)
                      .map((session) => (
                      <div 
                        key={session.id} 
                        className="recent-list-item"
                        onClick={() => handleRecentListClick(session)}
                      >
                        <div className="list-info">
                          <span className="list-name">{session.name}</span>
                          <span className="list-count">{session.words.length} words</span>
                        </div>
                        <span className="list-arrow">→</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FlashcardsPage; 