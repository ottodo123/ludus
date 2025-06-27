# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is Ludus, a modern React-based Latin flashcard platform that implements spaced repetition learning using the SM-2 algorithm. The application is deployed via GitHub Pages and supports Firebase authentication for cloud sync.

## Essential Commands

### Development
```bash
cd ludus-flashcards
npm install --legacy-peer-deps  # Required due to peer dependency conflicts
./start.sh                      # ALWAYS use this for development - fully stable
```

**CRITICAL: Development Server Solution**
The React development server had persistent connection issues causing "Safari can't connect to server" errors that made refreshing impossible. This has been **permanently fixed** with a custom stable server.

**ALWAYS use `./start.sh` for development**:
- ✅ Works with all browsers (Safari, Chrome, Firefox) 
- ✅ Fully refreshable without any connection errors
- ✅ No WebSocket issues or port conflicts
- ✅ Reliable localhost connection on port 3000
- ✅ Uses Python HTTP server serving production build
- ✅ Automatic build process before serving
- ✅ Process cleanup to prevent port conflicts
- 📍 Access at `http://localhost:3000/`

**The `start.sh` script**:
1. Kills any existing servers on port 3000
2. Runs `npm run build` to create latest production build
3. Starts Python HTTP server in `/build` directory
4. Provides clear instructions and status messages

**Development Commands**:
- `./start.sh` - **ONLY command to use for development** (fully stable)
- `npm run build` - Manual build (already included in start.sh)
- `npm test` - Run tests

**NEVER use**:
- `npm start` - Original React dev server (causes connection issues)
- `npm run start:dev` - Same issues as npm start
- Manual `python3 -m http.server` - Use start.sh instead for proper setup

**Server Management for Code Changes**:
When making code changes during development, the server MUST be restarted to pick up changes:

1. **For ANY code/CSS changes**:
   ```bash
   # Kill existing servers first
   pkill -f 'python.*http.server'; pkill -f 'node.*serve-build'
   sleep 2
   # Always restart with start.sh
   ./start.sh
   ```

2. **Critical**: Changes to JS/CSS files require a fresh build and server restart
3. **Never assume** browser refresh will show changes - always restart server
4. **Port 3000 conflicts**: The script handles this automatically, but if you see "Address already in use", the kill commands above will fix it

**For Claude Code**: Always run the kill commands and restart server after making any file changes to ensure changes are visible.

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

## Recent Work (Session ending 2025-06-27)

### Development Server Stability Fix (CRITICAL)
- **PERMANENTLY FIXED** Safari connection issues that prevented page refreshing
- **Created `start.sh` script** that provides 100% reliable development server
- **Solution**: Python HTTP server serving production build instead of React dev server
- **Result**: No more "Safari can't connect to server" errors, fully refreshable in all browsers
- **Files created/modified**: `start.sh`, `package.json` (homepage field), various .env configs

### Saved Words Session Management Feature
- **Implemented session-based organization** for saved words with dividers and date tracking
- **Added "New Session" functionality** with automatic date stamping and word counts  
- **Session management**: Click session names to rename, delete sessions with trash icons
- **Firebase integration**: Sessions sync to cloud storage for authenticated users
- **UI improvements**: Dedicated SavedWordsPage, always-visible sidebar, compact styling
- **Files modified**: `GlossaryPage.js`, `SavedWordsPage.js`, `userDataService.js`, `GlossaryPage.css`

### Bug Fixes & UI Polish
- **Fixed random word deletion bug** by replacing broken debounced save with direct Firebase saves
- **Resolved Firebase sync issues** that caused saved words to disappear
- **Fixed spacing inconsistencies** in saved words sidebar (reduced top padding)
- **Removed debug elements** and test buttons for clean production UI
- **Files modified**: `GlossaryPage.js`, `GlossaryPage.css`

### Previous Work - Irregular Verb & Pronoun Fixes
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