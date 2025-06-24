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

### Key Files
- **Data Processing**: `ludus-flashcards/src/utils/dataProcessor.js` - Parses CSV vocabulary data
- **Study Logic**: `ludus-flashcards/src/components/StudySession.js` - Main flashcard interface
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

## Important Notes

- Always use `--legacy-peer-deps` when installing packages due to React 19.1.0 compatibility
- The `CI=false` flag is required in build scripts to bypass warnings
- Main branch deploys to `gh-pages` branch for GitHub Pages
- Firebase credentials should never be committed (use environment variables for production)