import React, { useRef, useState, useCallback } from 'react';

interface MagicCardProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  spotlightColor?: string;
  borderColor?: string;
  onClick?: () => void;
}

export const MagicCard: React.FC<MagicCardProps> = ({
  children,
  style = {},
  spotlightColor = 'rgba(233, 30, 99, 0.16)',
  borderColor = 'rgba(255, 255, 255, 0.14)',
  onClick
}) => {
  const cardRef = useRef<HTMLDivElement | null>(null);
  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null);
  const [isHovered, setIsHovered] = useState(false);

  const handlePointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    setMousePos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
  }, []);

  return (
    <div
      ref={cardRef}
      onPointerMove={handlePointerMove}
      onPointerEnter={() => setIsHovered(true)}
      onPointerLeave={() => {
        setIsHovered(false);
        setMousePos(null);
      }}
      onClick={onClick}
      style={{
        position: 'relative',
        borderRadius: 20,
        overflow: 'hidden',
        backgroundColor: 'rgba(12, 13, 19, 0.72)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        border: `1px solid ${isHovered ? borderColor : 'rgba(255, 255, 255, 0.08)'}`,
        boxShadow: isHovered
          ? '0 12px 36px rgba(0, 0, 0, 0.55), 0 0 24px rgba(233, 30, 99, 0.08)'
          : '0 8px 28px rgba(0, 0, 0, 0.4)',
        transition: 'border-color 0.3s ease, box-shadow 0.3s ease, transform 0.2s ease',
        ...style
      }}
    >
      {/* Dynamic Cursor Spotlight Layer */}
      {mousePos && isHovered && (
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            inset: 0,
            pointerEvents: 'none',
            borderRadius: 'inherit',
            background: `radial-gradient(280px circle at ${mousePos.x}px ${mousePos.y}px, ${spotlightColor}, transparent 80%)`,
            transition: 'opacity 0.2s ease',
            opacity: 1
          }}
        />
      )}

      {/* Card Content */}
      <div style={{ position: 'relative', zIndex: 1 }}>{children}</div>
    </div>
  );
};
