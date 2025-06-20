import { 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs 
} from 'firebase/firestore';
import { db } from '../config/firebase';

// Save user's flashcard progress
export const saveUserProgress = async (userId, cardId, progressData) => {
  try {
    const progressRef = doc(db, 'users', userId, 'cardProgress', cardId);
    await setDoc(progressRef, {
      ...progressData,
      lastUpdated: new Date().toISOString()
    }, { merge: true });
  } catch (error) {
    console.error('Error saving user progress:', error);
    throw error;
  }
};

// Get user's flashcard progress
export const getUserProgress = async (userId) => {
  try {
    const progressQuery = query(
      collection(db, 'users', userId, 'cardProgress')
    );
    const querySnapshot = await getDocs(progressQuery);
    
    const progress = {};
    querySnapshot.forEach((doc) => {
      progress[doc.id] = doc.data();
    });
    
    return progress;
  } catch (error) {
    console.error('Error getting user progress:', error);
    throw error;
  }
};

// Get cards due for review (REQUIRES INDEX)
export const getDueCards = async (userId) => {
  try {
    const now = new Date().toISOString();
    const progressQuery = query(
      collection(db, 'users', userId, 'cardProgress'),
      where('nextReview', '<=', now),
      orderBy('nextReview', 'asc'),
      limit(20)
    );
    const querySnapshot = await getDocs(progressQuery);
    
    const dueCards = [];
    querySnapshot.forEach((doc) => {
      dueCards.push({ id: doc.id, ...doc.data() });
    });
    
    return dueCards;
  } catch (error) {
    console.error('Error getting due cards:', error);
    console.error('Index creation link should appear above ↑');
    throw error;
  }
};

// Get learning cards (REQUIRES INDEX)
export const getLearningCards = async (userId) => {
  try {
    const progressQuery = query(
      collection(db, 'users', userId, 'cardProgress'),
      where('repetitions', '>', 0),
      where('repetitions', '<', 3),
      orderBy('repetitions', 'asc'),
      orderBy('lastReviewed', 'desc')
    );
    const querySnapshot = await getDocs(progressQuery);
    
    const learningCards = [];
    querySnapshot.forEach((doc) => {
      learningCards.push({ id: doc.id, ...doc.data() });
    });
    
    return learningCards;
  } catch (error) {
    console.error('Error getting learning cards:', error);
    console.error('Index creation link should appear above ↑');
    throw error;
  }
};

// Get user's best/worst cards (REQUIRES INDEX)
export const getUserStats = async (userId) => {
  try {
    // Best cards (highest accuracy)
    const bestCardsQuery = query(
      collection(db, 'users', userId, 'cardProgress'),
      where('totalReviews', '>', 3),
      orderBy('totalReviews', 'desc'),
      orderBy('correctReviews', 'desc'),
      limit(10)
    );
    
    // Worst cards (lowest accuracy)
    const worstCardsQuery = query(
      collection(db, 'users', userId, 'cardProgress'),
      where('totalReviews', '>', 3),
      orderBy('correctReviews', 'asc'),
      orderBy('totalReviews', 'desc'),
      limit(10)
    );
    
    const [bestSnapshot, worstSnapshot] = await Promise.all([
      getDocs(bestCardsQuery),
      getDocs(worstCardsQuery)
    ]);
    
    const bestCards = [];
    const worstCards = [];
    
    bestSnapshot.forEach((doc) => {
      bestCards.push({ id: doc.id, ...doc.data() });
    });
    
    worstSnapshot.forEach((doc) => {
      worstCards.push({ id: doc.id, ...doc.data() });
    });
    
    return { bestCards, worstCards };
  } catch (error) {
    console.error('Error getting user stats:', error);
    console.error('Index creation link should appear above ↑');
    throw error;
  }
};

// Save user profile
export const saveUserProfile = async (userId, profileData) => {
  try {
    const userRef = doc(db, 'users', userId);
    await setDoc(userRef, {
      ...profileData,
      lastLogin: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }, { merge: true });
  } catch (error) {
    console.error('Error saving user profile:', error);
    throw error;
  }
};

// Get user profile
export const getUserProfile = async (userId) => {
  try {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    
    if (userDoc.exists()) {
      return userDoc.data();
    } else {
      return null;
    }
  } catch (error) {
    console.error('Error getting user profile:', error);
    throw error;
  }
};

// Update card statistics for a user
export const updateCardStats = async (userId, cardId, response, timeTaken) => {
  try {
    const progressRef = doc(db, 'users', userId, 'cardProgress', cardId);
    const progressDoc = await getDoc(progressRef);
    
    let currentData = progressDoc.exists() ? progressDoc.data() : {
      easeFactor: 2.5,
      interval: 0,
      repetitions: 0,
      nextReview: null,
      lastReviewed: null,
      isKnown: false,
      totalReviews: 0,
      correctReviews: 0,
      averageTime: 0
    };
    
    // Update statistics
    currentData.totalReviews = (currentData.totalReviews || 0) + 1;
    if (response >= 3) { // Assuming 3+ is correct
      currentData.correctReviews = (currentData.correctReviews || 0) + 1;
    }
    
    // Update average time
    const currentAvg = currentData.averageTime || 0;
    const totalReviews = currentData.totalReviews;
    currentData.averageTime = ((currentAvg * (totalReviews - 1)) + timeTaken) / totalReviews;
    
    // Apply SM-2 algorithm for spaced repetition
    currentData = applySpacedRepetition(currentData, response);
    
    await saveUserProgress(userId, cardId, currentData);
    return currentData;
  } catch (error) {
    console.error('Error updating card stats:', error);
    throw error;
  }
};

// SM-2 Algorithm implementation
const applySpacedRepetition = (cardData, quality) => {
  let { easeFactor, interval, repetitions } = cardData;
  
  if (quality >= 3) {
    if (repetitions === 0) {
      interval = 1;
    } else if (repetitions === 1) {
      interval = 6;
    } else {
      interval = Math.round(interval * easeFactor);
    }
    repetitions += 1;
  } else {
    repetitions = 0;
    interval = 1;
  }
  
  easeFactor = easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  if (easeFactor < 1.3) easeFactor = 1.3;
  
  const nextReview = new Date();
  nextReview.setDate(nextReview.getDate() + interval);
  
  return {
    ...cardData,
    easeFactor,
    interval,
    repetitions,
    nextReview: nextReview.toISOString(),
    lastReviewed: new Date().toISOString(),
    isKnown: repetitions >= 1 && quality >= 3
  };
}; 