import React from 'react';
import '../styles/Navigation.css';
import AuthComponent from './AuthComponent';

const Navigation = ({ onPageChange, currentPage }) => {
  const pages = [
    { key: 'flashcards', label: 'Flashcards', disabled: false },
    { key: 'glossary', label: 'Glossary', disabled: false },
    { key: 'grammar', label: 'Grammar', disabled: false }
  ];

  return (
    <nav className="navigation">
      <div className="nav-container">
        <div className="nav-brand">
          <h1 onClick={() => onPageChange('ludus')}>Ludus</h1>
          <span className="nav-subtitle">Latin Flashcard Platform</span>
        </div>

        <div className="nav-tabs">
          {pages.map(page => (
            <button 
              key={page.key}
              className={`nav-tab ${currentPage === page.key ? 'active' : ''} ${page.disabled ? 'disabled' : ''}`}
              onClick={() => !page.disabled && onPageChange(page.key)}
              disabled={page.disabled}
            >
              {page.label}
              {page.disabled && <span className="coming-soon">Coming Soon</span>}
            </button>
          ))}
        </div>
        
        <div className="nav-auth">
          <AuthComponent />
        </div>
      </div>
    </nav>
  );
};

export default Navigation; 