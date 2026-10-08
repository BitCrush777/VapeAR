// Vapour Particle System — Created by Saidarshan.K
import type { Particle, Point2D } from '../types/hookah';
import { SMOKE_RITUAL_CONFIG } from '../config/smokeRitual';

export type ParticleType =
  | 'CORE_PUFF'
  | 'PRIMARY_CLOUD'
  | 'SECONDARY_CURL'
  | 'FINE_WISP'
  | 'SMOKE_RING';

export interface VapourParticle extends Particle {
  active: boolean;
  type: ParticleType;
  baseSize: number;
  maxExpansion: number;
  initialAlpha: number;
  zDepth: number; // 0 = at mouth, 1 = near camera
  vz: number;
  turbPhase: number;
  turbFreq: number;
  lateralBias: number;
  aspectRatio: number;
  subLobeOffset: number;
}

export class VapourParticleSystem {
  // Pre-allocated object pool to achieve ZERO per-frame GC allocations
  private readonly maxParticles = 180;
  private particlePool: VapourParticle[] = [];
  private frameCount = 0;

  // Exhale burst dynamics
  private lastEmitTime = 0;
  private exhaleBurstActive = false;
  private exhaleBurstFrames = 0;
  private lastRingTime = 0;

  constructor() {
    this.initPool();
  }

  private initPool() {
    this.particlePool = [];
    for (let i = 0; i < this.maxParticles; i++) {
      this.particlePool.push({
        active: false,
        type: 'PRIMARY_CLOUD',
        x: 0,
        y: 0,
        vx: 0,
        vy: 0,
        size: 20,
        baseSize: 20,
        maxExpansion: 45,
        alpha: 0,
        initialAlpha: 0.25,
        zDepth: 0.2,
        vz: 0.01,
        life: 0,
        maxLife: 90,
        rotation: 0,
        rotSpeed: 0,
        turbPhase: 0,
        turbFreq: 0.05,
        lateralBias: 0,
        aspectRatio: 1.0,
        subLobeOffset: 0.25
      });
    }
  }

  /**
   * Acquire an inactive particle from the pre-allocated pool (0 heap allocations).
   * If all particles are active, replaces the oldest particle gracefully.
   */
  private acquireParticle(): VapourParticle {
    // 1. Look for inactive particle
    for (let i = 0; i < this.maxParticles; i++) {
      if (!this.particlePool[i].active) {
        return this.particlePool[i];
      }
    }

    // 2. If pool exhausted, recycle the oldest particle
    let oldest = this.particlePool[0];
    let maxProgress = -1;
    for (let i = 0; i < this.maxParticles; i++) {
      const p = this.particlePool[i];
      const prog = p.life / p.maxLife;
      if (prog > maxProgress) {
        maxProgress = prog;
        oldest = p;
      }
    }
    return oldest;
  }

