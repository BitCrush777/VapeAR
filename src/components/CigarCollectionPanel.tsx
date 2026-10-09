// VapeAR Premium Cigar Collection Panel — Created by Saidarshan.K
// Floating Glassmorphism Customization & 3D Inspection UI for Cigars, Humidor Box, and Guillotine Cutter

import React, { useState, useEffect } from 'react';
import {
  CIGAR_VARIANTS,
  type CigarVariantId,
  type CigarVariantConfig
} from '../services/cigarCollection/cigarVariants';
import {
  CigarCollectionManager,
  type CigarCollectionState
} from '../services/cigarCollection/CigarCollectionManager';
import {
  Sparkles,
  Box,
  RotateCcw,
  RotateCw,
  X,
  Check,
  Eye,
  EyeOff,
  Maximize2
} from 'lucide-react';

interface CigarCollectionPanelProps {
  isOpen: boolean;
  onClose: () => void;
  cigarManager: CigarCollectionManager | null;
}

export const CigarCollectionPanel: React.FC<CigarCollectionPanelProps> = ({
  isOpen,
  onClose,
  cigarManager
}) => {
  const [managerState, setManagerState] = useState<CigarCollectionState | null>(() =>
    cigarManager ? cigarManager.getState() : null
  );

  // Sync state periodically from manager
  useEffect(() => {
    if (!isOpen || !cigarManager) return;

    const interval = setInterval(() => {
      setManagerState(cigarManager.getState());
    }, 120);

    return () => clearInterval(interval);
  }, [isOpen, cigarManager]);

  if (!isOpen) return null;

  const currentVariant = managerState?.currentVariant || 'maduro';
  const isBoxOpen = managerState?.isBoxOpen ?? true;
  const isCutterOpen = managerState?.isCutterOpen ?? true;
  const isCigarSelected = managerState?.isCigarSelected ?? false;
  const isAutoSpin = managerState?.isAutoSpin ?? false;
  const isBoxVisible = managerState?.isBoxVisible ?? true;
  const isCutterVisible = managerState?.isCutterVisible ?? true;

  const handleSelectVariant = (id: CigarVariantId) => {
    if (!cigarManager) return;
    cigarManager.setVariant(id);
    setManagerState(cigarManager.getState());
  };

  const handleToggleBox = () => {
    if (!cigarManager) return;
    cigarManager.toggleBox();
    setManagerState(cigarManager.getState());
  };

  const handleToggleCutter = () => {
    if (!cigarManager) return;
    cigarManager.toggleCutter();
    setManagerState(cigarManager.getState());
  };

  const handleToggleCigarSelect = () => {
    if (!cigarManager) return;
    cigarManager.selectCigar(!isCigarSelected);
    setManagerState(cigarManager.getState());
  };

  const handleRotate = (yaw: number, pitch: number) => {
    if (!cigarManager) return;
    cigarManager.rotateInspect(yaw, pitch);
    setManagerState(cigarManager.getState());
  };

  const handleToggleAutoSpin = () => {
    if (!cigarManager) return;
    cigarManager.toggleAutoSpin();
    setManagerState(cigarManager.getState());
  };

  const handleResetCigar = () => {
    if (!cigarManager) return;
    cigarManager.resetDisplayCigar();
    setManagerState(cigarManager.getState());
  };

  const handleToggleBoxVisible = () => {
    if (!cigarManager) return;
    cigarManager.setBoxVisible(!isBoxVisible);
    setManagerState(cigarManager.getState());
  };

  const handleToggleCutterVisible = () => {
    if (!cigarManager) return;
    cigarManager.setCutterVisible(!isCutterVisible);
    setManagerState(cigarManager.getState());
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="cigar-panel-title"
      style={{
        position: 'fixed',
        zIndex: 50,
        right: '1rem',
        top: '4.8rem',
        bottom: '5.5rem',
        width: 'min(92vw, 380px)',
        display: 'flex',
        flexDirection: 'column',
        borderRadius: '1.25rem',
        background: 'rgba(12, 14, 20, 0.88)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        border: '1px solid rgba(212, 175, 55, 0.35)',
        boxShadow: '0 24px 64px -12px rgba(0, 0, 0, 0.85), 0 0 32px rgba(212, 175, 55, 0.15)',
        color: '#f3f4f6',
        overflow: 'hidden',
        animation: 'cigarPanelSlideIn 0.28s cubic-bezier(0.16, 1, 0.3, 1)'
      }}
    >
      <style>{`
        @keyframes cigarPanelSlideIn {
          from { opacity: 0; transform: translateX(24px) scale(0.97); }
          to { opacity: 1; transform: translateX(0) scale(1); }
        }
      `}</style>

      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '1rem 1.25rem',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          background: 'linear-gradient(180deg, rgba(212, 175, 55, 0.08) 0%, transparent 100%)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <div
            style={{
              width: '2.1rem',
              height: '2.1rem',
              borderRadius: '0.65rem',
              background: 'linear-gradient(135deg, #d4af37 0%, #aa8218 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 8px rgba(212, 175, 55, 0.3)'
            }}
          >
            <Sparkles size={16} color="#000" />
          </div>
          <div>
            <h2
              id="cigar-panel-title"
              style={{
                margin: 0,
                fontSize: '1rem',
                fontWeight: 700,
                letterSpacing: '0.04em',
                background: 'linear-gradient(90deg, #fff 0%, #d4af37 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}
            >
              Cigar Collection
            </h2>
            <p style={{ margin: 0, fontSize: '0.72rem', color: '#9ca3af' }}>
              Artisanal Cigars · Humidor · Cutter
            </p>
          </div>
        </div>

        <button
          onClick={onClose}
          aria-label="Close Cigar Collection"
          style={{
            background: 'rgba(255, 255, 255, 0.06)',
            border: 'none',
            borderRadius: '50%',
            width: '2rem',
            height: '2rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: '#9ca3af',
            transition: 'all 0.15s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.14)';
            e.currentTarget.style.color = '#fff';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)';
            e.currentTarget.style.color = '#9ca3af';
          }}
        >
          <X size={16} />
        </button>
      </div>

      {/* ── Scrollable Body ────────────────────────────────────────────────── */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '1rem 1.1rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.25rem'
        }}
      >
        {/* SECTION 1: CIGAR VARIANTS */}
        <div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '0.65rem'
            }}
          >
            <span
              style={{
                fontSize: '0.75rem',
                fontWeight: 600,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: '#d4af37'
              }}
            >
              Cigar Style
            </span>
            <span style={{ fontSize: '0.7rem', color: '#9ca3af' }}>3 Handcrafted Blends</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {Object.values(CIGAR_VARIANTS).map((cfg: CigarVariantConfig) => {
              const isSelected = currentVariant === cfg.id;
              const wrapperColorHex = '#' + cfg.wrapper.color.toString(16).padStart(6, '0');

              return (
                <button
                  key={cfg.id}
                  onClick={() => handleSelectVariant(cfg.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    padding: '0.65rem 0.85rem',
                    borderRadius: '0.85rem',
                    background: isSelected
                      ? 'linear-gradient(90deg, rgba(212, 175, 55, 0.16) 0%, rgba(212, 175, 55, 0.05) 100%)'
                      : 'rgba(255, 255, 255, 0.03)',
                    border: isSelected
                      ? '1px solid rgba(212, 175, 55, 0.55)'
                      : '1px solid rgba(255, 255, 255, 0.06)',
                    cursor: 'pointer',
                    textAlign: 'left',
                    color: '#fff',
                    transition: 'all 0.18s ease'
                  }}
                >
                  {/* Swatch Pill */}
                  <div
                    style={{
                      width: '1.25rem',
                      height: '2.5rem',
                      borderRadius: '0.5rem',
                      backgroundColor: wrapperColorHex,
                      border: '1px solid rgba(255, 255, 255, 0.25)',
                      boxShadow: `0 2px 6px ${wrapperColorHex}55`,
                      flexShrink: 0
                    }}
                  />

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                      }}
                    >
                      <span
                        style={{
                          fontSize: '0.85rem',
                          fontWeight: 600,
                          color: isSelected ? '#d4af37' : '#f3f4f6'
                        }}
                      >
                        {cfg.name}
                      </span>
                      {isSelected && <Check size={14} color="#d4af37" />}
                    </div>
                    <div
                      style={{
                        fontSize: '0.7rem',
                        color: '#9ca3af',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}
                    >
                      {cfg.gauge}
                    </div>
                    <div
                      style={{
                        fontSize: '0.68rem',
                        color: '#6b7280',
                        marginTop: '0.15rem'
                      }}
                    >
                      {cfg.subtitle}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* SECTION 2: LUXURY CIGAR BOX */}
        <div
          style={{
            background: 'rgba(255, 255, 255, 0.02)',
            borderRadius: '0.9rem',
            padding: '0.85rem',
            border: '1px solid rgba(255, 255, 255, 0.06)'
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '0.65rem'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <Box size={14} color="#d4af37" />
              <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#e5e7eb' }}>
                Luxury Humidor Box
              </span>
            </div>
            <span
              style={{
                fontSize: '0.68rem',
                padding: '0.15rem 0.45rem',
                borderRadius: '0.35rem',
                background: isBoxOpen ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                color: isBoxOpen ? '#34d399' : '#f87171'
              }}
            >
              {isBoxOpen ? 'Lid Open' : 'Lid Closed'}
            </span>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              onClick={handleToggleBox}
              style={{
                flex: 1,
                padding: '0.45rem 0.65rem',
                borderRadius: '0.6rem',
                background: 'rgba(212, 175, 55, 0.14)',
                border: '1px solid rgba(212, 175, 55, 0.35)',
                color: '#fef3c7',
                fontSize: '0.75rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              {isBoxOpen ? 'Close Lid' : 'Open Lid'}
            </button>
            <button
              onClick={handleToggleBoxVisible}
              title={isBoxVisible ? 'Hide Box' : 'Show Box'}
              style={{
                padding: '0.45rem 0.65rem',
                borderRadius: '0.6rem',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                color: '#9ca3af',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer'
              }}
            >
              {isBoxVisible ? <Eye size={14} /> : <EyeOff size={14} />}
            </button>
          </div>
        </div>

        {/* SECTION 3: CIGAR CUTTER */}
        <div
          style={{
            background: 'rgba(255, 255, 255, 0.02)',
            borderRadius: '0.9rem',
            padding: '0.85rem',
            border: '1px solid rgba(255, 255, 255, 0.06)'
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '0.65rem'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <Maximize2 size={14} color="#d4af37" />
              <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#e5e7eb' }}>
                Guillotine Cutter
              </span>
            </div>
            <span
              style={{
                fontSize: '0.68rem',
                padding: '0.15rem 0.45rem',
                borderRadius: '0.35rem',
                background: isCutterOpen ? 'rgba(59, 130, 246, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                color: isCutterOpen ? '#60a5fa' : '#fbbf24'
              }}
            >
              {isCutterOpen ? 'Blades Open' : 'Blades Closed'}
            </span>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              onClick={handleToggleCutter}
              style={{
                flex: 1,
                padding: '0.45rem 0.65rem',
                borderRadius: '0.6rem',
                background: 'rgba(212, 175, 55, 0.14)',
                border: '1px solid rgba(212, 175, 55, 0.35)',
                color: '#fef3c7',
                fontSize: '0.75rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              {isCutterOpen ? 'Close Blades' : 'Open Blades'}
            </button>
            <button
              onClick={handleToggleCutterVisible}
              title={isCutterVisible ? 'Hide Cutter' : 'Show Cutter'}
              style={{
                padding: '0.45rem 0.65rem',
                borderRadius: '0.6rem',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                color: '#9ca3af',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer'
              }}
            >
              {isCutterVisible ? <Eye size={14} /> : <EyeOff size={14} />}
            </button>
          </div>
        </div>

        {/* SECTION 4: 3D INSPECTION & MANIPULATION */}
        <div
          style={{
            background: 'rgba(255, 255, 255, 0.02)',
            borderRadius: '0.9rem',
            padding: '0.85rem',
            border: '1px solid rgba(255, 255, 255, 0.06)'
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '0.65rem'
            }}
          >
            <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#e5e7eb' }}>
              3D Cigar Inspection
            </span>
            <span
              style={{
                fontSize: '0.68rem',
                padding: '0.15rem 0.45rem',
                borderRadius: '0.35rem',
                background: isCigarSelected ? 'rgba(212, 175, 55, 0.2)' : 'rgba(255, 255, 255, 0.06)',
                color: isCigarSelected ? '#fef08a' : '#9ca3af'
              }}
            >
              {isCigarSelected ? 'Selected' : 'At Rest'}
            </span>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '0.45rem',
              marginBottom: '0.5rem'
            }}
          >
            <button
              onClick={handleToggleCigarSelect}
              style={{
                padding: '0.45rem',
                borderRadius: '0.55rem',
                background: isCigarSelected ? 'rgba(212, 175, 55, 0.22)' : 'rgba(255, 255, 255, 0.05)',
                border: isCigarSelected ? '1px solid #d4af37' : '1px solid rgba(255, 255, 255, 0.08)',
                color: isCigarSelected ? '#fff' : '#d1d5db',
                fontSize: '0.72rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              {isCigarSelected ? 'Deselect' : 'Select Cigar'}
            </button>

            <button
              onClick={handleToggleAutoSpin}
              style={{
                padding: '0.45rem',
                borderRadius: '0.55rem',
                background: isAutoSpin ? 'rgba(212, 175, 55, 0.22)' : 'rgba(255, 255, 255, 0.05)',
                border: isAutoSpin ? '1px solid #d4af37' : '1px solid rgba(255, 255, 255, 0.08)',
                color: isAutoSpin ? '#fef08a' : '#d1d5db',
                fontSize: '0.72rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              {isAutoSpin ? 'Stop Spin' : '360° Auto-Spin'}
            </button>
          </div>

          {/* Manual Rotation Controls */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: '0.35rem',
              marginBottom: '0.5rem'
            }}
          >
            <button
              onClick={() => handleRotate(-Math.PI / 8, 0)}
              title="Rotate Left"
              style={{
                padding: '0.4rem',
                borderRadius: '0.5rem',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                color: '#e5e7eb',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer'
              }}
            >
              <RotateCcw size={13} />
            </button>
            <button
              onClick={() => handleRotate(Math.PI / 8, 0)}
              title="Rotate Right"
              style={{
                padding: '0.4rem',
                borderRadius: '0.5rem',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                color: '#e5e7eb',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer'
              }}
            >
              <RotateCw size={13} />
            </button>
            <button
              onClick={() => handleRotate(0, Math.PI / 8)}
              title="Pitch Up"
              style={{
                padding: '0.4rem',
                borderRadius: '0.5rem',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                color: '#e5e7eb',
                fontSize: '0.72rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              ▲ Pitch
            </button>
            <button
              onClick={() => handleRotate(0, -Math.PI / 8)}
              title="Pitch Down"
              style={{
                padding: '0.4rem',
                borderRadius: '0.5rem',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                color: '#e5e7eb',
                fontSize: '0.72rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              ▼ Pitch
            </button>
          </div>

          {/* Reset Action */}
          <button
            onClick={handleResetCigar}
            style={{
              width: '100%',
              padding: '0.45rem',
              borderRadius: '0.55rem',
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              color: '#9ca3af',
              fontSize: '0.72rem',
              fontWeight: 500,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.35rem',
              cursor: 'pointer'
            }}
          >
            <RotateCcw size={12} />
            Reset to Display Cradle
          </button>
        </div>

        {/* Interaction Hint */}
        <p
          style={{
            margin: 0,
            fontSize: '0.68rem',
            color: '#6b7280',
            textAlign: 'center',
            lineHeight: 1.4
          }}
        >
          💡 Tip: You can also pinch near the display cigar in AR to grab and move it!
        </p>
      </div>
    </div>
  );
};
