import React from 'react';
import { MagicCard } from './magicui/MagicCard';
import { ShimmerButton } from './magicui/ShimmerButton';
import { AnimatedGradientText } from './magicui/AnimatedGradientText';
import { BlurFade } from './magicui/BlurFade';
import { Camera, Sparkles, Wind, Hand, Shield } from 'lucide-react';

interface WelcomeScreenProps {
  onStart: () => void;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onStart }) => {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Welcome to VapeAR"
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 50,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(5, 5, 8, 0.88)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        padding: '20px',
        fontFamily: 'var(--font-sans)'
      }}
    >
      <BlurFade duration={0.4} yOffset={12}>
        <div style={{ width: '100%', maxWidth: 460 }}>
          <MagicCard
            spotlightColor="rgba(233, 30, 99, 0.24)"
            borderColor="rgba(255, 255, 255, 0.16)"
            style={{
              padding: '36px 32px',
              borderRadius: 28,
              textAlign: 'center',
              backgroundColor: 'rgba(12, 14, 23, 0.92)',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.7), 0 0 40px rgba(233, 30, 99, 0.1)'
            }}
          >
            {/* Top Badge & Creator Credit */}
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '4px 12px',
                borderRadius: 20,
                backgroundColor: 'rgba(233, 30, 99, 0.12)',
                border: '1px solid rgba(233, 30, 99, 0.3)',
                marginBottom: 16
              }}
            >
              <Sparkles size={12} color="var(--accent-light)" />
              <span
                style={{
                  fontSize: '0.68rem',
                  fontWeight: 700,
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  color: 'var(--accent-light)'
                }}
              >
                AI-POWERED AR
              </span>
              <span style={{ color: 'rgba(255, 255, 255, 0.3)' }}>•</span>
              <span
                style={{
                  fontSize: '0.72rem',
                  fontWeight: 600,
                  color: '#ffffff'
                }}
              >
                Created by Saidarshan.K
              </span>
            </div>

            {/* Main Headline */}
            <h1
              style={{
                margin: '0 0 8px',
                fontSize: '2.1rem',
                fontWeight: 800,
                letterSpacing: '0.03em',
                lineHeight: 1.15
              }}
            >
              <AnimatedGradientText
                colors={['#ffffff', '#ff80ab', '#f48fb1', '#ffffff', '#e0e0e0']}
                duration="5s"
              >
                VapeAR
              </AnimatedGradientText>
            </h1>

            <div
              style={{
                fontSize: '0.86rem',
                fontWeight: 600,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                color: 'var(--cyan)',
                marginBottom: 16
              }}
            >
              AI-Powered AR Experience
            </div>

            <p
              style={{
                color: 'rgba(255, 255, 255, 0.76)',
                fontSize: '0.88rem',
                lineHeight: 1.55,
                margin: '0 auto 24px',
                maxWidth: 380
              }}
            >
              Step into an augmented reality lounge. Use natural hand gestures to grab the virtual wand, bring it to your lips to inhale, and exhale volumetric billowing vapour clouds.
            </p>

            {/* Highlights Grid */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: 10,
                marginBottom: 28,
                textAlign: 'center'
              }}
            >
              <div
                style={{
                  padding: '12px 8px',
                  backgroundColor: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.07)',
                  borderRadius: 14
                }}
              >
                <Hand size={18} color="var(--cyan)" style={{ marginBottom: 4 }} />
                <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#ffffff' }}>
                  Hand Tracking
                </div>
                <div style={{ fontSize: '0.64rem', color: 'rgba(255, 255, 255, 0.5)' }}>
                  Pinch & Grab
                </div>
              </div>

              <div
                style={{
                  padding: '12px 8px',
                  backgroundColor: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.07)',
                  borderRadius: 14
                }}
              >
                <Sparkles size={18} color="var(--gold)" style={{ marginBottom: 4 }} />
                <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#ffffff' }}>
                  Face Vision
                </div>
                <div style={{ fontSize: '0.64rem', color: 'rgba(255, 255, 255, 0.5)' }}>
                  Lip Detection
                </div>
              </div>

              <div
                style={{
                  padding: '12px 8px',
                  backgroundColor: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.07)',
                  borderRadius: 14
                }}
              >
                <Wind size={18} color="var(--accent-light)" style={{ marginBottom: 4 }} />
                <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#ffffff' }}>
                  Smoke Physics
                </div>
                <div style={{ fontSize: '0.64rem', color: 'rgba(255, 255, 255, 0.5)' }}>
                  Volumetric Clouds
                </div>
              </div>
            </div>

            {/* Primary Action Button */}
            <div style={{ marginBottom: 16 }}>
              <ShimmerButton
                onClick={onStart}
                title="Start VapeAR Experience"
                aria-label="Start VapeAR Experience"
                shimmerColor="rgba(255, 64, 129, 0.75)"
                style={{
                  width: '100%',
                  padding: '14px 28px',
                  fontSize: '0.94rem',
                  letterSpacing: '0.05em',
                  fontWeight: 700,
                  borderRadius: 18
                }}
              >
                <Camera size={18} />
                <span>START EXPERIENCE</span>
              </ShimmerButton>
            </div>

            {/* Privacy & Camera Notice */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                color: 'rgba(255, 255, 255, 0.45)',
                fontSize: '0.72rem',
                lineHeight: 1.4
              }}
            >
              <Shield size={13} color="rgba(255, 255, 255, 0.6)" />
              <span>Camera required for on-device tracking. No video is recorded or stored.</span>
            </div>
          </MagicCard>
        </div>
      </BlurFade>
    </div>
  );
};
