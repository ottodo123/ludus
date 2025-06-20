# Ludus - Latin Flashcard Platform

A modern, web-based Latin flashcard platform featuring spaced repetition learning with the SM-2 algorithm. Built with React for cross-platform compatibility and future expansion to iOS and macOS.

## 🌟 Features

### Core Functionality
- **Spaced Repetition Learning**: Implements the proven SM-2 algorithm for optimal retention
- **680+ LUDUS Vocabulary**: Complete vocabulary set organized across 64 chapters
- **Smart Review System**: Cards appear based on your learning progress and retention
- **Multiple Study Modes**: 
  - Spaced Repetition (optimized intervals)
  - Practice Mode (no algorithm impact)
  - Cram Mode (quick review)

### User Interface
- **Clean, Distraction-Free Design**: Minimalist interface focused on learning
- **Responsive Layout**: Works seamlessly on desktop, tablet, and mobile
- **Keyboard Shortcuts**: Fast navigation and grading (Space, 1-4, arrows)
- **Real-Time Progress Tracking**: Visual progress bars and statistics
- **Customizable Display**: Toggle between basic (headword only) and full (headword + endings)

### Study Features
- **Bidirectional Learning**: Latin → English or English → Latin
- **Part-of-Speech Filtering**: Focus on specific word types (verbs, nouns, adjectives, etc.)
- **Chapter-Based Organization**: Study specific lessons or combinations
- **Difficulty Grading**: 4-level system (Again, Hard, Good, Easy)
- **Progress Persistence**: All progress saved locally in browser

### Statistics & Analytics
- **Study Streak Tracking**: Monitor daily study consistency
- **Retention Rate Analysis**: Track learning effectiveness
- **Session Statistics**: Real-time feedback during study sessions
- **Chapter Progress**: Individual lesson completion tracking

## 🚀 Getting Started

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn package manager

### Installation
1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd ludus-flashcards
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm start
   ```

4. Open http://localhost:3000 in your browser

## 📖 How to Use

### Getting Started with Study
1. **Navigate to Flashcards**: Use the top navigation to access the main study area
2. **Choose Your Method**:
   - **Daily Review**: Study cards that are due based on spaced repetition
   - **LUDUS Curriculum**: Browse and study specific chapters
3. **Start Studying**: Click any study button to begin a session

### During Study Sessions
1. **View the Card**: Read the Latin word or phrase
2. **Think of the Answer**: Try to recall the English meaning
3. **Reveal Answer**: Press Space or click "Reveal Answer"
4. **Grade Yourself**: 
   - **1 (Again)**: Didn't know it at all
   - **2 (Hard)**: Knew it but struggled
   - **3 (Good)**: Knew it well
   - **4 (Easy)**: Knew it perfectly

### Keyboard Shortcuts
- `Space` - Reveal answer
- `1` - Grade as "Again"
- `2` - Grade as "Hard" 
- `3` - Grade as "Good"
- `4` - Grade as "Easy"
- `←/→` - Navigate between cards

### Customization Options
- **Display Mode**: Toggle between showing full word forms or just headwords
- **Study Direction**: Switch between Latin→English and English→Latin
- **Part of Speech Filters**: Focus on specific word types

## 🏗️ Architecture

### Tech Stack
- **Frontend**: React 18 with functional components and hooks
- **State Management**: React Context API with useReducer
- **Styling**: Custom CSS with responsive design
- **Data Storage**: Browser localStorage for persistence
- **Algorithm**: SM-2 spaced repetition implementation

### Project Structure
```
src/
├── components/           # React components
│   ├── Navigation.js     # Main navigation bar
│   ├── FlashcardsPage.js # Main flashcards dashboard
│   ├── LudusFolder.js    # LUDUS curriculum browser
│   ├── StudySession.js   # Flashcard study interface
│   ├── GlossaryPage.js   # Placeholder for glossary
│   └── GrammarPage.js    # Placeholder for grammar
├── contexts/             # React contexts
│   └── FlashcardContext.js # Global state management
├── utils/                # Utility functions
│   ├── sm2Algorithm.js   # SM-2 implementation
│   ├── dataProcessor.js  # CSV parsing and data handling
│   └── storage.js        # localStorage utilities
├── styles/               # CSS stylesheets
└── data/                 # Vocabulary data
```

### SM-2 Algorithm Implementation
The platform uses the SuperMemo SM-2 algorithm for optimal spaced repetition:

- **Ease Factor**: Starts at 2.5, adjusts based on performance
- **Intervals**: Calculated automatically (1 day → 6 days → custom intervals)
- **Repetitions**: Tracks how many times you've seen each card
- **Quality Grades**: 4-point scale affecting future review timing

## 🎯 Future Development

### Planned Features
- **User Accounts**: Cloud synchronization and cross-device access
- **Additional Curricula**: CAESAR and CICERO vocabulary sets
- **Enhanced Statistics**: Detailed analytics and progress reports
- **Audio Pronunciations**: Native speaker recordings
- **Teacher Dashboard**: Classroom management and student tracking
- **Advanced Grammar**: Interactive grammar lessons and exercises
- **Comprehensive Glossary**: Searchable dictionary with etymology

### Platform Expansion
This web application is designed as the foundation for:
- **iOS App**: React Native implementation
- **macOS App**: Electron or native Swift application
- **Progressive Web App**: Offline functionality and app-like experience

## 📊 Current Content

### LUDUS Curriculum
- **680 Vocabulary Items** across 64 chapters
- **Parts of Speech**: Verbs, nouns, adjectives, adverbs, pronouns, conjunctions, prepositions, idioms
- **Comprehensive Coverage**: From basic vocabulary to advanced terms
- **Authentic Latin**: Proper diacritical marks and classical forms

### Sample Vocabulary
- **Chapter 1**: Basic nouns (terra, vita, silva) and verbs (est, habet, videt)
- **Chapter 2**: First conjugation verbs (amō, portō, spectō)
- **Chapter 3**: Action verbs and descriptive adjectives
- **Advanced Chapters**: Complex constructions and nuanced vocabulary

## 🔧 Development

### Adding New Vocabulary
To add new vocabulary data:
1. Update the CSV data in `src/utils/dataProcessor.js`
2. Ensure proper formatting: `lesson_number,latin_headword,latin_endings,part_of_speech,english`
3. The system will automatically parse and integrate new content

### Customizing the Algorithm
The SM-2 algorithm can be tuned in `src/utils/sm2Algorithm.js`:
- Adjust ease factor calculations
- Modify interval calculations
- Change quality grade thresholds

### Styling Modifications
All styles are in the `src/styles/` directory:
- Component-specific CSS files
- Responsive breakpoints
- Accessibility considerations

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- **SuperMemo**: For the SM-2 spaced repetition algorithm
- **LUDUS Curriculum**: For the comprehensive Latin vocabulary database
- **React Team**: For the excellent development framework
- **Latin Teachers Worldwide**: For inspiring effective language learning tools

---

**Ludus** - *Making Latin learning efficient, effective, and enjoyable.* 