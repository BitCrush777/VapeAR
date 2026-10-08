// Premium Spatial Audio & Procedural Sound Design for VapeAR
// 100% procedural Web Audio API synthesis: zero external file dependencies, zero 404s, royalty-free

import type { AppState } from '../types/hookah';

export interface AudioTelemetry {
  isEnabled: boolean;
  contextState: string;
  isAmbientPlaying: boolean;
  isBubbling: boolean;
  lastEvent: string;
}

export class AudioManager {
  private static instance: AudioManager | null = null;

  private ctx: AudioContext | null = null;
  private isUnlocked = false;
  private isEnabled = true;

  // Master & Bus gains
  private masterGain: GainNode | null = null;
  private ambientGain: GainNode | null = null;
  private hookahGain: GainNode | null = null;
  private interactionGain: GainNode | null = null;
  private uiGain: GainNode | null = null;

  // Spatial Panners
  private hookahPanner: StereoPannerNode | null = null;
  private mouthPanner: StereoPannerNode | null = null;

  // Persistent Ambient / Lounge nodes
  private ambientOsc1: OscillatorNode | null = null;
  private ambientOsc2: OscillatorNode | null = null;
  private ambientFilter: BiquadFilterNode | null = null;
  private isAmbientRunning = false;

  // Bubbling synthesis
  private bubbleTimer: number | null = null;
  private bubbleNoiseSource: AudioBufferSourceNode | null = null;
  private bubbleRumbleGain: GainNode | null = null;
  private isBubblingRunning = false;
  private bubbleIntensity = 0; // 0 = off, 0.35 = gentle idle, 1.0 = deep sip

  // Ember crackle
  private emberTimer: number | null = null;

  // Shared pink noise buffer
  private pinkNoiseBuffer: AudioBuffer | null = null;

  // Cooldown timers (ms)
  private lastGrabTime = -9999;
  private lastReleaseTime = -9999;
  private lastProximityTime = -9999;
  private lastSipTime = -9999;
  private lastExhaleTime = -9999;
  private lastState: AppState = 'IDLE';
  private wasHeld = false;
  private lastEvent = 'NONE';