  /**
   * Emit realistic hookah smoke that flows from the mouth and scatters
   * broadly around the face, cheeks, shoulders, and surrounding air.
   * Features recognizable initial exhale puff, multi-layer particles,
   * natural thermal buoyancy, and occasional vortex smoke rings.
   */
  emit(
    x: number,
    y: number,
    _requestedCount: number = 6,
    faceW: number = 160,
    direction?: { x: number; y: number }
  ) {
    const now = performance.now();
    this.frameCount++;

    // Detect new exhale onset (gap > 400ms)
    if (this.lastEmitTime === 0 || now - this.lastEmitTime > 400) {
      this.exhaleBurstActive = true;
      this.exhaleBurstFrames = 0;
    }
    this.lastEmitTime = now;

    // Throttle steady emission to every 2nd frame for optimal density without saturation
    if (!this.exhaleBurstActive && this.frameCount % 2 !== 0) {
      return;
    }

    const scale = Math.max(0.65, Math.min(1.85, faceW / 160));

    // Exhale direction vector (defaults slightly forward-downward then curving up)
    const dirX = direction ? direction.x : 0;
    const dirY = direction ? direction.y : -0.7; // General upward drift

    // ── 1. Initial Dense Exhale Burst Dynamics (Phase 4.7) ───────────────────
    if (this.exhaleBurstActive) {
      this.exhaleBurstFrames++;

      // First 3 burst frames: spawn dense forward-moving core puffs
      const burstCount = Math.min(5, 7 - this.exhaleBurstFrames);
      for (let i = 0; i < burstCount; i++) {
        this.spawnCorePuff(x, y, scale, dirX, dirY);
      }

      // 30% probability of releasing an authentic vortex smoke ring on puff onset (Phase 4.8)
      if (
        this.exhaleBurstFrames === 1 &&
        now - this.lastRingTime > 3500 &&
        Math.random() < 0.35
      ) {
        this.spawnSmokeRing(x, y - 8 * scale, scale);
        this.lastRingTime = now;
      }

      if (this.exhaleBurstFrames >= 4) {
        this.exhaleBurstActive = false;
      }
    }

    // ── 2. Multi-Layer Steady Exhale Plume (Phase 4.2 & 4.3) ─────────────────
    // Layer A: Core Puff (Dense center)
    this.spawnCorePuff(x, y, scale, dirX, dirY);

    // Layer B: Primary Cloud (Main volumetric body)
    this.spawnPrimaryCloud(x, y, scale);

    // Layer C: Asymmetric Secondary Curls (Cheeks & shoulders drift)
    const leftCurlAngle = -Math.PI / 2 - (0.35 + Math.random() * 0.50); // -110° to -140°
    this.spawnSecondaryCurl(
      x - (Math.random() * 10 * scale),
      y + (Math.random() - 0.5) * 6,
      scale,
      leftCurlAngle,
      -1 // Left cheek bias
    );

    const rightCurlAngle = -Math.PI / 2 + (0.35 + Math.random() * 0.50); // -70° to -40°
    this.spawnSecondaryCurl(
      x + (Math.random() * 10 * scale),
      y + (Math.random() - 0.5) * 6,
      scale,
      rightCurlAngle,
      1 // Right cheek bias
    );

    // Layer D: Fine Wisps (Delicate outer dissipation fringes)
    if (Math.random() < 0.65) {
      this.spawnFineWisp(x, y, scale);
    }
  }

  // ── Spawn Layer Helpers ───────────────────────────────────────────────────

  private spawnCorePuff(
    x: number,
    y: number,
    scale: number,
    dirX: number,
    dirY: number
  ) {
    const p = this.acquireParticle();
    p.active = true;
    p.type = 'CORE_PUFF';
    p.x = x + (Math.random() - 0.5) * 12 * scale;
    p.y = y + (Math.random() - 0.5) * 8 * scale;

    const angle = Math.atan2(dirY, dirX || (Math.random() - 0.5) * 0.4) + (Math.random() - 0.5) * 0.35;
    const speed = (3.2 + Math.random() * 2.2) * scale;
    p.vx = Math.cos(angle) * speed;
    p.vy = Math.sin(angle) * speed;

    p.baseSize = (16 + Math.random() * 8) * scale;
    p.size = p.baseSize;
    p.maxExpansion = (38 + Math.random() * 18) * scale;

    p.initialAlpha = 0.32 + Math.random() * 0.08;
    p.alpha = 0;
    p.life = 0;
    p.maxLife = 65 + Math.floor(Math.random() * 25);

    p.rotation = Math.random() * Math.PI * 2;
    p.rotSpeed = (Math.random() - 0.5) * 0.03;
    p.turbPhase = Math.random() * Math.PI * 2;
    p.turbFreq = 0.05 + Math.random() * 0.03;
    p.lateralBias = 0;
    p.aspectRatio = 1.15 + Math.random() * 0.2;
    p.subLobeOffset = 0.22 + Math.random() * 0.12;
    p.zDepth = 0.15 + Math.random() * 0.15;
    p.vz = 0.008 + Math.random() * 0.006;
  }

  private spawnPrimaryCloud(x: number, y: number, scale: number) {
    const p = this.acquireParticle();
    p.active = true;
    p.type = 'PRIMARY_CLOUD';
    p.x = x + (Math.random() - 0.5) * 14 * scale;
    p.y = y + (Math.random() - 0.5) * 6 * scale;

    const angle = -Math.PI / 2 + (Math.random() - 0.5) * 0.55;
    const speed = (2.2 + Math.random() * 1.8) * scale;
    p.vx = Math.cos(angle) * speed;
    p.vy = Math.sin(angle) * speed;

    p.baseSize = (22 + Math.random() * 12) * scale;
    p.size = p.baseSize;
    p.maxExpansion = (65 + Math.random() * 25) * scale;

    p.initialAlpha = 0.22 + Math.random() * 0.06;
    p.alpha = 0;
    p.life = 0;
    p.maxLife = 85 + Math.floor(Math.random() * 35);

    p.rotation = Math.random() * Math.PI * 2;
    p.rotSpeed = (Math.random() - 0.5) * 0.025;
    p.turbPhase = Math.random() * Math.PI * 2;
    p.turbFreq = 0.04 + Math.random() * 0.02;
    p.lateralBias = (Math.random() - 0.5) * 0.4;
    p.aspectRatio = 1.2 + Math.random() * 0.25;
    p.subLobeOffset = 0.28 + Math.random() * 0.14;
    p.zDepth = 0.25 + Math.random() * 0.25;
    p.vz = 0.006 + Math.random() * 0.005;
  }

