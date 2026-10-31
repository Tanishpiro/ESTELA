// Robust Multi-Engine Alarm Sound Generator
// Uses AudioContext oscillator (high-frequency siren) + HTML5 Audio fallback
// Automatically unlocks audio context on first user tap/click on the page

const ALARM_STORAGE_KEY = 'estela_active_alarm_state';

class EmergencyAlarmService {
  constructor() {
    this.audioCtx = null;
    this.sirenInterval = null;
    this.isPlaying = false;
    this.listeners = new Set();
    this.fallbackAudio = null;

    // Attach unlocker to first user interaction
    if (typeof window !== 'undefined') {
      const unlockAudio = () => {
        try {
          if (!this.audioCtx) {
            this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
          }
          if (this.audioCtx && this.audioCtx.state === 'suspended') {
            this.audioCtx.resume();
          }
        } catch (e) {}
      };

      window.addEventListener('click', unlockAudio, { once: false, passive: true });
      window.addEventListener('touchstart', unlockAudio, { once: false, passive: true });

      // Listen to cross-window events (Parent Portal <-> Child App)
      window.addEventListener('storage', (e) => {
        if (e.key === ALARM_STORAGE_KEY) {
          try {
            const data = e.newValue ? JSON.parse(e.newValue) : null;
            if (data?.playing) {
              this.start(false);
            } else {
              this.stop(false);
            }
          } catch (err) {}
        }
      });
    }
  }

  unlock() {
    try {
      if (!this.audioCtx) {
        this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      }
      if (this.audioCtx && this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }
    } catch (e) {}
  }

  subscribe(callback) {
    this.listeners.add(callback);
    callback(this.isPlaying);
    return () => this.listeners.delete(callback);
  }

  notify() {
    this.listeners.forEach((cb) => {
      try { cb(this.isPlaying); } catch (e) {}
    });
  }

  start(broadcast = true) {
    if (broadcast && typeof window !== 'undefined') {
      try {
        localStorage.setItem(ALARM_STORAGE_KEY, JSON.stringify({ playing: true, timestamp: Date.now() }));
      } catch (e) {}
    }

    if (this.isPlaying) return;
    this.isPlaying = true;
    this.notify();

    // 1. AudioContext Oscillator Siren
    try {
      this.unlock();
      const ctx = this.audioCtx;

      let highTone = true;
      const playTone = () => {
        if (!this.isPlaying) return;
        try {
          if (!this.audioCtx) {
            this.unlock();
          }
          const currentCtx = this.audioCtx;
          if (!currentCtx) return;
          if (currentCtx.state === 'suspended') {
            currentCtx.resume();
          }

          const osc = currentCtx.createOscillator();
          const gain = currentCtx.createGain();

          osc.type = 'sawtooth';
          const freq = highTone ? 1100 : 750;
          osc.frequency.setValueAtTime(freq, currentCtx.currentTime);
          osc.frequency.linearRampToValueAtTime(highTone ? 750 : 1100, currentCtx.currentTime + 0.3);

          gain.gain.setValueAtTime(0.5, currentCtx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.01, currentCtx.currentTime + 0.35);

          osc.connect(gain);
          gain.connect(currentCtx.destination);

          osc.start(currentCtx.currentTime);
          osc.stop(currentCtx.currentTime + 0.35);
          highTone = !highTone;
        } catch (err) {
          console.warn('Oscillator error:', err);
        }
      };

      playTone();
      this.sirenInterval = setInterval(playTone, 380);
    } catch (err) {
      console.warn('AudioContext Siren failed:', err);
    }

    // 2. Hardware Vibration for phones
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate([600, 200, 600, 200, 800]);
      } catch (e) {}
    }
  }

  stop(broadcast = true) {
    if (broadcast && typeof window !== 'undefined') {
      try {
        localStorage.setItem(ALARM_STORAGE_KEY, JSON.stringify({ playing: false, timestamp: Date.now() }));
      } catch (e) {}
    }

    this.isPlaying = false;
    if (this.sirenInterval) {
      clearInterval(this.sirenInterval);
      this.sirenInterval = null;
    }

    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(0);
      } catch (e) {}
    }

    this.notify();
  }

  toggle() {
    if (this.isPlaying) {
      this.stop(true);
    } else {
      this.start(true);
    }
  }
}

export const emergencyAlarm = new EmergencyAlarmService();
export default emergencyAlarm;
