import React from 'react';
import '../styles/PlaceholderPage.css';

const GrammarPage = () => {
  return (
    <div className="placeholder-page">
      <div className="placeholder-container">
        <div className="placeholder-icon">📚</div>
        <h1>Grammar</h1>
        <p className="placeholder-description">
          The comprehensive Latin grammar section will be available in a future update.
          This section will include interactive lessons, declension tables, conjugation practice,
          and comprehensive grammar explanations.
        </p>
        
        <div className="coming-features">
          <h3>Planned Features:</h3>
          <ul>
            <li>Interactive declension tables (nouns, adjectives, pronouns)</li>
            <li>Verb conjugation practice and tables</li>
            <li>Syntax explanations with examples</li>
            <li>Grammar drills and exercises</li>
            <li>Case usage explanations</li>
            <li>Subjunctive and conditional mood practice</li>
            <li>Participle and infinitive constructions</li>
            <li>Poetry meter and scansion tools</li>
            <li>Grammar reference charts</li>
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

export default GrammarPage; 