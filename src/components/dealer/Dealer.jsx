/**
 * Virtual Dealer Component
 * Animated dealer that introduces rounds, deals cards, and announces winners
 */
import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './Dealer.css';

const Dealer = ({ phase, message, isAnnouncing, onTipDealer, showTipButton }) => {
  const [currentMessage, setCurrentMessage] = useState('');

  useEffect(() => {
    if (message) {
      setCurrentMessage(message);
    }
  }, [message]);

  // Get phase-specific messages
  const getPhaseMessage = () => {
    switch (phase) {
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

  const displayMessage = currentMessage || getPhaseMessage();

  return (
    <div className="dealer-container">
      <motion.div
        className="dealer-avatar"
        animate={{
          scale: isAnnouncing ? [1, 1.1, 1] : 1,
          rotate: isAnnouncing ? [0, 5, -5, 0] : 0,
        }}
        transition={{
          duration: 0.5,
          repeat: isAnnouncing ? Infinity : 0,
          repeatDelay: 1,
        }}
      >
        <div className="dealer-glow"></div>
        <div className="dealer-image">
          <svg viewBox="0 0 200 200" className="dealer-svg">
            {/* Dealer silhouette/icon */}
            <circle cx="100" cy="100" r="80" fill="#0066FF" />
            <circle cx="100" cy="80" r="30" fill="#FFFFFF" />
            <rect x="70" y="110" width="60" height="80" rx="10" fill="#1a1a1a" />
            <circle cx="90" cy="75" r="5" fill="#fff" />
            <circle cx="110" cy="75" r="5" fill="#fff" />
            <path d="M 85 90 Q 100 100 115 90" stroke="#fff" strokeWidth="3" fill="none" />
          </svg>
        </div>
      </motion.div>

      <AnimatePresence>
        {displayMessage && (
          <motion.div
            className="dealer-speech-bubble"
            initial={{ opacity: 0, y: 20, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.8 }}
            transition={{ duration: 0.3 }}
          >
            <div className="speech-bubble-content">
              <p>{displayMessage}</p>
            </div>
            <div className="speech-bubble-tail"></div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        className="dealer-lighting"
        animate={{
          opacity: [0.3, 0.6, 0.3],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Tip Dealer Button - Small button next to dealer */}
      {showTipButton && onTipDealer && (
        <button
          className="dealer-tip-button"
          onClick={onTipDealer}
          title="Tip Dealer 100 chips"
          aria-label="Tip dealer 100 chips"
        >
          💰 100
        </button>
      )}
    </div>
  );
};

export default Dealer;

