import React, { useEffect } from 'react';
import type { AppState, ActiveObject } from '../types/hookah';
import { MagicCard } from './magicui/MagicCard';
import { BlurFade } from './magicui/BlurFade';
import { Hand, Sparkles, Wind, HelpCircle, X, ChevronRight } from 'lucide-react';

export interface ExperienceHUDProps {
  appState: AppState;
  showGuide: boolean;
  onCloseGuide: () => void;
  isVortexActive?: boolean;
  activeShape?: 'NONE' | 'RING' | 'SPIRAL';
  activeObject?: ActiveObject;
}

export const ExperienceHUD: React.FC<ExperienceHUDProps> = ({
  appState,
  showGuide,
  onCloseGuide,
  isVortexActive = false,
  activeShape = 'NONE',
  activeObject = 'hookah'
}) => {
  // Auto-reduce/dismiss guide when user actively begins interacting
  useEffect(() => {
    if (showGuide && (appState === 'PIPE_GRABBED' || appState === 'PIPE_AT_MOUTH' || appState === 'VAPOUR' || appState === 'SMOKE_RITUAL')) {
      const timer = setTimeout(() => {
        onCloseGuide();
      }, 1200);
      return () => clearTimeout(timer);
    }
  }, [appState, showGuide, onCloseGuide]);

  const getHintContent = () => {
    const isCigar = activeObject === 'cigar';
    switch (appState) {
      case 'IDLE':
        return {
          icon: <Hand size={15} color="var(--cyan)" />,
          title: 'READY WHEN YOU ARE',
          instruction: 'Raise your hand to begin',
          accentColor: 'var(--cyan)'
        };
      case 'HAND_DETECTED':
        return {
          icon: <Hand size={15} color="#29b6f6" />,
          title: 'HAND DETECTED',
          instruction: isCigar ? 'Reach for the cigar & pinch to pick up' : 'Reach for the mouthpiece & pinch to grab',
          accentColor: '#29b6f6'
        };
      case 'PIPE_GRABBED':
        return {
          icon: <Sparkles size={15} color="#ab47bc" />,
          title: isCigar ? 'CIGAR GRABBED' : 'MOUTHPIECE GRABBED',
          instruction: isCigar ? 'Bring cigar toward your lips' : 'Bring it toward your lips',
          accentColor: '#ab47bc'
        };
      case 'PIPE_AT_MOUTH':
        return {
          icon: <Sparkles size={15} color="#ffa726" />,
          title: isCigar ? 'AT LIPS' : 'READY',
          instruction: isCigar ? 'Open mouth to draw a puff' : 'Open your mouth to inhale',
          accentColor: '#ffa726'
        };
      case 'SIP_DETECTED':
        return {
          icon: <Wind size={15} color="#00e676" />,
          title: isCigar ? 'PUFF DETECTED' : 'INHALE DETECTED',
          instruction: isCigar ? 'Ember glowing at cigar foot' : 'Water bubbling & charcoal glowing',
          accentColor: '#00e676'
        };
      case 'VAPOUR':
        return {
          icon: <Wind size={15} color="#ff1744" />,
          title: isCigar ? 'CIGAR SMOKE' : 'EXHALE',
          instruction: isCigar ? 'Rich aromatic cigar smoke drifting' : 'Let it out — atmospheric vapour active',
          accentColor: '#ff1744'
        };
      case 'SMOKE_RITUAL':
        if (isVortexActive || activeShape === 'RING') {
          return {
            icon: <Sparkles size={15} color="#d4af37" />,
            title: 'SWIRL DETECTED',
            instruction: 'Smoke vortex active • Toroidal ring forming',
            accentColor: '#d4af37'
          };
        }
        return {
          icon: <Sparkles size={15} color="#d4af37" />,
          title: 'SMOKE RITUAL',
          instruction: 'Move your hand to guide & shape the smoke',
          accentColor: '#d4af37'
        };
      default:
        return {
          icon: <Hand size={15} color="var(--cyan)" />,
          title: 'READY WHEN YOU ARE',
          instruction: 'Raise your hand to begin',
          accentColor: 'var(--cyan)'
        };
    }
  };

  const hint = getHintContent();

  return (
    <div
      className="hint-wrapper"
      style={{
        position: 'absolute',
        bottom: 84,
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 10,
        zIndex: 22,
        pointerEvents: 'none',
        width: '90%',
        maxWidth: 420,
        boxSizing: 'border-box'
      }}
    >
      {/* Onboarding Quick Guide Card (Initial or toggled via Help) */}
      {showGuide && (
        <BlurFade duration={0.25} yOffset={8}>
          <div style={{ pointerEvents: 'auto', width: '100%' }}>
            <MagicCard
              spotlightColor="rgba(233, 30, 99, 0.22)"
              borderColor="rgba(233, 30, 99, 0.35)"
              style={{
                padding: '14px 18px',
                borderRadius: 20,
                backgroundColor: 'rgba(11, 13, 21, 0.88)'
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: 10
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <HelpCircle size={14} color="var(--accent-light)" />
                  <span
                    style={{
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                      color: '#ffffff'
                    }}
                  >
                    HOW TO USE
                  </span>
                </div>
                <button
                  onClick={onCloseGuide}
                  title="Close Guide"
                  aria-label="Close Guide"
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'rgba(255, 255, 255, 0.55)',
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

              {/* 4-Step User Journey Guide */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: 8,
                  fontSize: '0.72rem',
                  color: 'rgba(255, 255, 255, 0.82)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ color: 'var(--accent-light)', fontWeight: 800 }}>01</span>
                  <span>Grab mouthpiece</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ color: 'var(--accent-light)', fontWeight: 800 }}>02</span>
                  <span>Bring to your lips</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ color: 'var(--accent-light)', fontWeight: 800 }}>03</span>
                  <span>Open your mouth</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ color: 'var(--accent-light)', fontWeight: 800 }}>04</span>
                  <span>Exhale vapour</span>
                </div>
              </div>
            </MagicCard>
          </div>
        </BlurFade>
      )}

      {/* Main Dynamic Contextual Status / Hint Card */}
      <div style={{ pointerEvents: 'auto', width: '100%' }}>
        <MagicCard
          spotlightColor={`${hint.accentColor}28`}
          borderColor="rgba(255, 255, 255, 0.12)"
          style={{
            padding: '10px 16px',
            borderRadius: 22,
            backgroundColor: 'rgba(10, 12, 19, 0.82)',
            boxShadow: '0 8px 28px rgba(0, 0, 0, 0.5)'
          }}
        >
          <div
            key={appState}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              animation: 'blur-fade-in 0.22s ease-out'
            }}
          >
            {/* Visual Icon Badge */}
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 16,
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                border: `1px solid ${hint.accentColor}44`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}
            >
              {hint.icon}
            </div>

            {/* Hint Text Content */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0, flex: 1 }}>
              <span
                style={{
                  fontSize: '0.78rem',
                  fontWeight: 800,
                  letterSpacing: '0.04em',
                  color: '#ffffff',
                  lineHeight: 1.2
                }}
              >
                {hint.title}
              </span>
              <span
                style={{
                  fontSize: '0.72rem',
                  color: 'rgba(255, 255, 255, 0.65)',
                  lineHeight: 1.3,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}
              >
                {hint.instruction}
              </span>
            </div>

            <ChevronRight size={14} color="rgba(255, 255, 255, 0.2)" />
          </div>
        </MagicCard>
      </div>
    </div>
  );
};
