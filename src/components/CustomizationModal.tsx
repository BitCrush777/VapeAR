// Customization Drawer & Modal — Created by Saidarshan.K
// Phase 7: Skins + Visual Themes + Environment Presets

import React, { useState, useEffect } from 'react';
import { MagicCard } from './magicui/MagicCard';
import { AnimatedGradientText } from './magicui/AnimatedGradientText';
import {
  HOOKAH_SKINS,
  ENVIRONMENT_PRESETS,
  DEFAULT_SKIN_ID,
  DEFAULT_ENVIRONMENT_ID,
  type HookahSkinConfig,
  type EnvironmentPresetConfig
} from '../config/hookahSkins';
import { AudioManager } from '../services/audioManager';
import {
  Palette,
  Sparkles,
  SunMedium,
  Check,
  RotateCcw,
  X
} from 'lucide-react';

interface CustomizationModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentSkin: string;
  onSelectSkin: (skinId: string) => void;
  currentEnvironment: string;
  onSelectEnvironment: (envId: string) => void;
  onResetDefaults: () => void;
}

export const CustomizationModal: React.FC<CustomizationModalProps> = ({
  isOpen,
  onClose,
  currentSkin,
  onSelectSkin,
  currentEnvironment,
  onSelectEnvironment,
  onResetDefaults
}) => {
  const [activeTab, setActiveTab] = useState<'skins' | 'environments'>('skins');

  useEffect(() => {
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

  const handleSelectSkin = (id: string) => {
    AudioManager.getInstance().playUiClick();
    onSelectSkin(id);
  };

  const handleSelectEnvironment = (id: string) => {
    AudioManager.getInstance().playUiClick();
    onSelectEnvironment(id);
  };

  const handleReset = () => {
    AudioManager.getInstance().playUiClick();
    onResetDefaults();
  };

  const activeSkinObj = HOOKAH_SKINS[currentSkin] || HOOKAH_SKINS[DEFAULT_SKIN_ID];
  const activeEnvObj = ENVIRONMENT_PRESETS[currentEnvironment] || ENVIRONMENT_PRESETS[DEFAULT_ENVIRONMENT_ID];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="customization-modal-title"
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 50,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(5, 5, 8, 0.78)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        padding: 16,
        animation: 'blur-fade-in 0.22s cubic-bezier(0.16, 1, 0.3, 1)'
      }}
      onClick={onClose}
    >
      <div
        style={{ width: '100%', maxWidth: 540 }}
        onClick={(e) => e.stopPropagation()}
      >
        <MagicCard
          spotlightColor="rgba(212, 175, 55, 0.22)"
          borderColor="rgba(255, 255, 255, 0.16)"
          style={{
            padding: '24px 26px',
            borderRadius: 24,
            backgroundColor: 'rgba(12, 14, 22, 0.95)',
            boxShadow: '0 24px 60px rgba(0, 0, 0, 0.65)'
          }}
        >
          {/* Header */}
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
              marginBottom: 18
            }}
          >
            <div>
              <div
                style={{
                  fontSize: '0.68rem',
                  fontWeight: 700,
                  letterSpacing: '0.14em',
                  color: '#d4af37',
                  textTransform: 'uppercase',
                  marginBottom: 4,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6
                }}
              >
                <Sparkles size={13} color="#d4af37" />
                Customization Suite
              </div>
              <h2
                id="customization-modal-title"
                style={{
                  margin: 0,
                  fontSize: '1.4rem',
                  fontWeight: 800,
                  letterSpacing: '0.02em'
                }}
              >
                <AnimatedGradientText duration="5s">
                  Skins & Atmosphere
                </AnimatedGradientText>
              </h2>
            </div>

            <button
              onClick={() => {
                AudioManager.getInstance().playUiClick();
                onClose();
              }}
              title="Close customization"
              aria-label="Close customization"
              style={{
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                borderRadius: '50%',
                width: 32,
                height: 32,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: 'var(--text-muted)',
                transition: 'all 0.2s'
              }}
            >
              <X size={16} />
            </button>
          </div>

          {/* Tab Selector */}
          <div
            style={{
              display: 'flex',
              gap: 8,
              padding: 4,
              backgroundColor: 'rgba(255, 255, 255, 0.04)',
              borderRadius: 14,
              border: '1px solid rgba(255, 255, 255, 0.08)',
              marginBottom: 16
            }}
          >
            <button
              type="button"
              onClick={() => {
                AudioManager.getInstance().playUiClick();
                setActiveTab('skins');
              }}
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                padding: '9px 12px',
                borderRadius: 10,
                border: 'none',
                cursor: 'pointer',
                fontSize: '0.84rem',
                fontWeight: 600,
                transition: 'all 0.2s',
                backgroundColor:
                  activeTab === 'skins'
                    ? 'rgba(212, 175, 55, 0.22)'
                    : 'transparent',
                color: activeTab === 'skins' ? '#f5e6a8' : 'var(--text-muted)'
              }}
            >
              <Palette size={16} />
              VapeAR Skins ({Object.keys(HOOKAH_SKINS).length})
            </button>
            <button
              type="button"
              onClick={() => {
                AudioManager.getInstance().playUiClick();
                setActiveTab('environments');
              }}
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                padding: '9px 12px',
                borderRadius: 10,
                border: 'none',
                cursor: 'pointer',
                fontSize: '0.84rem',
                fontWeight: 600,
                transition: 'all 0.2s',
                backgroundColor:
                  activeTab === 'environments'
                    ? 'rgba(0, 188, 212, 0.22)'
                    : 'transparent',
                color: activeTab === 'environments' ? '#80deea' : 'var(--text-muted)'
              }}
            >
              <SunMedium size={16} />
              Lounge Presets ({Object.keys(ENVIRONMENT_PRESETS).length})
            </button>
          </div>

          {/* Tab Content List */}
          <div
            style={{
              maxHeight: '44vh',
              overflowY: 'auto',
              paddingRight: 4,
              display: 'flex',
              flexDirection: 'column',
              gap: 10
            }}
          >
            {activeTab === 'skins' &&
              Object.values(HOOKAH_SKINS).map((skin: HookahSkinConfig) => {
                const isSelected = skin.id === currentSkin;
                return (
                  <div
                    key={skin.id}
                    onClick={() => handleSelectSkin(skin.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '12px 16px',
                      borderRadius: 16,
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      backgroundColor: isSelected
                        ? 'rgba(212, 175, 55, 0.14)'
                        : 'rgba(255, 255, 255, 0.03)',
                      border: isSelected
                        ? '1px solid rgba(212, 175, 55, 0.45)'
                        : '1px solid rgba(255, 255, 255, 0.07)'
                    }}
                  >
                    <div style={{ flex: 1, marginRight: 12 }}>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8,
                          marginBottom: 3
                        }}
                      >
                        <span
                          style={{
                            fontWeight: 700,
                            fontSize: '0.95rem',
                            color: isSelected ? '#fff' : '#e0e0e0'
                          }}
                        >
                          {skin.name}
                        </span>
                        <span
                          style={{
                            fontSize: '0.72rem',
                            color: isSelected ? '#f5e6a8' : 'var(--text-muted)',
                            backgroundColor: 'rgba(255, 255, 255, 0.06)',
                            padding: '1px 7px',
                            borderRadius: 6
                          }}
                        >
                          {skin.subtitle}
                        </span>
                      </div>
                      <div
                        style={{
                          fontSize: '0.78rem',
                          color: 'var(--text-muted)',
                          lineHeight: 1.35
                        }}
                      >
                        {skin.description}
                      </div>

                      {/* Color Palette Swatches */}
                      <div
                        style={{
                          display: 'flex',
                          gap: 6,
                          marginTop: 8
                        }}
                      >
                        {skin.previewColors.map((color, i) => (
                          <span
                            key={i}
                            style={{
                              width: 14,
                              height: 14,
                              borderRadius: '50%',
                              backgroundColor: color,
                              border: '1px solid rgba(255, 255, 255, 0.25)',
                              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.3)'
                            }}
                          />
                        ))}
                      </div>
                    </div>

                    {/* Active State Checkmark */}
                    <div
                      style={{
                        width: 26,
                        height: 26,
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: isSelected
                          ? '#d4af37'
                          : 'rgba(255, 255, 255, 0.06)',
                        color: isSelected ? '#000' : 'transparent',
                        transition: 'all 0.2s',
                        flexShrink: 0
                      }}
                    >
                      <Check size={16} strokeWidth={3} />
                    </div>
                  </div>
                );
              })}

            {activeTab === 'environments' &&
              Object.values(ENVIRONMENT_PRESETS).map(
                (env: EnvironmentPresetConfig) => {
                  const isSelected = env.id === currentEnvironment;
                  return (
                    <div
                      key={env.id}
                      onClick={() => handleSelectEnvironment(env.id)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '12px 16px',
                        borderRadius: 16,
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        backgroundColor: isSelected
                          ? 'rgba(0, 188, 212, 0.14)'
                          : 'rgba(255, 255, 255, 0.03)',
                        border: isSelected
                          ? '1px solid rgba(0, 188, 212, 0.45)'
                          : '1px solid rgba(255, 255, 255, 0.07)'
                      }}
                    >
                      <div style={{ flex: 1, marginRight: 12 }}>
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                            marginBottom: 3
                          }}
                        >
                          <span
                            style={{
                              fontWeight: 700,
                              fontSize: '0.95rem',
                              color: isSelected ? '#fff' : '#e0e0e0'
                            }}
                          >
                            {env.name}
                          </span>
                          <span
                            style={{
                              fontSize: '0.72rem',
                              color: isSelected ? '#80deea' : 'var(--text-muted)',
                              backgroundColor: 'rgba(255, 255, 255, 0.06)',
                              padding: '1px 7px',
                              borderRadius: 6
                            }}
                          >
                            {env.subtitle}
                          </span>
                        </div>
                        <div
                          style={{
                            fontSize: '0.78rem',
                            color: 'var(--text-muted)',
                            lineHeight: 1.35
                          }}
                        >
                          {env.description}
                        </div>

                        {/* Color Palette Swatches */}
                        <div
                          style={{
                            display: 'flex',
                            gap: 6,
                            marginTop: 8
                          }}
                        >
                          {env.previewColors.map((color, i) => (
                            <span
                              key={i}
                              style={{
                                width: 14,
                                height: 14,
                                borderRadius: '50%',
                                backgroundColor: color,
                                border: '1px solid rgba(255, 255, 255, 0.25)',
                                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.3)'
                              }}
                            />
                          ))}
                        </div>
                      </div>

                      {/* Active State Checkmark */}
                      <div
                        style={{
                          width: 26,
                          height: 26,
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          backgroundColor: isSelected
                            ? '#00bcd4'
                            : 'rgba(255, 255, 255, 0.06)',
                          color: isSelected ? '#000' : 'transparent',
                          transition: 'all 0.2s',
                          flexShrink: 0
                        }}
                      >
                        <Check size={16} strokeWidth={3} />
                      </div>
                    </div>
                  );
                }
              )}
          </div>

          {/* Bottom Controls / Status */}
          <div
            style={{
              marginTop: 18,
              paddingTop: 14,
              borderTop: '1px solid rgba(255, 255, 255, 0.08)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12
            }}
          >
            <button
              type="button"
              onClick={handleReset}
              title="Reset skin and environment to defaults"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '8px 14px',
                borderRadius: 10,
                border: '1px solid rgba(255, 255, 255, 0.12)',
                backgroundColor: 'rgba(255, 255, 255, 0.04)',
                color: 'var(--text-muted)',
                fontSize: '0.78rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              <RotateCcw size={13} />
              Reset Defaults
            </button>

            <div
              style={{
                fontSize: '0.74rem',
                color: 'var(--text-muted)',
                textAlign: 'right'
              }}
            >
              <span style={{ color: '#d4af37', fontWeight: 600 }}>{activeSkinObj.name}</span>
              {' • '}
              <span style={{ color: '#00bcd4', fontWeight: 600 }}>{activeEnvObj.name}</span>
            </div>

            <button
              type="button"
              onClick={() => {
                AudioManager.getInstance().playUiClick();
                onClose();
              }}
              style={{
                padding: '8px 18px',
                borderRadius: 10,
                border: 'none',
                backgroundColor: '#d4af37',
                color: '#111',
                fontSize: '0.82rem',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              Done
            </button>
          </div>
        </MagicCard>
      </div>
    </div>
  );
};
