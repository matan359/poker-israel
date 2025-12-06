/**
 * Bonus Wheel Component
 * Hourly spin wheel for bonus chips
 */
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import useEconomyStore from '../../store/economyStore';
import { showAlert } from '../../utils/dialogs';
import './BonusWheel.css';

const BonusWheel = ({ isOpen, onClose }) => {
  const [spinning, setSpinning] = useState(false);
  const [prize, setPrize] = useState(null);
  const { spinWheelAvailable, spinBonusWheel } = useEconomyStore();

  const prizes = [100, 250, 500, 750, 1000, 1500, 2000];
  const prizeColors = ['#0066FF', '#00BFFF', '#00FFFF', '#0080FF', '#00CED1', '#32CD32', '#0066FF'];

  const handleSpin = async () => {
    if (spinning || !spinWheelAvailable) return;

    setSpinning(true);
    setPrize(null);

    // Spin animation duration
    const spinDuration = 3000;
    const rotations = 5 + Math.random() * 5; // 5-10 rotations

    setTimeout(async () => {
      const result = await spinBonusWheel();
      if (result.success) {
        setPrize(result.prize);
        setSpinning(false);
      } else {
        setSpinning(false);
        await showAlert(result.error || 'נכשל בקבלת הפרס', 'error', 'שגיאה');
      }
    }, spinDuration);
  };

  if (!isOpen) return null;

  return (
    <div className="bonus-wheel-overlay" onClick={onClose}>
      <motion.div
        className="bonus-wheel-container"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.8, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
      >
        <button className="bonus-wheel-close" onClick={onClose}>×</button>
        
        <h2>Bonus Wheel</h2>
        <p>Spin to win chips!</p>

        <div className="wheel-wrapper">
          <motion.div
            className="bonus-wheel"
            animate={spinning ? {
              rotate: [0, 360 * 8],
            } : {}}
            transition={spinning ? {
              duration: 3,
              ease: "easeOut",
            } : {}}
          >
            {prizes.map((amount, index) => {
              const angle = (360 / prizes.length) * index;
              return (
                <div
                  key={index}
                  className="wheel-segment"
                  style={{
                    transform: `rotate(${angle}deg)`,
                    backgroundColor: prizeColors[index],
                  }}
                >
                  <span className="wheel-prize">{amount}</span>
                </div>
              );
            })}
          </motion.div>
          <div className="wheel-pointer"></div>
        </div>

        {prize && (
          <motion.div
            className="prize-announcement"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
          >
            <h3>Congratulations!</h3>
            <p>You won {prize} chips!</p>
          </motion.div>
        )}

        <button
          className="spin-button"
          onClick={handleSpin}
          disabled={spinning || !spinWheelAvailable}
        >
          {spinning ? 'Spinning...' : spinWheelAvailable ? 'Spin Wheel' : 'Already Claimed'}
        </button>
      </motion.div>
    </div>
  );
};

export default BonusWheel;

