/**
 * Modern Poker App - Main Component
 * Integrates all features: authentication, multiplayer, economy, dealer, chat, etc.
 */
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import useGameStore from './store/gameStore';
import useAuthStore from './store/authStore';
import useEconomyStore from './store/economyStore';

// Components
import AuthModal from './components/auth/AuthModal';
import LoginPage from './components/auth/LoginPage';
import Lobby from './components/lobby/Lobby';
import Dealer from './components/dealer/Dealer';
import Chat from './components/chat/Chat';
import BonusWheel from './components/economy/BonusWheel';
import PokerIsraelLogo from './components/logo/PokerIsraelLogo';
import Player from './components/players/Player';
import ShowdownPlayer from './components/players/ShowdownPlayer';
import Card from './components/cards/Card';
import Spinner from './Spinner';
import WinScreen from './WinScreen';
import ErrorBoundary from './components/ErrorBoundary';
import Store from './components/store/Store';

// Utils
import { renderShowdownMessages, renderActionButtonText, renderNetPlayerEarnings, renderActionMenu } from './utils/ui';
import { determineMinBet } from './utils/bet';
import { showAlert } from './utils/dialogs';

// Styles
import './App.css';
import './Poker.css';
import './styles/ModernPoker.css';
import './styles/WaitingPlayer.css';
import './styles/ScrollOptimization.css';
import './styles/responsive.css';

