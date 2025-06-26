# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is Ludus, a modern React-based Latin flashcard platform that implements spaced repetition learning using the SM-2 algorithm. The application is deployed via GitHub Pages and supports Firebase authentication for cloud sync.

## Essential Commands

### Development
```bash
cd ludus-flashcards
npm install --legacy-peer-deps  # Required due to peer dependency conflicts
npm start                       # Start development server on localhost:3000
```

### Building & Deployment
```bash
cd ludus-flashcards
npm run build                   # Build for production
npm run deploy                  # Deploy to GitHub Pages (requires permissions)
```

### Testing
```bash
cd ludus-flashcards
npm test                        # Run Jest tests with React Testing Library
npm test -- --coverage          # Run tests with coverage
```

## Architecture & Key Components

### Application Structure
- **Main App**: `ludus-flashcards/` - React application built with Create React App
- **State Management**: React Context API (`FlashcardContext`) with useReducer for global state
- **Routing**: Single-page application with custom navigation component
- **Data Storage**: 
  - Local: Browser localStorage for offline functionality
  - Cloud: Firebase Firestore for authenticated users

### Core Algorithm
The SM-2 spaced repetition algorithm is implemented in `ludus-flashcards/src/utils/sm2Algorithm.js`. Key parameters:
- Initial ease factor: 2.5
- Quality grades: 1 (Again), 2 (Hard), 3 (Good), 4 (Easy)
- Interval calculation based on repetitions and ease factor

### Key Files & Architecture
- **State Management**: `ludus-flashcards/src/contexts/FlashcardContext.js` - Global state using useReducer pattern for cards, preferences, and statistics
- **Authentication**: `ludus-flashcards/src/contexts/AuthContext.js` - Firebase auth context wrapper
- **Daily Review System**: `ludus-flashcards/src/utils/dailyReview.js` - Logic for selecting cards based on user preferences (automatic vs manual selection)
- **Data Processing**: `ludus-flashcards/src/utils/dataProcessor.js` - Parses CSV vocabulary data
- **Study Logic**: `ludus-flashcards/src/components/StudySession.js` - Main flashcard interface with grading
- **Settings Management**: `ludus-flashcards/src/components/SettingsPage.js` - Dedicated page for daily review settings (not a modal)
- **Firebase Config**: `ludus-flashcards/src/config/firebase.js` - Authentication and database setup
- **Vocabulary Data**: `ludus-flashcards/public/data/` - CSV files with Latin vocabulary

### Deployment
GitHub Actions workflow (`.github/workflows/deploy.yml`) automatically:
1. Builds on push to main branch
2. Uses Node.js 18.20.4 with `--legacy-peer-deps`
3. Deploys to GitHub Pages at https://ottodo123.github.io/ludus

### Firebase Integration
When working with Firebase features:
- Authentication: Google Sign-in enabled
- Database: Firestore for user progress persistence
- Security Rules: Users can only access their own data
- See `ludus-flashcards/FIREBASE_SETUP.md` for configuration details

### Component Architecture
- **FlashcardsPage**: Main page with daily review interface and curriculum browsing
- **SettingsPage**: Full-page settings interface (migrated from modal popup)
- **StudySession**: Handles flashcard study sessions with SM-2 algorithm integration
- **LudusFolder**: Chapter-based browsing for LUDUS curriculum
- **Navigation**: Custom single-page navigation (no React Router)

### Data Flow & Storage
- **Local Storage**: Primary storage for offline functionality (cards, preferences, statistics)
- **Firebase Sync**: Cloud backup for authenticated users, syncs with local storage
- **Manual Selections**: Range-based chapter selection (fromChapter/toChapter) instead of individual checkboxes
- **Daily Review Logic**: Combines automatic (previously studied cards) and manual selection modes

## Recent Work (Session ending 2025-06-26)

### Irregular Verb & Pronoun Fixes
- **Fixed irregular verb inflection support** in `GlossaryPage.js`:
  - Added "odeo" (6 1 TRANS declension) with defective perfect-tense forms
  - Added "quaeso" (3 1 declension) with irregular 3rd conjugation handling
  - Both now show complete inflection tables instead of failing to display
- **Removed translation columns** from verb inflection tables (completed earlier)
- **Added pronoun inflection support** for hic/haec/hoc, ille/illa/illud, etc.
- **Known issues**: Some irregular verb endings still missing, "iste" pronoun missing from dictionary
- **Files modified**: `src/components/GlossaryPage.js` (lines 520-600, 800-853, 1335-1386)

### Outstanding Tasks
See TodoRead for current task list. Priority items:
- Fix remaining irregular verb inflection gaps
- Add missing "iste, ista, istud" pronoun to source data
- Complete inflection table coverage for all irregular patterns

## Important Notes

- Always use `--legacy-peer-deps` when installing packages due to React 19.1.0 compatibility
- The `CI=false` flag is required in build scripts to bypass warnings
- Main branch deploys to `gh-pages` branch for GitHub Pages
- Firebase credentials should never be committed (use environment variables for production)
- Settings page uses dedicated route, not modal overlay
- Chapter selection uses dropdown ranges (Chapter X to Chapter Y) not checkbox grids