  private spawnSecondaryCurl(
    x: number,
    y: number,
    scale: number,
    angle: number,
    lateralBias: number
  ) {
    const p = this.acquireParticle();
    p.active = true;
    p.type = 'SECONDARY_CURL';
    p.x = x;
    p.y = y;

    const speed = (2.0 + Math.random() * 1.6) * scale;
    p.vx = Math.cos(angle) * speed;
    p.vy = Math.sin(angle) * speed;

    p.baseSize = (18 + Math.random() * 10) * scale;
    p.size = p.baseSize;
    p.maxExpansion = (55 + Math.random() * 22) * scale;

    p.initialAlpha = 0.18 + Math.random() * 0.05;
    p.alpha = 0;
    p.life = 0;
    p.maxLife = 95 + Math.floor(Math.random() * 35);

    p.rotation = Math.random() * Math.PI * 2;
    p.rotSpeed = (Math.random() - 0.5) * 0.035;
    p.turbPhase = Math.random() * Math.PI * 2;
    p.turbFreq = 0.045 + Math.random() * 0.02;
    p.lateralBias = lateralBias * (0.8 + Math.random() * 0.5);
    p.aspectRatio = 1.25 + Math.random() * 0.25;
    p.subLobeOffset = 0.3 + Math.random() * 0.15;
    p.zDepth = 0.35 + Math.random() * 0.3;
    p.vz = 0.005 + Math.random() * 0.004;
  }

  private spawnFineWisp(x: number, y: number, scale: number) {
    const p = this.acquireParticle();
    p.active = true;
    p.type = 'FINE_WISP';
    p.x = x + (Math.random() - 0.5) * 22 * scale;
    p.y = y + (Math.random() - 0.5) * 12 * scale;

    const angle = -Math.PI / 2 + (Math.random() - 0.5) * 1.2;
    const speed = (1.5 + Math.random() * 1.5) * scale;
    p.vx = Math.cos(angle) * speed;
    p.vy = Math.sin(angle) * speed;

    p.baseSize = (14 + Math.random() * 8) * scale;
    p.size = p.baseSize;
    p.maxExpansion = (45 + Math.random() * 18) * scale;

    p.initialAlpha = 0.09 + Math.random() * 0.04;
    p.alpha = 0;
    p.life = 0;
    p.maxLife = 110 + Math.floor(Math.random() * 40);

    p.rotation = Math.random() * Math.PI * 2;
    p.rotSpeed = (Math.random() - 0.5) * 0.04;
    p.turbPhase = Math.random() * Math.PI * 2;
    p.turbFreq = 0.06 + Math.random() * 0.03;
    p.lateralBias = (Math.random() - 0.5) * 1.2;
    p.aspectRatio = 1.35 + Math.random() * 0.3;
    p.subLobeOffset = 0.35;
    p.zDepth = 0.5 + Math.random() * 0.35;
    p.vz = 0.004;
  }

  private spawnSmokeRing(x: number, y: number, scale: number) {
    const p = this.acquireParticle();
    p.active = true;
    p.type = 'SMOKE_RING';
    p.x = x;
    p.y = y;

    // Fast initial forward/upward motion for the smoke ring
    p.vx = (Math.random() - 0.5) * 0.6;
    p.vy = -3.8 * scale;

    p.baseSize = 14 * scale;
    p.size = p.baseSize;
    p.maxExpansion = 52 * scale;

    p.initialAlpha = 0.36;
    p.alpha = 0;
    p.life = 0;
    p.maxLife = 85;

    p.rotation = 0;
    p.rotSpeed = 0.005;
    p.turbPhase = 0;
    p.turbFreq = 0.02;
    p.lateralBias = 0;
    p.aspectRatio = 1.0;
    p.subLobeOffset = 0;
    p.zDepth = 0.1;
    p.vz = 0.012;
  }

