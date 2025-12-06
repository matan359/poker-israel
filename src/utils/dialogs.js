/**
 * Dialog Utility Functions
 * Provides easy-to-use functions for showing custom dialogs
 */
import React from 'react';
import { createRoot } from 'react-dom/client';
import CustomAlert from '../components/ui/CustomAlert';
import CustomPrompt from '../components/ui/CustomPrompt';
import CustomConfirm from '../components/ui/CustomConfirm';

const getContainer = (type) => {
  let containerId = `dialog-container-${type}`;
  let container = document.getElementById(containerId);
  
  if (!container) {
    container = document.createElement('div');
    container.id = containerId;
    document.body.appendChild(container);
  }
  
  return container;
};

/**
 * Show a custom alert dialog
 * @param {string} message - The message to display
 * @param {string} type - 'success', 'error', 'warning', or 'info'
 * @param {string} title - Optional custom title
 * @returns {Promise} Resolves when the alert is closed
 */
export const showAlert = (message, type = 'info', title) => {
  return new Promise((resolve) => {
    const container = getContainer('alert');
    const root = createRoot(container);
    
    const AlertComponent = () => {
      const [isOpen, setIsOpen] = React.useState(true);
      
      const handleClose = () => {
        setIsOpen(false);
        setTimeout(() => {
          root.unmount();
          resolve();
        }, 300);
      };
      
      return <CustomAlert isOpen={isOpen} message={message} type={type} title={title} onClose={handleClose} />;
    };
    
    root.render(<AlertComponent />);
  });
};

/**
 * Show a custom prompt dialog
 * @param {string} message - The message to display
 * @param {string} title - Optional custom title
 * @param {string} defaultValue - Default input value
 * @param {string} type - Input type (text, password, etc.)
 * @param {string} placeholder - Input placeholder
 * @returns {Promise<string|null>} Resolves with the entered value or null if cancelled
 */
export const showPrompt = (message, title = 'הזן ערך', defaultValue = '', type = 'text', placeholder = '') => {
  return new Promise((resolve) => {
    const container = getContainer('prompt');
    const root = createRoot(container);
    
    const PromptComponent = () => {
      const [isOpen, setIsOpen] = React.useState(true);
      
      const handleConfirm = (value) => {
        setIsOpen(false);
        setTimeout(() => {
          root.unmount();
          resolve(value);
        }, 300);
      };
      
      const handleCancel = () => {
        setIsOpen(false);
        setTimeout(() => {
          root.unmount();
          resolve(null);
        }, 300);
      };
      
      return (
        <CustomPrompt
          isOpen={isOpen}
          message={message}
          title={title}
          defaultValue={defaultValue}
          type={type}
          placeholder={placeholder}
          onConfirm={handleConfirm}
          onCancel={handleCancel}
        />
      );
    };
    
    root.render(<PromptComponent />);
  });
};

/**
 * Show a custom confirm dialog
 * @param {string} message - The message to display
 * @param {string} title - Optional custom title
 * @param {string} confirmText - Text for confirm button
 * @param {string} cancelText - Text for cancel button
 * @returns {Promise<boolean>} Resolves with true if confirmed, false if cancelled
 */
export const showConfirm = (message, title = 'אישור פעולה', confirmText = 'אישור', cancelText = 'ביטול') => {
  return new Promise((resolve) => {
    const container = getContainer('confirm');
    const root = createRoot(container);
    
    const ConfirmComponent = () => {
      const [isOpen, setIsOpen] = React.useState(true);
      
      const handleConfirm = () => {
        setIsOpen(false);
        setTimeout(() => {
          root.unmount();
          resolve(true);
        }, 300);
      };
      
      const handleCancel = () => {
        setIsOpen(false);
        setTimeout(() => {
          root.unmount();
          resolve(false);
        }, 300);
      };
      
      return (
        <CustomConfirm
          isOpen={isOpen}
          message={message}
          title={title}
          confirmText={confirmText}
          cancelText={cancelText}
          onConfirm={handleConfirm}
          onCancel={handleCancel}
        />
      );
    };
    
    root.render(<ConfirmComponent />);
  });
};

