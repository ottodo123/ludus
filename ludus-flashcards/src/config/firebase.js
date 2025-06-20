import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Your Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyByhR7u2GLUrCkVwqjlgRhdZ1WMVeatjM8",
  authDomain: "ludus-23160.firebaseapp.com",
  projectId: "ludus-23160",
  storageBucket: "ludus-23160.firebasestorage.app",
  messagingSenderId: "511644284143",
  appId: "1:511644284143:web:0f803de99fac3fd734d71a",
  measurementId: "G-58WJHNJ4K3"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);

export default app; 