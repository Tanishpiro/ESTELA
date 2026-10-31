// Shared Emergency Siren Audio Synthesizer & Cross-App Alarm Controller
// Generates loud high-low emergency distress tone & device vibration
// Synchronizes 30s auto-escalation across both Parent (Tanish) & Child (Catty) views

const ALARM_STORAGE_KEY = 'estela_active_alarm_state';

class EmergencyAlarmService {
  constructor() {
    this.audioCtx = null;
    this.sirenInterval = null;
    this.isPlaying = false;
    this.listeners = new Set();
    this.autoTimer = null;

    // Listen to cross-tab/cross-window events via localStorage
    if (typeof window !== 'undefined') {
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
    try {
      if (!this.audioCtx) {
        this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      }
      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }

      this.isPlaying = true;
      this.notify();

      let highTone = true;
      const playTone = () => {
        if (!this.audioCtx || !this.isPlaying) return;
        try {
          const ctx = this.audioCtx;
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();

          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(highTone ? 960 : 720, ctx.currentTime);
          osc.frequency.exponentialRampToValueAtTime(highTone ? 720 : 960, ctx.currentTime + 0.35);

          gain.gain.setValueAtTime(0.35, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.38);

          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start();
          osc.stop(ctx.currentTime + 0.38);
          highTone = !highTone;
        } catch (e) {}
      };

      playTone();
      this.sirenInterval = setInterval(playTone, 400);

      if ('vibrate' in navigator) {
        try {
          navigator.vibrate([500, 250, 500, 250, 500]);
        } catch (e) {}
      }
    } catch (err) {
      console.warn('Alarm AudioContext init blocked or unavailable:', err);
    }
  }

  stop(broadcast = true) {
    if (this.autoTimer) {
      clearTimeout(this.autoTimer);
      this.autoTimer = null;
    }

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
    if ('vibrate' in navigator) {
      try {
        navigator.vibrate(0);
      } catch (e) {}
    }
    this.notify();
  }

  toggle() {
    if (this.isPlaying) {
      this.stop();
    } else {
      this.start();
    }
  }

  // Schedule auto alarm ring after delayMs (30 seconds after SOS dispatch)
  scheduleAutoAlarm(delayMs = 30000, conditionCheck = null) {
    if (this.autoTimer) {
      clearTimeout(this.autoTimer);
    }
    this.autoTimer = setTimeout(() => {
      if (!conditionCheck || conditionCheck()) {
        this.start(true);
      }
    }, delayMs);
  }

  cancelAutoAlarm() {
    if (this.autoTimer) {
      clearTimeout(this.autoTimer);
      this.autoTimer = null;
    }
  }
}

export const emergencyAlarm = new EmergencyAlarmService();
export default emergencyAlarm;
