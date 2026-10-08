import React from 'react';
import type { AppState, MouthState, PinchState, PerformanceMetrics, SmokeRitualTelemetry } from '../types/hookah';
import type { AudioTelemetry } from '../services/audioManager';
import { MagicCard } from './magicui/MagicCard';
import { Eye, EyeOff, Wind, X, Volume2, VolumeX, Sparkles } from 'lucide-react';

export interface TechnicalHUDProps {
  appState: AppState;
  showLandmarks: boolean;
  onToggleLandmarks: () => void;
  onTriggerSmoke: () => void;
  pinchState: PinchState | null;
  mouthState: MouthState | null;
  perfMetrics?: PerformanceMetrics;
  audioTelemetry?: AudioTelemetry;
  ritualTelemetry?: SmokeRitualTelemetry;
  onClose: () => void;
}

export const TechnicalHUD: React.FC<TechnicalHUDProps> = ({
  appState,
  showLandmarks,
  onToggleLandmarks,
  onTriggerSmoke,
  pinchState,
  mouthState,
  perfMetrics,
  audioTelemetry,
  ritualTelemetry,
  onClose
}) => {
  const isPinching = pinchState?.isPinching || false;
  const isGrabbing = pinchState?.isGrabbing || false;
  const isFist = pinchState?.isFist || false;
  const isMouthOpen = mouthState?.isOpen || false;
  const openRatio = mouthState ? (mouthState.openRatio * 100).toFixed(1) : '0.0';

  return (
    <aside
      aria-label="Technical Telemetry Panel"
      style={{
        position: 'absolute',
        top: 72,
        right: 22,
        zIndex: 26,
        width: 280,
        pointerEvents: 'auto',
        fontFamily: 'var(--font-mono, monospace)',
        animation: 'blur-fade-in 0.2s ease-out'
      }}
    >
      <MagicCard
        spotlightColor="rgba(41, 121, 255, 0.18)"
        borderColor="rgba(255, 255, 255, 0.16)"
        style={{
          padding: '14px 16px',
          borderRadius: 18,
          fontSize: '0.74rem',
          backgroundColor: 'rgba(9, 11, 18, 0.92)',
          boxShadow: '0 12px 36px rgba(0, 0, 0, 0.6)'
        }}
      >
        {/* Panel Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            paddingBottom: 8,
            marginBottom: 10
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span
              style={{
                width: 7,
                height: 7,
                borderRadius: '50%',
                backgroundColor: '#00e5ff',
                boxShadow: '0 0 6px #00e5ff'
              }}
            />
            <span
              style={{
                color: '#ffffff',
                fontWeight: 700,
                letterSpacing: '0.06em',
                fontSize: '0.72rem'
              }}
            >
              VapeAR TELEMETRY
            </span>
          </div>

          <button
            onClick={onClose}
            title="Close Telemetry"
            aria-label="Close Telemetry"
            style={{
              background: 'none',
              border: 'none',
              color: 'rgba(255, 255, 255, 0.5)',
              cursor: 'pointer',
              padding: 2,
              display: 'flex',
              alignItems: 'center',
              outline: 'none'
            }}
          >
            <X size={14} />
          </button>
        </div>

        {/* Telemetry Metrics List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {/* App State */}
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'rgba(255, 255, 255, 0.5)' }}>STATE:</span>
            <span style={{ color: '#00e5ff', fontWeight: 700 }}>{appState}</span>
          </div>

          {/* Render & Vision AI Performance */}
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'rgba(255, 255, 255, 0.5)' }}>RENDER:</span>
            <span style={{ color: '#00e676', fontWeight: 600 }}>
              {perfMetrics ? `${perfMetrics.renderFps} FPS` : '60 FPS'}
            </span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'rgba(255, 255, 255, 0.5)' }}>VISION AI:</span>
            <span style={{ color: '#00e5ff', fontWeight: 600 }}>
              {perfMetrics ? `${perfMetrics.inferenceFps} FPS (${perfMetrics.inferenceTimeMs}ms)` : '30 FPS'}
            </span>
          </div>

          {/* Pinch / Grab Status */}
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'rgba(255, 255, 255, 0.5)' }}>GRAB:</span>
            <span style={{ color: isGrabbing ? '#00e676' : '#9e9e9e', fontWeight: 600 }}>
              {isGrabbing ? (isFist ? 'FIST LOCKED' : (isPinching ? 'PINCH LOCKED' : 'GRAB LOCKED')) : 'RELEASED'}
            </span>
          </div>

          {/* Active Hand Tracking & Lock */}
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'rgba(255, 255, 255, 0.5)' }}>HAND TRACK:</span>
            <span style={{ color: pinchState ? '#00e5ff' : 'rgba(255, 255, 255, 0.5)', fontWeight: 600 }}>
              {pinchState
                ? `${pinchState.handedness ?? 'TRACKED'}${pinchState.trackingStable === false ? ' (GRACE)' : ''}`
                : 'NO HAND'}
            </span>
          </div>

          {/* Gesture Confidence */}
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'rgba(255, 255, 255, 0.5)' }}>GESTURE CONF:</span>
            <span style={{ color: (pinchState?.gestureConfidence ?? 0) > 0.6 ? '#00e676' : 'rgba(255, 255, 255, 0.8)' }}>
              {pinchState && pinchState.gestureConfidence !== undefined
                ? `${(pinchState.gestureConfidence * 100).toFixed(0)}%`
                : '0%'}
            </span>
          </div>

          {/* Mouth State */}
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'rgba(255, 255, 255, 0.5)' }}>MOUTH:</span>
            <span style={{ color: isMouthOpen ? '#ffa726' : '#9e9e9e', fontWeight: 600 }}>
              {isMouthOpen ? 'OPEN' : 'CLOSED'}
            </span>
          </div>

          {/* Mouth Ratio */}
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'rgba(255, 255, 255, 0.5)' }}>OPEN RATIO:</span>
            <span style={{ color: isMouthOpen ? '#ffa726' : 'rgba(255, 255, 255, 0.8)' }}>
              {openRatio}% (TH: 15%)
            </span>
          </div>

          {/* Audio Telemetry Section (Phase 6.35) */}
          {audioTelemetry && (
            <div
              style={{
                marginTop: 6,
                paddingTop: 6,
                borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                display: 'flex',
                flexDirection: 'column',
                gap: 5
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'rgba(255, 255, 255, 0.5)' }}>AUDIO:</span>
                <span
                  style={{
                    color: audioTelemetry.isEnabled ? '#00e676' : '#ff5252',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4
                  }}
                >
                  {audioTelemetry.isEnabled ? <Volume2 size={11} /> : <VolumeX size={11} />}
                  {audioTelemetry.isEnabled ? 'ENABLED' : 'MUTED'}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'rgba(255, 255, 255, 0.5)' }}>AUDIO CTX:</span>
                <span style={{ color: '#00e5ff', textTransform: 'uppercase' }}>
                  {audioTelemetry.contextState}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'rgba(255, 255, 255, 0.5)' }}>AMBIENT:</span>
                <span style={{ color: audioTelemetry.isAmbientPlaying ? '#00e676' : 'rgba(255, 255, 255, 0.4)' }}>
                  {audioTelemetry.isAmbientPlaying ? 'PLAYING' : 'OFF'}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'rgba(255, 255, 255, 0.5)' }}>BUBBLE:</span>
                <span style={{ color: audioTelemetry.isBubbling ? '#00e676' : 'rgba(255, 255, 255, 0.4)' }}>
                  {audioTelemetry.isBubbling ? 'ACTIVE' : 'OFF'}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'rgba(255, 255, 255, 0.5)' }}>LAST SFX:</span>
                <span style={{ color: '#ff80ab', fontWeight: 600 }}>
                  {audioTelemetry.lastEvent}
                </span>
              </div>
            </div>
          )}

          {/* Smoke Ritual Telemetry Section (Phase 8) */}
          {ritualTelemetry && (
            <div
              style={{
                marginTop: 6,
                paddingTop: 6,
                borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                display: 'flex',
                flexDirection: 'column',
                gap: 5
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'rgba(255, 255, 255, 0.5)' }}>RITUAL:</span>
                <span
                  style={{
                    color: ritualTelemetry.isActive ? '#ffd700' : 'rgba(255, 255, 255, 0.4)',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4
                  }}
                >
                  <Sparkles size={11} />
                  {ritualTelemetry.isActive ? 'ACTIVE' : 'STANDBY'}
                </span>
              </div>

              {ritualTelemetry.isActive && (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'rgba(255, 255, 255, 0.5)' }}>TIMER:</span>
                    <span style={{ color: '#ffd700', fontWeight: 600 }}>
                      {(ritualTelemetry.ritualTimeRemainingMs / 1000).toFixed(1)}s ({(ritualTelemetry.ritualProgress * 100).toFixed(0)}%)
                    </span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'rgba(255, 255, 255, 0.5)' }}>HAND VEL:</span>
                    <span style={{ color: '#00e5ff', fontWeight: 600 }}>
                      {ritualTelemetry.handVelocity.x}, {ritualTelemetry.handVelocity.y} px/s
                    </span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'rgba(255, 255, 255, 0.5)' }}>PARTICLES INFL:</span>
                    <span style={{ color: '#00e676', fontWeight: 600 }}>
                      {ritualTelemetry.particlesInfluenced}
                    </span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'rgba(255, 255, 255, 0.5)' }}>VORTEX / SHAPE:</span>
                    <span style={{ color: ritualTelemetry.isVortexActive ? '#ff80ab' : 'rgba(255, 255, 255, 0.4)', fontWeight: 600 }}>
                      {ritualTelemetry.isVortexActive ? `SWIRL (${ritualTelemetry.activeShape})` : 'NONE'}
                    </span>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Quick Action Buttons */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 6,
            marginTop: 10,
            paddingTop: 8,
            borderTop: '1px solid rgba(255, 255, 255, 0.08)'
          }}
        >
          <button
            onClick={onToggleLandmarks}
            style={{
              padding: '6px 8px',
              borderRadius: 8,
              backgroundColor: showLandmarks ? 'rgba(41, 121, 255, 0.3)' : 'rgba(255, 255, 255, 0.06)',
              border: `1px solid ${showLandmarks ? '#2979ff' : 'rgba(255, 255, 255, 0.1)'}`,
              color: showLandmarks ? '#90caf9' : '#e0e0e0',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 5,
              fontSize: '0.68rem',
              fontWeight: 600
            }}
          >
            {showLandmarks ? <Eye size={12} /> : <EyeOff size={12} />}
            <span>Mesh {showLandmarks ? 'ON' : 'OFF'}</span>
          </button>

          <button
            onClick={onTriggerSmoke}
            style={{
              padding: '6px 8px',
              borderRadius: 8,
              backgroundColor: 'rgba(233, 30, 99, 0.25)',
              border: '1px solid rgba(233, 30, 99, 0.5)',
              color: '#ff80ab',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 5,
              fontSize: '0.68rem',
              fontWeight: 600
            }}
          >
            <Wind size={12} />
            <span>Test Smoke</span>
          </button>
        </div>
      </MagicCard>
    </aside>
  );
};
