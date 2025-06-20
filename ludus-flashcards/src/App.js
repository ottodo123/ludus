import React, { useState } from 'react';
import './App.css';
import { AuthProvider } from './contexts/AuthContext';
import { FlashcardProvider } from './contexts/FlashcardContext';
import Navigation from './components/Navigation';
import LudusFolder from './components/LudusFolder';
import FlashcardsPage from './components/FlashcardsPage';
import GlossaryPage from './components/GlossaryPage';
import GrammarPage from './components/GrammarPage';

function App() {
  const [currentPage, setCurrentPage] = useState('ludus');

  const renderPage = () => {
    switch(currentPage) {
      case 'ludus':
        return <LudusFolder onPageChange={setCurrentPage} />;
      case 'flashcards':
        return <FlashcardsPage />;
      case 'glossary':
        return <GlossaryPage />;
      case 'grammar':
        return <GrammarPage />;
      default:
        return <LudusFolder onPageChange={setCurrentPage} />;
    }
  };

  return (
    <AuthProvider>
      <FlashcardProvider>
        <div className="App">
          <Navigation onPageChange={setCurrentPage} currentPage={currentPage} />
          <main className="app-content">
            {renderPage()}
          </main>
        </div>
      </FlashcardProvider>
    </AuthProvider>
  );
}

export default App;
