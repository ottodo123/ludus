import React, { useState, useEffect } from 'react';
import '../styles/SavedWordsPage.css';
import { useAuth } from '../contexts/AuthContext';
import { 
  getSavedWordSessions, 
  deleteSavedWordSessions,
  debouncedSaveSessions 
} from '../services/userDataService';

const SavedWordsPage = ({ onBack }) => {
  const { user } = useAuth();
  const [savedWords, setSavedWords] = useState([]);
  const [sessions, setSessions] = useState([
    {
      id: 1,
      name: "Session 1",
      startedAt: new Date().toISOString(),
      words: []
    }
  ]);
  const [currentSessionId, setCurrentSessionId] = useState(1);
  const [editingSessionId, setEditingSessionId] = useState(null);
  const [editingSessionName, setEditingSessionName] = useState('');
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [showInflectionTable, setShowInflectionTable] = useState(false);

  // Load saved sessions from Firebase/localStorage on component mount
  useEffect(() => {
    const loadSavedSessions = async () => {
      if (user?.uid) {
        try {
          const firebaseData = await getSavedWordSessions(user.uid);
          
          if (firebaseData.sessions && firebaseData.sessions.length > 0) {
            setSessions(firebaseData.sessions);
            setCurrentSessionId(firebaseData.currentSessionId);
            
            const allWords = firebaseData.sessions.flatMap(session => session.words);
            setSavedWords(allWords);
            return;
          }
        } catch (error) {
          console.error('Error loading from Firebase:', error);
        }
      }
      
      // Fall back to localStorage
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
        } catch (error) {
          console.error('Error parsing saved sessions data:', error);
        }
      }
    };
    
    loadSavedSessions();
  }, [user]);

  // Save sessions whenever they change
  useEffect(() => {
    localStorage.setItem('glossary-sessions', JSON.stringify(sessions));
    localStorage.setItem('glossary-current-session-id', currentSessionId.toString());
    
    if (user?.uid && sessions.length > 0) {
      const sessionsData = { sessions, currentSessionId };
      debouncedSaveSessions(user.uid, sessionsData);
    }
  }, [sessions, currentSessionId, user]);

  const startNewSession = () => {
    const newSessionId = Math.max(...sessions.map(s => s.id)) + 1;
    const newSession = {
      id: newSessionId,
      name: `Session ${newSessionId}`,
      startedAt: new Date().toISOString(),
      words: []
    };
    setSessions(prev => [...prev, newSession]);
    setCurrentSessionId(newSessionId);
  };

  const deleteSession = (sessionId) => {
    if (window.confirm('Are you sure you want to delete this session and all its words?')) {
      const sessionToDelete = sessions.find(s => s.id === sessionId);
      
      if (sessionToDelete) {
        const wordsToRemove = sessionToDelete.words.map(word => word.id);
        setSavedWords(prev => prev.filter(word => !wordsToRemove.includes(word.id)));
        setSessions(prev => prev.filter(session => session.id !== sessionId));
        
        if (sessionId === currentSessionId) {
          const remainingSessions = sessions.filter(session => session.id !== sessionId);
          if (remainingSessions.length > 0) {
            setCurrentSessionId(remainingSessions[0].id);
          } else {
            const newSession = {
              id: 1,
              name: "Session 1",
              startedAt: new Date().toISOString(),
              words: []
            };
            setSessions([newSession]);
            setCurrentSessionId(1);
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
              {savedWords.length > 0 && (
                <button 
                  className="clear-all-btn"
                  onClick={async () => {
                    if (window.confirm('Are you sure you want to clear all saved words and sessions? This action cannot be undone.')) {
                      setSavedWords([]);
                      setSessions([{
                        id: 1,
                        name: "Session 1",
                        startedAt: new Date().toISOString(),
                        words: []
                      }]);
                      setCurrentSessionId(1);
                      
                      if (user?.uid) {
                        try {
                          await deleteSavedWordSessions(user.uid);
                        } catch (error) {
                          console.error('Error clearing Firebase sessions:', error);
                        }
                      }
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
            {savedWords.length === 0 ? (
              <div className="empty-state">
                <p>No saved words yet</p>
                <p className="hint">Go to the Glossary page and click the + button next to any word to save it here</p>
              </div>
            ) : (
              getSessionizedWords().map((session) => (
                <div key={session.id} className="session-group">
                  <div className="session-divider">
                    <div className="session-info">
                      {editingSessionId === session.id ? (
                        <div className="session-edit">
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
                        </div>
                      ) : (
                        <div className="session-display">
                          <div className="session-info-left">
                            <h4 
                              className="session-name"
                              onClick={() => startEditingSession(session.id, session.name)}
                              title="Click to rename session"
                            >
                              {session.name}
                            </h4>
                            <span className="session-date">
                              {new Date(session.startedAt).toLocaleDateString()}
                            </span>
                            <span className="session-count">
                              ({session.words.length} words)
                            </span>
                          </div>
                          <button
                            className="delete-session-btn"
                            onClick={() => deleteSession(session.id)}
                            title="Delete this session and all its words"
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M3 6h18m-2 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2m-6 5v6m4-6v6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          </button>
                        </div>
                      )}
                    </div>
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