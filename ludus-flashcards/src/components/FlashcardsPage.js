import React, { useState, useMemo } from 'react';
import { useFlashcards } from '../contexts/FlashcardContext';
import { calculateStudyStreak, calculateRetentionRate } from '../utils/sm2Algorithm';
import { getDailyReviewCards, getStudyMoreCards, getDailyProgress } from '../utils/dailyReview';
import LudusFolder from './LudusFolder';
import StudySession from './StudySession';
import DailyReviewSettings from './DailyReviewSettings';
import '../styles/FlashcardsPage.css';
import '../styles/DailyReviewSettings.css';

const FlashcardsPage = () => {
  const { cards, statistics, preferences } = useFlashcards();
  const [currentView, setCurrentView] = useState('main'); // 'main', 'ludus', 'study'
  const [studyCards, setStudyCards] = useState([]);
  const [showSettings, setShowSettings] = useState(false);
  const [studiedToday, setStudiedToday] = useState([]);
  const [isStudyMoreSession, setIsStudyMoreSession] = useState(false);

  // Get daily review data
  const dailyReviewData = useMemo(() => 
    getDailyReviewCards(cards, preferences), 
    [cards, preferences]
  );

  const studyStreak = useMemo(() => calculateStudyStreak(cards), [cards]);
  const retentionRate = useMemo(() => calculateRetentionRate(cards), [cards]);
  
  // Get daily progress
  const dailyProgress = useMemo(() => 
    getDailyProgress(studiedToday, preferences.dailyCardLimit || 20),
    [studiedToday, preferences.dailyCardLimit]
  );

  const handleStartDailyReview = () => {
    if (dailyReviewData.dailyCards.length > 0) {
      setStudyCards(dailyReviewData.dailyCards);
      setCurrentView('study');
      setIsStudyMoreSession(false);
    }
  };

  const handleStudyMore = () => {
    const moreCards = getStudyMoreCards(cards, studiedToday, preferences);
    if (moreCards.length > 0) {
      setStudyCards(moreCards);
      setCurrentView('study');
      setIsStudyMoreSession(true);
    }
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

  const handleStudyComplete = () => {
    // Add studied cards to today's session
    if (!isStudyMoreSession) {
      setStudiedToday(prev => [...prev, ...studyCards]);
    } else {
      setStudiedToday(prev => [...prev, ...studyCards]);
    }
    handleBackToMain();
  };

  const handleSettingsSave = () => {
    // Settings are automatically saved through context
    // Just close the modal
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

  return (
    <div className="flashcards-page">
      <div className="page-container">
        {/* Daily Review Section */}
        <section className="daily-review">
          <div className="review-header">
            <div className="review-title">
              <h2>Daily Review</h2>
              <button 
                className="settings-btn"
                onClick={() => setShowSettings(true)}
                title="Daily Review Settings"
              >
                ⚙️
              </button>
            </div>
            
            {/* Daily Progress Bar */}
            <div className="daily-progress">
              <div className="progress-header">
                <span>Today's Progress</span>
                <span>{dailyProgress.completed}/{dailyProgress.total} cards</span>
              </div>
              <div className="progress-bar">
                <div 
                  className="progress-fill"
                  style={{ width: `${dailyProgress.percentage}%` }}
                ></div>
              </div>
              {dailyProgress.isComplete && (
                <div className="progress-complete">🎉 Daily goal completed!</div>
              )}
            </div>

            <div className="review-stats">
              <div className="stat">
                <span className="stat-number">{dailyReviewData.stats.total}</span>
                <span className="stat-label">Ready to Review</span>
              </div>
              <div className="stat">
                <span className="stat-number">{studyStreak}</span>
                <span className="stat-label">Day Streak</span>
              </div>
              <div className="stat">
                <span className="stat-number">{statistics.totalReviews}</span>
                <span className="stat-label">Cards Reviewed</span>
              </div>
              <div className="stat">
                <span className="stat-number">{retentionRate}%</span>
                <span className="stat-label">Retention</span>
              </div>
            </div>
          </div>
          
          <div className="review-actions">
            {/* Primary Review Action */}
            <div className="primary-action">
              <button
                className={`start-review-btn ${dailyReviewData.stats.total === 0 ? 'disabled' : ''}`}
                onClick={handleStartDailyReview}
                disabled={dailyReviewData.stats.total === 0}
              >
                {dailyReviewData.stats.total > 0 ? 'Start Daily Review' : 'No Cards Ready'}
              </button>
              {dailyReviewData.stats.total > 0 && (
                <p className="review-description">
                  Review {dailyReviewData.stats.total} cards ({dailyReviewData.stats.due} due, {dailyReviewData.stats.learning} learning)
                </p>
              )}
            </div>

            {/* Study More Action */}
            {dailyProgress.isComplete && dailyReviewData.canStudyMore && (
              <div className="study-more-action">
                <button
                  className="study-more-btn"
                  onClick={handleStudyMore}
                >
                  Study More (+{dailyReviewData.stats.studyMoreIncrement})
                </button>
                <p className="study-more-description">
                  {dailyReviewData.availableForMore.due > 0 && 
                    `${dailyReviewData.availableForMore.due} due, `}
                  {dailyReviewData.availableForMore.learning > 0 &&
                    `${dailyReviewData.availableForMore.learning} learning cards available`}
                </p>
              </div>
            )}
          </div>
        </section>

        {/* Curriculum Folders Section */}
        <section className="curriculum-folders">
          <h2>Curriculum</h2>
          <div className="folders-grid">
            
            {/* LUDUS Folder - Fully Implemented */}
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

            {/* CAESAR Folder - Coming Soon */}
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

            {/* CICERO Folder - Coming Soon */}
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
        </section>

        {/* Quick Actions */}
        <section className="quick-actions">
          <h3>Quick Actions</h3>
          <div className="actions-grid">
            <button className="action-btn" onClick={() => handleFolderClick('ludus')}>
              <span className="action-icon">📖</span>
              Browse All Lessons
            </button>
            <button className="action-btn" disabled>
              <span className="action-icon">📊</span>
              View Statistics
              <span className="coming-soon-badge">Soon</span>
            </button>
            <button 
              className="action-btn" 
              onClick={() => setShowSettings(true)}
            >
              <span className="action-icon">⚙️</span>
              Daily Review Settings
            </button>
            <button className="action-btn" disabled>
              <span className="action-icon">📤</span>
              Export Progress
              <span className="coming-soon-badge">Soon</span>
            </button>
          </div>
        </section>
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <DailyReviewSettings
          onClose={() => setShowSettings(false)}
          onSave={handleSettingsSave}
        />
      )}
    </div>
  );
};

export default FlashcardsPage; 