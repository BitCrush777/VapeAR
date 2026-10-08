import React from 'react';

interface AnimatedGridPatternProps {
  className?: string;
  style?: React.CSSProperties;
}

export const AnimatedGridPattern: React.FC<AnimatedGridPatternProps> = ({ style = {} }) => {
  return (
    <div
      aria-hidden="true"
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 1,
        overflow: 'hidden',
        opacity: 0.15,
        ...style
      }}
    >
      {/* SVG Fine Grid */}
      <svg
        width="100%"
        height="100%"
        xmlns="http://www.w3.org/2000/svg"
        style={{
          width: '100%',
          height: '100%',
          animation: 'grid-breathe 8s ease-in-out infinite'
        }}
      >
        <defs>
          <pattern id="ar-grid-pattern" width="60" height="60" patternUnits="userSpaceOnUse">
            <path
              d="M 60 0 L 0 0 0 60"
              fill="none"
              stroke="rgba(255, 255, 255, 0.4)"
              strokeWidth="0.5"
            />
            <circle cx="60" cy="0" r="1" fill="rgba(233, 30, 99, 0.5)" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#ar-grid-pattern)" />
      </svg>

      {/* Cinematic Viewfinder Corner Brackets */}
      {/* Top Left */}
      <div
        style={{
          position: 'absolute',
          top: 24,
          left: 24,
          width: 32,
          height: 32,
          borderTop: '1.5px solid rgba(255, 255, 255, 0.35)',
          borderLeft: '1.5px solid rgba(255, 255, 255, 0.35)'
        }}
      />
      {/* Top Right */}
      <div
        style={{
          position: 'absolute',
          top: 24,
          right: 24,
          width: 32,
          height: 32,
          borderTop: '1.5px solid rgba(255, 255, 255, 0.35)',
          borderRight: '1.5px solid rgba(255, 255, 255, 0.35)'
        }}
      />
      {/* Bottom Left */}
      <div
        style={{
          position: 'absolute',
          bottom: 24,
          left: 24,
          width: 32,
          height: 32,
          borderBottom: '1.5px solid rgba(255, 255, 255, 0.35)',
          borderLeft: '1.5px solid rgba(255, 255, 255, 0.35)'
        }}
      />
      {/* Bottom Right */}
      <div
        style={{
          position: 'absolute',
          bottom: 24,
          right: 24,
          width: 32,
          height: 32,
          borderBottom: '1.5px solid rgba(255, 255, 255, 0.35)',
          borderRight: '1.5px solid rgba(255, 255, 255, 0.35)'
        }}
      />
    </div>
  );
};
