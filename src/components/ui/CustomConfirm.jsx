/**
 * Custom Confirm Component
 * Beautiful styled confirm dialog matching the Poker Israel theme
 */
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './CustomConfirm.css';

const CustomConfirm = ({ isOpen, message, title, onConfirm, onCancel, confirmText = 'אישור', cancelText = 'ביטול' }) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className="custom-confirm-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onCancel}
          />
          <motion.div
            className="custom-confirm"
            initial={{ opacity: 0, scale: 0.8, y: -50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: -50 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          >
            <div className="custom-confirm-header">
              <span className="custom-confirm-icon">⚠️</span>
              <h3 className="custom-confirm-title">{title || 'אישור פעולה'}</h3>
            </div>
            <div className="custom-confirm-body">
              <p className="custom-confirm-message">{message}</p>
            </div>
            <div className="custom-confirm-footer">
              <button className="custom-confirm-btn custom-confirm-btn-cancel" onClick={onCancel}>
                {cancelText}
              </button>
              <button className="custom-confirm-btn custom-confirm-btn-confirm" onClick={onConfirm}>
                {confirmText}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default CustomConfirm;



