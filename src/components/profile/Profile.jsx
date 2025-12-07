/**
 * User Profile Component
 * Displays user stats, achievements, and game history
 */
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import useAuthStore from '../../store/authStore';
import useEconomyStore from '../../store/economyStore';
import './Profile.css';

const Profile = ({ isOpen, onClose }) => {
  const { userProfile, updateProfile } = useAuthStore();
  const { transactions } = useEconomyStore();
  const [activeTab, setActiveTab] = useState('overview');

  if (!isOpen || !userProfile) return null;

  const level = Math.floor(userProfile.experience / 1000) + 1;
  const expToNextLevel = 1000 - (userProfile.experience % 1000);

  return (
    <div className="profile-overlay" onClick={onClose}>
      <motion.div
        className="profile-container"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.8, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
      >
        <button className="profile-close" onClick={onClose}>×</button>

        <div className="profile-header">
          <div className="profile-avatar">
            <img src={userProfile.avatar || '/assets/boy.svg'} alt="Avatar" />
            <div className="profile-level-badge">Lv.{level}</div>
          </div>
          <h2>{userProfile.username}</h2>
          <div className="profile-chips">
            <span className="chip-icon">💰</span>
            {userProfile.totalChips?.toLocaleString() || 0} chips
          </div>
        </div>

        <div className="profile-tabs">
          <button
            className={`profile-tab ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            Overview
          </button>
          <button
            className={`profile-tab ${activeTab === 'achievements' ? 'active' : ''}`}
            onClick={() => setActiveTab('achievements')}
          >
            Achievements
          </button>
          <button
            className={`profile-tab ${activeTab === 'history' ? 'active' : ''}`}
            onClick={() => setActiveTab('history')}
          >
            History
          </button>
          <button
            className={`profile-tab ${activeTab === 'transactions' ? 'active' : ''}`}
            onClick={() => setActiveTab('transactions')}
          >
            Transactions
          </button>
        </div>

        <div className="profile-content">
          {activeTab === 'overview' && (
            <div className="profile-overview">
              <div className="profile-stat">
                <label>Level</label>
                <div className="stat-value">{level}</div>
                <div className="exp-bar">
                  <div
                    className="exp-bar-fill"
                    style={{ width: `${((userProfile.experience % 1000) / 1000) * 100}%` }}
                  />
                </div>
                <div className="exp-text">{expToNextLevel} XP to next level</div>
              </div>
              <div className="profile-stat">
                <label>Total Chips</label>
                <div className="stat-value">{userProfile.totalChips?.toLocaleString() || 0}</div>
              </div>
              <div className="profile-stat">
                <label>Winning Streak</label>
                <div className="stat-value">{userProfile.winningStreak || 0}</div>
              </div>
              <div className="profile-stat">
                <label>Games Played</label>
                <div className="stat-value">{userProfile.gameHistory?.length || 0}</div>
              </div>
            </div>
          )}

          {activeTab === 'achievements' && (
            <div className="profile-achievements">
              {userProfile.achievements?.length > 0 ? (
                userProfile.achievements.map((achievement, index) => (
                  <div key={index} className="achievement-item">
                    <div className="achievement-icon">🏆</div>
                    <div className="achievement-info">
                      <div className="achievement-name">{achievement.name}</div>
                      <div className="achievement-desc">{achievement.description}</div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="no-data">No achievements yet. Keep playing!</p>
              )}
            </div>
          )}

          {activeTab === 'history' && (
            <div className="profile-history">
              {userProfile.gameHistory?.length > 0 ? (
                userProfile.gameHistory.slice().reverse().map((game, index) => (
                  <div key={index} className="history-item">
                    <div className="history-date">
                      {new Date(game.timestamp).toLocaleDateString()}
                    </div>
                    <div className="history-result">
                      {game.won ? '✅ Won' : '❌ Lost'} - {game.chipsWon || 0} chips
                    </div>
                  </div>
                ))
              ) : (
                <p className="no-data">No game history yet.</p>
              )}
            </div>
          )}

          {activeTab === 'transactions' && (
            <div className="profile-transactions">
              {transactions.length > 0 ? (
                transactions.map((transaction) => (
                  <div key={transaction.id} className="transaction-item">
                    <div className="transaction-type">{transaction.type}</div>
                    <div className={`transaction-amount ${transaction.amount > 0 ? 'positive' : 'negative'}`}>
                      {transaction.amount > 0 ? '+' : ''}{transaction.amount}
                    </div>
                    <div className="transaction-date">
                      {new Date(transaction.timestamp).toLocaleString()}
                    </div>
                  </div>
                ))
              ) : (
                <p className="no-data">No transactions yet.</p>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default Profile;




