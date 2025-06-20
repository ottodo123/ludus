import React, { useState, useMemo } from 'react';
import { useFlashcards } from '../contexts/FlashcardContext';
import { groupCardsByLesson, filterCardsByPartOfSpeech, getPartsOfSpeechWithCounts } from '../utils/dataProcessor';
import { getDueCards } from '../utils/sm2Algorithm';
import '../styles/LudusFolder.css';

const LudusFolder = ({ onBack, onStartStudy }) => {
  const { cards } = useFlashcards();
  const [selectedPartOfSpeech, setSelectedPartOfSpeech] = useState('all');
  const [showFilters, setShowFilters] = useState(false);

  const ludusCards = useMemo(() => 
    cards.filter(card => card.curriculum === 'LUDUS'), 
    [cards]
  );

  const filteredCards = useMemo(() => 
    filterCardsByPartOfSpeech(ludusCards, selectedPartOfSpeech),
    [ludusCards, selectedPartOfSpeech]
  );

  const lessonGroups = useMemo(() => 
    groupCardsByLesson(filteredCards),
    [filteredCards]
  );

  const partsOfSpeech = useMemo(() => 
    getPartsOfSpeechWithCounts(ludusCards),
    [ludusCards]
  );

  const handleLessonAction = (lesson, action) => {
    const lessonCards = lessonGroups[lesson] || [];
    
    switch (action) {
      case 'study-all':
        onStartStudy(lessonCards);
        break;
      case 'review-due':
        const dueCards = getDueCards(lessonCards);
        if (dueCards.length > 0) {
          onStartStudy(dueCards);
        }
        break;
      case 'practice':
        // Practice mode - random order, no SRS impact
        const shuffledCards = [...lessonCards].sort(() => Math.random() - 0.5);
        onStartStudy(shuffledCards);
        break;
      default:
        break;
    }
  };

  const getLessonStats = (lesson) => {
    const lessonCards = lessonGroups[lesson] || [];
    const total = lessonCards.length;
    const due = getDueCards(lessonCards).length;
    const newCards = lessonCards.filter(card => card.repetitions === 0).length;
    const learned = lessonCards.filter(card => card.repetitions > 0).length;
    
    return { total, due, newCards, learned };
  };

  const allLessons = Array.from({ length: 64 }, (_, i) => i + 1);

  return (
    <div className="ludus-folder">
      <div className="folder-header">
        <button className="back-btn" onClick={onBack}>
          ← Back to Flashcards
        </button>
        <h1>LUDUS Curriculum</h1>
        <p className="folder-subtitle">680 vocabulary words across 64 chapters</p>
      </div>

      {/* Filters Section */}
      <div className="filters-section">
        <button 
          className="toggle-filters-btn"
          onClick={() => setShowFilters(!showFilters)}
        >
          Filter by Part of Speech {showFilters ? '▼' : '▶'}
        </button>
        
        {showFilters && (
          <div className="filters-content">
            <div className="pos-filters">
              <button
                className={`pos-filter ${selectedPartOfSpeech === 'all' ? 'active' : ''}`}
                onClick={() => setSelectedPartOfSpeech('all')}
              >
                All ({ludusCards.length})
              </button>
              {partsOfSpeech.map(pos => (
                <button
                  key={pos.value}
                  className={`pos-filter ${selectedPartOfSpeech === pos.value ? 'active' : ''}`}
                  onClick={() => setSelectedPartOfSpeech(pos.value)}
                >
                  {pos.label.charAt(0).toUpperCase() + pos.label.slice(1)} ({pos.count})
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Lessons Grid */}
      <div className="lessons-container">
        <div className="lessons-grid">
          {allLessons.map(lesson => {
            const stats = getLessonStats(lesson);
            const hasCards = stats.total > 0;
            
            return (
              <div key={lesson} className={`lesson-card ${!hasCards ? 'empty' : ''}`}>
                <div className="lesson-header">
                  <h3>Chapter {lesson}</h3>
                  <span className="lesson-count">{stats.total} words</span>
                </div>

                {hasCards ? (
                  <>
                    <div className="lesson-stats">
                      <div className="stat-row">
                        <span className="stat-label">Due:</span>
                        <span className={`stat-value ${stats.due > 0 ? 'has-due' : ''}`}>
                          {stats.due}
                        </span>
                      </div>
                      <div className="stat-row">
                        <span className="stat-label">New:</span>
                        <span className="stat-value">{stats.newCards}</span>
                      </div>
                      <div className="stat-row">
                        <span className="stat-label">Learned:</span>
                        <span className="stat-value">{stats.learned}</span>
                      </div>
                    </div>

                    <div className="lesson-actions">
                      <button
                        className="action-btn primary"
                        onClick={() => handleLessonAction(lesson, 'study-all')}
                      >
                        Study All
                      </button>
                      
                      <button
                        className={`action-btn ${stats.due > 0 ? 'secondary' : 'disabled'}`}
                        onClick={() => handleLessonAction(lesson, 'review-due')}
                        disabled={stats.due === 0}
                      >
                        Review Due ({stats.due})
                      </button>
                      
                      <button
                        className="action-btn tertiary"
                        onClick={() => handleLessonAction(lesson, 'practice')}
                      >
                        Practice Mode
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="empty-lesson">
                    <p>No words match current filter</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Summary Stats */}
      <div className="summary-stats">
        <h3>Current Filter Summary</h3>
        <div className="summary-grid">
          <div className="summary-item">
            <span className="summary-number">{filteredCards.length}</span>
            <span className="summary-label">Total Words</span>
          </div>
          <div className="summary-item">
            <span className="summary-number">{getDueCards(filteredCards).length}</span>
            <span className="summary-label">Due for Review</span>
          </div>
          <div className="summary-item">
            <span className="summary-number">{filteredCards.filter(card => card.repetitions === 0).length}</span>
            <span className="summary-label">New Words</span>
          </div>
          <div className="summary-item">
            <span className="summary-number">{filteredCards.filter(card => card.repetitions > 0).length}</span>
            <span className="summary-label">Learning</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LudusFolder; 