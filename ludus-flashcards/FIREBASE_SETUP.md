# Firebase Setup Guide

## 1. Firebase Console Setup

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project" or select your existing project
3. Enter your project name (e.g., "ludus-flashcards")
4. Enable Google Analytics (optional)
5. Create the project

## 2. Enable Authentication

1. In your Firebase project dashboard, click "Authentication" in the left sidebar
2. Click "Get started"
3. Go to the "Sign-in method" tab
4. Click on "Google" in the providers list
5. Enable Google sign-in
6. Add your project's authorized domains:
   - `localhost` (for development)
   - `ottodo123.github.io` (for production)
7. Save the configuration

## 3. Enable Firestore Database

1. Click "Firestore Database" in the left sidebar
2. Click "Create database"
3. Choose "Start in test mode" (we'll secure it later)
4. Select a location closest to your users
5. Click "Done"

## 4. Get Your Firebase Configuration

1. Click the gear icon ⚙️ next to "Project Overview"
2. Select "Project settings"
3. Scroll down to "Your apps" section
4. Click "Web" icon (`</>`)
5. Register your app with a nickname (e.g., "ludus-web")
6. Copy the Firebase configuration object

## 5. Update Your Project

Replace the placeholder values in `src/config/firebase.js` with your actual Firebase configuration:

```javascript
const firebaseConfig = {
  apiKey: "your-actual-api-key",
  authDomain: "your-project-id.firebaseapp.com",
  projectId: "your-actual-project-id",
  storageBucket: "your-project-id.appspot.com",
  messagingSenderId: "your-actual-messaging-sender-id",
  appId: "your-actual-app-id"
};
```

## 6. Firestore Security Rules (Optional)

To secure your database, update Firestore rules in the Firebase Console:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow users to read/write their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
      
      // Allow users to read/write their card progress
      match /cardProgress/{cardId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
    }
  }
}
```

## 7. Test the Setup

1. Start your development server: `npm start`
2. Click the "Sign in with Google" button
3. Complete the Google authentication flow
4. Check the Firebase Console to see your user data

## Features Now Available

✅ **Google Authentication**: Users can sign in with their Google account
✅ **User Data Storage**: Progress is saved to Firestore
✅ **Cross-Device Sync**: Users can access their progress from any device
✅ **Spaced Repetition**: SM-2 algorithm tracks learning progress
✅ **Personal Statistics**: Track review accuracy and average time

## Security Notes

- Never commit your Firebase configuration with real credentials to public repositories
- Consider using environment variables for production deployments
- Update Firestore security rules before going live
- Regularly review authentication and database usage in Firebase Console 