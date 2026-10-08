import React, { useState } from 'react';
import { MagicCard } from './magicui/MagicCard';
import { ShimmerButton } from './magicui/ShimmerButton';
import { BlurFade } from './magicui/BlurFade';
import { CameraOff, RefreshCw, Shield, AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react';

interface CameraPermissionProps {
  errorMsg: string;
  onRetry: () => void;
  isDebugMode?: boolean;
}

export const CameraPermission: React.FC<CameraPermissionProps> = ({
  errorMsg,
  onRetry,
  isDebugMode = false
}) => {
  const [showDiagnostics, setShowDiagnostics] = useState(false);

  const isPermissionDenied =
    errorMsg.toLowerCase().includes('permission') ||
    errorMsg.toLowerCase().includes('denied') ||
    errorMsg.toLowerCase().includes('notallowed');

  return (
    <div
      role="alert"
      aria-label="Camera Access Notice"
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 45,
        display: 'flex',
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
        <div style={{ width: '100%', maxWidth: 410 }}>
          <MagicCard
            spotlightColor="rgba(255, 23, 68, 0.22)"
            borderColor="rgba(255, 23, 68, 0.35)"
            style={{
              padding: '34px 28px',
              borderRadius: 28,
              textAlign: 'center',
              backgroundColor: 'rgba(14, 15, 24, 0.94)',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.7)'
            }}
          >
            {/* Icon Badge */}
            <div
              style={{
                width: 58,
                height: 58,
                margin: '0 auto 18px',
                borderRadius: 29,
                backgroundColor: 'rgba(255, 23, 68, 0.12)',
                border: '1px solid rgba(255, 23, 68, 0.32)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ff5252'
              }}
            >
              {isPermissionDenied ? <CameraOff size={26} /> : <AlertTriangle size={26} />}
            </div>

            {/* Brand Wordmark */}
            <div
              style={{
                fontSize: '1rem',
                fontWeight: 800,
                letterSpacing: '0.04em',
                color: '#ffffff',
                marginBottom: 6
              }}
            >
              VapeAR
            </div>

            <div
              style={{
                fontSize: '0.68rem',
                fontWeight: 700,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: '#ff5252',
                marginBottom: 4
              }}
            >
              {isPermissionDenied ? 'CAMERA ACCESS REQUIRED' : 'AR INITIALIZATION FAILED'}
            </div>

            <h2
              style={{
                margin: '0 0 10px',
                fontSize: '1.3rem',
                fontWeight: 800,
                color: '#ffffff'
              }}
            >
              {isPermissionDenied ? 'Camera Access Required' : 'Unable to Start AR'}
            </h2>

            <p
              style={{
                color: 'rgba(255, 255, 255, 0.75)',
                fontSize: '0.84rem',
                lineHeight: 1.5,
                margin: '0 0 20px'
              }}
            >
              {isPermissionDenied
                ? 'Your camera is required for real-time hand gestures and mouth detection in augmented reality. Please enable camera permission in your browser.'
                : 'A device or graphics initialization error occurred while launching the spatial AR pipeline.'}
            </p>

            {/* Diagnostics accordion (visible if in debug mode or toggled) */}
            {isDebugMode && errorMsg && (
              <div style={{ marginBottom: 18, textAlign: 'left' }}>
                <button
                  onClick={() => setShowDiagnostics((prev) => !prev)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    width: '100%',
                    padding: '8px 12px',
                    backgroundColor: 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: 8,
                    color: 'rgba(255, 255, 255, 0.7)',
                    fontSize: '0.72rem',
                    cursor: 'pointer',
                    outline: 'none'
                  }}
                >
                  <span>Diagnostic Details</span>
                  {showDiagnostics ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>
                {showDiagnostics && (
                  <div
                    style={{
                      marginTop: 6,
                      padding: '8px 12px',
                      backgroundColor: 'rgba(0, 0, 0, 0.4)',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      borderRadius: 8,
                      fontSize: '0.7rem',
                      color: 'rgba(255, 255, 255, 0.55)',
                      fontFamily: 'var(--font-mono, monospace)',
                      wordBreak: 'break-word',
                      maxHeight: 100,
                      overflowY: 'auto'
                    }}
                  >
                    {errorMsg}
                  </div>
                )}
              </div>
            )}

            {/* Action CTA */}
            <div style={{ marginBottom: 16 }}>
              <ShimmerButton
                onClick={onRetry}
                shimmerColor="rgba(255, 64, 129, 0.75)"
                title={isPermissionDenied ? 'Enable Camera & Retry' : 'Try Again'}
                aria-label={isPermissionDenied ? 'Enable Camera & Retry' : 'Try Again'}
                style={{
                  width: '100%',
                  padding: '13px 24px',
                  fontSize: '0.88rem',
                  fontWeight: 700,
                  borderRadius: 16
                }}
              >
                <RefreshCw size={15} />
                <span>{isPermissionDenied ? 'ENABLE CAMERA & RETRY' : 'TRY AGAIN'}</span>
              </ShimmerButton>
            </div>

            {/* Privacy Note */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                color: 'rgba(255, 255, 255, 0.45)',
                fontSize: '0.72rem'
              }}
            >
              <Shield size={12} color="rgba(255, 255, 255, 0.6)" />
              <span>Camera frames are processed 100% locally on your device</span>
            </div>
          </MagicCard>
        </div>
      </BlurFade>
    </div>
  );
};