  /**
   * Aerodynamic simulation loop: multi-layer drag, thermal buoyancy,
   * non-linear volumetric expansion, and organic turbulence.
   */
  update() {
    for (let i = 0; i < this.maxParticles; i++) {
      const p = this.particlePool[i];
      if (!p.active) continue;

      p.life++;
      if (p.life >= p.maxLife) {
        p.active = false;
        continue;
      }

      const progress = p.life / p.maxLife;

      // ── A. Aerodynamic Drag (Slows initial high-speed blast) ───────────────
      const drag = p.type === 'CORE_PUFF' ? 0.962 : 0.974;
      p.vx *= drag;
      p.vy *= drag;

      // ── B. Thermal Buoyancy (Rises gently into surrounding air) ────────────
      // Fresh smoke pushes outward; older smoke rises as heat dominates
      const thermalLift = 0.038 + progress * 0.024;
      p.vy -= thermalLift;

      // ── C. Lateral Cheek/Shoulder Curl & Airflow Asymmetry ─────────────────
      if (p.lateralBias !== 0) {
        p.vx += p.lateralBias * 0.048;
      }

      // ── D. Multi-Frequency Organic Turbulence ──────────────────────────────
      p.vx += Math.sin(p.life * p.turbFreq + p.turbPhase) * 0.095;
      p.vy += Math.cos(p.life * (p.turbFreq * 0.8) + p.turbPhase) * 0.035;

      // Update positions
      p.x += p.vx;
      p.y += p.vy;
      p.zDepth = Math.min(1.0, p.zDepth + p.vz);

      // ── E. Non-Linear Volumetric Expansion (Phase 4.11) ────────────────────
      // Rapid initial expansion as pressure drops, tapering into ambient mist
      const expansionFactor = 1 - Math.exp(-progress * 3.4);
      p.size = p.baseSize + p.maxExpansion * expansionFactor;

      p.rotation += p.rotSpeed;

      // ── F. Natural Multi-Phase Alpha Envelope (Phase 4.12) ─────────────────
      let envelope: number;
      if (progress < 0.08) {
        // Smooth ramp-in at birth (prevents popping)
        envelope = progress / 0.08;
      } else if (progress < 0.38) {
        // Dense core plateau
        envelope = 1.0;
      } else {
        // Soft exponential falloff into ethereal wisps
        envelope = Math.pow(1 - (progress - 0.38) / 0.62, 1.6);
      }

      p.alpha = p.initialAlpha * envelope;
    }
  }

