import React, { useState } from 'react';
import './App.css';
import { AuthProvider } from './contexts/AuthContext';
import { FlashcardProvider } from './contexts/FlashcardContext';
import Navigation from './components/Navigation';
import LudusFolder from './components/LudusFolder';
import FlashcardsPage from './components/FlashcardsPage';
import GlossaryPage from './components/GlossaryPage';
import GrammarPage from './components/GrammarPage';
import SentencesPage from './components/SentencesPage';
import StudySession from './components/StudySession';

function App() {
  const [currentPage, setCurrentPage] = useState('flashcards');
  const [studyCards, setStudyCards] = useState([]);
  const [isStudying, setIsStudying] = useState(false);
  const [pageKey, setPageKey] = useState(0); // Force re-render key

  const handleStartStudy = (cards) => {
    setStudyCards(cards);
    setIsStudying(true);
  };

  const handleBackToPage = () => {
    setIsStudying(false);
    setStudyCards([]);
  };

  const handleGoHome = () => {
    // Always go to flashcards and reset any study state
    setIsStudying(false);
    setStudyCards([]);
    setCurrentPage('flashcards');
    setPageKey(prev => prev + 1); // Force re-render
  };

  const renderPage = () => {
    // If in study mode, show study session regardless of current page
    if (isStudying) {
      return (
        <StudySession
          cards={studyCards}
          onComplete={handleBackToPage}
          onBack={handleBackToPage}
        />
      );
    }

    switch(currentPage) {
      case 'ludus':
        return (
          <LudusFolder 
            onBack={() => setCurrentPage('flashcards')}
            onStartStudy={handleStartStudy}
          />
        );
      case 'flashcards':
        return <FlashcardsPage key={pageKey} />;
      case 'glossary':
        return <GlossaryPage onNavigate={setCurrentPage} />;
      case 'grammar':
        return <GrammarPage />;
      case 'sentences':
        return <SentencesPage onBack={() => setCurrentPage('flashcards')} />;
      default:
        return (
          <LudusFolder 
            onBack={() => setCurrentPage('flashcards')}
            onStartStudy={handleStartStudy}
          />
        );
    }
  };

  return (
    <AuthProvider>
      <FlashcardProvider>
        <div className="App">
          <Navigation onPageChange={setCurrentPage} currentPage={currentPage} onGoHome={handleGoHome} />
          <main className="app-content">
            {renderPage()}
          </main>
        </div>
      </FlashcardProvider>
    </AuthProvider>
  );
}

export default App;
