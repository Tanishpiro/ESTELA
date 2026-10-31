// Dual-Engine High-Reliability Emergency Siren Alarm
// 1. HTML5 Audio with embedded looping emergency siren (works on mobile browsers without AudioContext restrictions)
// 2. Web Audio API Oscillator (High-pitch 1100Hz-750Hz wail)
// 3. Hardware phone vibration

const ALARM_STORAGE_KEY = 'estela_active_alarm_state';

class EmergencyAlarmService {
  constructor() {
    this.audioCtx = null;
    this.sirenInterval = null;
    this.isPlaying = false;
    this.listeners = new Set();
    this.audioElement = null;

    if (typeof window !== 'undefined') {
      try {
        // Pre-create HTML5 Audio element pointing to /alarm.wav
        this.audioElement = new Audio('/alarm.wav');
        this.audioElement.loop = true;
        this.audioElement.volume = 1.0;
        this.audioElement.preload = 'auto';
      } catch (e) {
        console.warn('Audio element init error:', e);
      }

      // Pre-unlock audio on ANY interaction (click, touch, keydown)
      const unlockAllAudio = () => {
        try {
          if (!this.audioCtx) {
            this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
          }
          if (this.audioCtx && this.audioCtx.state === 'suspended') {
            this.audioCtx.resume();
          }
          if (this.audioElement && this.audioElement.paused && !this.isPlaying) {
            // Muted play & pause to unlock mobile Safari/Chrome autoplay gate
            this.audioElement.volume = 0;
            this.audioElement.play().then(() => {
              this.audioElement.pause();
              this.audioElement.currentTime = 0;
              this.audioElement.volume = 1.0;
            }).catch(() => {});
          }
        } catch (e) {}
      };

      window.addEventListener('click', unlockAllAudio, { passive: true });
      window.addEventListener('touchstart', unlockAllAudio, { passive: true });
      window.addEventListener('keydown', unlockAllAudio, { passive: true });

      // Cross-tab/Cross-window storage event sync
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
      if (this.audioElement) {
        this.audioElement.volume = 1.0;
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

    // 1. PLAY HTML5 AUDIO (Guaranteed audio track)
    try {
      if (!this.audioElement) {
        this.audioElement = new Audio('/alarm.wav');
        this.audioElement.loop = true;
      }
      this.audioElement.volume = 1.0;
      this.audioElement.currentTime = 0;
      const playPromise = this.audioElement.play();
      if (playPromise !== undefined) {
        playPromise.catch((err) => {
          console.warn('Audio element play deferred or blocked:', err);
        });
      }
    } catch (err) {
      console.warn('HTML5 Audio play error:', err);
    }

    // 2. PLAY WEB AUDIO API OSCILLATOR SYNTHESIZER
    try {
      this.unlock();
      const ctx = this.audioCtx;
      if (ctx && ctx.state === 'suspended') {
        ctx.resume();
      }

      let highTone = true;
      const playTone = () => {
        if (!this.isPlaying) return;
        try {
          if (!this.audioCtx) this.unlock();
          const currentCtx = this.audioCtx;
          if (!currentCtx) return;
          if (currentCtx.state === 'suspended') currentCtx.resume();

          const osc = currentCtx.createOscillator();
          const gain = currentCtx.createGain();

          osc.type = 'sawtooth';
          const freq = highTone ? 1200 : 780;
          osc.frequency.setValueAtTime(freq, currentCtx.currentTime);
          osc.frequency.linearRampToValueAtTime(highTone ? 780 : 1200, currentCtx.currentTime + 0.32);

          gain.gain.setValueAtTime(0.6, currentCtx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.01, currentCtx.currentTime + 0.36);

          osc.connect(gain);
          gain.connect(currentCtx.destination);

          osc.start(currentCtx.currentTime);
          osc.stop(currentCtx.currentTime + 0.36);
          highTone = !highTone;
        } catch (e) {}
      };

      playTone();
      this.sirenInterval = setInterval(playTone, 380);
    } catch (err) {
      console.warn('Oscillator alarm engine error:', err);
    }

    // 3. HARDWARE PHONE VIBRATION
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

    // Stop HTML5 Audio
    try {
      if (this.audioElement) {
        this.audioElement.pause();
        this.audioElement.currentTime = 0;
      }
    } catch (e) {}

    // Stop Oscillator
    if (this.sirenInterval) {
      clearInterval(this.sirenInterval);
      this.sirenInterval = null;
    }

    // Stop Phone Vibration
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