  /**
   * Phase 8: Apply ritual force fields to active smoke particles:
   * - Hand velocity coupling (pushes nearby smoke along hand path)
   * - Pinch attraction (concentrates smoke) / Open hand repulsion (disperses smoke)
   * - Rotational vortex force field with gentle centripetal eye pull
   * - Toroidal smoke ring / spiral alignment force
   * - Strict velocity and boundary clamping
   */
  applyRitualForces(params: {
    handPos: Point2D | null;
    handVelocity: Point2D | null;
    isPinching: boolean;
    isOpenHand: boolean;
    vortexCenter: Point2D | null;
    vortexStrength: number;
    vortexRadius: number;
    ringCenter: Point2D | null;
    ringRadius: number;
    ringStrength: number;
    canvasWidth: number;
    canvasHeight: number;
  }): number {
    let influencedCount = 0;
    const {
      handPos,
      handVelocity,
      isPinching,
      isOpenHand,
      vortexCenter,
      vortexStrength,
      vortexRadius,
      ringCenter,
      ringRadius,
      ringStrength,
      canvasWidth,
      canvasHeight
    } = params;

    const handRadius = SMOKE_RITUAL_CONFIG.handInfluenceRadius;
    const maxSpeed = SMOKE_RITUAL_CONFIG.maxParticleSpeed;

    for (let i = 0; i < this.maxParticles; i++) {
      const p = this.particlePool[i];
      if (!p.active) continue;

      let particleInfluenced = false;

      // ── 1. Hand Influence Field ──────────────────────────────────────────
      if (handPos) {
        const dx = p.x - handPos.x;
        const dy = p.y - handPos.y;
        const dist = Math.hypot(dx, dy);

        if (dist < handRadius && dist > 1.0) {
          particleInfluenced = true;
          // Smooth quadratic falloff (closer = stronger)
          const falloff = Math.pow(1 - dist / handRadius, 1.8);

          // A. Hand Velocity Coupling (push smoke along hand movement direction)
          if (handVelocity) {
            const coupling = SMOKE_RITUAL_CONFIG.handVelocityCoupling;
            p.vx += handVelocity.x * coupling * falloff;
            p.vy += handVelocity.y * coupling * falloff;
          }

          // B. Pinch Attraction (gather smoke into palm)
          if (isPinching) {
            const nx = dx / dist;
            const ny = dy / dist;
            const pull = SMOKE_RITUAL_CONFIG.pinchAttractionStrength * falloff;
            p.vx -= nx * pull;
            p.vy -= ny * pull;
          }
          // C. Open Hand Repulsion (disperse smoke outward)
          else if (isOpenHand) {
            const nx = dx / dist;
            const ny = dy / dist;
            const push = SMOKE_RITUAL_CONFIG.openHandRepulsionStrength * falloff;
            p.vx += nx * push;
            p.vy += ny * push;
          }
        }
      }

      // ── 2. Rotating Vortex Field ─────────────────────────────────────────
      if (vortexCenter && Math.abs(vortexStrength) > 0.05) {
        const vdx = p.x - vortexCenter.x;
        const vdy = p.y - vortexCenter.y;
        const vdist = Math.hypot(vdx, vdy);

        if (vdist < vortexRadius && vdist > 4.0) {
          particleInfluenced = true;
          const vFalloff = Math.pow(1 - vdist / vortexRadius, 1.25);

          // Tangential rotational force (-dy, dx)
          const tangentX = -vdy / vdist;
          const tangentY = vdx / vdist;
          p.vx += tangentX * vortexStrength * vFalloff;
          p.vy += tangentY * vortexStrength * vFalloff;

          // Gentle inward centripetal pull toward the vortex eye
          const centripetal = SMOKE_RITUAL_CONFIG.vortexCentripetalForce * vFalloff;
          p.vx -= (vdx / vdist) * centripetal;
          p.vy -= (vdy / vdist) * centripetal;

          // Controlled organic turbulence
          p.rotation += 0.04 * vortexStrength;
        }
      }

      // ── 3. Toroidal Smoke Ring / Spiral Formation ─────────────────────────
      if (ringCenter && ringRadius > 10 && ringStrength > 0.05) {
        const rdx = p.x - ringCenter.x;
        const rdy = p.y - ringCenter.y;
        const rdist = Math.hypot(rdx, rdy);

        if (rdist > 5.0) {
          const deltaR = rdist - ringRadius;
          const ringBand = SMOKE_RITUAL_CONFIG.ringThickness;

          if (Math.abs(deltaR) < ringBand * 2.2) {
            particleInfluenced = true;
            // Guide particles toward the toroidal ring radius
            const pullFactor = Math.max(-1, Math.min(1, -deltaR / ringBand));
            const ringPull = pullFactor * ringStrength;
            p.vx += (rdx / rdist) * ringPull;
            p.vy += (rdy / rdist) * ringPull;

            // Gentle circumferential swirl along the ring perimeter
            p.vx += (-rdy / rdist) * 0.85 * ringStrength;
            p.vy += (rdx / rdist) * 0.85 * ringStrength;
          }
        }
      }

      // ── 4. Strict Safety Clamping & Dissipation ───────────────────────────
      // Strict vector speed clamp prevents explosions / runaway movement
      const curSpeed = Math.hypot(p.vx, p.vy);
      if (curSpeed > maxSpeed && curSpeed > 0) {
        const factor = maxSpeed / curSpeed;
        p.vx *= factor;
        p.vy *= factor;
      }

      // Bounds check: if particle drifts outside interaction bounds, fade gracefully
      const margin = SMOKE_RITUAL_CONFIG.fadeOnBoundsMargin;
      if (
        p.x < -margin ||
        p.x > canvasWidth + margin ||
        p.y < -margin ||
        p.y > canvasHeight + margin
      ) {
        p.alpha *= 0.88;
      }

      if (particleInfluenced) {
        influencedCount++;
      }
    }

    return influencedCount;
  }

