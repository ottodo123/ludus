import React, { useState } from 'react';
import '../styles/Navigation.css';
import AuthComponent from './AuthComponent';

const Navigation = ({ onPageChange, currentPage, onGoHome }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const pages = [
    { key: 'flashcards', label: 'Flashcards', disabled: false },
    { key: 'glossary', label: 'Glossary', disabled: false },
    { key: 'grammar', label: 'Grammar', disabled: false }
  ];

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const handlePageChange = (pageKey) => {
    onPageChange(pageKey);
    setIsMobileMenuOpen(false); // Close menu after navigation
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <nav className="navigation">
      <div className="nav-container">
        <div className="nav-brand">
          <h1 onClick={onGoHome}>Ludus</h1>
        </div>

        {/* Desktop Navigation */}
        <div className="nav-tabs desktop-nav">
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
        
        <div className="nav-auth desktop-nav">
          <AuthComponent />
        </div>

        {/* Hamburger Menu Button */}
        <button 
          className="hamburger-btn mobile-only"
          onClick={toggleMobileMenu}
          aria-label="Toggle navigation menu"
        >
          <span className={`hamburger-line ${isMobileMenuOpen ? 'open' : ''}`}></span>
          <span className={`hamburger-line ${isMobileMenuOpen ? 'open' : ''}`}></span>
          <span className={`hamburger-line ${isMobileMenuOpen ? 'open' : ''}`}></span>
        </button>
      </div>

      {/* Mobile Menu Backdrop */}
      <div 
        className={`mobile-menu-backdrop ${isMobileMenuOpen ? 'open' : ''}`}
        onClick={closeMobileMenu}
      ></div>

      {/* Mobile Sidebar Menu */}
      <div className={`mobile-sidebar ${isMobileMenuOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <h2>Menu</h2>
        </div>
        
        <div className="sidebar-content">
          <div className="sidebar-nav">
            {pages.map(page => (
              <button 
                key={page.key}
                className={`sidebar-nav-item ${currentPage === page.key ? 'active' : ''} ${page.disabled ? 'disabled' : ''}`}
                onClick={() => !page.disabled && handlePageChange(page.key)}
                disabled={page.disabled}
              >
                {page.label}
                {page.disabled && <span className="coming-soon">Coming Soon</span>}
              </button>
            ))}
          </div>
          
          <div className="sidebar-auth">
            <AuthComponent />
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation; 