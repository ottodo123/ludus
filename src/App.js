import React, { useState } from 'react';
import './App.css';

// Inline Navigation component to avoid import issues
const Navigation = ({ activeTab, onTabChange }) => {
  const tabs = [
    { id: 'glossary', label: 'Glossary' },
    { id: 'flashcards', label: 'Flashcards' },
    { id: 'grammar', label: 'Grammar' }
  ];

  return (
    <nav style={{ 
      background: '#2563eb', 
      padding: '1rem 0', 
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)' 
    }}>
      <div style={{ 
        maxWidth: '1200px', 
        margin: '0 auto', 
        padding: '0 1rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div>
          <h1 style={{ color: 'white', margin: 0, fontSize: '1.5rem' }}>Ludus</h1>
          <span style={{ color: '#bfdbfe', fontSize: '0.875rem' }}>Latin Flashcard Platform</span>
        </div>
        
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {tabs.map(tab => (
            <button
              key={tab.id}
              style={{
                background: activeTab === tab.id ? '#1d4ed8' : 'transparent',
                color: 'white',
                border: '1px solid #3b82f6',
                padding: '0.5rem 1rem',
                borderRadius: '0.375rem',
                cursor: 'pointer',
                fontSize: '0.875rem'
              }}
              onClick={() => onTabChange(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>
    </nav>
  );
};

// Simple placeholder components
const FlashcardsPage = () => (
  <div style={{ padding: '2rem', textAlign: 'center' }}>
    <h2>🎉 Latin Flashcard App Working!</h2>
    <p>✅ React app is compiling successfully</p>
    <p>✅ Navigation is working</p>
    <p>✅ Tab switching is functional</p>
    <div style={{ 
      marginTop: '2rem', 
      padding: '1.5rem', 
      background: '#f0f8ff', 
      borderRadius: '8px',
      maxWidth: '600px',
      margin: '2rem auto'
    }}>
      <h3>Success! 🎊</h3>
      <p>Your Latin flashcard application is now working. We can now add back the full functionality step by step.</p>
      <p><strong>Next steps:</strong> Add spaced repetition, vocabulary cards, and study sessions.</p>
    </div>
  </div>
);

const GlossaryPage = () => (
  <div style={{ padding: '2rem', textAlign: 'center' }}>
    <h2>Glossary</h2>
    <p>Coming Soon - Full Latin vocabulary glossary</p>
  </div>
);

const GrammarPage = () => (
  <div style={{ padding: '2rem', textAlign: 'center' }}>
    <h2>Grammar</h2>
    <p>Coming Soon - Latin grammar lessons and exercises</p>
  </div>
);

function App() {
  const [activeTab, setActiveTab] = useState('flashcards');

  const renderCurrentPage = () => {
    switch (activeTab) {
      case 'glossary':
        return <GlossaryPage />;
      case 'flashcards':
        return <FlashcardsPage />;
      case 'grammar':
        return <GrammarPage />;
      default:
        return <FlashcardsPage />;
    }
  };

  return (
    <div className="App">
      <Navigation activeTab={activeTab} onTabChange={setActiveTab} />
      <main className="main-content">
        {renderCurrentPage()}
      </main>
    </div>
  );
}

export default App; 