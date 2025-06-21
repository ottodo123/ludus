import React from 'react';
import '../styles/StudyCompletionScreen.css';

const StudyCompletionScreen = ({ 
  sessionStats, 
  onComplete, 
  onStudyMore, 
  canStudyMore = false,
  studyMoreIncrement = 10,
  isFromDailyReview = false 
}) => {
  const sessionTime = sessionStats.endTime ? 
    Math.round((sessionStats.endTime - sessionStats.startTime) / 1000) : 0;
  
  const accuracy = sessionStats.correct + sessionStats.incorrect > 0 ?
    Math.round((sessionStats.correct / (sessionStats.correct + sessionStats.incorrect)) * 100) : 0;

  return (
    <div className="study-completion-screen">
      <div className="completion-container">
        <div className="completion-header">
          <div className="completion-icon">🎉</div>
          <h1>Session Complete!</h1>
          <p className="completion-subtitle">
            {isFromDailyReview ? 'Daily review completed' : 'Study session finished'}
          </p>
        </div>

        <div className="completion-stats">
          <div className="stat-card">
            <div className="stat-number">{sessionStats.correct + sessionStats.incorrect}</div>
            <div className="stat-label">Cards Studied</div>
          </div>
          
          <div className="stat-card">
            <div className="stat-number">{accuracy}%</div>
            <div className="stat-label">Accuracy</div>
          </div>
          
          <div className="stat-card">
            <div className="stat-number">{Math.floor(sessionTime / 60)}:{(sessionTime % 60).toString().padStart(2, '0')}</div>
            <div className="stat-label">Time</div>
          </div>
        </div>

        <div className="completion-details">
          <div className="detail-row">
            <span className="detail-icon correct">✓</span>
            <span className="detail-text">{sessionStats.correct} cards marked as known</span>
          </div>
          <div className="detail-row">
            <span className="detail-icon incorrect">✗</span>
            <span className="detail-text">{sessionStats.incorrect} cards need more review</span>
          </div>
        </div>

        <div className="completion-actions">
          {isFromDailyReview && canStudyMore && (
            <button 
              className="study-more-btn"
              onClick={onStudyMore}
            >
              <span className="btn-icon">➕</span>
              <div className="btn-content">
                <span className="btn-title">Continue Studying</span>
                <span className="btn-subtitle">{studyMoreIncrement} additional cards ready</span>
              </div>
            </button>
          )}
          
          <button 
            className="complete-btn"
            onClick={onComplete}
          >
            <span className="btn-icon">📚</span>
            Back to Flashcards
          </button>
        </div>

        {isFromDailyReview && (
          <div className="daily-goal-message">
            <p>🎯 Daily goal achieved! You can study more or return to review later.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudyCompletionScreen; 