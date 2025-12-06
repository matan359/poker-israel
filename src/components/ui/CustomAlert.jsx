/**
 * Custom Alert Component
 * Beautiful styled alert dialog matching the Poker Israel theme
 */
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './CustomAlert.css';

const CustomAlert = ({ isOpen, message, type = 'info', onClose, title }) => {
  if (!isOpen) return null;

  const getIcon = () => {
    switch (type) {
      case 'success':
        return '✅';
      case 'error':
        return '❌';
      case 'warning':
        return '⚠️';
      default:
        return 'ℹ️';
    }
  };

  const getTitle = () => {
    if (title) return title;
    switch (type) {
      case 'success':
        return 'הצלחה!';
      case 'error':
        return 'שגיאה!';
      case 'warning':
        return 'אזהרה!';
      default:
        return 'הודעה';
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className="custom-alert-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className={`custom-alert custom-alert-${type}`}
            initial={{ opacity: 0, scale: 0.8, y: -50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: -50 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          >
            <div className="custom-alert-header">
              <span className="custom-alert-icon">{getIcon()}</span>
              <h3 className="custom-alert-title">{getTitle()}</h3>
            </div>
            <div className="custom-alert-body">
              <p className="custom-alert-message">{message}</p>
            </div>
            <div className="custom-alert-footer">
              <button className="custom-alert-btn" onClick={onClose}>
                אישור
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default CustomAlert;



