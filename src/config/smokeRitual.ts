// Smoke Ritual Configuration — Created by Saidarshan.K
// Phase 8: Signature AR Experience — Gesture-Controlled Smoke & Interactive Ritual

export const SMOKE_RITUAL_CONFIG = {
  // ── 1. Activation & Lifecycle ─────────────────────────────────────────────
  activationDelayMs: 950,       // Duration in VAPOUR before seamless ritual activation
  durationMs: 6500,              // Total interactive ritual window (6.5 seconds)
  minSmokeParticlesToStart: 8,   // Plume must be visually formed before ritual activates

  // ── 2. Hand Force Field & Velocity Coupling ───────────────────────────────
  handInfluenceRadius: 185,      // Spatial radius (pixels) around hand palm/anchor
  maxHandForce: 3.2,             // Clamped maximum acceleration per frame
  handVelocityCoupling: 0.14,    // Drag/wind coupling factor from hand movement
  pinchAttractionStrength: 1.85, // Centripetal pull towards pinch anchor
  openHandRepulsionStrength: 2.15,// Centrifugal push away from open palm

  // ── 3. Circular Motion (Swirl Gesture) Detection ──────────────────────────
  swirlDetectionWindowMs: 850,   // Temporal history window for circular hand path
  swirlMinRadius: 28,            // Minimum circular radius (pixels)
  swirlMaxRadius: 210,           // Maximum circular radius (pixels)
  swirlMinAngleSpanRad: 4.71,    // Minimum angular traversal (270 degrees in radians)
  swirlCooldownMs: 2800,         // Prevent duplicate vortex trigger spam

  // ── 4. Vortex Dynamics ───────────────────────────────────────────────────
  vortexDurationMs: 2400,        // How long the rotating vortex remains active
  vortexRadius: 175,             // Vortex influence radius (pixels)
  vortexStrength: 3.6,           // Tangential rotational speed
  vortexCentripetalForce: 0.75,  // Inward pull towards vortex eye
  vortexDecay: 0.965,            // Per-frame strength damping

  // ── 5. Signature Shape: Expanding Smoke Ring / Spiral ─────────────────────
  shapeDurationMs: 2500,         // Duration the ring holds coherent structure
  ringBaseRadius: 95,            // Initial toroidal ring radius (pixels)
  ringExpansionSpeed: 24,        // Radial growth speed (pixels/sec)
  ringThickness: 34,             // Toroidal band thickness (pixels)
  ringAttractionStrength: 1.45,  // Force guiding nearby smoke into the ring boundary

  // ── 6. Physics Safety & Bound Clamping ───────────────────────────────────
  maxParticleSpeed: 6.8,         // Strict maximum particle speed (prevents runaway explosion)
  fadeOnBoundsMargin: 50,        // Distance outside viewport before accelerated dissipation
  trackingLossGracePeriodMs: 400,// How long to sustain momentum when hand tracking briefly drops
  trackingLossDecayMs: 1400,     // Graceful fade to normal smoke if hand missing for extended duration

  // ── 7. Local Persistence Key ─────────────────────────────────────────────
  introSeenKey: 'hookah_smoke_ritual_intro_seen_v1'
} as const;

export type SmokeRitualConfig = typeof SMOKE_RITUAL_CONFIG;
