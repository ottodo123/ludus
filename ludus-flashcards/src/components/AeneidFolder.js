import React, { useState, useMemo, useEffect } from 'react';
import { useFlashcards } from '../contexts/FlashcardContext';
import { filterCardsByPartOfSpeech, getPartsOfSpeechWithCounts } from '../utils/dataProcessor';
import { getDueCards } from '../utils/sm2Algorithm';
import '../styles/AeneidFolder.css';

const AeneidFolder = ({ onBack, onStartStudy }) => {
  const { cards, resetProgress } = useFlashcards();
  const [openDropdown, setOpenDropdown] = useState(null);
  const [filterMode, setFilterMode] = useState('section'); // 'section', 'alphabetical', or part of speech value
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 1200);
  const [viewMode, setViewMode] = useState('sections'); // 'sections' or 'vocabulary'
  const [selectedSection, setSelectedSection] = useState(null);

  const aeneidCards = useMemo(() => 
    cards.filter(card => card.curriculum === 'AENEID'), 
    [cards]
  );

  const filteredCards = useMemo(() => {
    // Filter by part of speech if filterMode is not a sort mode
    if (filterMode === 'section' || filterMode === 'alphabetical') {
      return aeneidCards;
    } else {
      return filterCardsByPartOfSpeech(aeneidCards, filterMode);
    }
  }, [aeneidCards, filterMode]);

  // Group cards by their Chapter field (which contains the 25-line chunks like "I.1-25")
  const sectionGroups = useMemo(() => {
    const groups = {};
    filteredCards.forEach(card => {
      const section = card.chapter; // This contains values like "I.1-25", "I.26-50", etc.
      if (!groups[section]) {
        groups[section] = [];
      }
      groups[section].push(card);
    });
    
    // Sort cards within each section by Required_Order to preserve order
    Object.keys(groups).forEach(section => {
      groups[section].sort((a, b) => a.required_order - b.required_order);
    });
    
    return groups;
  }, [filteredCards]);

  const partsOfSpeech = useMemo(() => 
    getPartsOfSpeechWithCounts(aeneidCards),
    [aeneidCards]
  );

  // Sort filtered cards by section or alphabetically for vocabulary view
  const sortedVocabularyCards = useMemo(() => {
    const sorted = [...filteredCards];
    if (filterMode === 'alphabetical') {
      return sorted.sort((a, b) => a.latin_headword.localeCompare(b.latin_headword));
    } else {
      // Default to section/required order sorting
      return sorted.sort((a, b) => {
        // First sort by section (chapter)
        const sectionCompare = a.chapter.localeCompare(b.chapter);
        if (sectionCompare !== 0) return sectionCompare;
        // Then by required order within section
        return a.required_order - b.required_order;
      });
    }
  }, [filteredCards, filterMode]);

  const handleSectionAction = (section, action) => {
    const sectionCards = sectionGroups[section] || [];
    
    switch (action) {
      case 'review-due':
        const dueCards = getDueCards(sectionCards);
        if (dueCards.length > 0) {
          onStartStudy(dueCards);
        }
        break;
      case 'practice':
        // Practice mode - random order, no SRS impact
        const shuffledCards = [...sectionCards].sort(() => Math.random() - 0.5);
        onStartStudy(shuffledCards, true);
        break;
      default:
        break;
    }
  };

  const handleResetSection = (section) => {
    const sectionCards = sectionGroups[section] || [];
    
    if (sectionCards.length === 0) return;
    
    const confirmReset = window.confirm(
      `Are you sure you want to reset all progress for ${section}? This will clear all review data and cannot be undone.`
    );
    
    if (confirmReset) {
      const cardIds = sectionCards.map(card => card.id);
      resetProgress(cardIds);
    }
  };

  const getSectionStats = (section) => {
    const sectionCards = sectionGroups[section] || [];
    const total = sectionCards.length;
    const due = getDueCards(sectionCards).length;
    const newCards = sectionCards.filter(card => card.repetitions === 0).length;
    const learned = sectionCards.filter(card => card.repetitions > 0).length;
    
    return { total, due, newCards, learned };
  };

  // Get all unique sections and sort them properly
  const allSections = useMemo(() => {
    const sections = Object.keys(sectionGroups);
    return sections.sort((a, b) => {
      // Parse section format like "I.1-25" vs "I.26-50"
      const parseSection = (section) => {
        const match = section.match(/([IVX]+)\.(\d+)-(\d+)/);
        if (match) {
          const book = match[1];
          const startLine = parseInt(match[2]);
          return { book, startLine };
        }
        return { book: section, startLine: 0 };
      };
      
      const aData = parseSection(a);
      const bData = parseSection(b);
      
      // First compare by book
      if (aData.book !== bData.book) {
        return aData.book.localeCompare(bData.book);
      }
      
      // Then by starting line number
      return aData.startLine - bData.startLine;
    });
  }, [sectionGroups]);


  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 1200);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // If a section is selected, show section detail view
  if (selectedSection) {
    const sectionCards = sectionGroups[selectedSection] || [];
    return (
      <div className="aeneid-folder">
        <button className="back-btn" onClick={() => setSelectedSection(null)}>
          ← Back to Aeneid
        </button>
        <h1 className="main-title">{selectedSection}</h1>
        
        <div className="vocabulary-container">
          <div className="vocabulary-controls">
            <div className="controls-left">
              <span className="word-counter">{sectionCards.length} words</span>
              {sectionCards.length > 0 && (() => {
                const stats = getSectionStats(selectedSection);
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
              {sectionCards.length > 0 && (() => {
                const stats = getSectionStats(selectedSection);
                return (
                  <div className="section-actions">
                    <button 
                      className={`action-btn ${stats.due > 0 ? 'primary' : 'disabled'}`} 
                      onClick={() => handleSectionAction(selectedSection, 'review-due')}
                      disabled={stats.due === 0}
                    >
                      Review Due
                    </button>
                    <button 
                      className="action-btn tertiary" 
                      onClick={() => handleSectionAction(selectedSection, 'practice')}
                    >
                      Practice Mode
                    </button>
                  </div>
                );
              })()}
            </div>
          </div>
          
          {sectionCards.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📚</div>
              <h3>No words in this section</h3>
            </div>
          ) : (
            <div className="vocabulary-list">
              {sectionCards.map((card, index) => (
                <div key={card.id} className="vocabulary-item">
                  <div className="vocabulary-word">
                    <span className="book-line-badge">{card.book_line_ref}</span>
                    <span className="word-text">
                      {card.latin_headword}
                      {card.latin_endings ? `, ${card.latin_endings}` : ''}
                    </span>
                    <span className="pos-badge">{card.part_of_speech}</span>
                  </div>
                  <div className="vocabulary-meaning">{card.english}</div>
                  <div className="vocabulary-status">
                    <span className="status-new">AEN</span>
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
    <div className="aeneid-folder">
      {/* Header Elements (no container) */}
      <button className="back-btn" onClick={onBack}>
        ← Dashboard
      </button>
      <h1 className="main-title">Aeneid</h1>
      <div className="header-actions">
        <button 
          className={`view-toggle-btn ${viewMode === 'sections' ? 'active' : ''}`}
          onClick={() => setViewMode('sections')}
        >
          Section View
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
          className={`view-toggle-btn ${viewMode === 'sections' ? 'active' : ''}`}
          onClick={() => setViewMode('sections')}
        >
          Section View
        </button>
        <button 
          className={`view-toggle-btn ${viewMode === 'vocabulary' ? 'active' : ''}`}
          onClick={() => setViewMode('vocabulary')}
        >
          All Vocabulary
        </button>
      </div>

      {/* Content based on view mode */}
      {viewMode === 'sections' ? (
        <div className="lessons-container">
          {allSections.map(section => {
            const stats = getSectionStats(section);
            const hasCards = stats.total > 0;
            return (
              <div 
                key={section} 
                className={`lesson-row ${!hasCards ? 'empty' : ''}`}
                onClick={() => setSelectedSection(section)}
                style={{cursor: 'pointer'}}
              > 
                <div className="lesson-header">
                  <div className="lesson-title-group">
                    <h3 className="clickable-chapter-title">
                      {section}
                    </h3>
                    <button 
                      className="reset-btn" 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleResetSection(section);
                      }}
                      title="Reset section progress"
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
                          <button className="action-btn primary" onClick={(e) => { e.stopPropagation(); setOpenDropdown(openDropdown === section ? null : section); }}>Study</button>
                          {openDropdown === section && (
                            <div className="dropdown-menu">
                              <button className="dropdown-item" onClick={(e) => { e.stopPropagation(); handleSectionAction(section, 'review-due'); setOpenDropdown(null); }} disabled={stats.due === 0}>Review Due</button>
                              <button className="dropdown-item" onClick={(e) => { e.stopPropagation(); handleSectionAction(section, 'practice'); setOpenDropdown(null); }}>Practice Mode</button>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="desktop-actions">
                          <button className={`action-btn ${stats.due > 0 ? 'primary' : 'disabled'}`} onClick={(e) => { e.stopPropagation(); handleSectionAction(section, 'review-due'); }} disabled={stats.due === 0}>Review Due</button>
                          <button className="action-btn tertiary" onClick={(e) => { e.stopPropagation(); handleSectionAction(section, 'practice'); }}>Practice Mode</button>
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
              <span className="word-counter">{sortedVocabularyCards.length} words • {allSections.length} sections</span>
            </div>
            <div className="controls-right">
              <div className="filter-dropdown-container">
                <button 
                  className={`control-btn filter-dropdown-btn ${filterMode !== 'section' && filterMode !== 'alphabetical' ? 'active' : ''}`}
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
                      className={`filter-dropdown-item ${filterMode === 'section' ? 'active' : ''}`}
                      onClick={() => { setFilterMode('section'); setShowFilterDropdown(false); }}
                    >
                      By Section
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
              <div key={`${card.chapter}-${card.latin_headword}-${index}`} className="vocabulary-item">
                <div className="vocabulary-word">
                  <span className="book-line-badge">{card.book_line_ref}</span>
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

export default AeneidFolder;