/**
 * Poker Israel Logo Component
 * Uses the official POKER ISRAEL logo image
 */
import React from 'react';
import './PokerIsraelLogo.css';

const PokerIsraelLogo = ({ size = 'large' }) => {
  const sizeClasses = {
    large: { width: '200px', height: 'auto' },
    medium: { width: '150px', height: 'auto' },
    small: { width: '100px', height: 'auto' }
  };

  const logoStyle = sizeClasses[size] || sizeClasses.medium;

  return (
    <div className={`poker-israel-logo logo-${size}`}>
      <img 
        src="/poker-israel-logo.png" 
        alt="POKER ISRAEL" 
        className="poker-israel-logo-image"
        style={logoStyle}
      />
    </div>
  );
};

export default PokerIsraelLogo;

