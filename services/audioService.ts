
export enum SoundType {
  SUCCESS = 'success',
  ERROR = 'error',
  ALERT = 'alert',
  SYNC = 'sync',
  TAP = 'tap',
  DISMISS = 'dismiss'
}

class AudioService {
  private context: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private enabled: boolean = true;
  private categories: Record<string, boolean> = {
    success: true,
    error: true,
    alert: true,
    sync: true,
    tap: true,
    dismiss: true
  };

  init() {
    if (this.context) return;
    try {
      this.context = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.masterGain = this.context.createGain();
      this.masterGain.connect(this.context.destination);
      this.masterGain.gain.value = 0.3; // Default professional volume
    } catch (e) {
      console.warn('Web Audio API not supported');
    }
  }

  updateSettings(enabled: boolean, categories: Record<string, boolean>) {
    this.enabled = enabled;
    this.categories = { ...this.categories, ...categories };
  }

  async play(type: SoundType) {
    if (!this.enabled || !this.categories[type] || !this.context) return;
    
    if (this.context.state === 'suspended') {
      await this.context.resume();
    }

    const now = this.context.currentTime;
    
    switch (type) {
      case SoundType.SUCCESS:
        this.beep(880, now, 0.1, 'sine');
        break;
      case SoundType.ERROR:
        this.beep(110, now, 0.15, 'square');
        this.beep(90, now + 0.2, 0.2, 'square');
        break;
      case SoundType.ALERT:
        this.beep(440, now, 0.1, 'triangle');
        this.beep(440, now + 0.15, 0.1, 'triangle');
        this.beep(554, now + 0.3, 0.2, 'triangle');
        break;
      case SoundType.SYNC:
        this.beep(1200, now, 0.02, 'sine', 0.1);
        break;
      case SoundType.TAP:
        this.beep(1600, now, 0.03, 'sine', 0.15);
        break;
      case SoundType.DISMISS:
        this.beep(600, now, 0.1, 'sine', 0.1);
        break;
    }
  }

  private beep(freq: number, startTime: number, duration: number, type: OscillatorType, vol = 1) {
    if (!this.context || !this.masterGain) return;

    const osc = this.context.createOscillator();
    const gain = this.context.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, startTime);
    
    gain.gain.setValueAtTime(0, startTime);
    gain.gain.linearRampToValueAtTime(vol, startTime + 0.005);
    gain.gain.exponentialRampToValueAtTime(0.01, startTime + duration);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(startTime);
    osc.stop(startTime + duration);
  }
}

export const audioService = new AudioService();
