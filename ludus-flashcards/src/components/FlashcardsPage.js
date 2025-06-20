import React, { useState, useMemo } from 'react';
import { useFlashcards } from '../contexts/FlashcardContext';
import { getDueCards, calculateStudyStreak, calculateRetentionRate } from '../utils/sm2Algorithm';
import LudusFolder from './LudusFolder';
import StudySession from './StudySession';
import '../styles/FlashcardsPage.css';

const FlashcardsPage = () => {
  const { cards, statistics } = useFlashcards();
  const [currentView, setCurrentView] = useState('main'); // 'main', 'ludus', 'study'
  const [studyCards, setStudyCards] = useState([]);

  const dueCards = useMemo(() => getDueCards(cards), [cards]);
  const studyStreak = useMemo(() => calculateStudyStreak(cards), [cards]);
  const retentionRate = useMemo(() => calculateRetentionRate(cards), [cards]);

  const handleStartReview = () => {
    if (dueCards.length > 0) {
      setStudyCards(dueCards);
      setCurrentView('study');
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
  };

  const handleStartLessonStudy = (lessonCards) => {
    setStudyCards(lessonCards);
    setCurrentView('study');
  };

  if (currentView === 'study') {
    return (
      <StudySession
        cards={studyCards}
        onComplete={handleBackToMain}
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
            <h2>Daily Review</h2>
            <div className="review-stats">
              <div className="stat">
                <span className="stat-number">{dueCards.length}</span>
                <span className="stat-label">Due Today</span>
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
          
          <div className="review-action">
            <button
              className={`start-review-btn ${dueCards.length === 0 ? 'disabled' : ''}`}
              onClick={handleStartReview}
              disabled={dueCards.length === 0}
            >
              {dueCards.length > 0 ? 'Start Review' : 'No Cards Due'}
            </button>
            {dueCards.length > 0 && (
              <p className="review-description">
                Review {dueCards.length} cards that are due for spaced repetition
              </p>
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
            <button className="action-btn" disabled>
              <span className="action-icon">⚙️</span>
              Settings
              <span className="coming-soon-badge">Soon</span>
            </button>
            <button className="action-btn" disabled>
              <span className="action-icon">📤</span>
              Export Progress
              <span className="coming-soon-badge">Soon</span>
            </button>
          </div>
        </section>
      </div>
    </div>
  );
};

export default FlashcardsPage; 