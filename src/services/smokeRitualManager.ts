// Smoke Ritual Orchestration & Gesture Force Field Manager
// Created by Saidarshan.K
// Phase 8: Signature AR Experience — Gesture-Controlled Smoke & Interactive Ritual

import type { AppState, PinchState, Point2D, SmokeRitualTelemetry } from '../types/hookah';
import { SMOKE_RITUAL_CONFIG } from '../config/smokeRitual';
import { VapourParticleSystem } from './vapourParticleSystem';
import { AudioManager } from './audioManager';

interface HandTrailPoint {
  x: number;
  y: number;
  time: number;
}

export class SmokeRitualManager {
  private isRitualActive = false;
  private ritualStartTime = 0;
  private ritualEndTime = 0;

  // Hand movement tracking & velocity
  private handTrail: HandTrailPoint[] = [];
  private lastHandPosition: Point2D | null = null;
  private smoothedVelocity: Point2D = { x: 0, y: 0 };
  private lastHandSeenTime = 0;

  // Swirl & Vortex state
  private isVortexActive = false;
  private vortexStartTime = 0;
  private vortexCenter: Point2D = { x: 0, y: 0 };
  private vortexDirection: 1 | -1 = 1;
  private lastSwirlTime = -9999;

  // Signature Shape: Toroidal Expanding Smoke Ring
  private activeShape: 'NONE' | 'RING' | 'SPIRAL' = 'NONE';
  private ringCenter: Point2D = { x: 0, y: 0 };
  private ringStartTime = 0;

  // Telemetry caching
  private particlesInfluenced = 0;
  private lastHandForce = 0;

  constructor() {
    this.reset();
  }

  /**
   * Activate the Smoke Ritual when the initial smoke cloud has formed
   */
  startRitual(timestampMs: number, emitterPos: Point2D): boolean {
    if (this.isRitualActive) return false;

    this.isRitualActive = true;
    this.ritualStartTime = timestampMs;
    this.ritualEndTime = timestampMs + SMOKE_RITUAL_CONFIG.durationMs;

    this.handTrail = [];
    this.lastHandPosition = null;
    this.smoothedVelocity = { x: 0, y: 0 };
    this.lastHandSeenTime = timestampMs;

    this.isVortexActive = false;
    this.activeShape = 'NONE';
    this.particlesInfluenced = 0;

    // Default ring/vortex center near initial mouth emission
    this.ringCenter = { ...emitterPos };
    this.vortexCenter = { ...emitterPos };

    // Trigger ethereal Web Audio activation chime
    AudioManager.getInstance().playRitualStart();

    return true;
  }

