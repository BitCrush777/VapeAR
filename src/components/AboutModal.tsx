import React from 'react';
import { MagicCard } from './magicui/MagicCard';
import { AnimatedGradientText } from './magicui/AnimatedGradientText';
import { Sparkles, X, Shield, Cpu, Wind } from 'lucide-react';

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AboutModal: React.FC<AboutModalProps> = ({ isOpen, onClose }) => {
  React.useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="about-modal-title"
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 50,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(5, 5, 8, 0.75)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        padding: 20,
        animation: 'blur-fade-in 0.2s ease-out'
      }}
      onClick={onClose}
    >
      <div
        style={{ width: '100%', maxWidth: 440 }}
        onClick={(e) => e.stopPropagation()}
      >
        <MagicCard
          spotlightColor="rgba(233, 30, 99, 0.22)"
          borderColor="rgba(255, 255, 255, 0.18)"
          style={{
            padding: '24px 28px',
            borderRadius: 24,
            backgroundColor: 'rgba(12, 14, 22, 0.94)'
          }}
        >
          {/* Header */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 16
            }}
          >
            <div>
              <div
                style={{
                  fontSize: '0.68rem',
                  fontWeight: 700,
                  letterSpacing: '0.12em',
                  color: 'var(--accent-light)',
                  textTransform: 'uppercase',
                  marginBottom: 4
                }}
              >
                AI-Powered AR Experience
              </div>
              <h2
                id="about-modal-title"
                style={{
                  margin: 0,
                  fontSize: '1.35rem',
                  fontWeight: 800,
                  letterSpacing: '0.03em'
                }}
              >
                <AnimatedGradientText duration="4s">
                  VapeAR
                </AnimatedGradientText>
              </h2>
            </div>

            <button
              onClick={onClose}
              title="Close modal"
              aria-label="Close modal"
              style={{
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                borderRadius: 16,
                color: '#ffffff',
                cursor: 'pointer',
                width: 32,
                height: 32,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                outline: 'none'
              }}
            >
              <X size={16} />
            </button>
          </div>

          {/* Description */}
          <p
            style={{
              color: 'rgba(255, 255, 255, 0.75)',
              fontSize: '0.84rem',
              lineHeight: 1.5,
              marginBottom: 20
            }}
          >
            An interactive AI-powered augmented reality experience.
            Control a photorealistic 3D virtual pipe using hand gestures, bring it to your lips,
            and exhale volumetric billowing vapour clouds in real-time.
          </p>

          {/* Architecture Pillars */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
              marginBottom: 22,
              padding: '12px 14px',
              backgroundColor: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.06)',
              borderRadius: 14
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.78rem' }}>
              <Cpu size={15} color="var(--cyan)" />
              <span style={{ color: 'rgba(255, 255, 255, 0.9)' }}>
                <strong>AI Vision:</strong> Google MediaPipe Hand & Face mesh tracking
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.78rem' }}>
              <Sparkles size={15} color="var(--gold)" />
              <span style={{ color: 'rgba(255, 255, 255, 0.9)' }}>
                <strong>3D Graphics:</strong> Three.js PBR lighting & dynamic cubic Bezier hose
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.78rem' }}>
              <Shield size={15} color="var(--green)" />
              <span style={{ color: 'rgba(255, 255, 255, 0.9)' }}>
                <strong>Privacy:</strong> 100% Client-side. Camera feed is never stored or uploaded
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.78rem' }}>
              <Wind size={15} color="#d4af37" />
              <span style={{ color: 'rgba(255, 255, 255, 0.9)' }}>
                <strong>Smoke Ritual:</strong> Gesture-steered vapour, swirl vortices & expanding rings
              </span>
            </div>
          </div>

          {/* Creator Attribution */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingTop: 14,
              borderTop: '1px solid rgba(255, 255, 255, 0.08)',
              fontSize: '0.8rem'
            }}
          >
            <span style={{ color: 'rgba(255, 255, 255, 0.5)' }}>Author & Creator</span>
            <span style={{ color: '#ffffff', fontWeight: 700, letterSpacing: '0.02em' }}>
              Created by Saidarshan.K
            </span>
          </div>
        </MagicCard>
      </div>
    </div>
  );
};
