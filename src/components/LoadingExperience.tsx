import React from 'react';
import { AnimatedGradientText } from './magicui/AnimatedGradientText';
import { MagicCard } from './magicui/MagicCard';
import { BlurFade } from './magicui/BlurFade';
import { Camera, Box, Brain, Check, Loader2, Sparkles } from 'lucide-react';

interface LoadingExperienceProps {
  loadingStep: string;
}

export const LoadingExperience: React.FC<LoadingExperienceProps> = ({ loadingStep }) => {
  const isCameraDone =
    loadingStep.includes('3D') || loadingStep.includes('Vision') || loadingStep.includes('AI') || loadingStep.includes('Ready');
  const is3DDone =
    loadingStep.includes('Vision') || loadingStep.includes('AI') || loadingStep.includes('Ready');
  const isVisionDone = loadingStep.includes('Ready');
  const isVisionActive = loadingStep.includes('Vision') || loadingStep.includes('AI');

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Initializing Augmented Reality Lounge"
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 40,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(5, 5, 8, 0.94)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        padding: 24,
        fontFamily: 'var(--font-sans)'
      }}
    >
      <BlurFade duration={0.3} yOffset={10}>
        <div style={{ width: '100%', maxWidth: 390 }}>
          <MagicCard
            spotlightColor="rgba(233, 30, 99, 0.22)"
            borderColor="rgba(255, 255, 255, 0.16)"
            style={{
              padding: '34px 28px',
              borderRadius: 28,
              textAlign: 'center',
              backgroundColor: 'rgba(12, 14, 23, 0.92)',
              boxShadow: '0 16px 48px rgba(0, 0, 0, 0.6)'
            }}
          >
            {/* Animated Central Halo */}
            <div
              style={{
                position: 'relative',
                width: 68,
                height: 68,
                margin: '0 auto 20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              {/* Outer Pulsing Glow Ring */}
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  borderRadius: '50%',
                  border: '2px solid rgba(233, 30, 99, 0.35)',
                  animation: 'pulse-ring 2.4s cubic-bezier(0.25, 1, 0.5, 1) infinite'
                }}
              />
              {/* Rotating Core Ring */}
              <div
                style={{
                  position: 'absolute',
                  inset: 4,
                  borderRadius: '50%',
                  border: '2px solid transparent',
                  borderTopColor: 'var(--accent)',
                  borderRightColor: 'var(--gold)',
                  animation: 'spin 1.2s linear infinite'
                }}
              />
              <span style={{ fontSize: '1.5rem' }}>🌬️</span>
            </div>

            {/* Badge & Title */}
            <div
              style={{
                fontSize: '0.68rem',
                fontWeight: 700,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                color: 'var(--accent-light)',
                marginBottom: 4
              }}
            >
              INITIALIZING EXPERIENCE
            </div>
            <h2
              style={{
                margin: '0 0 8px',
                fontSize: '1.45rem',
                fontWeight: 800,
                letterSpacing: '0.04em'
              }}
            >
              <AnimatedGradientText
                colors={['#ffffff', '#ff80ab', '#f48fb1', '#ffffff', '#e0e0e0']}
                duration="4s"
              >
                VapeAR
              </AnimatedGradientText>
            </h2>

            <p
              style={{
                color: 'rgba(255, 255, 255, 0.7)',
                fontSize: '0.82rem',
                margin: '0 0 22px',
                lineHeight: 1.45
              }}
            >
              {loadingStep}
            </p>

            {/* Verification Pipeline Checklist */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 10,
                textAlign: 'left',
                padding: '14px 16px',
                backgroundColor: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.07)',
                borderRadius: 18,
                marginBottom: 22
              }}
            >
              {/* 1. Camera Feed */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                  <Camera size={14} color="var(--cyan)" />
                  <span style={{ fontSize: '0.78rem', color: '#ffffff' }}>Camera Hardware</span>
                </div>
                {isCameraDone ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#00e676', fontSize: '0.7rem', fontWeight: 700 }}>
                    <Check size={13} />
                    <span>✓ Ready</span>
                  </div>
                ) : (
                  <Loader2 size={13} color="var(--accent)" style={{ animation: 'spin 1s linear infinite' }} />
                )}
              </div>

              {/* 2. 3D Lounge Scene */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                  <Box size={14} color="var(--gold)" />
                  <span style={{ fontSize: '0.78rem', color: '#ffffff' }}>3D Experience</span>
                </div>
                {is3DDone ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#00e676', fontSize: '0.7rem', fontWeight: 700 }}>
                    <Check size={13} />
                    <span>✓ Ready</span>
                  </div>
                ) : isCameraDone ? (
                  <Loader2 size={13} color="var(--accent)" style={{ animation: 'spin 1s linear infinite' }} />
                ) : (
                  <span style={{ fontSize: '0.7rem', color: 'rgba(255, 255, 255, 0.35)' }}>○ Pending</span>
                )}
              </div>

              {/* 3. AI Vision */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                  <Brain size={14} color="var(--accent-light)" />
                  <span style={{ fontSize: '0.78rem', color: '#ffffff' }}>AI Vision (Hand & Face)</span>
                </div>
                {isVisionDone ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#00e676', fontSize: '0.7rem', fontWeight: 700 }}>
                    <Check size={13} />
                    <span>✓ Ready</span>
                  </div>
                ) : isVisionActive ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--cyan)', fontSize: '0.7rem', fontWeight: 600 }}>
                    <Loader2 size={13} color="var(--cyan)" style={{ animation: 'spin 1s linear infinite' }} />
                    <span>• Loading</span>
                  </div>
                ) : (
                  <span style={{ fontSize: '0.7rem', color: 'rgba(255, 255, 255, 0.35)' }}>○ Pending</span>
                )}
              </div>

              {/* 4. AR Ready */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                  <Sparkles size={14} color="var(--cyan)" />
                  <span style={{ fontSize: '0.78rem', color: '#ffffff' }}>AR Ready</span>
                </div>
                {isVisionDone ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#00e676', fontSize: '0.7rem', fontWeight: 700 }}>
                    <Check size={13} />
                    <span>✓ Active</span>
                  </div>
                ) : (
                  <span style={{ fontSize: '0.7rem', color: 'rgba(255, 255, 255, 0.35)' }}>○ Calibrating</span>
                )}
              </div>
            </div>

            {/* Creator Attribution */}
            <div
              style={{
                fontSize: '0.74rem',
                color: 'rgba(255, 255, 255, 0.45)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 5
              }}
            >
              <span>Created by</span>
              <strong style={{ color: '#ffffff', fontWeight: 600 }}>Saidarshan.K</strong>
            </div>
          </MagicCard>
        </div>
      </BlurFade>
    </div>
  );
};
