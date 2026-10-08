import React from 'react';
import { Dock, type DockItem } from './magicui/Dock';
import { Eye, EyeOff, HelpCircle, Info, Palette, RotateCcw, Sliders, Volume2, VolumeX, Wind } from 'lucide-react';

interface ControlDockProps {
  showLandmarks: boolean;
  onToggleLandmarks: () => void;
  onTriggerSmoke: () => void;
  onReset: () => void;
  isSoundEnabled: boolean;
  onToggleSound: () => void;
  showGuide: boolean;
  onToggleGuide: () => void;
  isDebugMode: boolean;
  onToggleDebug: () => void;
  onOpenAbout: () => void;
  onOpenCustomize: () => void;
  isCustomizeOpen?: boolean;
}

export const ControlDock: React.FC<ControlDockProps> = ({
  showLandmarks,
  onToggleLandmarks,
  onTriggerSmoke,
  onReset,
  isSoundEnabled,
  onToggleSound,
  showGuide,
  onToggleGuide,
  isDebugMode,
  onToggleDebug,
  onOpenAbout,
  onOpenCustomize,
  isCustomizeOpen = false
}) => {
  const dockItems: DockItem[] = [
    {
      id: 'guide',
      label: showGuide ? 'Hide Guide' : 'How to Interact',
      icon: <HelpCircle size={17} />,
      onClick: onToggleGuide,
      isActive: showGuide,
      activeColor: 'var(--cyan)'
    },
    {
      id: 'sound',
      label: isSoundEnabled ? 'Mute Audio' : 'Unmute Audio',
      icon: isSoundEnabled ? <Volume2 size={17} /> : <VolumeX size={17} />,
      onClick: onToggleSound,
      isActive: isSoundEnabled,
      activeColor: 'var(--green)'
    },
    {
      id: 'landmarks',
      label: showLandmarks ? 'Hide Landmarks' : 'Show Landmarks',
      icon: showLandmarks ? <Eye size={17} /> : <EyeOff size={17} />,
      onClick: onToggleLandmarks,
      isActive: showLandmarks,
      activeColor: '#2979ff'
    },
    {
      id: 'smoke',
      label: 'Exhale Smoke Test',
      icon: <Wind size={17} />,
      onClick: onTriggerSmoke,
      isActive: false,
      activeColor: 'var(--accent)'
    },
    {
      id: 'reset',
      label: 'Reset Pipe to Base',
      icon: <RotateCcw size={17} />,
      onClick: onReset,
      isActive: false,
      activeColor: 'var(--amber)'
    },
    {
      id: 'telemetry',
      label: isDebugMode ? 'Hide Telemetry' : 'Show Telemetry',
      icon: <Sliders size={17} />,
      onClick: onToggleDebug,
      isActive: isDebugMode,
      activeColor: 'var(--accent)'
    },
    {
      id: 'customize',
      label: 'Skins & Themes',
      icon: <Palette size={17} />,
      onClick: onOpenCustomize,
      isActive: isCustomizeOpen,
      activeColor: '#d4af37'
    },
    {
      id: 'about',
      label: 'Creator Info',
      icon: <Info size={17} />,
      onClick: onOpenAbout,
      isActive: false,
      activeColor: '#d4af37'
    }
  ];

  return (
    <div
      className="dock-wrapper"
      style={{
        position: 'absolute',
        bottom: 20,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 25,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        pointerEvents: 'none'
      }}
    >
      <Dock items={dockItems} />
    </div>
  );
};