  /**
   * Main per-frame update loop:
   * - Consumes hand tracking data
   * - Detects circular swirl gestures
   * - Calculates force field parameters
   * - Updates particle physics
   * - Checks ritual duration bounds
   */
  update(
    pinchState: PinchState | null,
    particleSystem: VapourParticleSystem,
    timestampMs: number,
    canvasWidth: number,
    canvasHeight: number
  ): { isStillActive: boolean; appStateChange?: AppState } {
    if (!this.isRitualActive) {
      return { isStillActive: false };
    }

    // ── 1. Duration & Lifecycle Check ───────────────────────────────────────
    if (timestampMs >= this.ritualEndTime) {
      this.endRitual();
      return { isStillActive: false, appStateChange: 'IDLE' };
    }

    // If particles have naturally completely dissipated, end ritual gracefully
    if (particleSystem.getActiveParticleCount() === 0 && timestampMs - this.ritualStartTime > 1800) {
      this.endRitual();
      return { isStillActive: false, appStateChange: 'IDLE' };
    }

    // ── 2. Hand Position & Velocity Tracking ────────────────────────────────
    let activeHandPos: Point2D | null = null;
    let isPinching = false;
    let isOpenHand = false;

    if (pinchState) {
      this.lastHandSeenTime = timestampMs;
      activeHandPos = pinchState.pinchCenter;
      isPinching = pinchState.isPinching;
      isOpenHand = !!pinchState.isOpenHand;

      // Extract velocity from existing OneEuro-filtered tracking data
      if (pinchState.velocity) {
        this.smoothedVelocity.x = this.smoothedVelocity.x * 0.7 + pinchState.velocity.x * 0.3;
        this.smoothedVelocity.y = this.smoothedVelocity.y * 0.7 + pinchState.velocity.y * 0.3;
      } else if (this.lastHandPosition) {
        const dt = Math.max(0.001, (timestampMs - this.lastHandSeenTime) / 1000);
        const vx = (activeHandPos.x - this.lastHandPosition.x) / dt;
        const vy = (activeHandPos.y - this.lastHandPosition.y) / dt;
        this.smoothedVelocity.x = this.smoothedVelocity.x * 0.7 + vx * 0.3;
        this.smoothedVelocity.y = this.smoothedVelocity.y * 0.7 + vy * 0.3;
      }

      this.lastHandPosition = { ...activeHandPos };

      // Record temporal hand trail for circular motion analysis
      this.handTrail.push({
        x: activeHandPos.x,
        y: activeHandPos.y,
        time: timestampMs
      });

      // Filter trail points outside the detection window
      const cutoffTime = timestampMs - SMOKE_RITUAL_CONFIG.swirlDetectionWindowMs;
      while (this.handTrail.length > 0 && this.handTrail[0].time < cutoffTime) {
        this.handTrail.shift();
      }

      // ── 3. Detect Circular Swirl Gesture ──────────────────────────────────
      this.detectSwirlGesture(timestampMs);
    } else {
      // Hand tracking loss handling
      const lossDuration = timestampMs - this.lastHandSeenTime;
      if (lossDuration > SMOKE_RITUAL_CONFIG.trackingLossGracePeriodMs) {
        // Decay velocity
        this.smoothedVelocity.x *= 0.85;
        this.smoothedVelocity.y *= 0.85;
        this.handTrail = [];
      }
    }

    // ── 4. Vortex Lifecycle & Dynamics ──────────────────────────────────────
    let currentVortexStrength = 0;
    if (this.isVortexActive) {
      const vortexElapsed = timestampMs - this.vortexStartTime;
      const vortexProgress = vortexElapsed / SMOKE_RITUAL_CONFIG.vortexDurationMs;

      if (vortexProgress >= 1.0) {
        this.isVortexActive = false;
        this.activeShape = 'NONE';
      } else {
        // Smooth bell curve envelope for rotational speed
        const envelope = Math.sin(vortexProgress * Math.PI);
        currentVortexStrength = SMOKE_RITUAL_CONFIG.vortexStrength * this.vortexDirection * envelope;
      }
    }

    // ── 5. Expanding Smoke Ring / Spiral Formation ──────────────────────────
    let ringRadius = 0;
    let ringStrength = 0;
    if (this.activeShape === 'RING') {
      const ringElapsed = timestampMs - this.ringStartTime;
      const ringProgress = ringElapsed / SMOKE_RITUAL_CONFIG.shapeDurationMs;

      if (ringProgress < 1.0) {
        ringRadius = SMOKE_RITUAL_CONFIG.ringBaseRadius +
          (ringElapsed / 1000) * SMOKE_RITUAL_CONFIG.ringExpansionSpeed;
        ringStrength = Math.sin(ringProgress * Math.PI) * SMOKE_RITUAL_CONFIG.ringAttractionStrength;
      }
    }

    // ── 6. Apply Forces to Smoke Particles ──────────────────────────────────
    this.particlesInfluenced = particleSystem.applyRitualForces({
      handPos: activeHandPos,
      handVelocity: this.smoothedVelocity,
      isPinching,
      isOpenHand,
      vortexCenter: this.isVortexActive ? this.vortexCenter : null,
      vortexStrength: currentVortexStrength,
      vortexRadius: SMOKE_RITUAL_CONFIG.vortexRadius,
      ringCenter: this.activeShape === 'RING' ? this.ringCenter : null,
      ringRadius,
      ringStrength,
      canvasWidth,
      canvasHeight
    });

    this.lastHandForce = Math.hypot(this.smoothedVelocity.x, this.smoothedVelocity.y);

    return { isStillActive: true };
  }

