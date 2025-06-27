import React, { useState, useMemo, useEffect } from 'react';
import '../styles/SavedListsFolder.css';

const SavedListsFolder = ({ savedSessions, onBack, onStartStudy }) => {
  const [selectedSession, setSelectedSession] = useState(null);
  const [viewMode, setViewMode] = useState('sessions'); // 'sessions' or 'vocabulary'
  const [openDropdown, setOpenDropdown] = useState(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 1200);

  const handleSessionClick = (session) => {
    setSelectedSession(session);
  };

  // Get all vocabulary from all sessions for the vocabulary view
  const allVocabulary = useMemo(() => {
    const words = [];
    savedSessions.forEach((session) => {
      session.words.forEach((word, index) => {
        words.push({
          ...word,
          sessionName: session.name,
          sessionId: session.id,
          sessionDate: session.startedAt,
          uniqueId: `${session.id}-${index}`
        });
      });
    });
    // Sort alphabetically by Latin word (with safety check)
    return words.sort((a, b) => {
      const aLatin = a.dictionaryForm || a.latin || '';
      const bLatin = b.dictionaryForm || b.latin || '';
      return aLatin.localeCompare(bLatin);
    });
  }, [savedSessions]);

  // Extract first principal part from dictionary form for basic display
  const extractFirstPrincipalPart = (dictionaryForm) => {
    if (!dictionaryForm) return '';
    // Split by comma and take the first part, trim whitespace
    const firstPart = dictionaryForm.split(',')[0].trim();
    // Remove any parenthetical information
    return firstPart.split('(')[0].trim();
  };

  const handleStartStudy = (session, isPracticeMode = false) => {
    // Convert saved words to flashcard format matching LUDUS structure
    const flashcards = session.words.map((word, index) => {
      const fullForm = word.dictionaryForm || word.latin || 'Unknown';
      const headword = extractFirstPrincipalPart(fullForm);
      
      // Extract gender and endings from dictionary form for saved words
      let endings = '';
      
      // Check for direct gender property (Whitaker's format)
      if (word.gender && word.declension) {
        // For Whitaker's dictionary format, use gender and declension directly
        const declensionPart = word.declension.split(' ')[0]; // Get first part like "1" from "1 1"
        endings = `-${declensionPart}, ${word.gender.toLowerCase()}.`;
      } else if (word.gender) {
        // Just gender without declension
        endings = `, ${word.gender.toLowerCase()}.`;
      } else if (fullForm.includes(',')) {
        // Fallback to parsing dictionary form
        const parts = fullForm.split(',');
        if (parts.length > 1) {
          // Take everything after the first comma (endings and gender)
          endings = parts.slice(1).join(',').trim();
        }
      }
      
      return {
        id: `saved-${session.id}-${index}`,
        curriculum: 'SAVED_LISTS',
        lesson_number: session.name,
        latin_headword: headword,
        latin_endings: endings,
        // Store the full dictionary form for reference
        latin_full_form: fullForm,
        part_of_speech: word.partOfSpeech || 'Unknown',
        english: word.meaning || 'No meaning available',
        // SM-2 algorithm properties
        easeFactor: 2.5,
        interval: 0,
        repetitions: 0,
        nextReview: null,
        lastReviewed: null,
        // Additional properties
        displayMode: 'basic',
        isKnown: false,
        createdAt: new Date().toISOString(),
        isSavedWord: true
      };
    });

    onStartStudy(flashcards, isPracticeMode);
  };

  const handleStartAllVocabularyStudy = (isPracticeMode = false) => {
    // Convert all vocabulary to flashcard format matching LUDUS structure
    const flashcards = allVocabulary.map((word) => {
      const fullForm = word.dictionaryForm || word.latin || 'Unknown';
      const headword = extractFirstPrincipalPart(fullForm);
      
      // Extract gender and endings from dictionary form for saved words
      let endings = '';
      
      // Check for direct gender property (Whitaker's format)
      if (word.gender && word.declension) {
        // For Whitaker's dictionary format, use gender and declension directly
        const declensionPart = word.declension.split(' ')[0]; // Get first part like "1" from "1 1"
        endings = `-${declensionPart}, ${word.gender.toLowerCase()}.`;
      } else if (word.gender) {
        // Just gender without declension
        endings = `, ${word.gender.toLowerCase()}.`;
      } else if (fullForm.includes(',')) {
        // Fallback to parsing dictionary form
        const parts = fullForm.split(',');
        if (parts.length > 1) {
          // Take everything after the first comma (endings and gender)
          endings = parts.slice(1).join(',').trim();
        }
      }
      
      return {
        id: `saved-all-${word.uniqueId}`,
        curriculum: 'SAVED_LISTS',
        lesson_number: 'All Saved Lists',
        latin_headword: headword,
        latin_endings: endings,
        // Store the full dictionary form for reference
        latin_full_form: fullForm,
        part_of_speech: word.partOfSpeech || 'Unknown',
        english: word.meaning || 'No meaning available',
        // SM-2 algorithm properties
        easeFactor: 2.5,
        interval: 0,
        repetitions: 0,
        nextReview: null,
        lastReviewed: null,
        // Additional properties
        displayMode: 'basic',
        isKnown: false,
        createdAt: new Date().toISOString(),
        isSavedWord: true
      };
    });

    onStartStudy(flashcards, isPracticeMode);
  };

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 1200);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (selectedSession) {
    return (
      <div className="saved-lists-folder">
        <button className="back-btn" onClick={() => setSelectedSession(null)}>
          ← Back to Saved Lists
        </button>
        <h1 className="main-title">{selectedSession.name}</h1>

        
        <div className="vocabulary-container">
          <div className="vocabulary-controls">
            <div className="controls-left">
              <span className="word-counter">{selectedSession.words.length} words</span>
              {selectedSession.words.length > 0 && (
                <>
                  <span className="stat-separator"> • </span>
                  <span className="stat-label">Created:</span>
                  <span className="stat-badge">{new Date(selectedSession.startedAt).toLocaleDateString()}</span>
                </>
              )}
            </div>
            <div className="controls-right">
              {selectedSession.words.length > 0 && (
                <div className="session-actions">
                  <button 
                    className="action-btn primary"
                    onClick={() => handleStartStudy(selectedSession, false)}
                    disabled={selectedSession.words.length === 0}
                  >
                    Study
                  </button>
                  <button 
                    className="action-btn tertiary"
                    onClick={() => handleStartStudy(selectedSession, true)}
                    disabled={selectedSession.words.length === 0}
                  >
                    Practice Mode
                  </button>
                </div>
              )}
            </div>
          </div>
          
          {selectedSession.words.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📚</div>
              <h3>No words in this session</h3>
            </div>
          ) : (
            <div className="vocabulary-list">
              {selectedSession.words.map((word, index) => (
                <div key={index} className="vocabulary-item">
                  <div className="vocabulary-word">
                    <span className="chapter-badge">Saved</span>
                    <span className="word-text">{word.dictionaryForm || word.latin}</span>
                    <span className="pos-badge">{word.partOfSpeech || 'Unknown'}</span>
                  </div>
                  <div className="vocabulary-meaning">{word.meaning}</div>
                  <div className="vocabulary-status">
                    <span className="status-new">Saved</span>
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
    <div className="saved-lists-folder">
      {/* Header Elements (matching LUDUS structure) */}
      <button className="back-btn" onClick={onBack}>
        ← Dashboard
      </button>
      <h1 className="main-title">📝 Browse Saved Lists</h1>
      <div className="header-actions">
        <button 
          className={`view-toggle-btn ${viewMode === 'sessions' ? 'active' : ''}`}
          onClick={() => setViewMode('sessions')}
        >
          Session View
        </button>
        <button 
          className={`view-toggle-btn ${viewMode === 'vocabulary' ? 'active' : ''}`}
          onClick={() => setViewMode('vocabulary')}
        >
          All Vocabulary View
        </button>
      </div>

      {/* Mobile View Toggle */}
      <div className="view-toggle-section-mobile">
        <button 
          className={`view-toggle-btn ${viewMode === 'sessions' ? 'active' : ''}`}
          onClick={() => setViewMode('sessions')}
        >
          Session View
        </button>
        <button 
          className={`view-toggle-btn ${viewMode === 'vocabulary' ? 'active' : ''}`}
          onClick={() => setViewMode('vocabulary')}
        >
          All Vocabulary View
        </button>
      </div>

      {/* Content based on view mode */}
      {viewMode === 'sessions' ? (
        <div className="lessons-container">
          {savedSessions.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📚</div>
              <h3>No saved lists yet</h3>
              <p>Visit the glossary and save some words to create your first study list!</p>
            </div>
          ) : (
            savedSessions.map((session) => (
              <div 
                key={session.id} 
                className="lesson-row"
                onClick={() => setSelectedSession(session)}
                style={{cursor: 'pointer'}}
              >
                <div className="lesson-header">
                  <div className="lesson-title-group">
                    <h3 className="clickable-session-title">
                      {session.name}
                    </h3>
                  </div>
                  <span className="lesson-count">{session.words.length} words</span>
                </div>
                <div className="lesson-stats">
                  <div className="stat-row desktop-stats">
                    <span className="stat-label">Created:</span>
                    <span className="stat-value">{new Date(session.startedAt).toLocaleDateString()}</span>
                  </div>
                  <div className="stat-row desktop-stats">
                    <span className="stat-label">Words:</span>
                    <span className="stat-value">{session.words.length}</span>
                  </div>
                </div>
                <div className="lesson-actions">
                  <div className="stat-circles mobile-stats">
                    <span className="stat-circle due-circle">{session.words.length}</span>
                  </div>
                  {isMobile ? (
                    <div className="mobile-actions">
                      <button className="action-btn primary" onClick={(e) => { e.stopPropagation(); setOpenDropdown(openDropdown === session.id ? null : session.id); }}>Study</button>
                      {openDropdown === session.id && (
                        <div className="dropdown-menu">
                          <button className="dropdown-item" onClick={(e) => { e.stopPropagation(); handleStartStudy(session, false); setOpenDropdown(null); }} disabled={session.words.length === 0}>Study Mode</button>
                          <button className="dropdown-item" onClick={(e) => { e.stopPropagation(); handleStartStudy(session, true); setOpenDropdown(null); }} disabled={session.words.length === 0}>Practice Mode</button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="desktop-actions">
                      <button 
                        className="action-btn primary"
                        onClick={(e) => { e.stopPropagation(); handleStartStudy(session, false); }}
                        disabled={session.words.length === 0}
                      >
                        Study
                      </button>
                      <button 
                        className="action-btn tertiary"
                        onClick={(e) => { e.stopPropagation(); handleStartStudy(session, true); }}
                        disabled={session.words.length === 0}
                      >
                        Practice Mode
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        <div className="vocabulary-container">
          {/* Controls Section - matching LUDUS vocabulary controls */}
          <div className="vocabulary-controls">
            <div className="controls-left">
              <span className="word-counter">{allVocabulary.length} words • {savedSessions.length} session{savedSessions.length !== 1 ? 's' : ''}</span>
            </div>
            <div className="controls-right">
              {/* No filter dropdown for saved lists, just action buttons */}
            </div>
          </div>
          
          {allVocabulary.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📚</div>
              <h3>No saved vocabulary yet</h3>
              <p>Visit the glossary and save some words to create your vocabulary collection!</p>
            </div>
          ) : (
            <div className="vocabulary-list">
              {allVocabulary.map((word) => (
                <div key={word.uniqueId} className="vocabulary-item">
                  <div className="vocabulary-word">
                    <span className="chapter-badge">{word.sessionName}</span>
                    <span className="word-text">{word.dictionaryForm || word.latin}</span>
                    {word.partOfSpeech && (
                      <span className="pos-badge">{word.partOfSpeech}</span>
                    )}
                  </div>
                  <div className="vocabulary-meaning">{word.meaning}</div>
                  <div className="vocabulary-status">
                    <span className="status-new">Saved</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SavedListsFolder;