function GameTable() {
  const [showAuth, setShowAuth] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [showStore, setShowStore] = useState(false);
  const [playerChatMessages, setPlayerChatMessages] = useState({}); // { playerId: { message, playerName, timestamp } } }
  const [showBonusWheel, setShowBonusWheel] = useState(false);
  const [dealerMessage, setDealerMessage] = useState('');
  const [isAnnouncing, setIsAnnouncing] = useState(false);
  const [gameInitialized, setGameInitialized] = useState(false);

  const {
    loading,
    winnerFound,
    players,
    activePlayerIndex,
    dealerIndex,
    communityCards,
    pot,
    highBet,
    betInputValue,
    phase,
    playerHierarchy,
    showDownMessages,
    playerAnimationSwitchboard,
    clearCards,
    socket,
    roomId,
    connectedPlayers,
    turnTimeRemaining,
    timerActive,
    initializeGame,
    handleBetInputChange,
    changeSliderInput,
    handleBetInputSubmit,
    handleFold,
    handleNextRound,
    pushAnimationState,
    popAnimationState,
    startTurnTimer,
    stopTurnTimer,
    setSocket,
    joinRoom,
    leaveRoom,
  } = useGameStore();

  const { isAuthenticated, userProfile, initAuth, updateChipsAfterRound } = useAuthStore();
  const { initEconomy, dailyBonusAvailable, claimDailyBonus, tipDealer, recordHouseProfit } = useEconomyStore();

  useEffect(() => {
    initAuth();
  }, [initAuth]);

  useEffect(() => {
    if (isAuthenticated) {
      initEconomy();
    }
  }, [isAuthenticated, initEconomy]);

  // Initialize Socket.io connection and game
  useEffect(() => {
    if (isAuthenticated && userProfile && !socket) {
      try {
        const { io } = require('socket.io-client');
        // Use environment variable or fallback to localhost
        const socketUrl = process.env.REACT_APP_SOCKET_URL || 'http://localhost:3001';
        const newSocket = io(socketUrl, {
          transports: ['websocket'],
          reconnection: true,
          reconnectionDelay: 1000,
          reconnectionAttempts: 5
        });

        setSocket(newSocket);

        // Join room when socket connects
        newSocket.on('connect', () => {
          console.log('Socket connected');
          const urlParams = new URLSearchParams(window.location.search);
          // Use table ID from URL or create a shared room ID based on table
          const tableParam = urlParams.get('table');
          // If no table param, use a default room for testing
          const tableId = tableParam || `default_room_${window.location.pathname}`;
          
          const playerData = {
            id: userProfile.uid,
            name: userProfile.username,
            avatarURL: userProfile.avatarURL || '/assets/boy.svg',
            chips: userProfile.totalChips || 20000
          };
          
          console.log('Joining room:', tableId, 'as player:', playerData.name);
          joinRoom(tableId, playerData);
        });

        // Listen for chat messages and display them above players
        newSocket.on('chatMessage', (data) => {
          if (data && data.playerId && data.message) {
            setPlayerChatMessages(prev => ({
              ...prev,
              [data.playerId]: {
                message: data.message,
                playerName: data.playerName || 'Player',
                timestamp: Date.now()
              }
            }));
            
            // Auto-remove message after 3 seconds
            setTimeout(() => {
              setPlayerChatMessages(prev => {
                const updated = { ...prev };
                delete updated[data.playerId];
                return updated;
              });
            }, 3000);
          }
        });

        newSocket.on('connect_error', (error) => {
          console.warn('Socket connection error (will continue with Firestore):', error);
          // Join room via Firestore if Socket.io fails
          const urlParams = new URLSearchParams(window.location.search);
          const tableParam = urlParams.get('table');
          const tableId = tableParam || `default_room_${window.location.pathname}`;
          
          const playerData = {
            id: userProfile.uid,
            name: userProfile.username,
            avatarURL: userProfile.avatarURL || '/assets/boy.svg',
            chips: userProfile.totalChips || 20000
          };
          
          console.log('Joining room via Firestore:', tableId, 'as player:', playerData.name);
          joinRoom(tableId, playerData);
        });

        return () => {
          if (newSocket) {
            newSocket.disconnect();
          }
        };
      } catch (error) {
        console.warn('Socket.io not available, using Firestore only:', error);
        // Join room via Firestore if Socket.io is not available
        const urlParams = new URLSearchParams(window.location.search);
        const tableParam = urlParams.get('table');
        const tableId = tableParam || `default_room_${window.location.pathname}`;
        
        const playerData = {
          id: userProfile.uid,
          name: userProfile.username,
          avatarURL: userProfile.avatarURL || '/assets/boy.svg',
          chips: userProfile.totalChips || 20000
        };
        
        console.log('Joining room via Firestore (no Socket.io):', tableId, 'as player:', playerData.name);
        joinRoom(tableId, playerData);
      }
    }
  }, [isAuthenticated, userProfile, socket, setSocket, joinRoom]);

  // CRITICAL: Join room immediately when entering game page (primary method)
  useEffect(() => {
    if (isAuthenticated && userProfile && window.location.pathname === '/game') {
      const urlParams = new URLSearchParams(window.location.search);
      const tableParam = urlParams.get('table');
      if (tableParam) {
        const { roomId } = useGameStore.getState();
        // Join immediately if not already joined
        if (!roomId || roomId !== tableParam) {
          const playerData = {
            id: userProfile.uid,
            name: userProfile.username,
            avatarURL: userProfile.avatarURL || '/assets/boy.svg',
            chips: userProfile.totalChips || 20000
          };
          console.log('🚀 IMMEDIATELY joining room via Firestore:', tableParam, 'as player:', playerData.name);
          joinRoom(tableParam, playerData);
        }
      }
    }
  }, [isAuthenticated, userProfile, joinRoom]);

  // Initialize game when component mounts - WAIT for players to join
  useEffect(() => {
    if (!gameInitialized && !players && isAuthenticated && userProfile) {
      console.log('⏳ Waiting for players before initializing game...');
      const initialChips = userProfile?.totalChips || 20000;
      const { connectedPlayers, roomId } = useGameStore.getState();
      
      // Wait for players to connect via Firestore
      const checkPlayers = async () => {
        // Check password if table is private
        const urlParams = new URLSearchParams(window.location.search);
        const tableId = urlParams.get('table');
        const password = urlParams.get('password');
        
        if (tableId) {
          try {
            const { doc, getDoc } = await import('firebase/firestore');
            const { db } = await import('./config/firebase');
            const tableRef = doc(db, 'tables', tableId);
            const tableSnap = await getDoc(tableRef);
            
            if (tableSnap.exists()) {
              const tableData = tableSnap.data();
              // Only check password if table is private and has a password
              if (tableData.isPrivate && tableData.password) {
                // If no password provided in URL, redirect to lobby
                if (!password) {
                  console.log('Private table requires password, redirecting to lobby');
                  window.location.href = '/lobby';
                  return;
                }
                // Check if password matches
                if (password !== tableData.password) {
                  await showAlert('סיסמה שגויה!', 'error', 'שגיאה');
                  window.location.href = '/lobby';
                  return;
                }
                console.log('Password verified successfully');
              }
            }
          } catch (error) {
            console.error('Error checking table password:', error);
          }
        }
        
        // Wait for players - but start quickly if we have at least 1 player (will add robots)
        let attempts = 0;
        const maxAttempts = 3; // Wait only 3 seconds (3 attempts) - start fast!
        
        const waitForPlayers = setInterval(async () => {
          attempts++;
          const { connectedPlayers: currentPlayers, roomId: currentRoomId } = useGameStore.getState();
          
          // Get players from Firestore room (most reliable)
          let roomPlayers = [];
          const tableId = urlParams.get('table') || currentRoomId;
          
          if (tableId) {
            try {
              const { doc, getDoc } = await import('firebase/firestore');
              const { db } = await import('./config/firebase');
              const roomRef = doc(db, 'game_rooms', tableId);
              const roomSnap = await getDoc(roomRef);
              if (roomSnap.exists()) {
                const roomData = roomSnap.data();
                roomPlayers = (roomData && roomData.players) ? roomData.players : [];
                if (roomPlayers && roomPlayers.length > 0) {
                  console.log(`👥 Found ${roomPlayers.length} players in room ${tableId}:`, roomPlayers.map(p => p?.name || 'Unknown'));
                } else {
                  console.log(`⏳ Room ${tableId} exists but has no players yet`);
                }
              } else {
                console.log(`⏳ Room ${tableId} doesn't exist yet, waiting...`);
              }
            } catch (error) {
              console.error('Error loading room players:', error);
            }
          }
          
          const allPlayers = (roomPlayers && roomPlayers.length > 0) ? roomPlayers : (currentPlayers || []);
          console.log(`🔄 Attempt ${attempts}/${maxAttempts}: Found ${allPlayers ? allPlayers.length : 0} players`);
          
          // CRITICAL: Start immediately if we have at least 1 player (generateTable will add robots)
          // OR if we have 2+ players, OR if we've waited too long
          if (allPlayers && allPlayers.length >= 1) {
            clearInterval(waitForPlayers);
            console.log(`✅ Starting game with ${allPlayers.length} player(s)!`);
            
            // Convert players to game format - ensure all players have required fields
            const existingPlayers = allPlayers.filter(p => p && p.id).map(p => ({
              id: p.id,
              name: p.name,
              avatarURL: p.avatarURL || '/assets/boy.svg',
              chips: (typeof p.chips === 'number' && !isNaN(p.chips)) ? p.chips : (p.totalChips && typeof p.totalChips === 'number' && !isNaN(p.totalChips)) ? p.totalChips : 20000,
              roundStartChips: (typeof p.chips === 'number' && !isNaN(p.chips)) ? p.chips : (p.totalChips && typeof p.totalChips === 'number' && !isNaN(p.totalChips)) ? p.totalChips : 20000,
              roundEndChips: (typeof p.chips === 'number' && !isNaN(p.chips)) ? p.chips : (p.totalChips && typeof p.totalChips === 'number' && !isNaN(p.totalChips)) ? p.totalChips : 20000,
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
            }));
            
            initializeGame(initialChips, existingPlayers)
              .then(() => {
                console.log('✅ Game initialized successfully with', existingPlayers.length, 'players');
                setGameInitialized(true);
              })
              .catch((error) => {
                console.error('❌ Error initializing game:', error);
                setGameInitialized(true);
              });
          } else if (attempts >= maxAttempts) {
            clearInterval(waitForPlayers);
            console.warn(`⚠️ Timeout: Starting game anyway (will add robots if needed)`);
            
            // Start with current user - generateTable will add robots
            initializeGame(initialChips, null)
              .then(() => {
                console.log('Game initialized (timeout - with robots)');
                setGameInitialized(true);
              })
              .catch((error) => {
                console.error('Error initializing game:', error);
                setGameInitialized(true);
              });
          }
        }, 1000);
      };
      
      checkPlayers();
    }
  }, [gameInitialized, initializeGame, players, isAuthenticated, userProfile]);

  useEffect(() => {
    if (phase && phase !== 'loading' && phase !== 'showdown') {
      setDealerMessage(getPhaseMessage(phase));
      setIsAnnouncing(true);
      setTimeout(() => setIsAnnouncing(false), 3000);
    }
  }, [phase]);

  useEffect(() => {
    if (!loading && activePlayerIndex !== null && players && !players[activePlayerIndex]?.robot && phase !== 'showdown') {
      startTurnTimer();
      return () => stopTurnTimer();
    }
  }, [activePlayerIndex, phase, loading, players, startTurnTimer, stopTurnTimer]);

  // Update chips after round ends and record house profits
  // Cleanup: Leave room when component unmounts or user navigates away
  useEffect(() => {
    // Handle page unload
    const handleBeforeUnload = () => {
      if (roomId) {
        leaveRoom();
      }
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    // Cleanup on unmount
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      if (roomId) {
        leaveRoom();
      }
    };
  }, [roomId, leaveRoom]);

  useEffect(() => {
    if (phase === 'showdown' && players && userProfile && isAuthenticated) {
      const humanPlayer = players.find(p => !p.robot && p.roundEndChips !== undefined);
      if (humanPlayer && humanPlayer.roundEndChips !== undefined) {
        // Update chips in Firebase
        updateChipsAfterRound(userProfile.uid, humanPlayer.roundEndChips);
      }
      
      // Record house rake/profit if available
      const gameState = useGameStore.getState();
      if (gameState.roundHouseRake && gameState.roundHouseRake > 0) {
        recordHouseProfit(gameState.roundHouseRake, pot || 0, `round_${Date.now()}`);
      }
      
      // Auto-start next round after 5 seconds (show results, then continue)
      const autoNextRoundTimer = setTimeout(() => {
        const currentState = useGameStore.getState();
        // Only auto-start if still in showdown and no winner found
        if (currentState.phase === 'showdown' && !currentState.winnerFound) {
          console.log('🔄 Auto-starting next round...');
          handleNextRound();
        }
      }, 5000); // 5 seconds to show results
      
      return () => clearTimeout(autoNextRoundTimer);
    }
  }, [phase, players, userProfile, isAuthenticated, updateChipsAfterRound, recordHouseProfit, pot, handleNextRound]);

  useEffect(() => {
    if (!isAuthenticated && !loading) {
      setShowAuth(true);
    }
  }, [isAuthenticated, loading]);

  const getPhaseMessage = (currentPhase) => {
    switch (currentPhase) {
      case 'initialDeal':
        return 'Welcome to the table! Dealing cards...';
      case 'preflop':
        return 'Pre-flop betting round begins!';
      case 'flop':
        return 'The flop is revealed!';
      case 'turn':
        return 'The turn card is revealed!';
      case 'river':
        return 'The river card is revealed!';
      case 'showdown':
        return 'Showdown! Revealing hands...';
      default:
        return '';
    }
  };

  const handleDailyBonus = async () => {
    if (dailyBonusAvailable) {
      const result = await claimDailyBonus();
      if (result.success) {
        setDealerMessage(`Daily bonus claimed! You received ${result.amount} chips!`);
        setIsAnnouncing(true);
        setTimeout(() => setIsAnnouncing(false), 3000);
      }
    }
  };

  const renderBoard = () => {
    if (!players) return null;

    // Get current user's ID to identify which player is "me"
    const currentUserId = userProfile?.uid;

    return players.map((player, index) => {
      const isActive = index === activePlayerIndex;
      const hasDealerChip = index === dealerIndex;
      // Check if this is the current user's player
      const isCurrentUser = player.id === currentUserId;

      return (
        <Player
          key={index}
          arrayIndex={index}
          isActive={isActive}
          hasDealerChip={hasDealerChip}
          player={player}
          clearCards={clearCards}
          phase={phase}
          playerAnimationSwitchboard={playerAnimationSwitchboard}
          endTransition={popAnimationState}
          isCurrentUser={isCurrentUser}
          communityCards={communityCards}
        />
      );
    });
  };

  const renderCommunityCards = (purgeAnimation = false) => {
    if (!communityCards || !Array.isArray(communityCards)) return null;
    return communityCards.map((card, index) => {
      let cardData = { ...card };
      if (purgeAnimation) {
        cardData.animationDelay = 0;
      }
      return <Card key={index} cardData={cardData} />;
    });
  };

  const renderShowdown = () => {
    return (
      <div className="showdown-container--wrapper">
        <h5 className="showdown-container--title">Round Complete!</h5>
        <div className="showdown-container--messages">
          {renderShowdownMessages(showDownMessages)}
        </div>
        <h5 className="showdown-container--community-card-label">Community Cards</h5>
        <div className="showdown-container--community-cards">
          {renderCommunityCards(true)}
        </div>
        <button 
          className="showdown--nextRound--button" 
          onClick={handleNextRound}
          aria-label="Start next round"
        >
          Next Round
        </button>
        {renderBestHands()}
      </div>
    );
  };

  const renderBestHands = () => {
    if (!playerHierarchy || playerHierarchy.length === 0) return null;

    return playerHierarchy.map((rankSnapshot, index) => {
      if (!rankSnapshot) return null;
      const tie = Array.isArray(rankSnapshot);
      const isWinner = index === 0; // First in hierarchy is the winner
      return tie ? (
        <div key={index}>{(rankSnapshot || []).map((player) => player ? renderRankWinner(player, isWinner) : null)}</div>
      ) : (
        renderRankWinner(rankSnapshot, isWinner)
      );
    });
  };

  const renderRankWinner = (player, isWinner = false) => {
    if (!players) return null;
    const playerStateData = players.find((p) => p.name === player.name);
    if (!playerStateData) return null;

    // Get hand rank from player object or fallback to playerStateData
    const handRank = player.handRank || 
                     playerStateData?.showDownHand?.bestHandRank || 
                     'Unknown';

    return (
      <div className={`showdown-player--entity ${isWinner ? 'showdown-winner' : 'showdown-loser'}`} key={player.name}>
        <ShowdownPlayer
          name={player.name}
          avatarURL={playerStateData.avatarURL}
          cards={playerStateData.cards}
          roundEndChips={playerStateData.roundEndChips}
          roundStartChips={playerStateData.roundStartChips}
        />
        <div className="showdown-player--besthand--container">
          <h5 className="showdown-player--besthand--heading">Best Hand</h5>
          <div className="showdown-player--besthand--cards">
            {player.bestHand?.map((card, index) => {
              const cardData = { ...card, animationDelay: 0 };
              return <Card key={index} cardData={cardData} />;
            })}
          </div>
        </div>
        <div className="showdown--handrank">{handRank}</div>
        {renderNetPlayerEarnings(playerStateData.roundEndChips, playerStateData.roundStartChips)}
      </div>
    );
  };

  const renderActionButtons = () => {
    if (!players || activePlayerIndex === null || !userProfile) return null;
    const activePlayer = players[activePlayerIndex];
    if (activePlayer?.robot || phase === 'showdown') return null;

    // CRITICAL: Only show action buttons if it's the current user's turn
    const isCurrentUserTurn = activePlayer.id === userProfile.uid;
    if (!isCurrentUserTurn) {
      return (
        <div className="waiting-for-player" role="status" aria-live="polite">
          <p>ממתין ל-{activePlayer.name}...</p>
        </div>
      );
    }

    const min = determineMinBet(highBet, activePlayer.chips, activePlayer.bet);
    const max = activePlayer.chips + activePlayer.bet;

    return (
      <>
        <button
          className="modern-action-button"
          onClick={() => handleBetInputSubmit(betInputValue, min, max)}
          aria-label={`${renderActionButtonText(highBet, betInputValue, activePlayer)} - Bet ${betInputValue || min} chips`}
        >
          {renderActionButtonText(highBet, betInputValue, activePlayer)}
        </button>
        <button 
          className="modern-action-button fold" 
          onClick={handleFold}
          aria-label="Fold your hand"
        >
          Fold
        </button>
      </>
    );
  };

  // Debug: Log state to console (only in development)
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('GameTable State:', {
        loading,
        gameInitialized,
        players: players?.length || 0,
        activePlayerIndex,
        phase,
        winnerFound,
      });
    }
  }, [loading, gameInitialized, players, activePlayerIndex, phase, winnerFound]);

  // Show loading only if we don't have players yet
  if (!players || (loading && !gameInitialized)) {
    return (
      <>
        <div className="modern-poker-background" />
        <div className="poker-table--wrapper">
          <div className="loading-spinner-container">
            <Spinner />
            <div>Loading game...</div>
          </div>
        </div>
      </>
    );
  }

  if (winnerFound) {
    return (
      <>
        <div className="modern-poker-background" />
        <div className="poker-table--wrapper">
          <WinScreen />
        </div>
      </>
    );
  }

  return (
    <>
      <div className="modern-poker-background" />
      <div className="poker-table--wrapper">
      
      {/* Top Bar with Logo */}
      <div className="game-top-bar">
        <div className="game-logo-container">
          <PokerIsraelLogo size="medium" />
        </div>
        <div className="table-info">
          <div className="table-name">Table 1</div>
          <div className="table-blinds">10/20</div>
        </div>
        {(() => {
          // Find the current player (Player 1) in the game
          const currentPlayer = players && players.length > 0 
            ? players.find(p => p.name === 'Player 1' || !p.robot) || players[0]
            : null;
          const displayChips = currentPlayer 
            ? (typeof currentPlayer.chips === 'number' && !isNaN(currentPlayer.chips) ? currentPlayer.chips : 0)
            : (userProfile?.totalChips && typeof userProfile.totalChips === 'number' && !isNaN(userProfile.totalChips) ? userProfile.totalChips : 0);
          const displayName = currentPlayer ? currentPlayer.name : (userProfile?.username || 'Player');
          
          return (
            <div className="game-user-info">
              <span className="game-username">{displayName}</span>
              <span className="game-chips">💰 {displayChips.toLocaleString()}</span>
            </div>
          );
        })()}
        <button 
          className="game-back-btn" 
          onClick={() => window.location.href = '/'}
        >
          ← Back to Lobby
        </button>
      </div>
      
      <div className="modern-table-container">
        <div className="poker-table--container">
          <img
            className="poker-table--table-image"
            src="/assets/table-nobg-svg-01.svg"
            alt="Poker Table"
            onError={(e) => {
              if (process.env.NODE_ENV === 'development') {
                console.error('Failed to load table image');
              }
              e.target.style.display = 'none';
            }}
          />
          
          <Dealer 
            phase={phase} 
            message={dealerMessage} 
            isAnnouncing={isAnnouncing}
            showTipButton={players && players.find(p => !p.robot)}
            onTipDealer={async () => {
              const tipAmount = 100;
              const result = await tipDealer(tipAmount);
              if (result.success) {
                setDealerMessage(`Thank you for the ${tipAmount} chip tip! 🎰`);
                setIsAnnouncing(true);
                setTimeout(() => setIsAnnouncing(false), 3000);
              }
            }}
          />
          
          {players && players.length > 0 ? renderBoard() : (
            <div className="loading-players-container">
              <div className="loading-players-text">Loading players...</div>
            </div>
          )}
          
          <div className="community-card-container modern-community-cards">
            {communityCards && communityCards.length > 0 ? renderCommunityCards() : null}
          </div>
          
          <div className="pot-container modern-pot-container">
            <img
              className="modern-pot-icon"
              src="/assets/pot.svg"
              alt={`Pot: ${pot || 0} chips`}
              loading="lazy"
              onError={(e) => {
                if (process.env.NODE_ENV === 'development') {
                  console.error('Failed to load pot icon');
                }
                e.target.style.display = 'none';
              }}
            />
            <h4 className="modern-pot-value">{pot || 0}</h4>
          </div>
        </div>
      </div>

      {phase === 'showdown' && renderShowdown()}

      {timerActive && (
        <div className={`modern-timer ${turnTimeRemaining <= 10 ? 'warning' : ''}`}>
          <div className="modern-timer-label">Time Remaining</div>
          <div className="modern-timer-value">{turnTimeRemaining}s</div>
        </div>
      )}

      <div className="modern-action-bar">
        <div className="action-buttons">{renderActionButtons()}</div>
        <div className="slider-container">
          <div className="slider-labels">
            <span>MIN</span>
            <span>Select your bet amount</span>
            <span>MAX</span>
          </div>
          <div className="slider-boi">
            {!loading &&
              renderActionMenu(
                highBet,
                players,
                activePlayerIndex,
                phase,
                handleBetInputChange,
                changeSliderInput
              )}
          </div>
        </div>
      </div>

      {dailyBonusAvailable && (
        <button
          className="modern-action-button bonus-button-mobile"
          onClick={handleDailyBonus}
          aria-label="Claim daily bonus"
        >
          Claim Daily Bonus
        </button>
      )}

      <button
        className="modern-action-button bonus-button-mobile"
        onClick={() => setShowBonusWheel(true)}
        aria-label="Spin bonus wheel"
      >
        Bonus Wheel
      </button>

      <Chat socket={socket} roomId={roomId} isOpen={showChat} onToggle={() => setShowChat(!showChat)} />

      <Store isOpen={showStore} onClose={() => setShowStore(false)} />

      <BonusWheel isOpen={showBonusWheel} onClose={() => setShowBonusWheel(false)} />

      <AuthModal isOpen={showAuth} onClose={() => setShowAuth(false)} />
      </div>
    </>
  );
}

