/**
 * Create Private Table Modal
 * Allows users to create a private table with password and share link
 */
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import useAuthStore from '../../store/authStore';
import './CreatePrivateTableModal.css';

const CreatePrivateTableModal = ({ isOpen, onClose, onCreateSuccess }) => {
  const [tableName, setTableName] = useState('');
  const [password, setPassword] = useState('');
  const [maxPlayers, setMaxPlayers] = useState(6);
  const [minBet, setMinBet] = useState(20);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { userProfile } = useAuthStore();

  const handleCreate = async () => {
    if (!tableName.trim()) {
      setError('אנא הזן שם לשולחן');
      return;
    }

    if (!password.trim()) {
      setError('אנא הזן סיסמה לשולחן');
      return;
    }

    if (password.length < 4) {
      setError('סיסמה חייבת להכיל לפחות 4 תווים');
      return;
    }

    if (!userProfile || !userProfile.uid) {
      setError('אנא התחבר כדי ליצור שולחן');
      return;
    }

    setError('');
    setLoading(true);

    try {
      // Verify user is authenticated
      if (!userProfile || !userProfile.uid) {
        throw new Error('User not authenticated');
      }

      // Create table document
      const tableData = {
        name: tableName.trim(),
        password: password,
        maxPlayers: maxPlayers,
        minBet: minBet,
        players: 0,
        pot: 0,
        status: 'waiting',
        isPrivate: true,
        isDefault: false,
        createdBy: userProfile.uid,
        createdAt: new Date().toISOString(),
        connectedPlayers: []
      };

      console.log('Creating table with data:', { ...tableData, password: '***' });
      const docRef = await addDoc(collection(db, 'tables'), tableData);
      const tableId = docRef.id;
      console.log('Table created successfully with ID:', tableId);

      // Also create corresponding game room
      try {
        const { doc, setDoc } = await import('firebase/firestore');
        const roomRef = doc(db, 'game_rooms', tableId);
        await setDoc(roomRef, {
          tableId: tableId,
          players: [],
          gameState: 'waiting',
          createdAt: new Date().toISOString(),
          isPrivate: true,
          password: password
        });
      } catch (roomError) {
        console.warn('Could not create game room:', roomError);
        // Continue anyway, room will be created when first player joins
      }

      // Generate share link
      const shareLink = `${window.location.origin}/lobby?table=${tableId}&password=${encodeURIComponent(password)}`;
      
      if (onCreateSuccess) {
        onCreateSuccess(tableId, shareLink, password);
      }
      
      onClose();
    } catch (error) {
      console.error('Error creating private table:', error);
      console.error('Error details:', error.code, error.message);
      
      // More detailed error messages
      let errorMessage = 'שגיאה ביצירת שולחן';
      if (error.code === 'permission-denied') {
        errorMessage = 'אין הרשאה ליצור שולחן. אנא בדוק את הגדרות Firestore.';
      } else if (error.code === 'unavailable') {
        errorMessage = 'שירות לא זמין. אנא נסה שוב מאוחר יותר.';
      } else if (error.message) {
        errorMessage = `שגיאה: ${error.message}`;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="create-table-overlay" onClick={onClose}>
        <motion.div
          className="create-table-modal"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="create-table-header">
            <h2>צור שולחן פרטי</h2>
            <button className="create-table-close" onClick={onClose}>✕</button>
          </div>

          <div className="create-table-form">
            <div className="form-group">
              <label>שם השולחן</label>
              <input
                type="text"
                value={tableName}
                onChange={(e) => setTableName(e.target.value)}
                placeholder="הזן שם לשולחן"
                maxLength={30}
              />
            </div>

            <div className="form-group">
              <label>סיסמה</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="הזן סיסמה"
                minLength={4}
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>מספר שחקנים מקסימלי</label>
                <input
                  type="number"
                  value={maxPlayers}
                  onChange={(e) => setMaxPlayers(parseInt(e.target.value) || 6)}
                  min={2}
                  max={10}
                />
              </div>

              <div className="form-group">
                <label>מינימום הימור</label>
                <input
                  type="number"
                  value={minBet}
                  onChange={(e) => setMinBet(parseInt(e.target.value) || 20)}
                  min={10}
                  step={10}
                />
              </div>
            </div>

            {error && <div className="error-message">{error}</div>}

            <button 
              className="create-table-submit" 
              onClick={handleCreate}
              disabled={loading}
            >
              {loading ? 'יוצר...' : 'צור שולחן'}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default CreatePrivateTableModal;

