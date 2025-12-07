/**
 * Intro Video Component
 * Displays opening video before login page
 */
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './IntroVideo.css';

const IntroVideo = ({ onComplete, onSkip }) => {
  const [showSkip, setShowSkip] = useState(false);
  const [hasPlayed, setHasPlayed] = useState(false);
  const videoRef = useRef(null);

  useEffect(() => {
    // Show skip button after 2 seconds
    const skipTimer = setTimeout(() => {
      setShowSkip(true);
    }, 2000);

    // Check if video has been played before
    const playedBefore = localStorage.getItem('introVideoPlayed');
    if (playedBefore === 'true') {
      // Auto-skip if played before (optional - can be removed if you want to show it every time)
      // onSkip();
    }

    return () => clearTimeout(skipTimer);
  }, [onSkip]);

  const handleVideoEnd = () => {
    setHasPlayed(true);
    localStorage.setItem('introVideoPlayed', 'true');
    setTimeout(() => {
      onComplete();
    }, 500);
  };

  const handleSkip = () => {
    if (videoRef.current) {
      videoRef.current.pause();
    }
    localStorage.setItem('introVideoPlayed', 'true');
    onSkip();
  };

  const handleVideoError = () => {
    console.error('Error loading intro video');
    // If video fails to load, skip to login
    onSkip();
  };

  return (
    <div className="intro-video-container">
      <AnimatePresence>
        <motion.div
          className="intro-video-wrapper"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
        >
          <video
            ref={videoRef}
            className="intro-video"
            autoPlay
            muted
            playsInline
            onEnded={handleVideoEnd}
            onError={handleVideoError}
          >
            <source src="/assets/intro-video.mp4" type="video/mp4" />
            Your browser does not support the video tag.
          </video>

          {showSkip && (
            <motion.button
              className="intro-skip-btn"
              onClick={handleSkip}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              דלג
            </motion.button>
          )}

          <div className="intro-overlay">
            <div className="intro-logo-container">
              {/* Logo can be added here if needed */}
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default IntroVideo;

