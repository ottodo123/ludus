import React, { useState, useMemo, useEffect } from 'react';
import { useFlashcards } from '../contexts/FlashcardContext';
import { groupCardsByLesson, filterCardsByPartOfSpeech, getPartsOfSpeechWithCounts } from '../utils/dataProcessor';
import { getDueCards } from '../utils/sm2Algorithm';
import '../styles/LudusFolder.css';

const OvidFolder = ({ onBack, onStartStudy }) => {
  const { cards, resetProgress } = useFlashcards();
  const [showFilters, setShowFilters] = useState(false);
  const [openDropdown, setOpenDropdown] = useState(null);
  const [filterMode, setFilterMode] = useState('chapter'); // 'chapter', 'alphabetical', or part of speech value
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 1200);
  const [viewMode, setViewMode] = useState('chapters'); // 'chapters' or 'vocabulary'
  const [selectedChapter, setSelectedChapter] = useState(null);

  const ovidCards = useMemo(() => 
    cards.filter(card => card.curriculum === 'OVID'), 
    [cards]
  );

  const filteredCards = useMemo(() => {
    // Filter by part of speech if filterMode is not a sort mode
    if (filterMode === 'chapter' || filterMode === 'alphabetical') {
      return ovidCards;
    } else {
      return filterCardsByPartOfSpeech(ovidCards, filterMode);
    }
  }, [ovidCards, filterMode]);

  const lessonGroups = useMemo(() => 
    groupCardsByLesson(filteredCards),
    [filteredCards]
  );

  const partsOfSpeech = useMemo(() => 
    getPartsOfSpeechWithCounts(ovidCards),
    [ovidCards]
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
      case 'review-due':
        const dueCards = getDueCards(lessonCards);
        if (dueCards.length > 0) {
          onStartStudy(dueCards);
        }
        break;
      case 'practice':
        // Practice mode - random order, no SRS impact
        const shuffledCards = [...lessonCards].sort(() => Math.random() - 0.5);
        onStartStudy(shuffledCards, true);
        break;
      default:
        break;
    }
  };

  const handleResetChapter = (lesson) => {
    const lessonCards = lessonGroups[lesson] || [];
    
    if (lessonCards.length === 0) return;
    
    const confirmReset = window.confirm(
      `Are you sure you want to reset all progress for ${typeof lesson === 'string' ? lesson : `Chapter ${lesson}`}? This will clear all review data and cannot be undone.`
    );
    
    if (confirmReset) {
      const cardIds = lessonCards.map(card => card.id);
      resetProgress(cardIds);
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

  // Get all sections for Ovid curriculum (using text identifiers)
  const allLessons = useMemo(() => {
    const lessons = ovidCards.map(card => card.lesson_number);
    const uniqueLessons = [...new Set(lessons)];
    // Sort sections in a logical order
    return uniqueLessons.sort((a, b) => {
      // Handle numeric vs string comparison
      if (typeof a === 'string' && typeof b === 'string') {
        return a.localeCompare(b);
      }
      return a - b;
    });
  }, [ovidCards]);

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

  // If a chapter is selected, show chapter detail view
  if (selectedChapter) {
    const chapterCards = lessonGroups[selectedChapter] || [];
    return (
      <div className="ludus-folder">
        <button className="back-btn" onClick={() => setSelectedChapter(null)}>
          ← Back to OVID
        </button>
        <h1 className="main-title">{typeof selectedChapter === 'string' ? selectedChapter : `Chapter ${selectedChapter}`}</h1>
        
        <div className="vocabulary-container">
          <div className="vocabulary-controls">
            <div className="controls-left">
              <span className="word-counter">{chapterCards.length} words</span>
              {chapterCards.length > 0 && (() => {
                const stats = getLessonStats(selectedChapter);
                return (
                  <>
                    <span className="stat-separator"> • </span>
                    <span className="stat-label">Due:</span>
                    <span className={`stat-badge ${stats.due > 0 ? 'stat-due' : 'stat-zero'}`}>{stats.due}</span>
                    <span className="stat-separator"> • </span>
                    <span className="stat-label">New:</span>
                    <span className="stat-badge stat-new">{stats.newCards}</span>
                    <span className="stat-separator"> • </span>
                    <span className="stat-label">Learned:</span>
                    <span className="stat-badge stat-learned">{stats.learned}</span>
                  </>
                );
              })()}
            </div>
            <div className="controls-right">
              {chapterCards.length > 0 && (() => {
                const stats = getLessonStats(selectedChapter);
                return (
                  <div className="chapter-actions">
                    <button 
                      className={`action-btn ${stats.due > 0 ? 'primary' : 'disabled'}`} 
                      onClick={() => handleLessonAction(selectedChapter, 'review-due')}
                      disabled={stats.due === 0}
                    >
                      Review Due
                    </button>
                    <button 
                      className="action-btn tertiary" 
                      onClick={() => handleLessonAction(selectedChapter, 'practice')}
                    >
                      Practice Mode
                    </button>
                  </div>
                );
              })()}
            </div>
          </div>
          
          {chapterCards.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📚</div>
              <h3>No words in this chapter</h3>
            </div>
          ) : (
            <div className="vocabulary-list">
              {chapterCards.map((card, index) => (
                <div key={card.id} className="vocabulary-item">
                  <div className="vocabulary-word">
                    <span className="chapter-badge">OVI {card.lesson_number}</span>
                    <span className="word-text">
                      {card.latin_headword}
                      {card.latin_endings ? `, ${card.latin_endings}` : ''}
                    </span>
                    <span className="pos-badge">{card.part_of_speech}</span>
                  </div>
                  <div className="vocabulary-meaning">{card.english}</div>
                  <div className="vocabulary-status">
                    <span className="status-new">OVI</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="ludus-folder">
      {/* Header Elements (no container) */}
      <button className="back-btn" onClick={onBack}>
        ← Dashboard
      </button>
      <h1 className="main-title">OVID</h1>
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
              <div 
                key={lesson} 
                className={`lesson-row ${!hasCards ? 'empty' : ''}`}
                onClick={() => setSelectedChapter(lesson)}
                style={{cursor: 'pointer'}}
              > 
                <div className="lesson-header">
                  <div className="lesson-title-group">
                    <h3 className="clickable-chapter-title">
                      {typeof lesson === 'string' ? lesson : `Chapter ${lesson}`}
                    </h3>
                    <button 
                      className="reset-btn" 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleResetChapter(lesson);
                      }}
                      title="Reset chapter progress"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/>
                        <path d="M21 3v5h-5"/>
                        <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/>
                        <path d="M3 21v-5h5"/>
                      </svg>
                    </button>
                  </div>
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
                          <button className="action-btn primary" onClick={(e) => { e.stopPropagation(); setOpenDropdown(openDropdown === lesson ? null : lesson); }}>Study</button>
                          {openDropdown === lesson && (
                            <div className="dropdown-menu">
                              <button className="dropdown-item" onClick={(e) => { e.stopPropagation(); handleLessonAction(lesson, 'review-due'); setOpenDropdown(null); }} disabled={stats.due === 0}>Review Due</button>
                              <button className="dropdown-item" onClick={(e) => { e.stopPropagation(); handleLessonAction(lesson, 'practice'); setOpenDropdown(null); }}>Practice Mode</button>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="desktop-actions">
                          <button className={`action-btn ${stats.due > 0 ? 'primary' : 'disabled'}`} onClick={(e) => { e.stopPropagation(); handleLessonAction(lesson, 'review-due'); }} disabled={stats.due === 0}>Review Due</button>
                          <button className="action-btn tertiary" onClick={(e) => { e.stopPropagation(); handleLessonAction(lesson, 'practice'); }}>Practice Mode</button>
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
              <span className="word-counter">{sortedVocabularyCards.length} words • {allLessons.length} sections</span>
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

export default OvidFolder;