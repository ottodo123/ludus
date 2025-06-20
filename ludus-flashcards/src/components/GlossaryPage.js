import React from 'react';
import '../styles/PlaceholderPage.css';

const GlossaryPage = () => {
  return (
    <div className="placeholder-page">
      <div className="placeholder-container">
        <div className="placeholder-icon">📖</div>
        <h1>Glossary</h1>
        <p className="placeholder-description">
          The comprehensive Latin-English glossary will be available in a future update.
          This section will include searchable definitions, etymology, and usage examples
          for all vocabulary terms across all curricula.
        </p>
        
        <div className="coming-features">
          <h3>Planned Features:</h3>
          <ul>
            <li>Searchable vocabulary database</li>
            <li>Advanced filtering by part of speech, curriculum, and difficulty</li>
            <li>Etymology and word origin information</li>
            <li>Usage examples and sample sentences</li>
            <li>Related words and derivatives</li>
            <li>Audio pronunciations</li>
            <li>Bookmark favorite words</li>
          </ul>
        </div>

        <div className="development-status">
          <span className="status-badge">🚧 In Development</span>
          <p>This feature is currently being developed and will be available soon.</p>
        </div>
      </div>
    </div>
  );
};

export default GlossaryPage; 