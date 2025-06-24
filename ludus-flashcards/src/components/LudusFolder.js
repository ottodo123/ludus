import React, { useState, useMemo, useEffect } from 'react';
import { useFlashcards } from '../contexts/FlashcardContext';
import { groupCardsByLesson, filterCardsByPartOfSpeech, getPartsOfSpeechWithCounts } from '../utils/dataProcessor';
import { getDueCards } from '../utils/sm2Algorithm';
import '../styles/LudusFolder.css';

const LudusFolder = ({ onBack, onStartStudy }) => {
  const { cards } = useFlashcards();
  const [showFilters, setShowFilters] = useState(false);
  const [openDropdown, setOpenDropdown] = useState(null);
  const [filterMode, setFilterMode] = useState('chapter'); // 'chapter', 'alphabetical', or part of speech value
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 1200);
  const [viewMode, setViewMode] = useState('chapters'); // 'chapters' or 'vocabulary'

  const ludusCards = useMemo(() => 
    cards.filter(card => card.curriculum === 'LUDUS'), 
    [cards]
  );

  const filteredCards = useMemo(() => {
    // Filter by part of speech if filterMode is not a sort mode
    if (filterMode === 'chapter' || filterMode === 'alphabetical') {
      return ludusCards;
    } else {
      return filterCardsByPartOfSpeech(ludusCards, filterMode);
    }
  }, [ludusCards, filterMode]);

  const lessonGroups = useMemo(() => 
    groupCardsByLesson(filteredCards),
    [filteredCards]
  );

  const partsOfSpeech = useMemo(() => 
    getPartsOfSpeechWithCounts(ludusCards),
    [ludusCards]
  );

  // Sort filtered cards by chapter or alphabetically for vocabulary view
  const sortedVocabularyCards = useMemo(() => {
    const sorted = [...filteredCards];
    if (filterMode === 'alphabetical') {
      return sorted.sort((a, b) => a.latin_headword.localeCompare(b.latin_headword));
    } else {
      // Default to chapter sorting for all other modes (including part of speech filters)
      return sorted.sort((a, b) => a.lesson_number - b.lesson_number);
    }
  }, [filteredCards, filterMode]);

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

  // Get display text for current filter mode
  const getFilterDisplayText = () => {
    if (filterMode === 'chapter') return 'By Chapter';
    if (filterMode === 'alphabetical') return 'Alphabetical';
    const pos = partsOfSpeech.find(p => p.value === filterMode);
    return pos ? `${pos.label.charAt(0).toUpperCase() + pos.label.slice(1)} only` : 'Filter';
  };

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 1200);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="ludus-folder">
      {/* Header Elements (no container) */}
      <button className="back-btn" onClick={onBack}>
        ← Dashboard
      </button>
      <h1 className="main-title">LUDUS</h1>
      <div className="header-actions">
        <button 
          className={`view-toggle-btn ${viewMode === 'chapters' ? 'active' : ''}`}
          onClick={() => setViewMode('chapters')}
        >
          Chapter View
        </button>
        <button 
          className={`view-toggle-btn ${viewMode === 'vocabulary' ? 'active' : ''}`}
          onClick={() => setViewMode('vocabulary')}
        >
          All Vocabulary
        </button>
      </div>

      {/* Mobile View Toggle - only shows on intermediate/compact views */}
      <div className="view-toggle-section-mobile">
        <button 
          className={`view-toggle-btn ${viewMode === 'chapters' ? 'active' : ''}`}
          onClick={() => setViewMode('chapters')}
        >
          Chapter View
        </button>
        <button 
          className={`view-toggle-btn ${viewMode === 'vocabulary' ? 'active' : ''}`}
          onClick={() => setViewMode('vocabulary')}
        >
          All Vocabulary
        </button>
      </div>

      {/* Content based on view mode */}
      {viewMode === 'chapters' ? (
        <div className="lessons-container">
          {allLessons.map(lesson => {
            const stats = getLessonStats(lesson);
            const hasCards = stats.total > 0;
            return (
              <div key={lesson} className={`lesson-row ${!hasCards ? 'empty' : ''}`}> 
                <div className="lesson-header">
                  <h3>Chapter {lesson}</h3>
                  <span className="lesson-count">{stats.total} words</span>
                </div>
                {hasCards ? (
                  <>
                    <div className="lesson-stats">
                      <div className="stat-row desktop-stats">
                        <span className="stat-label">Due:</span>
                        <span className={`stat-value ${stats.due > 0 ? 'has-due' : ''}`}>{stats.due}</span>
                      </div>
                      <div className="stat-row desktop-stats">
                        <span className="stat-label">New:</span>
                        <span className="stat-value">{stats.newCards}</span>
                      </div>
                      <div className="stat-row desktop-stats">
                        <span className="stat-label">Learned:</span>
                        <span className="stat-value">{stats.learned}</span>
                      </div>
                    </div>
                    <div className="lesson-actions">
                      <div className="stat-circles mobile-stats">
                        <span className="stat-circle due-circle">{stats.due}</span>
                        <span className="stat-circle new-circle">{stats.newCards}</span>
                        <span className="stat-circle learned-circle">{stats.learned}</span>
                      </div>
                      {isMobile ? (
                        <div className="mobile-actions">
                          <button className="action-btn primary" onClick={() => setOpenDropdown(openDropdown === lesson ? null : lesson)}>Study</button>
                          {openDropdown === lesson && (
                            <div className="dropdown-menu">
                              <button className="dropdown-item" onClick={() => { handleLessonAction(lesson, 'study-all'); setOpenDropdown(null); }}>Study All</button>
                              <button className="dropdown-item" onClick={() => { handleLessonAction(lesson, 'review-due'); setOpenDropdown(null); }} disabled={stats.due === 0}>Review Due</button>
                              <button className="dropdown-item" onClick={() => { handleLessonAction(lesson, 'practice'); setOpenDropdown(null); }}>Practice Mode</button>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="desktop-actions">
                          <button className="action-btn primary" onClick={() => handleLessonAction(lesson, 'study-all')}>Study All</button>
                          <button className={`action-btn ${stats.due > 0 ? 'secondary' : 'disabled'}`} onClick={() => handleLessonAction(lesson, 'review-due')} disabled={stats.due === 0}>Review Due</button>
                          <button className="action-btn tertiary" onClick={() => handleLessonAction(lesson, 'practice')}>Practice Mode</button>
                        </div>
                      )}
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
      ) : (
        <div className="vocabulary-container">
          {/* Controls Section - only for vocabulary view */}
          <div className="vocabulary-controls">
            <div className="controls-left">
              <span className="word-counter">{sortedVocabularyCards.length} words • 64 chapters</span>
            </div>
            <div className="controls-right">
              <div className="filter-dropdown-container">
                <button 
                  className={`control-btn filter-dropdown-btn ${filterMode !== 'chapter' && filterMode !== 'alphabetical' ? 'active' : ''}`}
                  onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="22,3 2,3 10,12.46 10,19 14,21 14,12.46 22,3"></polygon>
                  </svg>
                  ▼
                </button>
                {showFilterDropdown && (
                  <div className="filter-dropdown-menu">
                    <button
                      className={`filter-dropdown-item ${filterMode === 'chapter' ? 'active' : ''}`}
                      onClick={() => { setFilterMode('chapter'); setShowFilterDropdown(false); }}
                    >
                      By Chapter
                    </button>
                    <button
                      className={`filter-dropdown-item ${filterMode === 'alphabetical' ? 'active' : ''}`}
                      onClick={() => { setFilterMode('alphabetical'); setShowFilterDropdown(false); }}
                    >
                      Alphabetical
                    </button>
                    <div className="filter-separator"></div>
                    {partsOfSpeech.map(pos => (
                      <button
                        key={pos.value}
                        className={`filter-dropdown-item ${filterMode === pos.value ? 'active' : ''}`}
                        onClick={() => { setFilterMode(pos.value); setShowFilterDropdown(false); }}
                      >
                        {pos.label.charAt(0).toUpperCase() + pos.label.slice(1)} only ({pos.count})
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="vocabulary-list">
            {sortedVocabularyCards.map((card, index) => (
              <div key={`${card.lesson}-${card.word}-${index}`} className="vocabulary-item">
                <div className="vocabulary-word">
                  <span className="chapter-badge">Ch. {card.lesson_number}</span>
                  <span className="word-text">{card.latin_headword}{card.latin_endings ? `, ${card.latin_endings}` : ''}</span>
                  <span className="pos-badge">{card.part_of_speech}</span>
                </div>
                <div className="vocabulary-meaning">{card.english}</div>
                <div className="vocabulary-status">
                  {card.repetitions === 0 ? (
                    <span className="status-new">New</span>
                  ) : card.nextReview && new Date(card.nextReview) <= new Date() ? (
                    <span className="status-due">Due</span>
                  ) : (
                    <span className="status-learning">Learning</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default LudusFolder; 