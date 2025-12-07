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
    if (!roomId) return;

    // Listen for Socket.io messages
    const handleSocketMessage = (data) => {
      // Avoid duplicates - check if message already exists
      setMessages((prev) => {
        const exists = prev.some(
          msg => msg.playerId === data.playerId && 
                 msg.message === data.message && 
                 msg.timestamp === data.timestamp
        );
        if (exists) return prev;
        return [...prev, data];
      });
    };

    if (socket && socket.connected) {
      socket.on('chatMessage', handleSocketMessage);
    }

    // Listen for Firestore messages
    let unsubscribeFirestore = null;
    const setupFirestoreListener = async () => {
      try {
        const { db } = await import('../../config/firebase');
        const { collection, query, orderBy, limit, onSnapshot } = await import('firebase/firestore');
        
        const chatRef = collection(db, 'rooms', roomId, 'chat');
        const q = query(chatRef, orderBy('timestamp', 'desc'), limit(50));
        
        unsubscribeFirestore = onSnapshot(q, (snapshot) => {
          snapshot.docChanges().forEach((change) => {
            if (change.type === 'added') {
              const data = change.doc.data();
              const messageData = {
                playerId: data.playerId,
                playerName: data.playerName || 'Anonymous',
                message: data.message,
                timestamp: data.timestamp?.toDate?.()?.toISOString() || data.createdAt || data.timestamp,
              };
              
              // Avoid duplicates
              setMessages((prev) => {
                const exists = prev.some(
                  msg => msg.playerId === messageData.playerId && 
                         msg.message === messageData.message && 
                         Math.abs(new Date(msg.timestamp) - new Date(messageData.timestamp)) < 1000
                );
                if (exists) return prev;
                return [messageData, ...prev];
              });
            }
          });
        }, (error) => {
          console.error('Firestore chat listener error:', error);
        });
      } catch (error) {
        console.warn('Firestore not available for chat:', error);
      }
    };

    setupFirestoreListener();

    return () => {
      if (socket) {
        socket.off('chatMessage', handleSocketMessage);
      }
      if (unsubscribeFirestore) {
        unsubscribeFirestore();
      }
    };
  }, [socket, roomId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    // Use instant scroll for better performance, or requestAnimationFrame for smooth
    if (messagesEndRef.current) {
      requestAnimationFrame(() => {
        messagesEndRef.current.scrollIntoView({ behavior: 'auto' });
      });
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim() || !roomId) return;

    const messageData = {
      playerId: userProfile?.uid,
      playerName: userProfile?.username || 'Anonymous',
      message: inputMessage.trim(),
      timestamp: new Date().toISOString(),
    };

    // Optimistic update - add message immediately so sender sees it
    setMessages((prev) => [...prev, messageData]);
    setInputMessage('');

    // Try Socket.io first if available
    if (socket && socket.connected) {
      try {
        socket.emit('chatMessage', { roomId, ...messageData });
      } catch (error) {
        console.warn('Socket emit failed, using Firestore:', error);
        // Fallback to Firestore
        await sendChatMessageViaFirestore(roomId, messageData);
      }
    } else {
      // Use Firestore if Socket.io is not available
      await sendChatMessageViaFirestore(roomId, messageData);
    }
  };

  const sendChatMessageViaFirestore = async (roomId, messageData) => {
    try {
      const { db } = await import('../../config/firebase');
      const { collection, addDoc, serverTimestamp } = await import('firebase/firestore');
      
      const chatRef = collection(db, 'rooms', roomId, 'chat');
      await addDoc(chatRef, {
        ...messageData,
        timestamp: serverTimestamp(),
        createdAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error sending chat message via Firestore:', error);
    }
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
        <button 
          className="chat-close-btn" 
          onClick={onToggle}
          aria-label="Close chat"
        >
          ×
        </button>
      </div>

      <div className="chat-messages">
        {messages.length === 0 ? (
          <div className="chat-empty-state">
            <p>No messages yet. Start the conversation!</p>
          </div>
        ) : (
          <>
            {messages.map((msg, index) => (
              <motion.div
                key={`${msg.timestamp}-${index}`}
                className={`chat-message ${msg.playerId === userProfile?.uid ? 'own-message' : ''}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
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
          </>
        )}
        <div ref={messagesEndRef} />
      </div>

      <form className="chat-input-form" onSubmit={handleSendMessage}>
        <input
          type="text"
          className="chat-input"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          placeholder="הקלד הודעה..."
          maxLength={200}
          autoFocus={isOpen}
        />
        <button 
          type="submit" 
          className="chat-send-btn" 
          disabled={!inputMessage.trim()}
          aria-label="Send message"
        >
          שלח
        </button>
      </form>
    </motion.div>
  );
};

export default Chat;




