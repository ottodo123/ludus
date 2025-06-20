import React, { useState } from 'react';
import AuthComponent from './AuthComponent';
import '../styles/Navigation.css';

const Navigation = ({ activeTab, onTabChange }) => {
  const tabs = [
    { id: 'glossary', label: 'Glossary', disabled: false },
    { id: 'flashcards', label: 'Flashcards', disabled: false },
    { id: 'grammar', label: 'Grammar', disabled: false }
  ];

  return (
    <nav className="navigation">
      <div className="nav-container">
        <div className="nav-brand">
          <h1>Ludus</h1>
          <span className="nav-subtitle">Latin Flashcard Platform</span>
        </div>
        
        <div className="nav-tabs">
          {tabs.map(tab => (
            <button
              key={tab.id}
              className={`nav-tab ${activeTab === tab.id ? 'active' : ''} ${tab.disabled ? 'disabled' : ''}`}
              onClick={() => !tab.disabled && onTabChange(tab.id)}
              disabled={tab.disabled}
            >
              {tab.label}
              {tab.disabled && <span className="coming-soon">Coming Soon</span>}
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