/**
 * Global game state management using Zustand
 * Handles all game state, players, table, and game flow
 */
import { create } from 'zustand';
import { cloneDeep } from 'lodash';
import {
  generateDeckOfCards,
  shuffle,
  dealPrivateCards,
  dealMissingCommunityCards,
  showDown,
} from '../utils/cards';
import {
  generateTable,
  beginNextRound,
  checkWin,
  determineNextActivePlayer,
  determinePhaseStartActivePlayer,
} from '../utils/players';
import {
  determineBlindIndices,
  anteUpBlinds,
  determineMinBet,
  handleBet,
  handleFold,
  handlePhaseShift,
  reconcilePot,
} from '../utils/bet';
import { handleAI as handleAIUtil } from '../utils/ai';

const useGameStore = create((set, get) => ({
  // Game state
  loading: true,
  winnerFound: null,
  players: null,
  numPlayersActive: null,
  numPlayersFolded: null,
  numPlayersAllIn: null,
  activePlayerIndex: null,
  dealerIndex: null,
  blindIndex: null,
  deck: null,
  communityCards: [],
  pot: null,
  highBet: null,
  betInputValue: null,
  sidePots: [],
  minBet: 20,
  phase: 'loading', // loading, initialDeal, preflop, flop, turn, river, showdown
  playerHierarchy: [],
  showDownMessages: [],
  playActionMessages: [],
  houseRake: 0, // House profit from rake
  roundHouseRake: 0, // Rake for current round
  playerAnimationSwitchboard: {
    0: { isAnimating: false, content: null },
    1: { isAnimating: false, content: null },
    2: { isAnimating: false, content: null },
    3: { isAnimating: false, content: null },
    4: { isAnimating: false, content: null },
    5: { isAnimating: false, content: null },
  },
  clearCards: false,

  // Multiplayer state
  isMultiplayer: true, // Always multiplayer now
  roomId: null,
  socket: null,
  isConnected: false,
  connectedPlayers: [], // Real players connected via Socket.io
  firestoreUnsubscribe: null, // Firestore real-time listener

  // Timer state
  turnTimer: null,
  turnTimeRemaining: 30, // seconds
  timerActive: false,

  // Actions
  initializeGame: async (initialChips = null, existingPlayers = null) => {
    try {
      console.log('Starting game initialization...');
      
      // Use provided chips or default to 20000
      const startingChips = initialChips || 20000;
      
      // Use existing players from Socket.io if available, otherwise create just the human player
      const players = await generateTable(startingChips, existingPlayers);
      console.log('Players generated:', players.length);
      
      if (!players || players.length === 0) {
        throw new Error('No players generated');
      }

      // generateTable now ensures we have at least 2 players (adds robots if needed)
      // So we can always start the game
      if (players.length < 2) {
        console.warn('Only', players.length, 'player(s) - this should not happen as generateTable adds robots');
        // Continue anyway - the game will work
      }
      
      // Apply dealer rake (5% commission) to human player
      const DEALER_RAKE_PERCENTAGE = 0.05; // 5% commission
      const humanPlayer = players.find(p => !p.robot);
      if (humanPlayer) {
        const rakeAmount = Math.floor(humanPlayer.chips * DEALER_RAKE_PERCENTAGE);
        humanPlayer.chips -= rakeAmount;
        humanPlayer.rakePaid = rakeAmount;
        console.log(`Dealer rake: ${rakeAmount} chips deducted from ${humanPlayer.name}`);
      }
      
      const dealerIndex = Math.floor(Math.random() * Math.floor(players.length));
      const blindIndicies = determineBlindIndices(dealerIndex, players.length);
      const playersBoughtIn = anteUpBlinds(players, blindIndicies, 20);

      console.log('Setting game state...');
      set({
        loading: false,
        players: playersBoughtIn,
        numPlayersActive: players.length,
        numPlayersFolded: 0,
        numPlayersAllIn: 0,
        activePlayerIndex: dealerIndex,
        dealerIndex,
        blindIndex: {
          big: blindIndicies.bigBlindIndex,
          small: blindIndicies.smallBlindIndex,
        },
        deck: shuffle(generateDeckOfCards()),
        pot: 0,
        highBet: 20,
        betInputValue: 20,
        phase: 'initialDeal',
      });

      console.log('Starting game loop...');
      // Start game loop IMMEDIATELY - no delay needed
      const currentState = get();
      if (currentState.players && currentState.players.length > 0) {
        get().runGameLoop();
      } else {
        console.error('No players available for game loop');
      }
      
      return Promise.resolve();
    } catch (error) {
      console.error('Error initializing game:', error);
      // Even on error, set loading to false so UI doesn't get stuck
      // Try to create a minimal game state
      try {
        const fallbackPlayers = [{
          id: 'player1',
          name: 'Player 1',
          avatarURL: '/assets/boy.svg',
          cards: [],
          showDownHand: { hand: [], descendingSortHand: [] },
          chips: 20000,
          roundStartChips: 20000,
          roundEndChips: 20000,
          currentRoundChipsInvested: 0,
          bet: 0,
          betReconciled: false,
          folded: false,
          allIn: false,
          canRaise: true,
          stackInvestment: 0,
          robot: false
        }];
        
        for (let i = 0; i < 4; i++) {
          fallbackPlayers.push({
            id: `ai${i}`,
            name: `AI Player ${i + 1}`,
            avatarURL: '/assets/boy.svg',
            cards: [],
            showDownHand: { hand: [], descendingSortHand: [] },
            chips: 20000,
            roundStartChips: 20000,
            roundEndChips: 20000,
            currentRoundChipsInvested: 0,
            bet: 0,
            betReconciled: false,
            folded: false,
            allIn: false,
            robot: true,
            canRaise: true,
            stackInvestment: 0,
          });
        }
        
        const dealerIndex = 0;
        const blindIndicies = determineBlindIndices(dealerIndex, fallbackPlayers.length);
        const playersBoughtIn = anteUpBlinds(fallbackPlayers, blindIndicies, 20);
        
        set({
          loading: false,
          players: playersBoughtIn,
          numPlayersActive: fallbackPlayers.length,
          numPlayersFolded: 0,
          numPlayersAllIn: 0,
          activePlayerIndex: dealerIndex,
          dealerIndex,
          blindIndex: {
            big: blindIndicies.bigBlindIndex,
            small: blindIndicies.smallBlindIndex,
          },
          deck: shuffle(generateDeckOfCards()),
          pot: 0,
          highBet: 20,
          betInputValue: 20,
          phase: 'initialDeal',
        });
        
        setTimeout(() => get().runGameLoop(), 200);
        return Promise.resolve();
      } catch (fallbackError) {
        console.error('Fallback initialization also failed:', fallbackError);
        set({ loading: false });
        return Promise.reject(error);
      }
    }
  },

  runGameLoop: () => {
    const state = get();
    if (!state.players || state.players.length === 0) {
      console.error('No players to deal cards to');
      return;
    }
    
    const newState = dealPrivateCards(cloneDeep(state));
    if (newState && newState.players) {
      // Verify cards were dealt
      const cardsDealt = newState.players.every(p => p.cards && p.cards.length === 2);
      if (!cardsDealt) {
        console.error('❌ Cards not dealt correctly!', newState.players.map(p => ({ name: p.name, cards: p.cards?.length || 0 })));
      }
      
      console.log('🎮 Cards dealt, activePlayerIndex:', newState.activePlayerIndex, 'Phase:', newState.phase, 'Cards dealt:', cardsDealt);
      set(newState);
      
      // CRITICAL: Sync game state to Firestore after dealing cards
      // Note: Cards are NOT synced to Firestore for security
      get().syncGameStateToFirestore(newState);
      
      // Auto-handle AI players immediately (small delay only for UI animation)
      setTimeout(() => {
        const currentState = get();
        if (currentState.players && 
            currentState.activePlayerIndex !== null &&
            currentState.players[currentState.activePlayerIndex]?.robot && 
            currentState.phase !== 'showdown') {
          get().handleAI();
        }
      }, 500); // Reduced from 1500ms to 500ms for faster gameplay
    } else {
      console.error('Failed to deal cards');
    }
  },

  handleBetInputChange: (val, min, max) => {
    if (val === '') val = min;
    if (val > max) val = max;
    set({ betInputValue: parseInt(val, 10) });
  },

  changeSliderInput: (val) => {
    set({ betInputValue: val[0] });
  },

  pushAnimationState: (index, content) => {
    const switchboard = get().playerAnimationSwitchboard;
    set({
      playerAnimationSwitchboard: {
        ...switchboard,
        [index]: { isAnimating: true, content },
      },
    });
  },

  popAnimationState: (index) => {
    const switchboard = get().playerAnimationSwitchboard;
    const persistContent = switchboard[index]?.content;
    set({
      playerAnimationSwitchboard: {
        ...switchboard,
        [index]: { isAnimating: false, content: persistContent },
      },
    });
  },

  handleBetInputSubmit: (bet, min, max) => {
    const state = get();
    const { playerAnimationSwitchboard, activePlayerIndex, socket, roomId } = state;
    
    // CRITICAL: Only allow action if this is the current user's turn
    const authStoreModule = require('./authStore');
    const authState = authStoreModule.default.getState();
    const userProfile = authState.userProfile;
    
    if (!userProfile) {
      console.error('Cannot perform action: user not authenticated');
      return;
    }
    
    const activePlayer = state.players[activePlayerIndex];
    if (!activePlayer) {
      console.error('No active player');
      return;
    }
    
    // Check if the active player is the current user
    if (activePlayer.id !== userProfile.uid && !activePlayer.robot) {
      console.warn('Not your turn! Active player:', activePlayer.name, 'Your ID:', userProfile.uid);
      return; // Don't allow action if it's not the current user's turn
    }
    
    // Show animation
    get().pushAnimationState(
      activePlayerIndex,
      `${activePlayer.name} bets ${bet}`
    );

    const newState = handleBet(cloneDeep(state), parseInt(bet, 10), parseInt(min, 10), parseInt(max, 10));
    console.log('🎯 Bet action - new activePlayerIndex:', newState.activePlayerIndex, 'Phase:', newState.phase, 'Community cards:', newState.communityCards?.length || 0);
    set(newState);

    // Broadcast action to other players via Socket.io
    if (socket && roomId && socket.connected) {
      socket.emit('playerAction', {
        roomId,
        playerId: activePlayer.id,
        action: 'bet',
        amount: bet,
        gameState: newState
      });
    }

    // CRITICAL: Sync game state to Firestore immediately
    get().syncGameStateToFirestore(newState);

    // Auto-handle AI
    if (newState.players[newState.activePlayerIndex]?.robot && newState.phase !== 'showdown') {
      setTimeout(() => get().handleAI(), 1200);
    } else if (newState.phase === 'flop' || newState.phase === 'turn' || newState.phase === 'river') {
      // If we just moved to a new phase (flop/turn/river), the phase shift already happened
      // But we need to make sure the betting round starts correctly
      console.log('📊 New phase detected:', newState.phase, 'Community cards:', newState.communityCards?.length || 0);
    }
  },

  handleFold: () => {
    const state = get();
    const { socket, roomId } = state;
    
    // CRITICAL: Only allow action if this is the current user's turn
    const authStoreModule = require('./authStore');
    const authState = authStoreModule.default.getState();
    const userProfile = authState.userProfile;
    
    if (!userProfile) {
      console.error('Cannot perform action: user not authenticated');
      return;
    }
    
    const activePlayer = state.players[state.activePlayerIndex];
    if (!activePlayer) {
      console.error('No active player');
      return;
    }
    
    // Check if the active player is the current user
    if (activePlayer.id !== userProfile.uid && !activePlayer.robot) {
      console.warn('Not your turn! Active player:', activePlayer.name, 'Your ID:', userProfile.uid);
      return; // Don't allow action if it's not the current user's turn
    }
    
    const newState = handleFold(cloneDeep(state));
    console.log('🎯 Fold action - new activePlayerIndex:', newState.activePlayerIndex);
    set(newState);

    // Broadcast action to other players via Socket.io
    if (socket && roomId && socket.connected) {
      socket.emit('playerAction', {
        roomId,
        playerId: activePlayer.id,
        action: 'fold',
        gameState: newState
      });
    }

    // CRITICAL: Sync game state to Firestore immediately
    get().syncGameStateToFirestore(newState);

    // Auto-handle AI
    if (newState.players[newState.activePlayerIndex]?.robot && newState.phase !== 'showdown') {
      setTimeout(() => get().handleAI(), 1200);
    }
  },

  handleAI: () => {
    const state = get();
    if (!state.players || state.activePlayerIndex === null) {
      console.warn('⚠️ Cannot handle AI - no players or activePlayerIndex');
      return;
    }
    
    const newState = handleAIUtil(cloneDeep(state), (index, content) => {
      get().pushAnimationState(index, content);
    });

    if (newState && newState.players) {
      console.log('🤖 AI action - new activePlayerIndex:', newState.activePlayerIndex, 'Phase:', newState.phase);
      set({
        ...newState,
        betInputValue: newState.minBet || newState.betInputValue || 20,
      });
      
      // Sync to Firestore
      get().syncGameStateToFirestore(newState);

      // Continue AI loop if needed
      if (newState.players[newState.activePlayerIndex]?.robot && newState.phase !== 'showdown') {
        setTimeout(() => get().handleAI(), 1200);
      }
    } else {
      console.error('❌ AI handler returned invalid state');
    }
  },

  handleNextRound: () => {
    const state = get();
    set({ clearCards: true });
    
    const newState = beginNextRound(cloneDeep(state));
    
    if (checkWin(newState.players)) {
      set({ winnerFound: true });
      return;
    }

    console.log('🔄 Starting next round - Phase:', newState.phase, 'ActivePlayer:', newState.activePlayerIndex);
    set(newState);
    
    // CRITICAL: Sync game state to Firestore after starting new round
    get().syncGameStateToFirestore(newState);

    // Auto-handle AI if it's AI's turn
    if (newState.players && 
        newState.activePlayerIndex !== null &&
        newState.players[newState.activePlayerIndex]?.robot && 
        newState.phase !== 'showdown') {
      setTimeout(() => get().handleAI(), 500);
    }
  },

  // Timer actions
  startTurnTimer: () => {
    const timer = setInterval(() => {
      const timeRemaining = get().turnTimeRemaining;
      if (timeRemaining <= 0) {
        get().stopTurnTimer();
        // Auto-fold if time expires
        const state = get();
        if (!state.players[state.activePlayerIndex]?.robot) {
          get().handleFold();
        }
      } else {
        set({ turnTimeRemaining: timeRemaining - 1 });
      }
    }, 1000);

    set({ turnTimer: timer, timerActive: true, turnTimeRemaining: 30 });
  },

  stopTurnTimer: () => {
    const timer = get().turnTimer;
    if (timer) {
      clearInterval(timer);
    }
    set({ turnTimer: null, timerActive: false, turnTimeRemaining: 30 });
  },

  // Multiplayer actions
  setSocket: (socket) => {
    if (socket) {
      // Set up Socket.io event listeners for multiplayer
      socket.on('connect', () => {
        console.log('Socket connected');
        set({ isConnected: true });
      });

      socket.on('disconnect', () => {
        console.log('Socket disconnected');
        set({ isConnected: false });
      });

      socket.on('playerJoined', (playerData) => {
        console.log('Player joined:', playerData);
        const { connectedPlayers } = get();
        const updatedPlayers = [...connectedPlayers, playerData];
        set({ connectedPlayers: updatedPlayers });
        
        // Add player to game if game is active
        const { players } = get();
        if (players) {
          const newPlayer = {
            id: playerData.id,
            name: playerData.name,
            avatarURL: playerData.avatarURL || '/assets/boy.svg',
            chips: playerData.chips || 20000,
            roundStartChips: playerData.chips || 20000,
            roundEndChips: playerData.chips || 20000,
            currentRoundChipsInvested: 0,
            cards: [],
            showDownHand: { hand: [], descendingSortHand: [] },
            bet: 0,
            betReconciled: false,
            folded: false,
            allIn: false,
            canRaise: true,
            stackInvestment: 0,
            robot: false,
            isConnected: true,
          };
          set({ players: [...players, newPlayer] });
        }
      });

      socket.on('playerLeft', (playerId) => {
        console.log('Player left:', playerId);
        const { connectedPlayers, players } = get();
        set({ 
          connectedPlayers: connectedPlayers.filter(p => p.id !== playerId),
          players: players ? players.filter(p => p.id !== playerId) : null
        });
      });

      socket.on('gameStateUpdate', (gameState) => {
        console.log('Game state updated from server:', gameState);
        // Merge with current state to preserve local UI state
        const currentState = get();
        set({
          ...gameState,
          loading: currentState.loading,
          playerAnimationSwitchboard: currentState.playerAnimationSwitchboard
        });
      });

      socket.on('roomPlayers', (players) => {
        console.log('Room players updated:', players);
        set({ connectedPlayers: players });
        
        // Update game players if game is active
        const { players: gamePlayers } = get();
        if (gamePlayers) {
          // Merge connected players with game players
          const updatedPlayers = gamePlayers.map(gamePlayer => {
            const connectedPlayer = players.find(p => p.id === gamePlayer.id);
            if (connectedPlayer) {
              return {
                ...gamePlayer,
                name: connectedPlayer.name,
                avatarURL: connectedPlayer.avatarURL || gamePlayer.avatarURL,
                isConnected: true
              };
            }
            return gamePlayer;
          });
          
          // Add new players that aren't in the game yet
          players.forEach(connectedPlayer => {
            if (!updatedPlayers.find(p => p.id === connectedPlayer.id)) {
              updatedPlayers.push({
                id: connectedPlayer.id,
                name: connectedPlayer.name,
                avatarURL: connectedPlayer.avatarURL || '/assets/boy.svg',
                chips: connectedPlayer.chips || 20000,
                roundStartChips: connectedPlayer.chips || 20000,
                roundEndChips: connectedPlayer.chips || 20000,
                currentRoundChipsInvested: 0,
                cards: [],
                showDownHand: { hand: [], descendingSortHand: [] },
                bet: 0,
                betReconciled: false,
                folded: false,
                allIn: false,
                canRaise: true,
                stackInvestment: 0,
                robot: false,
                isConnected: true,
              });
            }
          });
          
          set({ players: updatedPlayers });
        }
      });

      socket.on('playerAction', (action) => {
        console.log('Player action:', action);
        // Handle player actions from other players
        const { players, activePlayerIndex } = get();
        if (players && action.playerId) {
          const playerIndex = players.findIndex(p => p.id === action.playerId);
          if (playerIndex !== -1) {
            // Update player state based on action
            const updatedPlayers = [...players];
            if (action.type === 'bet') {
              updatedPlayers[playerIndex].bet = action.amount;
              updatedPlayers[playerIndex].chips -= action.amount;
            } else if (action.type === 'fold') {
              updatedPlayers[playerIndex].folded = true;
            }
            set({ players: updatedPlayers });
          }
        }
      });
    }
    set({ socket, isConnected: socket?.connected || false });
  },

  // Firestore real-time sync as primary/fallback method
  setupFirestoreSync: async (roomId, playerData) => {
    try {
      const { doc, setDoc, onSnapshot, updateDoc, arrayUnion } = await import('firebase/firestore');
      const { db } = await import('../config/firebase');
      
      const roomRef = doc(db, 'game_rooms', roomId);
      
      // Try to get existing room or create new one
      try {
        const { getDoc } = await import('firebase/firestore');
        const roomSnap = await getDoc(roomRef);
        
        if (roomSnap.exists()) {
          // Room exists - add player if not already there
          const roomData = roomSnap.data();
          const existingPlayers = roomData.players || [];
          
          // Clean up stale players (not active for more than 5 minutes)
          const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
          const activePlayers = existingPlayers.filter(p => {
            if (!p.lastSeen) return true; // Keep players without timestamp
            const lastSeen = new Date(p.lastSeen).getTime();
            return lastSeen > fiveMinutesAgo;
          });
          
          const playerExists = activePlayers.find(p => p.id === playerData.id);
          
          if (!playerExists) {
            console.log('➕ Adding player to existing room:', playerData.name);
            // Add timestamp to player data
            const playerWithTimestamp = {
              ...playerData,
              lastSeen: new Date().toISOString()
            };
            await updateDoc(roomRef, {
              players: [...activePlayers, playerWithTimestamp],
              lastUpdate: new Date().toISOString()
            });
          } else {
            // Update lastSeen timestamp
            const updatedPlayers = activePlayers.map(p => 
              p.id === playerData.id 
                ? { ...p, lastSeen: new Date().toISOString() }
                : p
            );
            await updateDoc(roomRef, {
              players: updatedPlayers,
              lastUpdate: new Date().toISOString()
            });
            console.log('✅ Player already in room, updated timestamp:', playerData.name);
          }
        } else {
          // Create new room
          console.log('🆕 Creating new room with player:', playerData.name);
          await setDoc(roomRef, {
            players: [{
              ...playerData,
              lastSeen: new Date().toISOString()
            }],
            gameState: null,
            createdAt: new Date().toISOString(),
            status: 'waiting',
            lastUpdate: new Date().toISOString()
          });
        }
      } catch (error) {
        console.error('Error creating/updating room:', error);
        // Try to create anyway
        try {
          await setDoc(roomRef, {
            players: [playerData],
            gameState: null,
            createdAt: new Date().toISOString(),
            status: 'waiting',
            lastUpdate: new Date().toISOString()
          });
        } catch (e) {
          console.error('Failed to create room:', e);
        }
      }

      // Listen for real-time updates
      const unsubscribe = onSnapshot(roomRef, (snapshot) => {
        if (snapshot.exists()) {
          const roomData = snapshot.data();
          
          // Clean up stale players (not active for more than 5 minutes)
          const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
          const allPlayers = roomData.players || [];
          const activePlayers = allPlayers.filter(p => {
            if (!p.lastSeen) return true; // Keep players without timestamp
            const lastSeen = new Date(p.lastSeen).getTime();
            return lastSeen > fiveMinutesAgo;
          });
          
          // Update timestamp for current user
          const authStoreModule = require('./authStore');
          const { userProfile } = authStoreModule.default.getState();
          const updatedPlayers = activePlayers.map(p => {
            if (p.id === userProfile?.uid) {
              return { ...p, lastSeen: new Date().toISOString() };
            }
            return p;
          });
          
          // If we filtered out stale players, update Firestore
          if (updatedPlayers.length !== allPlayers.length) {
            updateDoc(roomRef, {
              players: updatedPlayers,
              lastUpdate: new Date().toISOString()
            }).catch(err => console.error('Error cleaning stale players:', err));
          }
          
          console.log('🔥 Firestore room update - active players:', updatedPlayers.length, 'out of', allPlayers.length);
          
          // Update connected players
          set({ connectedPlayers: updatedPlayers });
          
          // Update game players
          const { players: gamePlayers, phase } = get();
          
          if (gamePlayers && gamePlayers.length > 0) {
            // Game is already running - merge players
            const mergedPlayers = [...gamePlayers];
            let hasNewPlayers = false;
            
            updatedPlayers.forEach(roomPlayer => {
              const existingIndex = mergedPlayers.findIndex(p => p.id === roomPlayer.id);
              if (existingIndex !== -1) {
                // Update existing player - ensure chips is valid
                const updatedChips = (typeof roomPlayer.chips === 'number' && !isNaN(roomPlayer.chips))
                  ? roomPlayer.chips
                  : (roomPlayer.totalChips && typeof roomPlayer.totalChips === 'number' && !isNaN(roomPlayer.totalChips))
                    ? roomPlayer.totalChips
                    : mergedPlayers[existingIndex].chips;
                
                // Ensure we don't set NaN
                const safeChips = (typeof updatedChips === 'number' && !isNaN(updatedChips)) ? updatedChips : mergedPlayers[existingIndex].chips || 20000;
                
                mergedPlayers[existingIndex] = {
                  ...mergedPlayers[existingIndex],
                  name: roomPlayer.name,
                  avatarURL: roomPlayer.avatarURL || mergedPlayers[existingIndex].avatarURL,
                  chips: safeChips,
                  isConnected: true
                };
              } else if (!roomPlayer.robot) {
                // Add new real player (not robot)
                hasNewPlayers = true;
                // If game hasn't started yet (loading/waiting phase), add player as active
                // If game is in progress, add them but they'll join next round
                const isGameInProgress = phase && phase !== 'loading' && phase !== 'waiting' && phase !== 'initialDeal';
                // Ensure chips is a valid number
                const playerChips = (typeof roomPlayer.chips === 'number' && !isNaN(roomPlayer.chips)) 
                  ? roomPlayer.chips 
                  : (roomPlayer.totalChips && typeof roomPlayer.totalChips === 'number' && !isNaN(roomPlayer.totalChips))
                    ? roomPlayer.totalChips
                    : 20000;
                
                mergedPlayers.push({
                  id: roomPlayer.id,
                  name: roomPlayer.name,
                  avatarURL: roomPlayer.avatarURL || '/assets/boy.svg',
                  chips: playerChips,
                  roundStartChips: playerChips,
                  roundEndChips: playerChips,
                  currentRoundChipsInvested: 0,
                  cards: [],
                  showDownHand: { hand: [], descendingSortHand: [] },
                  bet: 0,
                  betReconciled: false,
                  folded: isGameInProgress, // Only fold if game is already in progress
                  allIn: false,
                  canRaise: true,
                  stackInvestment: 0,
                  robot: false,
                  isConnected: true,
                });
                console.log(`✅ Added new player to game: ${roomPlayer.name} (${isGameInProgress ? 'will join next round' : 'active now'})`);
              }
            });
            
            // Remove players that left (but keep robots)
            const playerIds = updatedPlayers.map(p => p.id);
            const filteredPlayers = mergedPlayers.filter(p => playerIds.includes(p.id) || p.robot);
            
            if (hasNewPlayers || filteredPlayers.length !== mergedPlayers.length) {
              console.log('🔄 Updating game players:', filteredPlayers.length, 'players');
              set({ players: filteredPlayers });
            }
          } else if (updatedPlayers.length > 0) {
            // No game yet - but wait for at least 2 players before initializing
            console.log('⏳ Room has', players.length, 'players, waiting for more...');
            if (players.length >= 2) {
              console.log('🎮 Initializing game with', players.length, 'players from room');
              const initialChips = playerData.chips || 20000;
              get().initializeGame(initialChips, players);
            } else {
              console.log('⏸️ Not enough players yet (need 2, have', players.length, '), waiting...');
              // Set waiting state
              set({ 
                loading: false,
                phase: 'waiting',
                players: players.map(p => ({
                  id: p.id,
                  name: p.name,
                  avatarURL: p.avatarURL || '/assets/boy.svg',
                  chips: p.chips || 20000,
                  roundStartChips: p.chips || 20000,
                  roundEndChips: p.chips || 20000,
                  currentRoundChipsInvested: 0,
                  cards: [],
                  showDownHand: { hand: [], descendingSortHand: [] },
                  bet: 0,
                  betReconciled: false,
                  folded: false,
                  allIn: false,
                  canRaise: true,
                  stackInvestment: 0,
                  robot: false,
                  isConnected: true
                }))
              });
            }
          }
          
          // Update game state if available - CRITICAL: Sync activePlayerIndex
          // BUT: Don't overwrite cards - they're not synced for security
          if (roomData.gameState) {
            const currentState = get();
            
            // Preserve cards from current state - they're not synced to Firestore for security
            const currentPlayersWithCards = currentState.players || [];
            const syncedPlayers = roomData.gameState.players || [];
            
            // Merge: use synced player data but keep cards from current state
            const mergedPlayers = syncedPlayers.map((syncedPlayer, index) => {
              const currentPlayer = currentPlayersWithCards.find(p => p.id === syncedPlayer.id);
              return {
                ...syncedPlayer,
                // CRITICAL: Keep cards from current state (not synced for security)
                cards: currentPlayer?.cards || syncedPlayer.cards || [],
                showDownHand: currentPlayer?.showDownHand || syncedPlayer.showDownHand || { hand: [], descendingSortHand: [] }
              };
            });
            
            const syncedState = {
              ...roomData.gameState,
              players: mergedPlayers,
              loading: currentState.loading,
              playerAnimationSwitchboard: currentState.playerAnimationSwitchboard,
              // Preserve deck and cards-related state
              deck: currentState.deck || roomData.gameState.deck,
              clearCards: currentState.clearCards || false
            };
            
            // Ensure activePlayerIndex is valid
            if (syncedState.activePlayerIndex !== null && 
                syncedState.activePlayerIndex !== undefined &&
                syncedState.players && 
                syncedState.players[syncedState.activePlayerIndex]) {
              console.log('🔄 Syncing game state from Firestore - activePlayerIndex:', syncedState.activePlayerIndex, 'Players with cards:', syncedState.players.map(p => ({ name: p.name, cards: p.cards?.length || 0 })));
              set(syncedState);
            } else {
              console.warn('⚠️ Invalid activePlayerIndex from Firestore, keeping current state');
            }
          }
        } else {
          console.log('⚠️ Room does not exist yet');
        }
      }, (error) => {
        console.error('❌ Error in Firestore snapshot:', error);
      });

      // Store unsubscribe function
      set({ firestoreUnsubscribe: unsubscribe });
    } catch (error) {
      console.error('Error setting up Firestore sync:', error);
    }
  },

  syncGameStateToFirestore: async (gameState) => {
    try {
      const { doc, updateDoc } = await import('firebase/firestore');
      const { db } = await import('../config/firebase');
      const { roomId } = get();
      
      if (!roomId) return;
      
      const roomRef = doc(db, 'game_rooms', roomId);
      
      // Sync essential game state (without sensitive data like player cards)
      // CRITICAL: Don't sync player cards for security, but sync everything else
      const safeGameState = {
        players: (gameState.players || []).map(p => ({
          id: p.id,
          name: p.name || 'Player',
          avatarURL: p.avatarURL || '/assets/boy.svg',
          chips: (typeof p.chips === 'number' && !isNaN(p.chips)) ? p.chips : 0,
          bet: (typeof p.bet === 'number' && !isNaN(p.bet)) ? p.bet : 0,
          folded: p.folded || false,
          allIn: p.allIn || false,
          robot: p.robot || false,
          betReconciled: p.betReconciled || false
        })),
        pot: (typeof gameState.pot === 'number' && !isNaN(gameState.pot)) ? gameState.pot : 0,
        highBet: (typeof gameState.highBet === 'number' && !isNaN(gameState.highBet)) ? gameState.highBet : 20,
        phase: gameState.phase || 'loading',
        activePlayerIndex: (typeof gameState.activePlayerIndex === 'number' && gameState.activePlayerIndex !== null && gameState.activePlayerIndex >= 0) ? gameState.activePlayerIndex : 0,
        communityCards: gameState.communityCards || [], // CRITICAL: Sync community cards
        dealerIndex: (typeof gameState.dealerIndex === 'number' && gameState.dealerIndex !== null && gameState.dealerIndex >= 0) ? gameState.dealerIndex : 0,
        blindIndex: gameState.blindIndex || { big: 0, small: 0 },
        numPlayersActive: (typeof gameState.numPlayersActive === 'number' && !isNaN(gameState.numPlayersActive)) ? gameState.numPlayersActive : (gameState.players?.length || 0),
        numPlayersFolded: (typeof gameState.numPlayersFolded === 'number' && !isNaN(gameState.numPlayersFolded)) ? gameState.numPlayersFolded : 0,
        numPlayersAllIn: (typeof gameState.numPlayersAllIn === 'number' && !isNaN(gameState.numPlayersAllIn)) ? gameState.numPlayersAllIn : 0,
        lastUpdate: new Date().toISOString()
      };
      
      await updateDoc(roomRef, {
        gameState: safeGameState,
        lastUpdate: new Date().toISOString()
      });
      console.log('💾 Synced game state to Firestore - Phase:', safeGameState.phase, 'ActivePlayer:', safeGameState.activePlayerIndex, 'Community cards:', safeGameState.communityCards?.length || 0, 'Pot:', safeGameState.pot);
    } catch (error) {
      console.error('Error syncing game state to Firestore:', error);
    }
  },

  joinRoom: async (roomId, playerData) => {
    const { socket } = get();
    
    console.log('Joining room:', roomId, 'with player:', playerData);
    set({ roomId, isMultiplayer: true });

    // Try Socket.io first if available
    if (socket && socket.connected) {
      socket.emit('joinRoom', { roomId, playerData });
    }

    // Always set up Firestore sync as primary/fallback method
    await get().setupFirestoreSync(roomId, playerData);
  },

  leaveRoom: async () => {
    const { firestoreUnsubscribe, socket, roomId, players } = get();
    
    // Remove player from Firestore room
    if (roomId) {
      try {
        const { doc, getDoc, updateDoc } = await import('firebase/firestore');
        const { db } = await import('../config/firebase');
        const roomRef = doc(db, 'game_rooms', roomId);
        const roomSnap = await getDoc(roomRef);
        
        if (roomSnap.exists()) {
          const roomData = roomSnap.data();
          const currentPlayers = roomData.players || [];
          
          // Find current user's player data
          const { userProfile } = await import('./authStore').then(m => m.default.getState());
          if (userProfile) {
            // Remove player from room by filtering out the current user
            const updatedPlayers = currentPlayers.filter(p => p.id !== userProfile.uid);
            
            if (updatedPlayers.length !== currentPlayers.length) {
              await updateDoc(roomRef, {
                players: updatedPlayers,
                lastUpdate: new Date().toISOString()
              });
              console.log('✅ Removed player from room:', userProfile.uid);
            }
          }
        }
      } catch (error) {
        console.error('Error removing player from room:', error);
      }
    }
    
    // Unsubscribe from Firestore
    if (firestoreUnsubscribe) {
      firestoreUnsubscribe();
    }
    
    // Leave Socket.io room
    if (socket && socket.connected) {
      socket.emit('leaveRoom', { roomId });
    }
    
    set({ 
      roomId: null, 
      isMultiplayer: false,
      firestoreUnsubscribe: null,
      connectedPlayers: []
    });
  },
}));

export default useGameStore;

