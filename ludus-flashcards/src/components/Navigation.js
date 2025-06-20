import React, { useState } from 'react';
import '../styles/Navigation.css';
import AuthComponent from './AuthComponent';

const Navigation = ({ onPageChange, currentPage }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const pages = [
    { key: 'ludus', label: 'Home' },
    { key: 'flashcards', label: 'Flashcards' },
    { key: 'glossary', label: 'Glossary' },
    { key: 'grammar', label: 'Grammar' },
    { key: 'index-tester', label: '🔍 Index Tester' }
  ];

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <nav className="navigation">
      <div className="nav-brand">
        <h1 onClick={() => onPageChange('ludus')}>Ludus</h1>
      </div>
      
      <div className="nav-toggle" onClick={toggleMenu}>
        <span></span>
        <span></span>
        <span></span>
      </div>

      <div className={`nav-menu ${isMenuOpen ? 'nav-menu-open' : ''}`}>
        <ul className="nav-list">
          {pages.map(page => (
            <li key={page.key} className="nav-item">
              <button 
                className={`nav-link ${currentPage === page.key ? 'active' : ''}`}
                onClick={() => {
                  onPageChange(page.key);
                  setIsMenuOpen(false);
                }}
              >
                {page.label}
              </button>
            </li>
          ))}
        </ul>
        
        <div className="nav-auth">
          <AuthComponent />
        </div>
      </div>
    </nav>
  );
};

export default Navigation; 