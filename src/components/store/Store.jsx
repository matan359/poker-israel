/**
 * Store Component
 * In-game store for purchasing chips and cosmetics
 */
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import useEconomyStore from '../../store/economyStore';
import useAuthStore from '../../store/authStore';
import { showAlert } from '../../utils/dialogs';
import './Store.css';

const Store = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState('chips');
  const { storeItems, loadStoreItems, purchaseChips, purchaseCosmetic } = useEconomyStore();
  const { userProfile } = useAuthStore();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadStoreItems();
    }
  }, [isOpen, loadStoreItems]);

  const handlePurchaseChips = async (item) => {
    setLoading(true);
    const result = await purchaseChips(item.amount, item.price);
    setLoading(false);
    if (result.success) {
      await showAlert(`נרכשו ${item.amount} צ'יפים בהצלחה!`, 'success', 'רכישה הושלמה');
    } else {
      await showAlert(result.error || 'הרכישה נכשלה', 'error', 'שגיאה');
    }
  };

  const handlePurchaseCosmetic = async (item) => {
    setLoading(true);
    const result = await purchaseCosmetic(item.id, item.type, item.price);
    setLoading(false);
    if (result.success) {
      await showAlert(`נרכש ${item.name} בהצלחה!`, 'success', 'רכישה הושלמה');
    } else {
      await showAlert(result.error || 'הרכישה נכשלה', 'error', 'שגיאה');
    }
  };

  if (!isOpen) return null;

  const chipsItems = storeItems.filter(item => item.type === 'chips');
  const cosmeticItems = storeItems.filter(item => item.type !== 'chips');

  return (
    <div className="store-overlay" onClick={onClose}>
      <motion.div
        className="store-container"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.8, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
      >
        <button className="store-close" onClick={onClose}>×</button>
        
        <div className="store-header">
          <h2>🎰 Store</h2>
          <div className="store-balance">
            <span>Your Chips: </span>
            <span className="store-balance-amount">💰 {userProfile?.totalChips?.toLocaleString() || 0}</span>
          </div>
        </div>

        <div className="store-tabs">
          <button
            className={`store-tab ${activeTab === 'chips' ? 'active' : ''}`}
            onClick={() => setActiveTab('chips')}
          >
            Chips
          </button>
          <button
            className={`store-tab ${activeTab === 'cosmetics' ? 'active' : ''}`}
            onClick={() => setActiveTab('cosmetics')}
          >
            Cosmetics
          </button>
        </div>

        <div className="store-content">
          {activeTab === 'chips' && (
            <div className="store-items-grid">
              {chipsItems.length > 0 ? (
                chipsItems.map((item) => (
                  <motion.div
                    key={item.id}
                    className="store-item-card"
                    whileHover={{ scale: 1.05 }}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <div className="store-item-header">
                      <h3>{item.name}</h3>
                    </div>
                    <div className="store-item-body">
                      <div className="store-item-amount">💰 {item.amount?.toLocaleString()} chips</div>
                      <div className="store-item-description">{item.description}</div>
                      <div className="store-item-price">${item.price}</div>
                    </div>
                    <button
                      className="store-item-btn"
                      onClick={() => handlePurchaseChips(item)}
                      disabled={loading}
                    >
                      {loading ? 'Processing...' : 'Purchase'}
                    </button>
                  </motion.div>
                ))
              ) : (
                <div className="store-empty">
                  <p>No chips packages available</p>
                  <p className="store-empty-note">Add items in Firestore store collection</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'cosmetics' && (
            <div className="store-items-grid">
              {cosmeticItems.length > 0 ? (
                cosmeticItems.map((item) => (
                  <motion.div
                    key={item.id}
                    className="store-item-card"
                    whileHover={{ scale: 1.05 }}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <div className="store-item-header">
                      <h3>{item.name}</h3>
                    </div>
                    <div className="store-item-body">
                      <div className="store-item-type">{item.type}</div>
                      <div className="store-item-description">{item.description}</div>
                      <div className="store-item-price">{item.price} chips</div>
                    </div>
                    <button
                      className="store-item-btn"
                      onClick={() => handlePurchaseCosmetic(item)}
                      disabled={loading || (userProfile?.totalChips || 0) < item.price}
                    >
                      {loading ? 'Processing...' : 
                       (userProfile?.totalChips || 0) < item.price ? 'Insufficient Chips' : 'Purchase'}
                    </button>
                  </motion.div>
                ))
              ) : (
                <div className="store-empty">
                  <p>No cosmetics available</p>
                  <p className="store-empty-note">Add items in Firestore store collection</p>
                </div>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default Store;

