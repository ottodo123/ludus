import React, { useState } from 'react';
import './App.css';
import { AuthProvider } from './contexts/AuthContext';
import { FlashcardProvider } from './contexts/FlashcardContext';
import Navigation from './components/Navigation';
import LudusFolder from './components/LudusFolder';
import FlashcardsPage from './components/FlashcardsPage';
import GlossaryPage from './components/GlossaryPage';
import GrammarPage from './components/GrammarPage';
import StudySession from './components/StudySession';

function App() {
  const [currentPage, setCurrentPage] = useState('ludus');
  const [studyCards, setStudyCards] = useState([]);
  const [isStudying, setIsStudying] = useState(false);

  const handleStartStudy = (cards) => {
    setStudyCards(cards);
    setIsStudying(true);
  };

  const handleBackToPage = () => {
    setIsStudying(false);
    setStudyCards([]);
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
        return <FlashcardsPage />;
      case 'glossary':
        return <GlossaryPage />;
      case 'grammar':
        return <GrammarPage />;
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