  /**
   * Optimized multi-layer Canvas 2D renderer with theme harmonization.
   * Renders feathered volumetric clouds, organic sub-lobes, and smoke rings.
   */
  draw(ctx: CanvasRenderingContext2D, themeId?: string) {
    let hasActive = false;
    for (let i = 0; i < this.maxParticles; i++) {
      if (this.particlePool[i].active && this.particlePool[i].alpha > 0.002) {
        hasActive = true;
        break;
      }
    }
    if (!hasActive) return;

    ctx.save();

    for (let i = 0; i < this.maxParticles; i++) {
      const p = this.particlePool[i];
      if (!p.active || p.alpha <= 0.002) continue;

      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation);

      if (p.aspectRatio !== 1.0) {
        ctx.scale(1.0, p.aspectRatio);
      }

      // Special rendering for Smoke Ring
      if (p.type === 'SMOKE_RING') {
        const ringGrad = ctx.createRadialGradient(0, 0, p.size * 0.42, 0, 0, p.size);
        ringGrad.addColorStop(0, 'rgba(255, 255, 255, 0)');
        ringGrad.addColorStop(0.38, 'rgba(255, 255, 255, 0.04)');
        ringGrad.addColorStop(0.68, `rgba(255, 255, 255, ${p.alpha * 1.35})`);
        ringGrad.addColorStop(0.88, `rgba(240, 246, 255, ${p.alpha * 0.75})`);
        ringGrad.addColorStop(1, 'rgba(215, 230, 255, 0)');

        ctx.fillStyle = ringGrad;
        ctx.beginPath();
        ctx.arc(0, 0, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        continue;
      }

      // Pearlescent Soft Multi-Stop Smoke Gradient (with subtle environment harmonization)
      const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, p.size);
      grad.addColorStop(0, `rgba(255, 255, 255, ${p.alpha * 1.18})`);
      grad.addColorStop(0.24, `rgba(244, 248, 255, ${p.alpha * 0.92})`);
      grad.addColorStop(0.55, `rgba(230, 238, 252, ${p.alpha * 0.45})`);

      // Subtle edge tint to harmonize with active skin & environment (Phase 8.14 & 8.15)
      if (themeId === 'cyber-neon' || themeId === 'cyber-lounge') {
        grad.addColorStop(0.82, `rgba(210, 248, 255, ${p.alpha * 0.16})`);
      } else if (themeId === 'royal-gold' || themeId === 'royal-lounge' || themeId === 'desert-amber') {
        grad.addColorStop(0.82, `rgba(255, 244, 226, ${p.alpha * 0.16})`);
      } else if (themeId === 'deep-ocean') {
        grad.addColorStop(0.82, `rgba(218, 250, 246, ${p.alpha * 0.16})`);
      } else if (themeId === 'obsidian-luxury') {
        grad.addColorStop(0.82, `rgba(235, 225, 245, ${p.alpha * 0.16})`);
      } else {
        grad.addColorStop(0.82, `rgba(215, 226, 246, ${p.alpha * 0.15})`);
      }

      grad.addColorStop(1, 'rgba(200, 215, 240, 0)');

      // Primary Volumetric Lobe
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(0, 0, p.size, 0, Math.PI * 2);
      ctx.fill();

      // Secondary Organic Sub-Lobe for Cauliflower Cloud Texture (Phase 4.2)
      if ((p.type === 'PRIMARY_CLOUD' || p.type === 'CORE_PUFF') && p.subLobeOffset > 0) {
        const subDist = p.size * p.subLobeOffset;
        const subSize = p.size * 0.72;
        const subGrad = ctx.createRadialGradient(subDist, subDist * 0.5, 0, subDist, subDist * 0.5, subSize);
        subGrad.addColorStop(0, `rgba(250, 252, 255, ${p.alpha * 0.85})`);
        subGrad.addColorStop(0.5, `rgba(232, 240, 252, ${p.alpha * 0.35})`);
        subGrad.addColorStop(1, 'rgba(210, 225, 245, 0)');

        ctx.fillStyle = subGrad;
        ctx.beginPath();
        ctx.arc(subDist, subDist * 0.5, subSize, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    }

    ctx.restore();
  }

  clear() {
    for (let i = 0; i < this.maxParticles; i++) {
      this.particlePool[i].active = false;
      this.particlePool[i].alpha = 0;
    }
    this.exhaleBurstActive = false;
  }

  getActiveParticleCount(): number {
    let count = 0;
    for (let i = 0; i < this.maxParticles; i++) {
      if (this.particlePool[i].active) count++;
    }
    return count;
  }

  getMetrics() {
    return {
      activeCount: this.getActiveParticleCount(),
      maxParticles: this.maxParticles,
      isExhaling: this.exhaleBurstActive
    };
  }

  getParticlePool(): readonly VapourParticle[] {
    return this.particlePool;
  }
}
