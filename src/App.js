import React, { useState } from 'react';
import { FlashcardProvider } from './contexts/FlashcardContext';
import Navigation from './components/Navigation';
import FlashcardsPage from './components/FlashcardsPage';
import GlossaryPage from './components/GlossaryPage';
import GrammarPage from './components/GrammarPage';
import './App.css';

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
    <FlashcardProvider>
      <div className="App">
        <Navigation activeTab={activeTab} onTabChange={setActiveTab} />
        <main className="main-content">
          {renderCurrentPage()}
        </main>
      </div>
    </FlashcardProvider>
  );
}

export default App; 