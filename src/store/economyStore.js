/**
 * Economy system state management
 * Handles bonuses, store, transactions, and chip management
 */
import { create } from 'zustand';
import { doc, getDoc, updateDoc, collection, addDoc, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '../config/firebase';
import useAuthStore from './authStore';

const useEconomyStore = create((set, get) => ({
  // Economy state
  dailyBonusAvailable: false,
  spinWheelAvailable: false,
  storeItems: [],
  transactions: [],
  loading: false,

  // Initialize economy
  initEconomy: async () => {
    const { userProfile } = useAuthStore.getState();
    if (!userProfile) return;

    // Check daily bonus
    const lastBonusDate = userProfile.lastDailyBonusDate;
    const today = new Date().toDateString();
    const dailyBonusAvailable = lastBonusDate !== today;

    // Check spin wheel (hourly)
    const lastSpin = userProfile.lastSpinWheelTime;
    const now = Date.now();
    const oneHour = 60 * 60 * 1000;
    const spinWheelAvailable = !lastSpin || (now - lastSpin) >= oneHour;

    set({ dailyBonusAvailable, spinWheelAvailable });
    await get().loadStoreItems();
    await get().loadTransactions();
  },

  // Load store items
  loadStoreItems: async () => {
    try {
      const storeRef = collection(db, 'store');
      const storeSnap = await getDocs(storeRef);
      const items = storeSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      set({ storeItems: items });
    } catch (error) {
      console.error('Error loading store items:', error);
    }
  },

  // Load transactions
  loadTransactions: async () => {
    try {
      const { user } = useAuthStore.getState();
      if (!user) return;

      const transactionsRef = collection(db, 'transactions');
      const q = query(
        transactionsRef,
        where('userId', '==', user.uid),
        orderBy('timestamp', 'desc'),
        limit(50)
      );
      const transactionsSnap = await getDocs(q);
      const transactions = transactionsSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      set({ transactions });
    } catch (error) {
      console.error('Error loading transactions:', error);
    }
  },

  // Claim daily bonus
  claimDailyBonus: async () => {
    try {
      const { user, userProfile, updateProfile } = useAuthStore.getState();
      if (!user || !userProfile) return { success: false, error: 'Not authenticated' };

      const bonusAmount = 500 + (userProfile.level * 50); // Base 500 + level bonus
      
      await updateProfile({
        totalChips: userProfile.totalChips + bonusAmount,
        dailyBonusClaimed: true,
        lastDailyBonusDate: new Date().toDateString(),
      });

      // Add transaction
      await addDoc(collection(db, 'transactions'), {
        userId: user.uid,
        type: 'daily_bonus',
        amount: bonusAmount,
        timestamp: new Date().toISOString(),
        description: 'Daily Login Bonus',
      });

      set({ dailyBonusAvailable: false });
      await get().loadTransactions();
      
      return { success: true, amount: bonusAmount };
    } catch (error) {
      console.error('Error claiming daily bonus:', error);
      return { success: false, error: error.message };
    }
  },

  // Spin bonus wheel
  spinBonusWheel: async () => {
    try {
      const { user, userProfile, updateProfile } = useAuthStore.getState();
      if (!user || !userProfile) return { success: false, error: 'Not authenticated' };

      // Random prize between 100-2000 chips
      const prizes = [100, 250, 500, 750, 1000, 1500, 2000];
      const prize = prizes[Math.floor(Math.random() * prizes.length)];
      
      await updateProfile({
        totalChips: userProfile.totalChips + prize,
        lastSpinWheelTime: Date.now(),
      });

      // Add transaction
      await addDoc(collection(db, 'transactions'), {
        userId: user.uid,
        type: 'spin_wheel',
        amount: prize,
        timestamp: new Date().toISOString(),
        description: `Bonus Wheel: ${prize} chips`,
      });

      set({ spinWheelAvailable: false });
      await get().loadTransactions();
      
      return { success: true, prize };
    } catch (error) {
      console.error('Error spinning bonus wheel:', error);
      return { success: false, error: error.message };
    }
  },

  // Purchase chips
  purchaseChips: async (amount, price) => {
    try {
      const { user, userProfile, updateProfile } = useAuthStore.getState();
      if (!user || !userProfile) return { success: false, error: 'Not authenticated' };

      // In a real app, you'd process payment here
      // For now, we'll just add the chips
      await updateProfile({
        totalChips: userProfile.totalChips + amount,
      });

      // Add transaction
      await addDoc(collection(db, 'transactions'), {
        userId: user.uid,
        type: 'purchase',
        amount: amount,
        price: price,
        timestamp: new Date().toISOString(),
        description: `Purchased ${amount} chips`,
      });

      await get().loadTransactions();
      return { success: true };
    } catch (error) {
      console.error('Error purchasing chips:', error);
      return { success: false, error: error.message };
    }
  },

  // Purchase cosmetic
  purchaseCosmetic: async (itemId, itemType, price) => {
    try {
      const { user, userProfile, updateProfile } = useAuthStore.getState();
      if (!user || !userProfile) return { success: false, error: 'Not authenticated' };

      if (userProfile.totalChips < price) {
        return { success: false, error: 'Insufficient chips' };
      }

      const cosmetics = { ...userProfile.cosmetics, [itemType]: itemId };
      
      await updateProfile({
        totalChips: userProfile.totalChips - price,
        cosmetics,
      });

      // Add transaction
      await addDoc(collection(db, 'transactions'), {
        userId: user.uid,
        type: 'cosmetic_purchase',
        amount: -price,
        timestamp: new Date().toISOString(),
        description: `Purchased ${itemType}: ${itemId}`,
      });

      await get().loadTransactions();
      return { success: true };
    } catch (error) {
      console.error('Error purchasing cosmetic:', error);
      return { success: false, error: error.message };
    }
  },

  // Update winning streak
  updateWinningStreak: async (won) => {
    try {
      const { user, userProfile, updateProfile } = useAuthStore.getState();
      if (!user || !userProfile) return;

      let winningStreak = userProfile.winningStreak || 0;
      if (won) {
        winningStreak += 1;
        // Reward for streaks
        if (winningStreak % 5 === 0) {
          const streakBonus = winningStreak * 100;
          await updateProfile({
            winningStreak,
            totalChips: userProfile.totalChips + streakBonus,
          });
          
          await addDoc(collection(db, 'transactions'), {
            userId: user.uid,
            type: 'streak_bonus',
            amount: streakBonus,
            timestamp: new Date().toISOString(),
            description: `Winning Streak Bonus: ${winningStreak} games`,
          });
        } else {
          await updateProfile({ winningStreak });
        }
      } else {
        await updateProfile({ winningStreak: 0 });
      }
    } catch (error) {
      console.error('Error updating winning streak:', error);
    }
  },

  // Tip the dealer
  tipDealer: async (amount) => {
    try {
      const { user, userProfile, updateProfile } = useAuthStore.getState();
      if (!user || !userProfile) {
        console.error('Tip dealer: Not authenticated');
        return { success: false, error: 'Not authenticated' };
      }

      const currentChips = userProfile.totalChips || 0;
      console.log('Tip dealer: Current chips:', currentChips, 'Amount:', amount);

      if (currentChips < amount) {
        console.warn('Tip dealer: Insufficient chips');
        return { success: false, error: 'Insufficient chips' };
      }

      const newChips = currentChips - amount;
      console.log('Tip dealer: Deducting', amount, 'chips. New total:', newChips);

      // Deduct chips from player - CRITICAL: This must update Firestore
      const updateResult = await updateProfile({
        totalChips: newChips,
      });

      if (!updateResult || !updateResult.success) {
        console.error('Tip dealer: Failed to update profile');
        return { success: false, error: 'Failed to update chips' };
      }

      // Verify the update worked by reloading profile
      const updatedProfile = useAuthStore.getState().userProfile;
      console.log('Tip dealer: Updated chips in store:', updatedProfile?.totalChips);

      // Record tip in transactions
      await addDoc(collection(db, 'transactions'), {
        userId: user.uid,
        type: 'dealer_tip',
        amount: -amount,
        timestamp: new Date().toISOString(),
        description: `Tipped dealer ${amount} chips`,
      });

      // Record tip in house profits
      await addDoc(collection(db, 'house_profits'), {
        type: 'dealer_tip',
        amount: amount,
        userId: user.uid,
        timestamp: new Date().toISOString(),
        description: `Dealer tip from ${userProfile.username || user.email}`,
      });

      await get().loadTransactions();
      console.log('Tip dealer: Success! Chips deducted:', amount);
      return { success: true, amount, newChips };
    } catch (error) {
      console.error('Error tipping dealer:', error);
      return { success: false, error: error.message };
    }
  },

  // Record house rake/profit
  recordHouseProfit: async (rakeAmount, potSize, roundId) => {
    try {
      await addDoc(collection(db, 'house_profits'), {
        type: 'rake',
        amount: rakeAmount,
        potSize: potSize,
        roundId: roundId || `round_${Date.now()}`,
        timestamp: new Date().toISOString(),
        description: `House rake: ${rakeAmount} chips from pot of ${potSize}`,
      });
    } catch (error) {
      console.error('Error recording house profit:', error);
    }
  },
}));

export default useEconomyStore;

