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

      // Check minimum 2 players requirement
      if (players.length < 2) {
        console.warn('Not enough players to start game. Waiting for more players...');
        set({ 
          loading: false,
          phase: 'waiting',
          players: players
        });
        // Show message to user
        const { showAlert } = await import('../utils/dialogs');
        await showAlert('נדרשים לפחות 2 שחקנים כדי להתחיל משחק. אנא המתין לשחקן נוסף או הזמן חברים!', 'warning', 'ממתין לשחקנים');
        return Promise.resolve();
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
      // Start game loop after state is set
      setTimeout(() => {
        const currentState = get();
        if (currentState.players && currentState.players.length > 0) {
          get().runGameLoop();
        } else {
          console.error('No players available for game loop');
        }
      }, 200);
      
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
      set(newState);
      
      // Auto-handle AI players after a short delay
      setTimeout(() => {
        const currentState = get();
        if (currentState.players && 
            currentState.activePlayerIndex !== null &&
            currentState.players[currentState.activePlayerIndex]?.robot && 
            currentState.phase !== 'showdown') {
          get().handleAI();
        }
      }, 1500);
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
    
    // Show animation
    get().pushAnimationState(
      activePlayerIndex,
      `${state.players[activePlayerIndex].name} bets ${bet}`
    );

    const newState = handleBet(cloneDeep(state), parseInt(bet, 10), parseInt(min, 10), parseInt(max, 10));
    set(newState);

    // Broadcast action to other players via Socket.io
    if (socket && roomId && socket.connected) {
      socket.emit('playerAction', {
        roomId,
        playerId: state.players[activePlayerIndex].id,
        action: 'bet',
        amount: bet,
        gameState: newState
      });
    }

    // Also sync via Firestore
    get().syncGameStateToFirestore(newState);

    // Auto-handle AI
    if (newState.players[newState.activePlayerIndex]?.robot && newState.phase !== 'showdown') {
      setTimeout(() => get().handleAI(), 1200);
    }
  },

  handleFold: () => {
    const state = get();
    const { socket, roomId } = state;
    const newState = handleFold(cloneDeep(state));
    set(newState);

    // Broadcast action to other players via Socket.io
    if (socket && roomId && socket.connected) {
      socket.emit('playerAction', {
        roomId,
        playerId: state.players[state.activePlayerIndex].id,
        action: 'fold',
        gameState: newState
      });
    }

    // Also sync via Firestore
    get().syncGameStateToFirestore(newState);

    // Auto-handle AI
    if (newState.players[newState.activePlayerIndex]?.robot && newState.phase !== 'showdown') {
      setTimeout(() => get().handleAI(), 1200);
    }
  },

  handleAI: () => {
    const state = get();
    const newState = handleAIUtil(cloneDeep(state), (index, content) => {
      get().pushAnimationState(index, content);
    });

    set({
      ...newState,
      betInputValue: newState.minBet,
    });

    // Continue AI loop if needed
    if (newState.players[newState.activePlayerIndex]?.robot && newState.phase !== 'showdown') {
      setTimeout(() => get().handleAI(), 1200);
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

    set(newState);

    // Auto-handle AI
    if (newState.players[newState.activePlayerIndex]?.robot && newState.phase !== 'showdown') {
      setTimeout(() => get().handleAI(), 1200);
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
          const playerExists = existingPlayers.find(p => p.id === playerData.id);
          
          if (!playerExists) {
            console.log('➕ Adding player to existing room:', playerData.name);
            await updateDoc(roomRef, {
              players: arrayUnion(playerData),
              lastUpdate: new Date().toISOString()
            });
          } else {
            console.log('✅ Player already in room:', playerData.name);
          }
        } else {
          // Create new room
          console.log('🆕 Creating new room with player:', playerData.name);
          await setDoc(roomRef, {
            players: [playerData],
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
          console.log('🔥 Firestore room update - players:', roomData.players?.length || 0, roomData.players);
          
          // Update connected players
          const players = roomData.players || [];
          set({ connectedPlayers: players });
          
          // Update game players
          const { players: gamePlayers, phase } = get();
          
          if (gamePlayers && gamePlayers.length > 0) {
            // Game is already running - merge players
            const updatedPlayers = [...gamePlayers];
            let hasNewPlayers = false;
            
            players.forEach(roomPlayer => {
              const existingIndex = updatedPlayers.findIndex(p => p.id === roomPlayer.id);
              if (existingIndex !== -1) {
                // Update existing player
                updatedPlayers[existingIndex] = {
                  ...updatedPlayers[existingIndex],
                  name: roomPlayer.name,
                  avatarURL: roomPlayer.avatarURL || updatedPlayers[existingIndex].avatarURL,
                  chips: roomPlayer.chips || updatedPlayers[existingIndex].chips,
                  isConnected: true
                };
              } else if (!roomPlayer.robot) {
                // Add new real player (not robot)
                hasNewPlayers = true;
                // If game hasn't started yet (loading/waiting phase), add player as active
                // If game is in progress, add them but they'll join next round
                const isGameInProgress = phase && phase !== 'loading' && phase !== 'waiting' && phase !== 'initialDeal';
                updatedPlayers.push({
                  id: roomPlayer.id,
                  name: roomPlayer.name,
                  avatarURL: roomPlayer.avatarURL || '/assets/boy.svg',
                  chips: roomPlayer.chips || 20000,
                  roundStartChips: roomPlayer.chips || 20000,
                  roundEndChips: roomPlayer.chips || 20000,
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
            const playerIds = players.map(p => p.id);
            const filteredPlayers = updatedPlayers.filter(p => playerIds.includes(p.id) || p.robot);
            
            if (hasNewPlayers || filteredPlayers.length !== updatedPlayers.length) {
              console.log('🔄 Updating game players:', filteredPlayers.length, 'players');
              set({ players: filteredPlayers });
            }
          } else if (players.length > 0) {
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
          
          // Update game state if available
          if (roomData.gameState) {
            const currentState = get();
            set({
              ...roomData.gameState,
              loading: currentState.loading,
              playerAnimationSwitchboard: currentState.playerAnimationSwitchboard
            });
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
      
      // Sync essential game state (without sensitive data like cards)
      await updateDoc(roomRef, {
        gameState: {
          players: gameState.players.map(p => ({
            id: p.id,
            name: p.name,
            avatarURL: p.avatarURL,
            chips: p.chips,
            bet: p.bet,
            folded: p.folded,
            allIn: p.allIn,
            robot: p.robot || false
          })),
          pot: gameState.pot,
          highBet: gameState.highBet,
          phase: gameState.phase,
          activePlayerIndex: gameState.activePlayerIndex,
          communityCards: gameState.communityCards,
          dealerIndex: gameState.dealerIndex,
          blindIndex: gameState.blindIndex,
          lastUpdate: new Date().toISOString()
        },
        lastUpdate: new Date().toISOString()
      });
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

  leaveRoom: () => {
    const { firestoreUnsubscribe, socket } = get();
    
    // Unsubscribe from Firestore
    if (firestoreUnsubscribe) {
      firestoreUnsubscribe();
    }
    
    // Leave Socket.io room
    if (socket && socket.connected) {
      socket.emit('leaveRoom', { roomId: get().roomId });
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

