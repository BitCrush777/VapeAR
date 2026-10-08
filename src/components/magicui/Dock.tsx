import React, { useState } from 'react';

export interface DockItem {
  id: string;
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  isActive?: boolean;
  activeColor?: string;
  badge?: string | number;
}

interface DockProps {
  items: DockItem[];
  style?: React.CSSProperties;
}

export const Dock: React.FC<DockProps> = ({ items, style = {} }) => {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  return (
    <nav
      aria-label="Experience Controls"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        padding: '6px 12px',
        backgroundColor: 'rgba(10, 11, 18, 0.76)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.12)',
        borderRadius: 28,
        boxShadow: '0 12px 36px rgba(0, 0, 0, 0.5), 0 0 1px 1px rgba(255, 255, 255, 0.05)',
        pointerEvents: 'auto',
        ...style
      }}
    >
      {items.map((item) => {
        const isHovered = hoveredId === item.id;
        const isActive = item.isActive;
        const color = isActive ? (item.activeColor || '#e91e63') : isHovered ? '#ffffff' : '#9ea2ad';

        return (
          <div key={item.id} style={{ position: 'relative' }}>
            <button
              onClick={item.onClick}
              onMouseEnter={() => setHoveredId(item.id)}
              onMouseLeave={() => setHoveredId(null)}
              onFocus={() => setHoveredId(item.id)}
              onBlur={() => setHoveredId(null)}
              aria-label={item.label}
              style={{
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: isActive
                  ? 'rgba(255, 255, 255, 0.12)'
                  : isHovered
                  ? 'rgba(255, 255, 255, 0.08)'
                  : 'transparent',
                border: isActive
                  ? `1px solid ${item.activeColor || '#e91e63'}88`
                  : '1px solid transparent',
                color,
                cursor: 'pointer',
                transform: isHovered ? 'scale(1.14) translateY(-2px)' : 'scale(1)',
                transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                outline: 'none'
              }}
            >
              {item.icon}

              {/* Active Dot Indicator */}
              {isActive && (
                <span
                  style={{
                    position: 'absolute',
                    bottom: 3,
                    width: 4,
                    height: 4,
                    borderRadius: '50%',
                    backgroundColor: item.activeColor || '#e91e63',
                    boxShadow: `0 0 6px ${item.activeColor || '#e91e63'}`
                  }}
                />
              )}
            </button>

            {/* Floating Tooltip */}
            {isHovered && (
              <div
                role="tooltip"
                style={{
                  position: 'absolute',
                  bottom: '100%',
                  left: '50%',
                  transform: 'translateX(-50%) translateY(-8px)',
                  padding: '4px 8px',
                  backgroundColor: 'rgba(15, 17, 26, 0.92)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.14)',
                  borderRadius: 6,
                  color: '#ffffff',
                  fontSize: '0.7rem',
                  fontWeight: 500,
                  whiteSpace: 'nowrap',
                  pointerEvents: 'none',
                  boxShadow: '0 4px 14px rgba(0, 0, 0, 0.4)',
                  animation: 'blur-fade-in 0.15s ease-out',
                  zIndex: 100
                }}
              >
                {item.label}
              </div>
            )}
          </div>
        );
      })}
    </nav>
  );
};