// Lobby wrapper component with navigation
function LobbyWrapper() {
  return <Lobby onJoinTable={() => {}} onCreateTable={() => {}} />;
}

// Store wrapper component
function StoreWrapper() {
  return <Store isOpen={true} onClose={() => window.location.href = '/lobby'} />;
}

function App() {
  const { isAuthenticated, loading: authLoading, initAuth } = useAuthStore();
  const { initializeGame } = useGameStore();

  useEffect(() => {
    initAuth();
  }, [initAuth]);

  if (authLoading) {
    return (
      <>
        <div className="modern-poker-background" />
        <div className="poker-table--wrapper">
          <div className="loading-spinner-container">
            <div className="modern-spinner" />
          </div>
        </div>
      </>
    );
  }

  return (
    <ErrorBoundary>
      <Router>
        <Routes>
          <Route path="/" element={<LoginPage />} />
          <Route 
            path="/lobby" 
            element={
              <ProtectedRoute>
                <LobbyWrapper />
              </ProtectedRoute>
            } 
          />
          <Route
            path="/game"
            element={
              <ProtectedRoute>
                <GameTable />
              </ProtectedRoute>
            }
          />
          <Route
            path="/store"
            element={
              <ProtectedRoute>
                <StoreWrapper />
              </ProtectedRoute>
            }
          />
        </Routes>
      </Router>
    </ErrorBoundary>
  );
}

// Protected Route Component - redirects to login if not authenticated
function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, loading, navigate]);

  if (loading) {
    return (
      <>
        <div className="modern-poker-background" />
        <div className="loading-spinner-container">
          <div className="modern-spinner" />
        </div>
      </>
    );
  }

  return isAuthenticated ? children : null;
}

export default App;