/**
 * Lobby Component
 * Shows available tables and allows players to join games
 */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import useGameStore from '../../store/gameStore';
import useAuthStore from '../../store/authStore';
import Profile from '../profile/Profile';
import Store from '../store/Store';
import AuthModal from '../auth/AuthModal';
import Admin from '../admin/Admin';
import WinnersSection from './WinnersSection';
import TournamentsSection from './TournamentsSection';
import CreatePrivateTableModal from './CreatePrivateTableModal';
import PokerIsraelLogo from '../logo/PokerIsraelLogo';
import { initializeDefaultTables } from '../../utils/defaultTables';
import { showAlert, showPrompt, showConfirm } from '../../utils/dialogs';
import './Lobby.css';
import './ConnectedUsers.css';

const Lobby = ({ onJoinTable, onCreateTable }) => {
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showProfile, setShowProfile] = useState(false);
  const [showStore, setShowStore] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);
  const [showCreateTable, setShowCreateTable] = useState(false);
  const [connectedUsers, setConnectedUsers] = useState([]);
  const [tablePlayers, setTablePlayers] = useState({}); // { tableId: [players] }
  const navigate = useNavigate();
  const { setSocket, joinRoom, initializeGame } = useGameStore();
  const { userProfile, signOut, isAuthenticated } = useAuthStore();
  
  // Show auth modal if not authenticated
  useEffect(() => {
    if (!isAuthenticated && !loading) {
      setShowAuth(true);
    }
  }, [isAuthenticated, loading]);

  useEffect(() => {
    // Initialize default tables and load tables from Firestore
    let unsubscribeTables = null;
    let initTimeout = null;
    let hasInitialized = false;
    let updateTimeout = null; // Move to outer scope for cleanup
    
    const loadTables = async () => {
      if (!isAuthenticated) {
        setLoading(false);
        return;
      }
      
      try {
        const { db } = await import('../../config/firebase');
        const { collection, onSnapshot, getDocs } = await import('firebase/firestore');
        const tablesRef = collection(db, 'tables');
        
        // Initialize default tables only once
        if (!hasInitialized) {
          console.log('Initializing default tables...');
          try {
            await initializeDefaultTables(db);
            console.log('Default tables initialized');
            hasInitialized = true;
          } catch (initError) {
            console.error('Error initializing default tables:', initError);
            // Continue anyway - maybe they already exist
            hasInitialized = true;
          }
        }
        
        // Real-time listener for tables with debounce
        unsubscribeTables = onSnapshot(
          tablesRef,
          (snapshot) => {
            // Debounce updates to prevent flickering
            if (updateTimeout) {
              clearTimeout(updateTimeout);
            }
            
            updateTimeout = setTimeout(() => {
              console.log(`Tables snapshot: ${snapshot.docs.length} tables, loading: ${loading}`);
              
              // Check if snapshot has errors
              if (snapshot.metadata.fromCache && snapshot.metadata.hasPendingWrites) {
                console.log('Snapshot is from cache, waiting for server...');
                return;
              }
              
              const tablesData = snapshot.docs.map(doc => {
                const data = doc.data();
                return {
                  id: doc.id,
                  ...data,
                  // Ensure all required fields exist
                  minBet: data.minBet || 10,
                  maxPlayers: data.maxPlayers || 6,
                  players: data.players || 0,
                  pot: data.pot || 0,
                  status: data.status || 'waiting',
                  isPrivate: data.isPrivate || false,
                  isDefault: data.isDefault || false
                };
              });
              
              // CRITICAL: Never update with empty array if we already have tables
              setTables(prev => {
                // If we have tables in snapshot, use them
                if (tablesData.length > 0) {
                  // Sort tables: default tables first (by level), then private tables
                  const sortedTables = tablesData.sort((a, b) => {
                    // Default tables first
                    if (a.isDefault && !b.isDefault) return -1;
                    if (!a.isDefault && b.isDefault) return 1;
                    // Sort default tables by level
                    if (a.isDefault && b.isDefault) {
                      return (a.level || 0) - (b.level || 0);
                    }
                    // Private tables by creation date
                    return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
                  });
                  
                  console.log(`✅ Setting ${sortedTables.length} tables from Firestore`);
                  
                  // Load connected players for each table
                  sortedTables.forEach(table => {
                    loadTablePlayers(table.id);
                  });
                  
                  return sortedTables;
                }
                
                // If snapshot is empty but we have existing tables, keep them
                if (prev.length > 0) {
                  console.log(`⚠️ Snapshot is empty but we have ${prev.length} existing tables, keeping them`);
                  return prev;
                }
                
                // Only use fallback if we have no tables at all (first load)
                if (loading || prev.length === 0) {
                  console.log('No tables found, using fallback');
                  const { DEFAULT_TABLES } = require('../../utils/defaultTables');
                  const fallbackTables = DEFAULT_TABLES.map((table, index) => ({
                    id: `default_table_level_${index + 1}`,
                    ...table
                  }));
                  return fallbackTables;
                }
                
                // Keep existing tables
                return prev;
              });
              
              setLoading(false);
            }, 300); // 300ms debounce
          },
          (error) => {
            console.error('Error in tables snapshot:', error);
            // Only use fallback if we don't have tables yet
            setTables(prev => {
              if (prev.length === 0) {
                const { DEFAULT_TABLES } = require('../../utils/defaultTables');
                return DEFAULT_TABLES.map((table, index) => ({
                  id: `default_table_level_${index + 1}`,
                  ...table
                }));
              }
              return prev; // Keep existing tables
            });
            setLoading(false);
          }
        );
      } catch (error) {
        console.error('Error loading tables:', error);
        // Only use fallback if we don't have tables yet
        setTables(prev => {
          if (prev.length === 0) {
            const { DEFAULT_TABLES } = require('../../utils/defaultTables');
            return DEFAULT_TABLES.map((table, index) => ({
              id: `default_table_level_${index + 1}`,
              ...table
            }));
          }
          return prev; // Keep existing tables
        });
        setLoading(false);
      }
    };
    
    if (isAuthenticated) {
      loadTables();
    } else {
      setLoading(false);
    }
    
    // Cleanup
    return () => {
      if (unsubscribeTables) {
        unsubscribeTables();
      }
      if (initTimeout) {
        clearTimeout(initTimeout);
      }
    };
  }, [isAuthenticated]);

  // Store unsubscribe functions for table players
  const tablePlayerUnsubscribes = useRef({});
  
  // Load connected players for a specific table
  const loadTablePlayers = useCallback(async (tableId) => {
    // Clean up previous listener for this table
    if (tablePlayerUnsubscribes.current[tableId]) {
      tablePlayerUnsubscribes.current[tableId]();
      delete tablePlayerUnsubscribes.current[tableId];
    }
    
    try {
      const { doc, onSnapshot } = await import('firebase/firestore');
      const { db } = await import('../../config/firebase');
      const roomRef = doc(db, 'game_rooms', tableId);
      
      const unsubscribe = onSnapshot(roomRef, (snapshot) => {
        if (snapshot.exists()) {
          const roomData = snapshot.data();
          const players = roomData.players || [];
          setTablePlayers(prev => ({
            ...prev,
            [tableId]: players
          }));
        } else {
          // Room doesn't exist yet, set empty array
          setTablePlayers(prev => ({
            ...prev,
            [tableId]: []
          }));
        }
      }, (error) => {
        console.error(`Error loading players for table ${tableId}:`, error);
        // Set empty array on error
        setTablePlayers(prev => ({
          ...prev,
          [tableId]: []
        }));
      });
      
      tablePlayerUnsubscribes.current[tableId] = unsubscribe;
    } catch (error) {
      console.error('Error loading table players:', error);
    }
  }, []);
  
  // Cleanup table player listeners on unmount
  useEffect(() => {
    return () => {
      Object.values(tablePlayerUnsubscribes.current).forEach(unsubscribe => {
        if (unsubscribe) unsubscribe();
      });
      tablePlayerUnsubscribes.current = {};
    };
  }, []);

  useEffect(() => {
    // Load connected users from users collection (users who are online)
    let roomsUnsubscribe = null;
    let usersUnsubscribe = null;
    
    const loadConnectedUsers = async () => {
      try {
        const { collection, onSnapshot, query, orderBy, limit } = await import('firebase/firestore');
        const { db } = await import('../../config/firebase');
        const usersRef = collection(db, 'users');
        
        // Load users from game rooms (most reliable - shows who is actually playing)
        const roomsRef = collection(db, 'game_rooms');
        roomsUnsubscribe = onSnapshot(roomsRef, (snapshot) => {
          const allUsers = new Map();
          
          snapshot.docs.forEach(doc => {
            const roomData = doc.data();
            const players = roomData.players || [];
            players.forEach(player => {
              if (player.id && !allUsers.has(player.id)) {
                allUsers.set(player.id, {
                  id: player.id,
                  username: player.name || player.username || 'שחקן',
                  totalChips: player.chips || player.totalChips || 0
                });
              }
            });
          });
          
          // Update connected users immediately from game_rooms
          setConnectedUsers(Array.from(allUsers.values()).slice(0, 20));
        }, (error) => {
          console.error('Error loading from game_rooms:', error);
        });
        
        // Note: We primarily use game_rooms to show connected users
        // Users collection is less reliable for real-time status
      } catch (error) {
        console.error('Error loading connected users:', error);
        // Fallback: show current user if available
        if (userProfile) {
          setConnectedUsers([{
            id: userProfile.uid,
            username: userProfile.username,
            totalChips: userProfile.totalChips || 0
          }]);
        }
      }
    };
    
    if (isAuthenticated) {
      loadConnectedUsers();
    }
    
    // Cleanup
    return () => {
      if (roomsUnsubscribe) {
        roomsUnsubscribe();
      }
      if (usersUnsubscribe) {
        usersUnsubscribe();
      }
    };
  }, [isAuthenticated, userProfile]);

  const handleJoinTable = async (table) => {
    console.log('Joining table:', table.id);
    
    // Check if table is private and requires password
    let password = null;
    if (table.isPrivate && table.password) {
      // Check if password is in URL (from share link)
      const urlParams = new URLSearchParams(window.location.search);
      const urlPassword = urlParams.get('password');
      
      if (urlPassword) {
        // Password from URL
        password = urlPassword;
      } else {
        // Ask user for password
        const enteredPassword = await showPrompt('הזן סיסמה לשולחן:', 'סיסמה לשולחן', '', 'password', 'הזן סיסמה');
        if (!enteredPassword) {
          return; // User cancelled
        }
        if (enteredPassword !== table.password) {
          await showAlert('סיסמה שגויה!', 'error', 'שגיאה');
          return;
        }
        password = enteredPassword;
      }
    }
    
    // Check minimum players requirement
    const currentPlayers = tablePlayers[table.id] || [];
    if (currentPlayers.length < 1) {
      // Will check again in game initialization
    }
    
    // Navigate with password if needed
    const gameUrl = password 
      ? `/game?table=${table.id}&password=${encodeURIComponent(password)}`
      : `/game?table=${table.id}`;
    navigate(gameUrl, { replace: true });
  };

  const handleCreateTable = () => {
    setShowCreateTable(true);
  };

  const handleTableCreated = async (tableId, shareLink, password) => {
    // Copy share link to clipboard
    try {
      await navigator.clipboard.writeText(shareLink);
      await showAlert(`שולחן נוצר בהצלחה!\nקישור הועתק ללוח: ${shareLink}`, 'success', 'הצלחה!');
    } catch {
      await showAlert(`שולחן נוצר בהצלחה!\nקישור: ${shareLink}`, 'success', 'הצלחה!');
    }
    
    // Navigate to game with password in URL
    const gameUrl = password 
      ? `/game?table=${tableId}&password=${encodeURIComponent(password)}`
      : `/game?table=${tableId}`;
    navigate(gameUrl, { replace: true });
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  if (loading) {
    return (
      <>
        <div 
          className="modern-poker-background"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            backgroundImage: 'url(/assets/poker-table-background.png)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            backgroundAttachment: 'fixed',
            zIndex: -999,
            pointerEvents: 'none'
          }}
        />
        <div className="lobby-container" style={{ position: 'relative', zIndex: 1 }}>
          <div className="lobby-loading">
            <div className="spinner"></div>
            <p>טוען שולחנות...</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <div 
        className="modern-poker-background"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          backgroundImage: 'url(/assets/poker-table-background.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          backgroundAttachment: 'fixed',
          zIndex: -999,
          pointerEvents: 'none'
        }}
      />
      <div className="lobby-container" style={{ position: 'relative', zIndex: 1 }}>
      {/* Top Menu Bar */}
      <div className="lobby-menu-bar">
        <div className="lobby-menu-left">
          {userProfile && (
            <>
              <div className="lobby-user-info">
                <span className="lobby-username">{userProfile.username}</span>
                <span className="lobby-chips">💰 {userProfile.totalChips?.toLocaleString() || 0}</span>
              </div>
            </>
          )}
        </div>
        <div className="lobby-menu-center">
          <PokerIsraelLogo size="medium" />
        </div>
        <div className="lobby-menu-right">
          {userProfile ? (
            <>
              <button className="lobby-menu-btn" onClick={() => setShowStore(true)}>
                🛒 חנות
              </button>
              <button className="lobby-menu-btn" onClick={() => setShowProfile(true)}>
                פרופיל
              </button>
              {(userProfile?.isAdmin || userProfile?.email === 'admin@pokerisrael.com') && (
                <button className="lobby-menu-btn" onClick={() => setShowAdmin(true)}>
                  🎛️ ADMIN
                </button>
              )}
              <button className="lobby-menu-btn" onClick={handleSignOut}>
                התנתק
              </button>
            </>
          ) : (
            <button className="lobby-menu-btn" onClick={() => setShowAuth(true)}>
              התחבר / הרשם
            </button>
          )}
        </div>
      </div>

      <div className="lobby-main-content">
        <div className="lobby-left-sidebar">
          <WinnersSection />
          <TournamentsSection />
          
          <div className="connected-users-section">
            <h3 className="connected-users-title">👥 משתמשים מחוברים</h3>
            <div className="connected-users-list">
              {connectedUsers.length === 0 ? (
                <p className="no-users">
                  {isAuthenticated && userProfile 
                    ? `רק אתה מחובר (${userProfile.username})`
                    : 'אין משתמשים מחוברים'}
                </p>
              ) : (
                connectedUsers.map((user, index) => (
                  <div key={user.id || index} className="connected-user-item">
                    <span className="user-name">{user.username || 'שחקן'}</span>
                    <span className="user-chips">💰 {user.totalChips?.toLocaleString() || 0}</span>
                  </div>
                ))
              )}
              {isAuthenticated && userProfile && !connectedUsers.find(u => u.id === userProfile.uid) && (
                <div className="connected-user-item">
                  <span className="user-name">{userProfile.username}</span>
                  <span className="user-chips">💰 {userProfile.totalChips?.toLocaleString() || 0}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="lobby-main-area">
      <div className="lobby-header">
        <h2>בחר שולחן</h2>
        <p>בחר שולחן להצטרף או צור שולחן משלך</p>
      </div>

      <div className="lobby-actions">
        <button className="lobby-free-play-btn" onClick={handleCreateTable}>
          <img 
            src="/assets/playfree.png" 
            alt="שחק בחינם" 
            className="free-play-btn-image"
            onError={(e) => {
              console.error('Failed to load free play button image');
              e.target.style.display = 'none';
            }}
          />
        </button>
        <button className="lobby-create-btn" onClick={handleCreateTable}>
          צור שולחן פרטי
        </button>
        
        <CreatePrivateTableModal
          isOpen={showCreateTable}
          onClose={() => setShowCreateTable(false)}
          onCreateSuccess={handleTableCreated}
        />
      </div>

      <div className="tables-grid">
        {tables.map((table, index) => (
          <motion.div
            key={table.id}
            className="table-card"
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: index * 0.1, type: "spring", stiffness: 100 }}
            whileHover={{ scale: 1.03, y: -8 }}
            onClick={() => handleJoinTable(table)}
          >
            <div className="table-card-header">
              <h3>{table.name}</h3>
              <div className="table-header-right">
                {table.isDefault && <span className="table-badge">ציבורי</span>}
                <span className="table-status">
                  {tablePlayers[table.id]?.length || table.players || 0}/{table.maxPlayers} שחקנים {table.isPrivate && '🔒'}
                </span>
              </div>
            </div>
            
            <div className="table-card-info">
              <div className="table-info-item">
                <span className="table-info-label">מינימום הימור:</span>
                <span className="table-info-value">{table.minBet?.toLocaleString() || 0} צ'יפים</span>
              </div>
              <div className="table-info-item">
                <span className="table-info-label">קופה נוכחית:</span>
                <span className="table-info-value">{table.pot?.toLocaleString() || 0} צ'יפים</span>
              </div>
              {table.description && (
                <div className="table-info-item table-description">
                  <span className="table-info-value">{table.description}</span>
                </div>
              )}
            </div>

            <div className="table-card-footer">
              <button className="table-join-btn">
                {(table.players || 0) >= table.maxPlayers ? 'מלא' : 'הצטרף לשולחן'}
              </button>
            </div>
          </motion.div>
        ))}
      </div>
        </div>
      </div>

      <Profile isOpen={showProfile} onClose={() => setShowProfile(false)} />
      <Store isOpen={showStore} onClose={() => setShowStore(false)} />
      <Admin isOpen={showAdmin} onClose={() => setShowAdmin(false)} />
      <AuthModal isOpen={showAuth} onClose={() => setShowAuth(false)} />
      </div>
    </>
  );
};

export default Lobby;

