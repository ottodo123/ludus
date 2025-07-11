import React, { useState, useEffect, useRef } from 'react';
import '../styles/SentencesPage.css';
import { useAuth } from '../contexts/AuthContext';
import { callClaudeAPI, checkApiStatus, extractNewWords } from '../services/claudeApi';

const SentencesPage = ({ onBack }) => {
  const { user } = useAuth();
  const [mode, setMode] = useState('Study'); // 'Study' or 'Learn'
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [newWordsLearned, setNewWordsLearned] = useState([]);
  const [showSettings, setShowSettings] = useState(false);
  const [apiError, setApiError] = useState(null);
  const [apiStatus, setApiStatus] = useState(null);
  const messagesEndRef = useRef(null);

  // Scroll to bottom when new messages are added
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Check API status on component mount
  useEffect(() => {
    const status = checkApiStatus();
    setApiStatus(status);
    if (!status.configured) {
      setApiError('Claude API key not configured. Please add your API key to use the chat feature.');
    }
  }, []);

  // Initialize with welcome message
  useEffect(() => {
    const welcomeMessage = {
      id: Date.now(),
      type: 'ai',
      content: mode === 'Study' 
        ? 'Welcome to Study Mode! I\'ll help you practice Latin using only vocabulary and grammar concepts you\'ve already learned. What would you like to practice today?'
        : 'Welcome to Learn Mode! I\'ll introduce new Latin words and grammar concepts one at a time. Ready to learn something new?',
      timestamp: new Date().toISOString()
    };
    setMessages([welcomeMessage]);
    setApiError(null); // Clear any previous errors when mode changes
  }, [mode]);

  // Close settings dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showSettings && !event.target.closest('.settings-container')) {
        setShowSettings(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showSettings]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!inputText.trim() || isLoading) return;

    // Check if API is configured
    if (!apiStatus?.configured) {
      setApiError('Claude API key not configured. Please add your API key to use the chat feature.');
      return;
    }

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: inputText.trim(),
      timestamp: new Date().toISOString()
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInputText('');
    setIsLoading(true);
    setApiError(null);

    try {
      // Call Claude API
      const response = await callClaudeAPI(updatedMessages, mode);
      
      const aiMessage = {
        id: Date.now() + 1,
        type: 'ai',
        content: response.content,
        timestamp: new Date().toISOString()
      };

      setMessages(prev => [...prev, aiMessage]);

      // If in Learn mode, check for new words to save
      if (mode === 'Learn') {
        const newWords = extractNewWords(response.content);
        if (newWords.length > 0) {
          setNewWordsLearned(prev => [...prev, ...newWords]);
        }
      }

    } catch (error) {
      console.error('Claude API Error:', error);
      setApiError(error.message);
      
      // Add an error message to the chat
      const errorMessage = {
        id: Date.now() + 1,
        type: 'ai',
        content: `I'm sorry, but I encountered an error: ${error.message}\n\nPlease try again in a moment.`,
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const saveNewWord = (word) => {
    // TODO: Integrate with existing saved words system
    setNewWordsLearned(prev => [...prev, word]);
    console.log('Saving new word:', word);
  };

  const clearChat = () => {
    if (window.confirm('Clear the entire conversation?')) {
      setMessages([]);
      setNewWordsLearned([]);
      // Reinitialize with welcome message
      const welcomeMessage = {
        id: Date.now(),
        type: 'ai',
        content: mode === 'Study' 
          ? 'Welcome to Study Mode! I\'ll help you practice Latin using only vocabulary and grammar concepts you\'ve already learned. What would you like to practice today?'
          : 'Welcome to Learn Mode! I\'ll introduce new Latin words and grammar concepts one at a time. Ready to learn something new?',
        timestamp: new Date().toISOString()
      };
      setMessages([welcomeMessage]);
    }
  };

  return (
    <div className="sentences-page">
      {/* Header */}
      <div className="sentences-header">
        <div className="header-content">
          <h1 className="main-title">Sentences</h1>
          <div className="current-mode">
            <span className="mode-indicator">{mode} Mode</span>
          </div>
        </div>
        <div className="header-actions">
          <button className="clear-btn" onClick={clearChat}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 6h18"></path>
              <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
              <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
            </svg>
            Clear
          </button>
          <div className="settings-container">
            <button 
              className={`settings-btn ${showSettings ? 'active' : ''}`}
              onClick={() => setShowSettings(!showSettings)}
              title="Settings"
            >
              <svg width="18" height="18" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd"></path>
              </svg>
            </button>
            {showSettings && (
              <div className="settings-dropdown">
                <div className="settings-section">
                  <label className="settings-label">Select Mode</label>
                  <div className="mode-toggle">
                    <button 
                      className={`mode-btn ${mode === 'Study' ? 'active' : ''}`}
                      onClick={() => {
                        setMode('Study');
                        setShowSettings(false);
                      }}
                    >
                      Study
                    </button>
                    <button 
                      className={`mode-btn ${mode === 'Learn' ? 'active' : ''}`}
                      onClick={() => {
                        setMode('Learn');
                        setShowSettings(false);
                      }}
                    >
                      Learn
                    </button>
                  </div>
                  <div className="mode-descriptions">
                    <p className="mode-desc study">
                      <strong>Study:</strong> Practice with vocabulary and grammar you've already learned
                    </p>
                    <p className="mode-desc learn">
                      <strong>Learn:</strong> Discover new words and concepts one at a time
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mode Description */}
      <div className="mode-description">
        {mode === 'Study' ? (
          <p>Practice with vocabulary and grammar you've already learned</p>
        ) : (
          <p>Learn new words and concepts one at a time • Save new words to your collection</p>
        )}
        {apiError && (
          <div className="api-error">
            <span className="error-icon">⚠️</span>
            {apiError}
          </div>
        )}
        {apiStatus && !apiStatus.configured && (
          <div className="api-warning">
            <span className="warning-icon">🔑</span>
            Add your Claude API key to .env file to enable chat functionality
          </div>
        )}
      </div>

      {/* Chat Messages */}
      <div className="chat-container">
        <div className="messages-list">
          {messages.map((message) => (
            <div key={message.id} className={`message ${message.type}`}>
              <div className="message-content">
                {message.content}
                {message.type === 'ai' && mode === 'Learn' && (
                  <div className="learn-actions">
                    {/* TODO: Add save word button when new words are introduced */}
                  </div>
                )}
              </div>
              <div className="message-timestamp">
                {new Date(message.timestamp).toLocaleTimeString([], { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="message ai loading">
              <div className="message-content">
                <div className="typing-indicator">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Form */}
      <form className="chat-input-form" onSubmit={handleSubmit}>
        <div className="input-container">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={mode === 'Study' 
              ? 'Ask a question or request practice...' 
              : 'Ask to learn something new...'
            }
            disabled={isLoading}
            className="chat-input"
          />
          <button 
            type="submit" 
            disabled={!inputText.trim() || isLoading}
            className="send-btn"
          >
            {isLoading ? '...' : 'Send'}
          </button>
        </div>
      </form>

      {/* Learn Mode Stats */}
      {mode === 'Learn' && newWordsLearned.length > 0 && (
        <div className="learn-stats">
          <p>New words learned this session: {newWordsLearned.length}</p>
        </div>
      )}
    </div>
  );
};

export default SentencesPage;