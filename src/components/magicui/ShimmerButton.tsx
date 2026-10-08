import React from 'react';

interface ShimmerButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  style?: React.CSSProperties;
  shimmerColor?: string;
  shimmerDuration?: string;
  borderRadius?: string;
  disabled?: boolean;
  title?: string;
  'aria-label'?: string;
}

export const ShimmerButton: React.FC<ShimmerButtonProps> = ({
  children,
  onClick,
  style = {},
  shimmerColor = 'rgba(255, 64, 129, 0.65)',
  shimmerDuration = '3s',
  borderRadius = '100px',
  disabled = false,
  title,
  'aria-label': ariaLabel
}) => {
  const [isHovered, setIsHovered] = React.useState(false);
  const [isActive, setIsActive] = React.useState(false);

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      aria-label={ariaLabel || title}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        setIsActive(false);
      }}
      onMouseDown={() => setIsActive(true)}
      onMouseUp={() => setIsActive(false)}
      style={{
        position: 'relative',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        padding: '9px 18px',
        background: 'linear-gradient(135deg, rgba(23, 14, 25, 0.9), rgba(12, 13, 20, 0.95))',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        border: '1px solid rgba(255, 255, 255, 0.14)',
        borderRadius,
        color: '#ffffff',
        fontSize: '0.82rem',
        fontWeight: 600,
        fontFamily: 'inherit',
        cursor: disabled ? 'not-allowed' : 'pointer',
        overflow: 'hidden',
        boxShadow: isHovered
          ? '0 6px 24px rgba(233, 30, 99, 0.35), 0 0 12px rgba(255, 255, 255, 0.1)'
          : '0 4px 16px rgba(0, 0, 0, 0.45)',
        transform: isActive ? 'scale(0.97)' : isHovered ? 'translateY(-1px)' : 'none',
        transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
        opacity: disabled ? 0.6 : 1,
        outline: 'none',
        ...style
      }}
    >
      {/* Sweeping Shimmer Sheen Layer */}
      <span
        aria-hidden="true"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: `linear-gradient(90deg, transparent 0%, ${shimmerColor} 50%, transparent 100%)`,
          width: '100%',
          transform: 'translateX(-100%)',
          animation: `shimmer-sweep ${shimmerDuration} infinite ease-in-out`,
          pointerEvents: 'none',
          opacity: isHovered ? 0.85 : 0.45
        }}
      />

      {/* Button Content */}
      <span style={{ position: 'relative', zIndex: 1, display: 'inline-flex', alignItems: 'center', gap: 7 }}>
        {children}
      </span>
    </button>
  );
};
