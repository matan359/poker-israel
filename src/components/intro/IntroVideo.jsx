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
  const [isMuted, setIsMuted] = useState(true);
  const [showUnmute, setShowUnmute] = useState(true);
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

  const handleUnmute = () => {
    if (videoRef.current) {
      videoRef.current.muted = false;
      setIsMuted(false);
      setShowUnmute(false);
    }
  };

  const handleMuteToggle = () => {
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted;
      setIsMuted(videoRef.current.muted);
    }
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
            muted={isMuted}
            playsInline
            onEnded={handleVideoEnd}
            onError={handleVideoError}
          >
            <source src="/assets/intro-video.mp4" type="video/mp4" />
            Your browser does not support the video tag.
          </video>

          {showUnmute && (
            <motion.button
              className="intro-unmute-btn"
              onClick={handleUnmute}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5 }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              🔊 הפעל שמע
            </motion.button>
          )}

          {!showUnmute && (
            <motion.button
              className="intro-mute-toggle-btn"
              onClick={handleMuteToggle}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              {isMuted ? '🔇' : '🔊'}
            </motion.button>
          )}

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