  /**
   * Lightweight temporal circular motion detector:
   * Examines cumulative angular traversal of hand points around their centroid.
   */
  private detectSwirlGesture(timestampMs: number) {
    if (timestampMs - this.lastSwirlTime < SMOKE_RITUAL_CONFIG.swirlCooldownMs) {
      return;
    }

    const n = this.handTrail.length;
    if (n < 8) return;

    // 1. Calculate trail centroid
    let sumX = 0;
    let sumY = 0;
    for (let i = 0; i < n; i++) {
      sumX += this.handTrail[i].x;
      sumY += this.handTrail[i].y;
    }
    const cx = sumX / n;
    const cy = sumY / n;

    // 2. Compute radius distribution
    let avgRadius = 0;
    for (let i = 0; i < n; i++) {
      avgRadius += Math.hypot(this.handTrail[i].x - cx, this.handTrail[i].y - cy);
    }
    avgRadius /= n;

    if (
      avgRadius < SMOKE_RITUAL_CONFIG.swirlMinRadius ||
      avgRadius > SMOKE_RITUAL_CONFIG.swirlMaxRadius
    ) {
      return;
    }

    // 3. Compute cumulative angular traversal
    let totalAngleDelta = 0;
    let prevAngle = Math.atan2(this.handTrail[0].y - cy, this.handTrail[0].x - cx);

    for (let i = 1; i < n; i++) {
      const curAngle = Math.atan2(this.handTrail[i].y - cy, this.handTrail[i].x - cx);
      let dTheta = curAngle - prevAngle;
      // Normalize to [-PI, PI]
      if (dTheta > Math.PI) dTheta -= Math.PI * 2;
      if (dTheta < -Math.PI) dTheta += Math.PI * 2;
      totalAngleDelta += dTheta;
      prevAngle = curAngle;
    }

    // 4. Trigger swirl vortex if rotation reaches threshold (>= 270 deg)
    if (Math.abs(totalAngleDelta) >= SMOKE_RITUAL_CONFIG.swirlMinAngleSpanRad) {
      this.lastSwirlTime = timestampMs;
      this.isVortexActive = true;
      this.vortexStartTime = timestampMs;
      this.vortexCenter = { x: cx, y: cy };
      this.vortexDirection = totalAngleDelta > 0 ? 1 : -1;

      // Spawn temporary toroidal smoke ring at the vortex eye
      this.activeShape = 'RING';
      this.ringCenter = { x: cx, y: cy };
      this.ringStartTime = timestampMs;

      // Clear trail to prevent double-trigger
      this.handTrail = [];

      // Play soft atmospheric swirling audio tone
      AudioManager.getInstance().playRitualSwirl();
    }
  }

  endRitual() {
    if (!this.isRitualActive) return;

    this.isRitualActive = false;
    this.isVortexActive = false;
    this.activeShape = 'NONE';
    this.handTrail = [];

    // Play gentle completion chime
    AudioManager.getInstance().playRitualComplete();
  }

  reset() {
    this.isRitualActive = false;
    this.ritualStartTime = 0;
    this.ritualEndTime = 0;
    this.handTrail = [];
    this.lastHandPosition = null;
    this.smoothedVelocity = { x: 0, y: 0 };
    this.isVortexActive = false;
    this.activeShape = 'NONE';
    this.particlesInfluenced = 0;
  }

  isActive(): boolean {
    return this.isRitualActive;
  }

  getTelemetry(): SmokeRitualTelemetry {
    const now = performance.now();
    const remainingMs = Math.max(0, this.ritualEndTime - now);
    const progress = this.isRitualActive
      ? Math.min(1, Math.max(0, (now - this.ritualStartTime) / SMOKE_RITUAL_CONFIG.durationMs))
      : 0;

    return {
      isActive: this.isRitualActive,
      handForce: Math.round(this.lastHandForce),
      handVelocity: {
        x: Math.round(this.smoothedVelocity.x),
        y: Math.round(this.smoothedVelocity.y)
      },
      isVortexActive: this.isVortexActive,
      activeShape: this.activeShape,
      particlesInfluenced: this.particlesInfluenced,
      ritualTimeRemainingMs: Math.round(remainingMs),
      ritualProgress: progress
    };
  }

  getVortexCenter(): Point2D {
    return { ...this.vortexCenter };
  }

  getRingCenter(): Point2D {
    return { ...this.ringCenter };
  }

  isIntroSeen(): boolean {
    try {
      return localStorage.getItem(SMOKE_RITUAL_CONFIG.introSeenKey) === 'true';
    } catch {
      return false;
    }
  }

  markIntroSeen(): void {
    try {
      localStorage.setItem(SMOKE_RITUAL_CONFIG.introSeenKey, 'true');
    } catch {}
  }
}
