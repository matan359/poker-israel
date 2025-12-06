/**
 * Firebase configuration and initialization
 * Firebase SDK setup for authentication and Firestore database
 */
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getAnalytics } from 'firebase/analytics';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBibZJmNmKsQ8mZk3mzDZK7dpGjghm2uI4",
  authDomain: "poker-3c5c6.firebaseapp.com",
  projectId: "poker-3c5c6",
  storageBucket: "poker-3c5c6.firebasestorage.app",
  messagingSenderId: "348135909160",
  appId: "1:348135909160:web:b03e47ae905f29c7c5521d",
  measurementId: "G-Q7MQH1S4YL"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
export const auth = getAuth(app);
export const db = getFirestore(app);

// Initialize Analytics (only in browser environment)
let analytics = null;
if (typeof window !== 'undefined') {
  try {
    analytics = getAnalytics(app);
  } catch (error) {
    console.warn('Analytics initialization failed:', error);
  }
}

export { analytics };
export default app;

