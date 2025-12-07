/**
 * Player Chat Bubble Component
 * Displays chat messages above player avatars
 */
import React, { useEffect, useState } from 'react';
import './PlayerChatBubble.css';

const PlayerChatBubble = ({ message, playerName, duration = 3000 }) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
    }, duration);

    return () => clearTimeout(timer);
  }, [duration]);

  if (!isVisible || !message) return null;

  return (
    <div className="player-chat-bubble">
      <div className="player-chat-bubble-content">
        <span className="player-chat-name">{playerName}:</span>
        <span className="player-chat-message">{message}</span>
      </div>
      <div className="player-chat-bubble-tail"></div>
    </div>
  );
};

export default PlayerChatBubble;


