/**
 * Authentication and user profile state management
 * Handles user login, registration, and profile data
 */
import { create } from 'zustand';
import { 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
} from 'firebase/auth';
import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc,
  collection,
  query,
  where,
  getDocs,
  orderBy,
  limit,
} from 'firebase/firestore';
import { auth, db } from '../config/firebase';

const useAuthStore = create((set, get) => ({
  // Auth state
  user: null,
  userProfile: null,
  loading: true,
  isAuthenticated: false,

  // Initialize auth listener
  initAuth: () => {
    onAuthStateChanged(auth, async (user) => {
      if (user) {
        const profile = await get().loadUserProfile(user.uid);
        set({ 
          user, 
          userProfile: profile,
          isAuthenticated: true,
          loading: false,
        });
      } else {
        set({ 
          user: null, 
          userProfile: null,
          isAuthenticated: false,
          loading: false,
        });
      }
    });
  },

  // Load user profile from Firestore
  loadUserProfile: async (uid) => {
    try {
      const userRef = doc(db, 'users', uid);
      const userSnap = await getDoc(userRef);
      
      if (userSnap.exists()) {
        return userSnap.data();
      } else {
        // Create new profile
        const newProfile = {
          uid,
          username: `Player${Math.floor(Math.random() * 10000)}`,
          avatar: null,
          level: 1,
          experience: 0,
          totalChips: 10000,
          achievements: [],
          gameHistory: [],
          createdAt: new Date().toISOString(),
          lastLogin: new Date().toISOString(),
          dailyBonusClaimed: false,
          lastDailyBonusDate: null,
          winningStreak: 0,
          cosmetics: {
            avatar: 'default',
            cardBack: 'default',
            tableSkin: 'default',
          },
        };
        await setDoc(userRef, newProfile);
        return newProfile;
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
      return null;
    }
  },

  // Sign in with email/password
  signIn: async (email, password) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const profile = await get().loadUserProfile(userCredential.user.uid);
      
      // Update last login
      await updateDoc(doc(db, 'users', userCredential.user.uid), {
        lastLogin: new Date().toISOString(),
      });

      set({ 
        user: userCredential.user, 
        userProfile: profile,
        isAuthenticated: true,
      });
      return { success: true };
    } catch (error) {
      console.error('Sign in error:', error);
      return { success: false, error: error.message };
    }
  },

  // Sign up with email/password
  signUp: async (email, password, username) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const newProfile = {
        uid: userCredential.user.uid,
        username,
        email,
        avatar: null,
        level: 1,
        experience: 0,
        totalChips: 10000,
        achievements: [],
        gameHistory: [],
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString(),
        dailyBonusClaimed: false,
        lastDailyBonusDate: null,
        winningStreak: 0,
        cosmetics: {
          avatar: 'default',
          cardBack: 'default',
          tableSkin: 'default',
        },
      };

      await setDoc(doc(db, 'users', userCredential.user.uid), newProfile);
      
      set({ 
        user: userCredential.user, 
        userProfile: newProfile,
        isAuthenticated: true,
      });
      return { success: true };
    } catch (error) {
      console.error('Sign up error:', error);
      return { success: false, error: error.message };
    }
  },

  // Sign in with Google
  signInWithGoogle: async () => {
    try {
      const provider = new GoogleAuthProvider();
      const userCredential = await signInWithPopup(auth, provider);
      const profile = await get().loadUserProfile(userCredential.user.uid);
      
      set({ 
        user: userCredential.user, 
        userProfile: profile,
        isAuthenticated: true,
      });
      return { success: true };
    } catch (error) {
      console.error('Google sign in error:', error);
      return { success: false, error: error.message };
    }
  },

  // Sign out
  signOut: async () => {
    try {
      await signOut(auth);
      set({ 
        user: null, 
        userProfile: null,
        isAuthenticated: false,
      });
      return { success: true };
    } catch (error) {
      console.error('Sign out error:', error);
      return { success: false, error: error.message };
    }
  },

  // Update user profile
  updateProfile: async (updates) => {
    try {
      const { user } = get();
      if (!user) return { success: false, error: 'Not authenticated' };

      await updateDoc(doc(db, 'users', user.uid), updates);
      const updatedProfile = await get().loadUserProfile(user.uid);
      
      set({ userProfile: updatedProfile });
      return { success: true };
    } catch (error) {
      console.error('Update profile error:', error);
      return { success: false, error: error.message };
    }
  },

  // Update chips after round ends
  updateChipsAfterRound: async (uid, finalChips) => {
    try {
      const userRef = doc(db, 'users', uid);
      await updateDoc(userRef, {
        totalChips: finalChips,
        lastGameUpdate: new Date().toISOString(),
      });
      
      const updatedProfile = { ...get().userProfile, totalChips: finalChips };
      set({ userProfile: updatedProfile });
      return { success: true };
    } catch (error) {
      console.error('Error updating chips:', error);
      return { success: false, error: error.message };
    }
  },

  // Add game to history
  addGameToHistory: async (gameData) => {
    try {
      const { user, userProfile } = get();
      if (!user) return;

      const gameHistory = [...(userProfile?.gameHistory || []), {
        ...gameData,
        timestamp: new Date().toISOString(),
      }].slice(-50); // Keep last 50 games

      await updateDoc(doc(db, 'users', user.uid), {
        gameHistory,
        totalChips: gameData.finalChips || userProfile.totalChips,
      });

      const updatedProfile = await get().loadUserProfile(user.uid);
      set({ userProfile: updatedProfile });
    } catch (error) {
      console.error('Error adding game to history:', error);
    }
  },

  // Get game history
  getGameHistory: async (limitCount = 20) => {
    try {
      const { user } = get();
      if (!user) return [];

      const userRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userRef);
      
      if (userSnap.exists()) {
        const history = userSnap.data().gameHistory || [];
        return history.slice(-limitCount).reverse();
      }
      return [];
    } catch (error) {
      console.error('Error getting game history:', error);
      return [];
    }
  },
}));

export default useAuthStore;