  private constructor() {
    // Load persisted audio preference if available
    try {
      const saved = localStorage.getItem('hookah_audio_enabled');
      if (saved !== null) {
        this.isEnabled = saved === 'true';
      }
    } catch {
      // LocalStorage access might be restricted in some sandboxes
    }

    // Handle tab visibility to conserve CPU and avoid unexpected background audio
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', this.handleVisibilityChange);
    }
  }

  public static getInstance(): AudioManager {
    if (!AudioManager.instance) {
      AudioManager.instance = new AudioManager();
    }
    return AudioManager.instance;
  }

  /**
   * Initializes AudioContext upon user gesture (START EXPERIENCE or click).
   * Fully compliant with browser autoplay policies.
   */
  public async unlock(): Promise<boolean> {
    if (this.isUnlocked && this.ctx && this.ctx.state === 'running') {
      return true;
    }

    try {
      if (!this.ctx) {
        const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (!AudioContextClass) {
          console.warn('Web Audio API not supported on this browser');
          return false;
        }
        this.ctx = new AudioContextClass();
        this.buildAudioGraph();
      }

      if (this.ctx.state === 'suspended') {
        await this.ctx.resume();
      }

      this.isUnlocked = true;

      // Start ambient lounge drone and intermittent embers if sound is enabled
      if (this.isEnabled) {
        this.startAmbient();
        this.startEmberSchedule();
      }

      return true;
    } catch (e) {
      console.warn('AudioContext initialization error:', e);
      return false;
    }
  }

  private buildAudioGraph() {
    if (!this.ctx) return;

    // Master bus
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.setValueAtTime(this.isEnabled ? 0.75 : 0, this.ctx.currentTime);
    this.masterGain.connect(this.ctx.destination);

    // Sub-buses
    this.ambientGain = this.ctx.createGain();
    this.ambientGain.gain.setValueAtTime(0.18, this.ctx.currentTime);
    this.ambientGain.connect(this.masterGain);

    this.hookahGain = this.ctx.createGain();
    this.hookahGain.gain.setValueAtTime(0.42, this.ctx.currentTime);
    this.hookahGain.connect(this.masterGain);

    this.interactionGain = this.ctx.createGain();
    this.interactionGain.gain.setValueAtTime(0.35, this.ctx.currentTime);
    this.interactionGain.connect(this.masterGain);

    this.uiGain = this.ctx.createGain();
    this.uiGain.gain.setValueAtTime(0.25, this.ctx.currentTime);
    this.uiGain.connect(this.masterGain);

    // Spatial Panners (Hookah on table left ~ -0.28, User lips in center ~ 0.0)
    if (this.ctx.createStereoPanner) {
      this.hookahPanner = this.ctx.createStereoPanner();
      this.hookahPanner.pan.setValueAtTime(-0.28, this.ctx.currentTime);
      this.hookahPanner.connect(this.hookahGain);

      this.mouthPanner = this.ctx.createStereoPanner();
      this.mouthPanner.pan.setValueAtTime(0.0, this.ctx.currentTime);
      this.mouthPanner.connect(this.interactionGain);
    }

    // Pre-calculate 3-second looping pink noise buffer for realistic air/vapour/water rumble
    this.pinkNoiseBuffer = this.generatePinkNoiseBuffer(this.ctx, 3);
  }

  private generatePinkNoiseBuffer(ctx: AudioContext, seconds = 3): AudioBuffer {
    const bufferSize = ctx.sampleRate * seconds;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.09;
      b6 = white * 0.115926;
    }
    return buffer;
  }

  private handleVisibilityChange = () => {
    if (!this.ctx) return;
    if (document.hidden) {
      // Smoothly mute on tab blur
      if (this.masterGain) {
        this.masterGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.08);
      }
    } else {
      // Resume if sound is enabled
      if (this.masterGain && this.isEnabled) {
        this.masterGain.gain.setTargetAtTime(0.75, this.ctx.currentTime, 0.12);
      }
      if (this.ctx.state === 'suspended' && this.isUnlocked) {
        this.ctx.resume().catch(() => {});
      }
    }
  };

  /**
   * Sound Enable/Disable Toggle
   */
  public setEnabled(enabled: boolean) {
    this.isEnabled = enabled;
    try {
      localStorage.setItem('hookah_audio_enabled', String(enabled));
    } catch {}

    if (!this.ctx || !this.masterGain) return;

    const targetGain = enabled ? 0.75 : 0;
    this.masterGain.gain.setTargetAtTime(targetGain, this.ctx.currentTime, 0.05);

    if (enabled) {
      if (this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }
      this.startAmbient();
      this.startEmberSchedule();
    } else {
      this.stopBubbling();
    }
  }

  public toggleEnabled(): boolean {
    this.setEnabled(!this.isEnabled);
    this.playUiClick();
    return this.isEnabled;
  }

  public getIsEnabled(): boolean {
    return this.isEnabled;
  }

  // ── 1. Subtle Ambient Lounge Tone ──────────────────────────────────────────
  private startAmbient() {
    if (!this.ctx || !this.ambientGain || this.isAmbientRunning || !this.isEnabled) return;

    try {
      // Warm, velvet sub-bass drone with gentle detune: 55Hz & 55.35Hz
      this.ambientOsc1 = this.ctx.createOscillator();
      this.ambientOsc2 = this.ctx.createOscillator();
      this.ambientFilter = this.ctx.createBiquadFilter();

      this.ambientOsc1.type = 'sine';
      this.ambientOsc1.frequency.setValueAtTime(55, this.ctx.currentTime);

      this.ambientOsc2.type = 'sine';
      this.ambientOsc2.frequency.setValueAtTime(55.38, this.ctx.currentTime); // 0.38Hz slow binaural beat

      this.ambientFilter.type = 'lowpass';
      this.ambientFilter.frequency.setValueAtTime(160, this.ctx.currentTime);

      this.ambientOsc1.connect(this.ambientFilter);
      this.ambientOsc2.connect(this.ambientFilter);
      this.ambientFilter.connect(this.ambientGain);

      this.ambientOsc1.start();
      this.ambientOsc2.start();
      this.isAmbientRunning = true;
    } catch (e) {
      console.warn('Ambient drone start error:', e);
    }
  }

  // ── 2. Organic Water Bubbling Synthesis ────────────────────────────────────
  private setBubbleIntensity(intensity: number) {
    this.bubbleIntensity = Math.max(0, Math.min(1, intensity));

    if (this.bubbleIntensity > 0) {
      if (!this.isBubblingRunning) {
        this.startBubbling();
      }
    } else {
      if (this.isBubblingRunning) {
        this.stopBubbling();
      }
    }
  }

  private startBubbling() {
    if (!this.ctx || !this.hookahGain || !this.isEnabled) return;
    this.isBubblingRunning = true;

    // Start deep vase water rumble loop (lowpass filtered pink noise at 140Hz)
    if (!this.bubbleNoiseSource && this.pinkNoiseBuffer) {
      this.bubbleNoiseSource = this.ctx.createBufferSource();
      this.bubbleNoiseSource.buffer = this.pinkNoiseBuffer;
      this.bubbleNoiseSource.loop = true;

      const rumbleFilter = this.ctx.createBiquadFilter();
      rumbleFilter.type = 'lowpass';
      rumbleFilter.frequency.setValueAtTime(140, this.ctx.currentTime);

      this.bubbleRumbleGain = this.ctx.createGain();
      this.bubbleRumbleGain.gain.setValueAtTime(0.04, this.ctx.currentTime);

      this.bubbleNoiseSource.connect(rumbleFilter);
      rumbleFilter.connect(this.bubbleRumbleGain);
      if (this.hookahPanner) {
        this.bubbleRumbleGain.connect(this.hookahPanner);
      } else {
        this.bubbleRumbleGain.connect(this.hookahGain);
      }
      this.bubbleNoiseSource.start();
    }

    // Schedule rapid organic discrete bubble pops
    const scheduleNextBubble = () => {
      if (!this.isBubblingRunning || !this.ctx) return;

      this.spawnSingleBubble();

      // Faster bubble stream during active sip (45-75ms), calmer during mouth alignment (120-190ms)
      const baseDelay = this.bubbleIntensity > 0.6 ? 55 : 140;
      const jitter = (Math.random() - 0.5) * 35;
      const delay = Math.max(30, baseDelay + jitter);

      this.bubbleTimer = window.setTimeout(scheduleNextBubble, delay);
    };

    scheduleNextBubble();
  }

  private stopBubbling() {
    this.isBubblingRunning = false;
    if (this.bubbleTimer !== null) {
      clearTimeout(this.bubbleTimer);
      this.bubbleTimer = null;
    }
    if (this.bubbleNoiseSource) {
      try {
        this.bubbleNoiseSource.stop();
        this.bubbleNoiseSource.disconnect();
      } catch {}
      this.bubbleNoiseSource = null;
    }
    this.bubbleRumbleGain = null;
  }

  /**
   * Synthesizes an individual water bubble drop using resonant pitch-decay sines.
   */
  private spawnSingleBubble() {
    if (!this.ctx || !this.hookahGain) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      // Physically, expanding bubble pitch sweeps down rapidly: ~480Hz down to ~260Hz
      const startFreq = 380 + Math.random() * 260;
      const endFreq = startFreq * (0.58 + Math.random() * 0.12);
      const duration = 0.045 + Math.random() * 0.035;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(startFreq, now);
      osc.frequency.exponentialRampToValueAtTime(endFreq, now + duration);

      filter.type = 'bandpass';
      filter.frequency.setValueAtTime((startFreq + endFreq) / 2, now);
      filter.Q.setValueAtTime(12, now);

      const peakGain = (0.09 + Math.random() * 0.08) * (this.bubbleIntensity > 0.6 ? 1.0 : 0.45);
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(peakGain, now + 0.004);
      gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

      osc.connect(filter);
      filter.connect(gain);

      if (this.hookahPanner) {
        gain.connect(this.hookahPanner);
      } else {
        gain.connect(this.hookahGain);
      }

      osc.start(now);
      osc.stop(now + duration + 0.01);

      osc.onended = () => {
        try {
          osc.disconnect();
          filter.disconnect();
          gain.disconnect();
        } catch {}
      };
    } catch {}
  }

  // ── 3. Intermittent Charcoal / Ember Crackles ──────────────────────────────
  private startEmberSchedule() {
    if (this.emberTimer !== null) return;

    const scheduleEmber = () => {
      if (!this.isEnabled) return;
      this.playEmberPop();
      const nextDelay = 2500 + Math.random() * 4500; // Random interval: 2.5 - 7.0 seconds
      this.emberTimer = window.setTimeout(scheduleEmber, nextDelay);
    };

    this.emberTimer = window.setTimeout(scheduleEmber, 3000);
  }

  private playEmberPop() {
    if (!this.ctx || !this.hookahGain || !this.isEnabled) return;

    try {
      const now = this.ctx.currentTime;
      // High-pass micro-click resembling charcoal thermal expansion
      const buffer = this.ctx.createBuffer(1, Math.floor(this.ctx.sampleRate * 0.008), this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < data.length; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (data.length * 0.25));
      }

      const source = this.ctx.createBufferSource();
      source.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.setValueAtTime(2800, now);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.045, now);

      source.connect(filter);
      filter.connect(gain);
      if (this.hookahPanner) {
        gain.connect(this.hookahPanner);
      } else {
        gain.connect(this.hookahGain);
      }

      source.start(now);
      source.onended = () => {
        try {
          source.disconnect();
          filter.disconnect();
          gain.disconnect();
        } catch {}
      };
    } catch {}
  }

  // ── 4. Interaction Cues (Grab, Release, Proximity, Sip, Exhale, UI) ─────────

  /**
   * Tactile confirmation snap when user forms fist/pinch near mouthpiece
   */
  public playGrabCue() {
    const nowMs = performance.now();
    if (nowMs - this.lastGrabTime < 280) return; // Cooldown protection
    this.lastGrabTime = nowMs;
    this.lastEvent = 'GRAB';

    if (!this.ctx || !this.interactionGain || !this.isEnabled) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      // Short, premium tactile thud: 160Hz -> 65Hz over 45ms
      osc.type = 'sine';
      osc.frequency.setValueAtTime(160, now);
      osc.frequency.exponentialRampToValueAtTime(65, now + 0.045);

      gain.gain.setValueAtTime(0.14, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

      osc.connect(gain);
      gain.connect(this.interactionGain);

      osc.start(now);
      osc.stop(now + 0.055);
      osc.onended = () => {
        try {
          osc.disconnect();
          gain.disconnect();
        } catch {}
      };
    } catch {}
  }

  /**
   * Subtle release resonance when wand is released
   */
  public playReleaseCue() {
    const nowMs = performance.now();
    if (nowMs - this.lastReleaseTime < 280) return;
    this.lastReleaseTime = nowMs;
    this.lastEvent = 'RELEASE';

    if (!this.ctx || !this.interactionGain || !this.isEnabled) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(110, now);
      osc.frequency.exponentialRampToValueAtTime(50, now + 0.035);

      gain.gain.setValueAtTime(0.06, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

      osc.connect(gain);
      gain.connect(this.interactionGain);

      osc.start(now);
      osc.stop(now + 0.045);
      osc.onended = () => {
        try {
          osc.disconnect();
          gain.disconnect();
        } catch {}
      };
    } catch {}
  }

  /**
   * Delicate harmonic chime when mouthpiece enters mouth proximity
   */
  public playMouthProximityCue() {
    const nowMs = performance.now();
    if (nowMs - this.lastProximityTime < 600) return;
    this.lastProximityTime = nowMs;
    this.lastEvent = 'LIPS_ALIGNED';

    if (!this.ctx || !this.interactionGain || !this.isEnabled) return;

    try {
      const now = this.ctx.currentTime;
      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      // Soft dual harmonic: 520Hz + 1040Hz
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(520, now);
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(1040, now);

      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.065, now + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

      osc1.connect(gain);
      osc2.connect(gain);
      if (this.mouthPanner) {
        gain.connect(this.mouthPanner);
      } else {
        gain.connect(this.interactionGain);
      }

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 0.24);
      osc2.stop(now + 0.24);

      osc1.onended = () => {
        try {
          osc1.disconnect();
          osc2.disconnect();
          gain.disconnect();
        } catch {}
      };
    } catch {}
  }

  /**
   * Soft inhalation cue when mouth opens at wand tip
   */
  public playSipCue() {
    const nowMs = performance.now();
    if (nowMs - this.lastSipTime < 800) return;
    this.lastSipTime = nowMs;
    this.lastEvent = 'SIP_INHALE';

    if (!this.ctx || !this.hookahGain || !this.isEnabled || !this.pinkNoiseBuffer) return;

    try {
      const now = this.ctx.currentTime;
      const source = this.ctx.createBufferSource();
      source.buffer = this.pinkNoiseBuffer;

      // Inhale air whoosh: ascending bandpass filter (220Hz -> 540Hz)
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(220, now);
      filter.frequency.exponentialRampToValueAtTime(540, now + 0.9);
      filter.Q.setValueAtTime(4.5, now);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.01, now);
      gain.gain.linearRampToValueAtTime(0.16, now + 0.35);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 1.1);

      source.connect(filter);
      filter.connect(gain);
      gain.connect(this.hookahGain);

      source.start(now);
      source.stop(now + 1.15);
      source.onended = () => {
        try {
          source.disconnect();
          filter.disconnect();
          gain.disconnect();
        } catch {}
      };
    } catch {}
  }

  /**
   * Soft, atmospheric air-release whoosh aligned with vapour burst onset
   */
  public playExhaleCue() {
    const nowMs = performance.now();
    if (nowMs - this.lastExhaleTime < 1200) return;
    this.lastExhaleTime = nowMs;
    this.lastEvent = 'EXHALE_VAPOUR';

    if (!this.ctx || !this.hookahGain || !this.isEnabled || !this.pinkNoiseBuffer) return;

    try {
      const now = this.ctx.currentTime;
      const source = this.ctx.createBufferSource();
      source.buffer = this.pinkNoiseBuffer;

      // Exhale whoosh: warm lowpass sweeping down from 720Hz -> 260Hz
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(720, now);
      filter.frequency.exponentialRampToValueAtTime(260, now + 1.6);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.18, now + 0.22);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 1.7);

      source.connect(filter);
      filter.connect(gain);
      gain.connect(this.hookahGain);

      source.start(now);
      source.stop(now + 1.75);
      source.onended = () => {
        try {
          source.disconnect();
          filter.disconnect();
          gain.disconnect();
        } catch {}
      };
    } catch {}
  }

  /**
   * Subtle micro-click for dock buttons and controls
   */
  public playUiClick() {
    if (!this.ctx || !this.uiGain || !this.isEnabled) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(1200, now);
      gain.gain.setValueAtTime(0.045, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.02);

      osc.connect(gain);
      gain.connect(this.uiGain);

      osc.start(now);
      osc.stop(now + 0.025);
      osc.onended = () => {
        try {
          osc.disconnect();
          gain.disconnect();
        } catch {}
      };
    } catch {}
  }

  // ── 4B. Smoke Ritual Procedural Audio Cues (Phase 8.16) ───────────────────
  /**
   * Subtle crystalline harmonic chime when Smoke Ritual activates
   */
  public playRitualStart() {
    this.lastEvent = 'RITUAL_START';
    if (!this.ctx || !this.interactionGain || !this.isEnabled) return;

    try {
      const now = this.ctx.currentTime;
      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      // Delicate D5 + A5 harmonic shimmer (587.33Hz + 880Hz)
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(587.33, now);
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(880, now);

      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.045, now + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.65);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(this.interactionGain);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 0.7);
      osc2.stop(now + 0.7);

      osc1.onended = () => {
        try {
          osc1.disconnect();
          osc2.disconnect();
          gain.disconnect();
        } catch {}
      };
    } catch {}
  }

  /**
   * Soft swirling vortex tone when circular hand gesture is detected
   */
  public playRitualSwirl() {
    this.lastEvent = 'RITUAL_SWIRL';
    if (!this.ctx || !this.hookahGain || !this.isEnabled || !this.pinkNoiseBuffer) return;

    try {
      const now = this.ctx.currentTime;
      const source = this.ctx.createBufferSource();
      source.buffer = this.pinkNoiseBuffer;

      // Resonant bandpass filter sweeping from 340Hz up to 640Hz and returning
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(340, now);
      filter.frequency.exponentialRampToValueAtTime(640, now + 0.4);
      filter.frequency.exponentialRampToValueAtTime(380, now + 0.85);
      filter.Q.setValueAtTime(6.0, now);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.038, now + 0.15);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.9);

      source.connect(filter);
      filter.connect(gain);
      gain.connect(this.hookahGain);

      source.start(now);
      source.stop(now + 0.95);
      source.onended = () => {
        try {
          source.disconnect();
          filter.disconnect();
          gain.disconnect();
        } catch {}
      };
    } catch {}
  }

  /**
   * Soft resolving completion chime when Smoke Ritual concludes naturally
   */
  public playRitualComplete() {
    this.lastEvent = 'RITUAL_COMPLETE';
    if (!this.ctx || !this.interactionGain || !this.isEnabled) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      // Soft A4 resolving tone (440Hz)
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, now);

      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.035, now + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.55);

      osc.connect(gain);
      gain.connect(this.interactionGain);

      osc.start(now);
      osc.stop(now + 0.6);
      osc.onended = () => {
        try {
          osc.disconnect();
          gain.disconnect();
        } catch {}
      };
    } catch {}
  }

  // ── 5. State Machine Integration ───────────────────────────────────────────
  /**
   * Consumes high-level AppState and hold state transitions.
   * Completely decoupled from rendering loops. Only executes on actual state changes.
   */
  public updateState(state: AppState, isHeld: boolean) {
    // 1. Grab & Release transitions
    if (!this.wasHeld && isHeld) {
      this.playGrabCue();
    } else if (this.wasHeld && !isHeld) {
      this.playReleaseCue();
    }
    this.wasHeld = isHeld;

    // 2. State change transitions
    if (state !== this.lastState) {
      switch (state) {
        case 'PIPE_AT_MOUTH':
          this.playMouthProximityCue();
          this.setBubbleIntensity(0.35); // Gentle idle bubbling in vase
          break;

        case 'SIP_DETECTED':
          this.playSipCue();
          this.setBubbleIntensity(1.0); // Vigorous bubbling during inhale
          break;

        case 'VAPOUR':
          this.playExhaleCue();
          this.setBubbleIntensity(0); // Exhale stops bubbling
          break;

        case 'SMOKE_RITUAL':
          this.setBubbleIntensity(0);
          break;

        case 'IDLE':
        case 'HAND_DETECTED':
        case 'PIPE_GRABBED':
        default:
          this.setBubbleIntensity(0);
          break;
      }
      this.lastState = state;
    }
  }

  // ── 6. Telemetry & Diagnostics ─────────────────────────────────────────────
  public getTelemetry(): AudioTelemetry {
    return {
      isEnabled: this.isEnabled,
      contextState: this.ctx ? this.ctx.state : 'uninitialized',
      isAmbientPlaying: this.isAmbientRunning && this.isEnabled,
      isBubbling: this.isBubblingRunning && this.isEnabled,
      lastEvent: this.lastEvent
    };
  }

  public destroy() {
    if (typeof document !== 'undefined') {
      document.removeEventListener('visibilitychange', this.handleVisibilityChange);
    }
    this.stopBubbling();
    if (this.emberTimer !== null) {
      clearTimeout(this.emberTimer);
      this.emberTimer = null;
    }
    if (this.ambientOsc1) {
      try {
        this.ambientOsc1.stop();
        this.ambientOsc1.disconnect();
      } catch {}
    }
    if (this.ambientOsc2) {
      try {
        this.ambientOsc2.stop();
        this.ambientOsc2.disconnect();
      } catch {}
    }
    if (this.ctx) {
      try {
        this.ctx.close();
      } catch {}
      this.ctx = null;
    }
    this.isUnlocked = false;
    this.isAmbientRunning = false;
  }
}
