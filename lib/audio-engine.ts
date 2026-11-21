/**
 * Procedural Web Audio Engine for Reelix Timeline Editor
 * Zero external audio files. 100% in-browser procedural sound synthesis.
 */

class AudioEngine {
  private ctx: AudioContext | null = null;
  private osc: OscillatorNode | null = null;
  private filter: BiquadFilterNode | null = null;
  private gainNode: GainNode | null = null;
  private lfo: OscillatorNode | null = null;
  private lfoGain: GainNode | null = null;
  private isPlaying = false;
  private currentVolume = 0.4;

  private initContext(): AudioContext | null {
    if (typeof window === "undefined") return null;
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  /**
   * Starts procedural vocal cadence & lo-fi tone during playback
   */
  public startPlayback(speed = 1, volume = 0.4): void {
    const ctx = this.initContext();
    if (!ctx) return;

    this.stopPlayback();
    this.isPlaying = true;
    this.currentVolume = Math.max(0, Math.min(1, volume));

    try {
      const now = ctx.currentTime;

      // Master gain
      this.gainNode = ctx.createGain();
      this.gainNode.gain.setValueAtTime(0.001, now);
      this.gainNode.gain.exponentialRampToValueAtTime(
        Math.max(0.001, this.currentVolume * 0.16),
        now + 0.12
      );
      this.gainNode.connect(ctx.destination);

      // Warm speech-like bandpass filter
      this.filter = ctx.createBiquadFilter();
      this.filter.type = "bandpass";
      this.filter.frequency.setValueAtTime(420, now);
      this.filter.Q.setValueAtTime(3.2, now);
      this.filter.connect(this.gainNode);

      // Main harmonic tone
      this.osc = ctx.createOscillator();
      this.osc.type = "triangle";
      this.osc.frequency.setValueAtTime(145 * speed, now);
      this.osc.connect(this.filter);

      // Low frequency cadence modulator (simulates speech rhythm)
      this.lfo = ctx.createOscillator();
      this.lfo.type = "sine";
      this.lfo.frequency.setValueAtTime(3.8 * speed, now);

      this.lfoGain = ctx.createGain();
      this.lfoGain.gain.setValueAtTime(180, now);
      this.lfo.connect(this.lfoGain);
      this.lfoGain.connect(this.filter.frequency);

      this.osc.start(now);
      this.lfo.start(now);
    } catch (err) {
      console.warn("Audio playback init prevented:", err);
    }
  }

  /**
   * Smoothly stops playback synthesis without audio pops
   */
  public stopPlayback(): void {
    if (!this.isPlaying && !this.gainNode) return;
    this.isPlaying = false;

    if (this.ctx && this.gainNode) {
      try {
        const now = this.ctx.currentTime;
        this.gainNode.gain.cancelScheduledValues(now);
        this.gainNode.gain.setValueAtTime(this.gainNode.gain.value, now);
        this.gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.08);

        const oldOsc = this.osc;
        const oldLfo = this.lfo;
        setTimeout(() => {
          try {
            oldOsc?.stop();
            oldOsc?.disconnect();
            oldLfo?.stop();
            oldLfo?.disconnect();
          } catch {
            // Ignored
          }
        }, 100);
      } catch {
        // Ignored
      }
    }
  }

  /**
   * Adjusts volume live
   */
  public setVolume(volume: number, isMuted = false): void {
    this.currentVolume = Math.max(0, Math.min(1, volume));
    if (!this.ctx || !this.gainNode) return;
    try {
      const now = this.ctx.currentTime;
      const target = isMuted ? 0.0001 : Math.max(0.0001, this.currentVolume * 0.16);
      this.gainNode.gain.cancelScheduledValues(now);
      this.gainNode.gain.setValueAtTime(this.gainNode.gain.value, now);
      this.gainNode.gain.exponentialRampToValueAtTime(target, now + 0.05);
    } catch {
      // Ignored
    }
  }

  /**
   * Tactile button click sound
   */
  public playClick(): void {
    const ctx = this.initContext();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(1200, now);
      osc.frequency.exponentialRampToValueAtTime(350, now + 0.025);

      gain.gain.setValueAtTime(0.05, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.025);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.03);
    } catch {
      // Ignored
    }
  }

  /**
   * Split cut snap sound
   */
  public playSplit(): void {
    const ctx = this.initContext();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(800, now);
      osc.frequency.exponentialRampToValueAtTime(120, now + 0.04);

      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.04);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.045);
    } catch {
      // Ignored
    }
  }

  /**
   * Trim tick sound
   */
  public playTrim(): void {
    const ctx = this.initContext();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(520, now);
      osc.frequency.exponentialRampToValueAtTime(260, now + 0.02);

      gain.gain.setValueAtTime(0.04, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.02);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.025);
    } catch {
      // Ignored
    }
  }
}

export const audioEngine = new AudioEngine();
