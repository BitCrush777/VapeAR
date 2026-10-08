import React from 'react';

interface BlurFadeProps {
  children: React.ReactNode;
  delay?: number;
  duration?: number;
  yOffset?: number;
  blur?: string;
  style?: React.CSSProperties;
  className?: string;
}

export const BlurFade: React.FC<BlurFadeProps> = ({
  children,
  delay = 0,
  duration = 0.35,
  yOffset = 8,
  blur = '8px',
  style = {}
}) => {
  return (
    <div
      style={{
        animation: `blur-fade-in ${duration}s cubic-bezier(0.16, 1, 0.3, 1) ${delay}s both`,
        willChange: 'transform, opacity, filter',
        ...style
      }}
    >
      <style>{`
        @keyframes blur-fade-in {
          from {
            opacity: 0;
            filter: blur(${blur});
            transform: translateY(${yOffset}px);
          }
          to {
            opacity: 1;
            filter: blur(0);
            transform: translateY(0);
          }
        }
      `}</style>
      {children}
    </div>
  );
};
