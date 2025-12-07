/**
 * Custom Prompt Component
 * Beautiful styled prompt dialog matching the Poker Israel theme
 */
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './CustomPrompt.css';

const CustomPrompt = ({ isOpen, message, title, defaultValue = '', onConfirm, onCancel, type = 'text', placeholder }) => {
  const [value, setValue] = useState(defaultValue);
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
    if (isOpen) {
      setValue(defaultValue);
    }
  }, [isOpen, defaultValue]);

  const handleConfirm = () => {
    if (onConfirm) {
      onConfirm(value);
    }
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleConfirm();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className="custom-prompt-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleCancel}
          />
          <motion.div
            className="custom-prompt"
            initial={{ opacity: 0, scale: 0.8, y: -50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: -50 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          >
            <div className="custom-prompt-header">
              <span className="custom-prompt-icon">❓</span>
              <h3 className="custom-prompt-title">{title || 'הזן ערך'}</h3>
            </div>
            <div className="custom-prompt-body">
              <p className="custom-prompt-message">{message}</p>
              <input
                ref={inputRef}
                type={type}
                className="custom-prompt-input"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder={placeholder}
                autoFocus
              />
            </div>
            <div className="custom-prompt-footer">
              <button 
                className="custom-prompt-btn custom-prompt-btn-cancel" 
                onClick={handleCancel}
                aria-label="Cancel input"
              >
                ביטול
              </button>
              <button 
                className="custom-prompt-btn custom-prompt-btn-confirm" 
                onClick={handleConfirm}
                aria-label="Confirm input"
              >
                אישור
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default CustomPrompt;




