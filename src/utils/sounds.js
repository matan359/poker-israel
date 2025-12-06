/**
 * Sound Effects System
 * Manages game sounds and background music
 */
class SoundManager {
  constructor() {
    this.sounds = {};
    this.music = null;
    this.musicVolume = 0.3;
    this.soundVolume = 0.7;
    this.musicEnabled = true;
    this.soundsEnabled = true;
    this.init();
  }

  init() {
    // Initialize sound effects
    // In a real app, you would load actual audio files
    // For now, we'll use Web Audio API to generate simple sounds
    
    // Card deal sound
    this.sounds.cardDeal = this.createTone(200, 0.1);
    
    // Chip sound
    this.sounds.chip = this.createTone(400, 0.15);
    
    // Win sound
    this.sounds.win = this.createTone(600, 0.3);
    
    // Fold sound
    this.sounds.fold = this.createTone(150, 0.2);
    
    // Bet sound
    this.sounds.bet = this.createTone(300, 0.2);
  }

  createTone(frequency, duration) {
    return () => {
      if (!this.soundsEnabled) return;
      
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = frequency;
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(0, audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(this.soundVolume, audioContext.currentTime + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + duration);
    };
  }

  playSound(soundName) {
    if (this.sounds[soundName] && this.soundsEnabled) {
      this.sounds[soundName]();
    }
  }

  playMusic(url) {
    if (!this.musicEnabled) return;
    
    if (this.music) {
      this.music.pause();
      this.music = null;
    }
    
    // In a real app, load and play background music
    // this.music = new Audio(url);
    // this.music.loop = true;
    // this.music.volume = this.musicVolume;
    // this.music.play();
  }

  stopMusic() {
    if (this.music) {
      this.music.pause();
      this.music = null;
    }
  }

  setMusicVolume(volume) {
    this.musicVolume = Math.max(0, Math.min(1, volume));
    if (this.music) {
      this.music.volume = this.musicVolume;
    }
  }

  setSoundVolume(volume) {
    this.soundVolume = Math.max(0, Math.min(1, volume));
  }

  toggleMusic() {
    this.musicEnabled = !this.musicEnabled;
    if (!this.musicEnabled) {
      this.stopMusic();
    }
    return this.musicEnabled;
  }

  toggleSounds() {
    this.soundsEnabled = !this.soundsEnabled;
    return this.soundsEnabled;
  }
}

// Export singleton instance
const soundManager = new SoundManager();
export default soundManager;

