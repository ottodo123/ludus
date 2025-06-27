// Debug utility for saved words Firebase issues
import { 
  getSavedWordSessions, 
  saveSavedWordSessions,
  triggerIndexCreation 
} from '../services/userDataService';

export const debugSavedWordsSystem = async (user) => {
  console.group('🔍 DEBUGGING SAVED WORDS SYSTEM');
  
  // 1. Check localStorage
  console.log('📱 Checking localStorage...');
  const localSessions = localStorage.getItem('glossary-sessions');
  const localCurrentSession = localStorage.getItem('glossary-current-session-id');
  
  console.log('Local sessions:', localSessions ? JSON.parse(localSessions) : 'None');
  console.log('Local current session ID:', localCurrentSession);
  
  // 2. Check user authentication
  console.log('👤 User auth status:', {
    authenticated: !!user,
    uid: user?.uid,
    email: user?.email
  });
  
  if (!user?.uid) {
    console.warn('❌ User not authenticated - Firebase sync not possible');
    console.groupEnd();
    return;
  }
  
  // 3. Test Firebase connection
  console.log('🔥 Testing Firebase connection...');
  try {
    const firebaseData = await getSavedWordSessions(user.uid);
    console.log('✅ Firebase read successful:', firebaseData);
    
    // 4. Test Firebase write (but restore original data after)
    console.log('📝 Testing Firebase write...');
    const originalData = firebaseData; // Keep the original data
    
    const testData = {
      sessions: [{
        id: 999,
        name: "Debug Test Session", 
        startedAt: new Date().toISOString(),
        words: []
      }],
      currentSessionId: 999
    };
    
    await saveSavedWordSessions(user.uid, testData);
    console.log('✅ Firebase write successful');
    
    // Restore the original data immediately
    if (originalData.sessions && originalData.sessions.length > 0) {
      await saveSavedWordSessions(user.uid, originalData);
      console.log('🔄 Restored original data after test');
    }
    
    // 5. Verify the write worked
    const verifyData = await getSavedWordSessions(user.uid);
    console.log('🔍 Verification read:', verifyData);
    
  } catch (error) {
    console.error('❌ Firebase error:', error);
    
    if (error.code === 'failed-precondition') {
      console.log('📊 Index creation needed');
      try {
        await triggerIndexCreation(user.uid);
      } catch (indexError) {
        console.log('🔗 Index creation link should appear above');
      }
    }
  }
  
  console.groupEnd();
};

export const testSaveWordFlow = async (user, wordToSave) => {
  console.group('🧪 TESTING SAVE WORD FLOW');
  
  console.log('Word to save:', wordToSave);
  
  // 1. Get current sessions
  const currentSessions = JSON.parse(localStorage.getItem('glossary-sessions') || '[]');
  console.log('Current sessions before save:', currentSessions);
  
  // 2. Add word to first session
  if (currentSessions.length > 0) {
    currentSessions[0].words.push({
      ...wordToSave,
      id: Date.now(),
      addedAt: new Date().toISOString()
    });
    
    console.log('Sessions after adding word:', currentSessions);
    
    // 3. Save to localStorage
    localStorage.setItem('glossary-sessions', JSON.stringify(currentSessions));
    console.log('✅ Saved to localStorage');
    
    // 4. Save to Firebase if user is authenticated
    if (user?.uid) {
      try {
        await saveSavedWordSessions(user.uid, {
          sessions: currentSessions,
          currentSessionId: 1
        });
        console.log('✅ Saved to Firebase');
      } catch (error) {
        console.error('❌ Firebase save failed:', error);
      }
    }
  }
  
  console.groupEnd();
};