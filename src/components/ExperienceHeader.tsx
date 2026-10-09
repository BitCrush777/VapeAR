import React from 'react';
import type { AppState, ActiveObject } from '../types/hookah';
import { AnimatedGradientText } from './magicui/AnimatedGradientText';
import { Camera, Sliders, HelpCircle } from 'lucide-react';

interface ExperienceHeaderProps {
  appState: AppState;
  isDebugMode: boolean;
  onToggleDebug: () => void;
  showGuide: boolean;
  onToggleGuide: () => void;
  activeObject?: ActiveObject;
  onToggleActiveObject?: () => void;
}

export const ExperienceHeader: React.FC<ExperienceHeaderProps> = ({
  appState,
  isDebugMode,
  onToggleDebug,
  showGuide,
  onToggleGuide,
  activeObject = 'hookah',
  onToggleActiveObject
}) => {

  const getSystemStatusMeta = (state: AppState) => {
    const isCigar = activeObject === 'cigar';
    switch (state) {
      case 'IDLE':
        return { label: 'AR READY', color: 'var(--cyan)', pulse: true };
      case 'HAND_DETECTED':
        return { label: 'HAND DETECTED', color: '#29b6f6', pulse: true };
      case 'PIPE_GRABBED':
        return { label: isCigar ? 'CIGAR HELD' : 'PIPE GRABBED', color: '#ab47bc', pulse: true };
      case 'PIPE_AT_MOUTH':
        return { label: isCigar ? 'AT LIPS' : 'ALIGNED', color: '#ffa726', pulse: true };
      case 'SIP_DETECTED':
        return { label: isCigar ? 'DRAWING PUFF' : 'INHALING', color: '#00e676', pulse: true };
      case 'VAPOUR':
        return { label: isCigar ? 'CIGAR SMOKE' : 'EXHALING', color: '#ff1744', pulse: true };
      case 'SMOKE_RITUAL':
        return { label: 'SMOKE RITUAL', color: '#d4af37', pulse: true };
      default:
        return { label: 'AR READY', color: '#9e9e9e', pulse: false };
    }
  };

  const statusMeta = getSystemStatusMeta(appState);

  return (
    <header
      className="responsive-header"
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        padding: '14px 22px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        zIndex: 25,
        pointerEvents: 'none',
        fontFamily: 'var(--font-sans)',
        boxSizing: 'border-box'
      }}
    >
      {/* Top Left: Minimal Title & Attribution */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
          pointerEvents: 'auto'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <h1
            className="responsive-title"
            style={{
              margin: 0,
              fontSize: '1.25rem',
              fontWeight: 800,
              letterSpacing: '0.04em',
              lineHeight: 1.1
            }}
          >
            <AnimatedGradientText
              colors={['#ffffff', '#ff80ab', '#f48fb1', '#ffffff', '#e0e0e0']}
              duration="5s"
            >
              VapeAR
            </AnimatedGradientText>
          </h1>
          <span
            style={{
              fontSize: '0.62rem',
              fontWeight: 700,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: 'var(--accent-light)',
              backgroundColor: 'rgba(233, 30, 99, 0.12)',
              border: '1px solid rgba(233, 30, 99, 0.28)',
              padding: '2px 7px',
              borderRadius: 10
            }}
          >
            AI-POWERED AR EXPERIENCE
          </span>
        </div>

        <div
          style={{
            fontSize: '0.7rem',
            color: 'rgba(255, 255, 255, 0.5)',
            fontWeight: 500
          }}
        >
          Created by <strong style={{ color: '#ffffff', fontWeight: 600 }}>Saidarshan.K</strong>
        </div>
      </div>

      {/* Top Right: System Status Capsule & Quick Actions */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          pointerEvents: 'auto'
        }}
      >
        {/* Dynamic Status Capsule */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '6px 14px',
            backgroundColor: 'rgba(11, 13, 20, 0.74)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: 22,
            boxShadow: '0 4px 18px rgba(0, 0, 0, 0.45)'
          }}
        >
          {/* CAMERA LIVE */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Camera size={12} color="rgba(255, 255, 255, 0.75)" />
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                backgroundColor: '#00e676',
                boxShadow: '0 0 6px #00e676'
              }}
            />
            <span
              style={{
                fontSize: '0.7rem',
                fontWeight: 600,
                letterSpacing: '0.04em',
                color: 'rgba(255, 255, 255, 0.85)'
              }}
            >
              CAMERA
            </span>
          </div>

          <div
            style={{
              width: 1,
              height: 11,
              backgroundColor: 'rgba(255, 255, 255, 0.12)'
            }}
          />

          {/* DYNAMIC SYSTEM / TRACKING STATE */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                backgroundColor: statusMeta.color,
                boxShadow: `0 0 8px ${statusMeta.color}`
              }}
            />
            <span
              style={{
                fontSize: '0.7rem',
                fontWeight: 700,
                letterSpacing: '0.05em',
                color: statusMeta.color
              }}
            >
              {statusMeta.label}
            </span>
          </div>
        </div>

        {/* Cigar Object Switcher Button (Hookah vs Cigar) */}
        {onToggleActiveObject && (
          <button
            onClick={onToggleActiveObject}
            title={activeObject === 'cigar' ? 'Switch to Hookah' : 'Switch to Cigar'}
            aria-label={activeObject === 'cigar' ? 'Switch to Hookah' : 'Switch to Cigar'}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 34,
              height: 34,
              borderRadius: 17,
              backgroundColor: activeObject === 'cigar' ? 'rgba(212, 175, 55, 0.28)' : 'rgba(11, 13, 20, 0.74)',
              border: `1px solid ${activeObject === 'cigar' ? '#d4af37' : 'rgba(255, 255, 255, 0.1)'}`,
              color: activeObject === 'cigar' ? '#ffd700' : 'rgba(255, 255, 255, 0.75)',
              boxShadow: activeObject === 'cigar' ? '0 0 12px rgba(212, 175, 55, 0.35)' : 'none',
              cursor: 'pointer',
              backdropFilter: 'blur(14px)',
              WebkitBackdropFilter: 'blur(14px)',
              transition: 'all 0.22s cubic-bezier(0.16, 1, 0.3, 1)',
              outline: 'none',
              padding: 0
            }}
          >
            {/* Recognizable Cigar Silhouette Icon */}
            <svg
              width="17"
              height="17"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              style={{
                transform: 'rotate(-32deg)',
                transformOrigin: 'center'
              }}
            >
              {/* Cigar Body with rounded head */}
              <rect
                x="2.5"
                y="8"
                width="19"
                height="8"
                rx="4"
                fill="currentColor"
                fillOpacity={activeObject === 'cigar' ? '1' : '0.82'}
              />
              {/* Decorative Band Ring */}
              <rect
                x="7.5"
                y="7.5"
                width="3.5"
                height="9"
                rx="1"
                fill={activeObject === 'cigar' ? '#ffe082' : '#d4af37'}
              />
              {/* Defined Foot cut line & ember glow */}
              <line
                x1="21.5"
                y1="9.5"
                x2="21.5"
                y2="14.5"
                stroke={activeObject === 'cigar' ? '#ff5722' : 'rgba(255, 255, 255, 0.5)'}
                strokeWidth="1.8"
                strokeLinecap="round"
              />
            </svg>
          </button>
        )}

        {/* Quick Guide Toggle */}
        <button
          onClick={onToggleGuide}
          title={showGuide ? 'Hide Guide' : 'Show Guide'}
          aria-label={showGuide ? 'Hide Guide' : 'Show Guide'}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 34,
            height: 34,
            borderRadius: 17,
            backgroundColor: showGuide ? 'rgba(0, 229, 255, 0.2)' : 'rgba(11, 13, 20, 0.74)',
            border: `1px solid ${showGuide ? 'var(--cyan)' : 'rgba(255, 255, 255, 0.1)'}`,
            color: showGuide ? 'var(--cyan)' : 'rgba(255, 255, 255, 0.7)',
            cursor: 'pointer',
            backdropFilter: 'blur(14px)',
            transition: 'all 0.2s ease',
            outline: 'none'
          }}
        >
          <HelpCircle size={14} />
        </button>

        {/* Telemetry/Debug Toggle Button */}
        <button
          onClick={onToggleDebug}
          title={isDebugMode ? 'Hide Telemetry' : 'Show Telemetry'}
          aria-label={isDebugMode ? 'Hide Telemetry' : 'Show Telemetry'}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 34,
            height: 34,
            borderRadius: 17,
            backgroundColor: isDebugMode ? 'rgba(233, 30, 99, 0.25)' : 'rgba(11, 13, 20, 0.74)',
            border: `1px solid ${isDebugMode ? 'var(--accent)' : 'rgba(255, 255, 255, 0.1)'}`,
            color: isDebugMode ? '#ff80ab' : 'rgba(255, 255, 255, 0.7)',
            cursor: 'pointer',
            backdropFilter: 'blur(14px)',
            transition: 'all 0.2s ease',
            outline: 'none'
          }}
        >
          <Sliders size={14} />
        </button>
      </div>
    </header>
  );
};
