import React, { useState, useEffect } from 'react';
import '../styles/SavedWordsPage.css';
import { useAuth } from '../contexts/AuthContext';
import { 
  getSavedWordSessions, 
  deleteSavedWordSessions,
  debouncedSaveSessions,
  saveSavedWordSessions 
} from '../services/userDataService';

const SavedWordsPage = ({ onBack }) => {
  const { user } = useAuth();
  const [savedWords, setSavedWords] = useState([]);
  const [sessions, setSessions] = useState(null); // Start with null to indicate not loaded
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const [editingSessionId, setEditingSessionId] = useState(null);
  const [editingSessionName, setEditingSessionName] = useState('');
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [showInflectionTable, setShowInflectionTable] = useState(false);
  const [isDataLoaded, setIsDataLoaded] = useState(false); // Track if initial load is complete
  const [deletedSessions, setDeletedSessions] = useState(null); // Trash bin for soft delete
  const [showTrash, setShowTrash] = useState(false); // Toggle trash view

  // Load saved sessions from Firebase/localStorage on component mount
  useEffect(() => {
    const loadSavedSessions = async () => {
      let dataFound = false;
      
      if (user?.uid) {
        try {
          const firebaseData = await getSavedWordSessions(user.uid);
          
          if (firebaseData.sessions && firebaseData.sessions.length > 0) {
            setSessions(firebaseData.sessions);
            setCurrentSessionId(firebaseData.currentSessionId);
            
            const allWords = firebaseData.sessions.flatMap(session => session.words);
            setSavedWords(allWords);
            dataFound = true;
          }
          
          // Load deleted sessions if they exist
          if (firebaseData.deletedSessions) {
            setDeletedSessions(firebaseData.deletedSessions);
          }
        } catch (error) {
          console.error('Error loading from Firebase:', error);
        }
      }
      
      // Fall back to localStorage if no Firebase data
      if (!dataFound) {
        const savedSessionsData = localStorage.getItem('glossary-sessions');
        const savedCurrentSessionId = localStorage.getItem('glossary-current-session-id');
        
        if (savedSessionsData) {
          try {
            const parsedSessions = JSON.parse(savedSessionsData);
            setSessions(parsedSessions);
            
            const allWords = parsedSessions.flatMap(session => session.words);
            setSavedWords(allWords);
            
            if (savedCurrentSessionId) {
              setCurrentSessionId(parseInt(savedCurrentSessionId, 10));
            }
            dataFound = true;
            
            // Load deleted sessions from localStorage
            const savedDeletedSessions = localStorage.getItem('glossary-deleted-sessions');
            if (savedDeletedSessions) {
              try {
                setDeletedSessions(JSON.parse(savedDeletedSessions));
              } catch (e) {
                console.error('Error parsing deleted sessions:', e);
              }
            }
          } catch (error) {
            console.error('Error parsing saved sessions data:', error);
          }
        }
      }
      
      // Only create default session if no data was found anywhere
      if (!dataFound) {
        const defaultSession = {
          id: 1,
          name: "Session 1",
          startedAt: new Date().toISOString(),
          words: []
        };
        setSessions([defaultSession]);
        setCurrentSessionId(1);
        setDeletedSessions([]); // Initialize empty trash
      }
      
      // Clean up old deleted items (older than 30 days)
      if (deletedSessions && deletedSessions.length > 0) {
        const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
        const cleaned = deletedSessions.filter(session => {
          const deletedAt = new Date(session.deletedAt).getTime();
          return deletedAt > thirtyDaysAgo;
        });
        if (cleaned.length !== deletedSessions.length) {
          setDeletedSessions(cleaned);
        }
      }
      
      // Mark data as loaded
      setIsDataLoaded(true);
    };
    
    loadSavedSessions();
  }, [user]);

  // Save sessions whenever they change (but only after initial load)
  useEffect(() => {
    // Skip saving if data hasn't been loaded yet or sessions is null
    if (!isDataLoaded || !sessions || !currentSessionId) {
      return;
    }
    
    localStorage.setItem('glossary-sessions', JSON.stringify(sessions));
    localStorage.setItem('glossary-current-session-id', currentSessionId.toString());
    if (deletedSessions) {
      localStorage.setItem('glossary-deleted-sessions', JSON.stringify(deletedSessions));
    }
    
    if (user?.uid) {
      const sessionsData = { 
        sessions, 
        currentSessionId,
        deletedSessions: deletedSessions || []
      };
      debouncedSaveSessions(user.uid, sessionsData);
    }
  }, [sessions, currentSessionId, deletedSessions, user, isDataLoaded]);

  // Cleanup function to save any pending changes when component unmounts
  useEffect(() => {
    return () => {
      // Save immediately on unmount if there are unsaved changes
      if (isDataLoaded && sessions && currentSessionId) {
        const sessionsData = { 
          sessions, 
          currentSessionId,
          deletedSessions: deletedSessions || []
        };
        localStorage.setItem('glossary-sessions', JSON.stringify(sessions));
        localStorage.setItem('glossary-current-session-id', currentSessionId.toString());
        if (deletedSessions) {
          localStorage.setItem('glossary-deleted-sessions', JSON.stringify(deletedSessions));
        }
        
        // Note: Firebase save is async and might not complete, but localStorage ensures data isn't lost
        if (user?.uid) {
          saveSavedWordSessions(user.uid, sessionsData).catch(error => {
            console.error('Error saving on unmount:', error);
          });
        }
      }
    };
  }, [sessions, currentSessionId, user, isDataLoaded]);

  const startNewSession = () => {
    const allSessionIds = [
      ...sessions.map(s => s.id),
      ...(deletedSessions?.map(s => s.id) || [])
    ];
    const newSessionId = allSessionIds.length > 0 ? Math.max(...allSessionIds) + 1 : 1;
    const newSession = {
      id: newSessionId,
      name: `Session ${sessions.length + 1}`,
      startedAt: new Date().toISOString(),
      words: []
    };
    setSessions(prev => [...prev, newSession]);
    setCurrentSessionId(newSessionId);
  };

  const restoreSession = (sessionId) => {
    const sessionToRestore = deletedSessions?.find(s => s.id === sessionId);
    if (!sessionToRestore) return;
    
    // Remove deletion metadata
    const { deletedAt, ...restoredSession } = sessionToRestore;
    
    // Restore to active sessions
    setSessions(prev => [...prev, restoredSession]);
    
    // Restore words
    const restoredWords = restoredSession.words;
    setSavedWords(prev => [...prev, ...restoredWords]);
    
    // Remove from trash
    setDeletedSessions(prev => prev.filter(session => session.id !== sessionId));
  };

  const emptyTrash = () => {
    if (!deletedSessions || deletedSessions.length === 0) return;
    
    const sessionCount = deletedSessions.length;
    const totalWords = deletedSessions.reduce((sum, s) => sum + s.words.length, 0);
    const confirmMessage = `Permanently delete ${sessionCount} session${sessionCount !== 1 ? 's' : ''} with ${totalWords} total word${totalWords !== 1 ? 's' : ''}?\n\nThis cannot be undone.`;
    
    if (window.confirm(confirmMessage)) {
      if (window.confirm('Are you absolutely sure? This will permanently delete all items in trash.')) {
        setDeletedSessions([]);
      }
    }
  };

  const deleteSession = (sessionId, isPermanent = false) => {
    const sessionToDelete = isPermanent 
      ? deletedSessions?.find(s => s.id === sessionId)
      : sessions.find(s => s.id === sessionId);
    if (!sessionToDelete) return;
    
    if (isPermanent) {
      // Permanent delete from trash
      const confirmMessage = `Are you sure you want to permanently delete "${sessionToDelete.name}"? This cannot be undone.`;
      if (window.confirm(confirmMessage)) {
        setDeletedSessions(prev => prev.filter(session => session.id !== sessionId));
      }
    } else {
      // Soft delete - move to trash
      const wordCount = sessionToDelete.words.length;
      const confirmMessage = wordCount > 0 
        ? `Move "${sessionToDelete.name}" with ${wordCount} word${wordCount !== 1 ? 's' : ''} to trash?\n\nYou can restore it within 30 days.`
        : `Move the empty session "${sessionToDelete.name}" to trash?`;
      
      if (window.confirm(confirmMessage)) {
        // Add deletion metadata
        const deletedSession = {
          ...sessionToDelete,
          deletedAt: new Date().toISOString()
        };
        
        // Move to trash
        setDeletedSessions(prev => [...(prev || []), deletedSession]);
        
        // Remove from active sessions
        const wordsToRemove = sessionToDelete.words.map(word => word.id);
        setSavedWords(prev => prev.filter(word => !wordsToRemove.includes(word.id)));
        setSessions(prev => prev.filter(session => session.id !== sessionId));
        
        if (sessionId === currentSessionId) {
          const remainingSessions = sessions.filter(session => session.id !== sessionId);
          if (remainingSessions.length > 0) {
            setCurrentSessionId(remainingSessions[0].id);
          } else {
            const newSession = {
              id: Date.now(), // Use timestamp for unique ID
              name: "Session 1",
              startedAt: new Date().toISOString(),
              words: []
            };
            setSessions([newSession]);
            setCurrentSessionId(newSession.id);
          }
        }
      }
    }
  };

  const removeFromSavedWords = (entryId) => {
    setSessions(prev => prev.map(session => ({
      ...session,
      words: session.words.filter(word => word.id !== entryId)
    })));
    setSavedWords(prev => prev.filter(saved => saved.id !== entryId));
  };

  const startEditingSession = (sessionId, currentName) => {
    setEditingSessionId(sessionId);
    setEditingSessionName(currentName);
  };

  const saveSessionName = () => {
    if (editingSessionName.trim()) {
      setSessions(prev => prev.map(session => 
        session.id === editingSessionId 
          ? { ...session, name: editingSessionName.trim() }
          : session
      ));
    }
    setEditingSessionId(null);
    setEditingSessionName('');
  };

  const cancelEditingSession = () => {
    setEditingSessionId(null);
    setEditingSessionName('');
  };

  const getSessionizedWords = () => {
    return sessions
      .slice()
      .sort((a, b) => new Date(b.startedAt) - new Date(a.startedAt));
  };

  return (
    <div className="saved-words-page">
      <div className="saved-words-container">
        <div className="page-header">
          <div className="page-header-nav">
            <button 
              className="back-btn"
              onClick={onBack}
              title="Back to Glossary"
            >
              ← Back to Glossary
            </button>
          </div>
          <h1>📚 Saved Words</h1>
          <p>Organize and manage your saved Latin vocabulary</p>
        </div>

        <div className="saved-words-content">
          <div className="saved-words-header">
            <div className="saved-words-title">
              <h3>Your Collections ({savedWords.length} total words)</h3>
            </div>
            <div className="saved-words-controls">
              <button 
                className="new-session-btn"
                onClick={startNewSession}
                title="Start a new session"
              >
                + New Session
              </button>
              <button 
                className={`trash-toggle-btn ${showTrash ? 'active' : ''}`}
                onClick={() => setShowTrash(!showTrash)}
                title={showTrash ? "Show active sessions" : "Show deleted sessions"}
              >
                🗑️ Deleted {deletedSessions && deletedSessions.length > 0 && `(${deletedSessions.length})`}
              </button>
              {savedWords.length > 0 && !showTrash && (
                <button 
                  className="clear-all-btn"
                  onClick={() => {
                    const totalWords = savedWords.length;
                    const totalSessions = sessions.length;
                    const confirmMessage = `Move ALL ${totalWords} saved word${totalWords !== 1 ? 's' : ''} across ${totalSessions} session${totalSessions !== 1 ? 's' : ''} to trash?\n\nYou can restore them within 30 days.`;
                    
                    if (window.confirm(confirmMessage)) {
                      // Move all sessions to trash with deletion timestamp
                      const deletedSessionsWithTimestamp = sessions.map(session => ({
                        ...session,
                        deletedAt: new Date().toISOString()
                      }));
                      
                      setDeletedSessions(prev => [...(prev || []), ...deletedSessionsWithTimestamp]);
                      setSavedWords([]);
                      
                      // Create new empty session
                      const newSession = {
                        id: Date.now(),
                        name: "Session 1",
                        startedAt: new Date().toISOString(),
                        words: []
                      };
                      setSessions([newSession]);
                      setCurrentSessionId(newSession.id);
                    }
                  }}
                  title="Clear all saved words"
                >
                  Clear All
                </button>
              )}
            </div>
          </div>

          <div className="saved-words-list">
            {!sessions ? (
              <div className="empty-state">
                <p>Loading saved words...</p>
              </div>
            ) : showTrash ? (
              // Trash view
              <>
                {deletedSessions && deletedSessions.length > 0 && (
                  <div className="trash-header">
                    <h4>Trash - Items will be permanently deleted after 30 days</h4>
                    <button 
                      className="empty-trash-btn"
                      onClick={emptyTrash}
                      title="Permanently delete all items in trash"
                    >
                      Empty Trash
                    </button>
                  </div>
                )}
                {!deletedSessions || deletedSessions.length === 0 ? (
                  <div className="empty-state">
                    <p>Trash is empty</p>
                    <p className="hint">Deleted sessions will appear here for 30 days</p>
                  </div>
                ) : (
                  deletedSessions.map((session) => {
                    const deletedDate = new Date(session.deletedAt);
                    const daysUntilPermanentDelete = Math.ceil((deletedDate.getTime() + 30 * 24 * 60 * 60 * 1000 - Date.now()) / (24 * 60 * 60 * 1000));
                    
                    return (
                      <div key={session.id} className="session-group deleted-session">
                        <div className="session-divider">
                          <h4 className="session-name deleted">{session.name}</h4>
                          <span className="session-count">({session.words.length} words)</span>
                          <span className="deletion-info">
                            Deleted {deletedDate.toLocaleDateString()} • {daysUntilPermanentDelete} days remaining
                          </span>
                          <button
                            className="restore-session-btn"
                            onClick={() => restoreSession(session.id)}
                            title="Restore this session"
                          >
                            ↩️ Restore
                          </button>
                          <button
                            className="delete-session-btn"
                            onClick={() => deleteSession(session.id, true)}
                            title="Permanently delete this session"
                          >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M3 6h18m-2 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2m-6 5v6m4-6v6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          </button>
                        </div>
                        <div className="session-words">
                          {session.words.length === 0 ? (
                            <div className="empty-session">
                              <p>No words in this session</p>
                            </div>
                          ) : (
                            session.words.slice(0, 5).map((word) => (
                              <div key={word.id} className="saved-word-item deleted-word">
                                <div className="saved-word-content">
                                  <div className="word-header">
                                    <strong>{word.dictionaryForm}</strong>
                                    <span className="part-of-speech">{word.partOfSpeechDisplay}</span>
                                  </div>
                                  <div className="word-meaning">{word.meaning}</div>
                                </div>
                              </div>
                            ))
                          )}
                          {session.words.length > 5 && (
                            <div className="more-words-indicator">
                              ...and {session.words.length - 5} more words
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </>
            ) : savedWords.length === 0 ? (
              <div className="empty-state">
                <p>No saved words yet</p>
                <p className="hint">Go to the Glossary page and click the + button next to any word to save it here</p>
              </div>
            ) : (
              getSessionizedWords().map((session) => (
                <div key={session.id} className="session-group">
                  <div className="session-divider">
                    {editingSessionId === session.id ? (
                      <input
                        type="text"
                        value={editingSessionName}
                        onChange={(e) => setEditingSessionName(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') saveSessionName();
                          if (e.key === 'Escape') cancelEditingSession();
                        }}
                        onBlur={saveSessionName}
                        autoFocus
                        className="session-name-input"
                      />
                    ) : (
                      <>
                        <h4 
                          className="session-name"
                          onClick={() => startEditingSession(session.id, session.name)}
                          title="Click to rename session"
                        >
                          {session.name}
                        </h4>
                        <span className="session-count">
                          ({session.words.length} words)
                        </span>
                        <span className="session-date">
                          {new Date(session.startedAt).toLocaleDateString()}
                        </span>
                        <button
                          className="delete-session-btn"
                          onClick={() => deleteSession(session.id)}
                          title="Delete this session and all its words"
                        >
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M3 6h18m-2 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2m-6 5v6m4-6v6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </button>
                      </>
                    )}
                  </div>
                  <div className="session-words">
                    {session.words.length === 0 ? (
                      <div className="empty-session">
                        <p>No words in this session yet</p>
                      </div>
                    ) : (
                      session.words
                        .slice()
                        .sort((a, b) => new Date(b.addedAt) - new Date(a.addedAt))
                        .map((word) => (
                        <div 
                          key={word.id} 
                          className={`saved-word-item ${(word.partOfSpeech === 'N' || word.partOfSpeech === 'V' || word.partOfSpeech === 'ADJ' || word.partOfSpeech === 'PRON') ? 'clickable' : ''}`}
                          onClick={() => {
                            if (word.partOfSpeech === 'N' || word.partOfSpeech === 'V' || word.partOfSpeech === 'ADJ' || word.partOfSpeech === 'PRON') {
                              setSelectedEntry(word);
                              setShowInflectionTable(true);
                            }
                          }}
                        >
                          <div className="saved-word-content">
                            <div className="word-header">
                              <strong>{word.dictionaryForm}</strong>
                              <span className="part-of-speech">{word.partOfSpeechDisplay}</span>
                            </div>
                            <div className="word-meaning">{word.meaning}</div>
                          </div>
                          <div className="saved-word-actions">
                            <button
                              className="remove-word-btn"
                              onClick={(e) => {
                                e.stopPropagation();
                                removeFromSavedWords(word.id);
                              }}
                              title="Remove from saved words"
                            >
                              ✕
                            </button>
                          </div>
                        </div>
                      )))}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SavedWordsPage;