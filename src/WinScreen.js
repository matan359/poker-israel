import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useGameStore from './store/gameStore';
import useAuthStore from './store/authStore';
import './WinScreen.css';

const WinScreen = () => {
  const navigate = useNavigate();
  const { players } = useGameStore();
  const { userProfile } = useAuthStore();
  
  // Check if current player ran out of chips
  const currentPlayer = players?.find(p => !p.robot && (p.id === userProfile?.uid || p.name === userProfile?.username));
  const hasNoChips = currentPlayer && (currentPlayer.chips === 0 || currentPlayer.chips < 0);
  
  useEffect(() => {
    if (hasNoChips) {
      // Redirect to store after 3 seconds
      const timer = setTimeout(() => {
        navigate('/store');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [hasNoChips, navigate]);
  
  if (hasNoChips) {
    return (
      <div className="win-screen-container out-of-chips">
        <div className="win-screen-content">
          <h1 className="win-screen-title">נגמר לך הצ'יפים!</h1>
          <p className="win-screen-message">קניה מהירה</p>
          <p className="win-screen-subtitle">מעביר אותך לחנות...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="win-screen-container">
      <div className="win-screen-content">
        <h1 className="win-screen-title">YOU WIN!</h1>
        <p className="win-screen-message">Congratulations!</p>
      </div>
    </div>
  );
};

export default WinScreen;