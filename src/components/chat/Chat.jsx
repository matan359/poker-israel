/**
 * Chat Component
 * Real-time chat for players at the table
 */
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import useAuthStore from '../../store/authStore';
import './Chat.css';

const Chat = ({ socket, roomId, isOpen, onToggle }) => {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const messagesEndRef = useRef(null);
  const { userProfile } = useAuthStore();

  useEffect(() => {
    if (!socket || !roomId) return;

    const handleMessage = (data) => {
      setMessages((prev) => [...prev, data]);
    };

    socket.on('chatMessage', handleMessage);

    return () => {
      socket.off('chatMessage', handleMessage);
    };
  }, [socket, roomId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!inputMessage.trim() || !socket || !roomId) return;

    const messageData = {
      playerId: userProfile?.uid,
      playerName: userProfile?.username || 'Anonymous',
      message: inputMessage.trim(),
      timestamp: new Date().toISOString(),
    };

    socket.emit('chatMessage', { roomId, ...messageData });
    setInputMessage('');
  };

  if (!isOpen) {
    return (
      <button className="chat-toggle-btn" onClick={onToggle}>
        💬 Chat
      </button>
    );
  }

  return (
    <motion.div
      className="chat-container"
      initial={{ x: 300, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 300, opacity: 0 }}
    >
      <div className="chat-header">
        <h3>Chat</h3>
        <button className="chat-close-btn" onClick={onToggle}>×</button>
      </div>

      <div className="chat-messages">
        <AnimatePresence>
          {messages.map((msg, index) => (
            <motion.div
              key={index}
              className={`chat-message ${msg.playerId === userProfile?.uid ? 'own-message' : ''}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <div className="chat-message-header">
                <span className="chat-player-name">{msg.playerName}</span>
                <span className="chat-timestamp">
                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <div className="chat-message-text">{msg.message}</div>
            </motion.div>
          ))}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </div>

      <form className="chat-input-form" onSubmit={handleSendMessage}>
        <input
          type="text"
          className="chat-input"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          placeholder="Type a message..."
          maxLength={200}
        />
        <button type="submit" className="chat-send-btn" disabled={!inputMessage.trim()}>
          Send
        </button>
      </form>
    </motion.div>
  );
};

export default Chat;

