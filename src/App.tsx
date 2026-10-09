// VapeAR WebAR Experience — Created by Saidarshan.K
import { useState } from 'react';
import { ARCanvas } from './components/ARCanvas';
import { ExperienceHeader } from './components/ExperienceHeader';
import { ExperienceHUD } from './components/ExperienceHUD';
import { ControlDock } from './components/ControlDock';
import { TechnicalHUD } from './components/TechnicalHUD';
import { AboutModal } from './components/AboutModal';
import { CustomizationModal } from './components/CustomizationModal';
import { CigarCollectionPanel } from './components/CigarCollectionPanel';
import { WelcomeScreen } from './components/WelcomeScreen';
import { AudioManager } from './services/audioManager';
import { CigarCollectionManager } from './services/cigarCollection/CigarCollectionManager';
import { DEFAULT_SKIN_ID, DEFAULT_ENVIRONMENT_ID, HOOKAH_SKINS, ENVIRONMENT_PRESETS } from './config/hookahSkins';
import type { AppState, MouthState, PinchState, PerformanceMetrics, SmokeRitualTelemetry, ActiveObject } from './types/hookah';

export function App() {
  const [isStarted, setIsStarted] = useState<boolean>(false);
  const [isSoundEnabled, setIsSoundEnabled] = useState<boolean>(
    AudioManager.getInstance().getIsEnabled()
  );
  const [appState, setAppState] = useState<AppState>('IDLE');
  const [showLandmarks, setShowLandmarks] = useState<boolean>(false);
  const [pinchState, setPinchState] = useState<PinchState | null>(null);
  const [mouthState, setMouthState] = useState<MouthState | null>(null);
  const [manualSmokeTrigger, setManualSmokeTrigger] = useState<boolean>(false);
  const [resetTrigger, setResetTrigger] = useState<number>(0);
  const [perfMetrics, setPerfMetrics] = useState<PerformanceMetrics>({
    renderFps: 60,
    inferenceFps: 30,
    inferenceTimeMs: 12
  });
  const [ritualTelemetry, setRitualTelemetry] = useState<SmokeRitualTelemetry | undefined>();

  // Experience HUD states
  const [showGuide, setShowGuide] = useState<boolean>(true);
  const [isDebugMode, setIsDebugMode] = useState<boolean>(false);
  const [showAbout, setShowAbout] = useState<boolean>(false);
  const [showCustomize, setShowCustomize] = useState<boolean>(false);
  const [showCigars, setShowCigars] = useState<boolean>(false);
  const [cigarManager, setCigarManager] = useState<CigarCollectionManager | null>(null);
  const [activeObject, setActiveObject] = useState<ActiveObject>('hookah');

  const handleToggleActiveObject = () => {
    setActiveObject((prev) => (prev === 'hookah' ? 'cigar' : 'hookah'));
  };

  // Phase 7 Customization state with validated localStorage persistence (Phase 9 hardened)
  const [currentSkin, setCurrentSkin] = useState<string>(() => {
    try {
      const saved = localStorage.getItem('hookah_skin_v1');
      return saved && saved in HOOKAH_SKINS ? saved : DEFAULT_SKIN_ID;
    } catch {
      return DEFAULT_SKIN_ID;
    }
  });

  const [currentEnvironment, setCurrentEnvironment] = useState<string>(() => {
    try {
      const saved = localStorage.getItem('hookah_env_v1');
      return saved && saved in ENVIRONMENT_PRESETS ? saved : DEFAULT_ENVIRONMENT_ID;
    } catch {
      return DEFAULT_ENVIRONMENT_ID;
    }
  });

  const handleSelectSkin = (skinId: string) => {
    setCurrentSkin(skinId);
    try {
      localStorage.setItem('hookah_skin_v1', skinId);
    } catch (e) {
      console.warn('Failed to save skin to localStorage:', e);
    }
  };

  const handleSelectEnvironment = (envId: string) => {
    setCurrentEnvironment(envId);
    try {
      localStorage.setItem('hookah_env_v1', envId);
    } catch (e) {
      console.warn('Failed to save environment to localStorage:', e);
    }
  };

  const handleResetDefaults = () => {
    setCurrentSkin(DEFAULT_SKIN_ID);
    setCurrentEnvironment(DEFAULT_ENVIRONMENT_ID);
    try {
      localStorage.removeItem('hookah_skin_v1');
      localStorage.removeItem('hookah_env_v1');
    } catch (e) {
      console.warn('Failed to clear customization from localStorage:', e);
    }
  };

  const handleStartExperience = () => {
    // Explicit user-gesture audio context unlock
    AudioManager.getInstance().unlock();
    setIsStarted(true);
  };

  const handleToggleSound = () => {
    const next = AudioManager.getInstance().toggleEnabled();
    setIsSoundEnabled(next);
  };

  const handleMetricsUpdate = (
    pinch: PinchState | null,
    mouth: MouthState | null,
    perf?: PerformanceMetrics,
    ritual?: SmokeRitualTelemetry
  ) => {
    setPinchState(pinch);
    setMouthState(mouth);
    if (perf) {
      setPerfMetrics(perf);
    }
    if (ritual) {
      setRitualTelemetry(ritual);
    }
  };

  const handleReset = () => {
    setResetTrigger((prev) => prev + 1);
    setRitualTelemetry(undefined);
    AudioManager.getInstance().updateState('IDLE', false);
    setAppState('IDLE');
  };

  return (
    <div
      style={{
        width: '100vw',
        height: '100dvh',
        margin: 0,
        padding: 0,
        overflow: 'hidden',
        position: 'relative',
        backgroundColor: '#000000'
      }}
    >
      {/* 1. Initial Welcome / Onboarding Screen */}
      {!isStarted && (
        <WelcomeScreen onStart={handleStartExperience} />
      )}

      {/* 2. Cinematic Experience Top Header */}
      {isStarted && (
        <ExperienceHeader
          appState={appState}
          isDebugMode={isDebugMode}
          onToggleDebug={() => setIsDebugMode((prev) => !prev)}
          showGuide={showGuide}
          onToggleGuide={() => setShowGuide((prev) => !prev)}
          activeObject={activeObject}
          onToggleActiveObject={handleToggleActiveObject}
        />
      )}

      {/* 3. State-Aware Contextual Intelligence & Onboarding Guide */}
      {isStarted && (
        <ExperienceHUD
          appState={appState}
          showGuide={showGuide}
          onCloseGuide={() => setShowGuide(false)}
          isVortexActive={ritualTelemetry?.isVortexActive}
          activeShape={ritualTelemetry?.activeShape}
          activeObject={activeObject}
        />
      )}

      {/* 4. Bottom Floating Control Dock */}
      {isStarted && (
        <ControlDock
          showLandmarks={showLandmarks}
          onToggleLandmarks={() => setShowLandmarks((prev) => !prev)}
          onTriggerSmoke={() => setManualSmokeTrigger(true)}
          onReset={handleReset}
          isSoundEnabled={isSoundEnabled}
          onToggleSound={handleToggleSound}
          showGuide={showGuide}
          onToggleGuide={() => setShowGuide((prev) => !prev)}
          isDebugMode={isDebugMode}
          onToggleDebug={() => setIsDebugMode((prev) => !prev)}
          onOpenAbout={() => setShowAbout(true)}
          onOpenCustomize={() => setShowCustomize(true)}
          isCustomizeOpen={showCustomize}
          onOpenCigars={() => setShowCigars((prev) => !prev)}
          isCigarsOpen={showCigars}
        />
      )}

      {/* 5. Technical Telemetry HUD (Active in Debug Mode) */}
      {isStarted && isDebugMode && (
        <TechnicalHUD
          appState={appState}
          showLandmarks={showLandmarks}
          onToggleLandmarks={() => setShowLandmarks((prev) => !prev)}
          onTriggerSmoke={() => setManualSmokeTrigger(true)}
          pinchState={pinchState}
          mouthState={mouthState}
          perfMetrics={perfMetrics}
          audioTelemetry={AudioManager.getInstance().getTelemetry()}
          ritualTelemetry={ritualTelemetry}
          onClose={() => setIsDebugMode(false)}
        />
      )}

      {/* 6. Creator & Architecture Overview Modal */}
      <AboutModal
        isOpen={showAbout}
        onClose={() => setShowAbout(false)}
      />

      {/* 7. VapeAR Skins & Environment Customization Modal (Phase 7) */}
      <CustomizationModal
        isOpen={showCustomize}
        onClose={() => setShowCustomize(false)}
        currentSkin={currentSkin}
        onSelectSkin={handleSelectSkin}
        currentEnvironment={currentEnvironment}
        onSelectEnvironment={handleSelectEnvironment}
        onResetDefaults={handleResetDefaults}
      />

      {/* 8. VapeAR Premium Cigar Collection Panel */}
      <CigarCollectionPanel
        isOpen={showCigars}
        onClose={() => setShowCigars(false)}
        cigarManager={cigarManager}
      />

      {/* 9. Core AR Camera & WebGL Canvas Pipeline */}
      <ARCanvas
        isStarted={isStarted}
        showLandmarks={showLandmarks}
        isDebugMode={isDebugMode}
        activeObject={activeObject}
        currentSkin={currentSkin}
        currentEnvironment={currentEnvironment}
        onStateChange={setAppState}
        onMetricsUpdate={handleMetricsUpdate}
        manualSmokeTrigger={manualSmokeTrigger}
        onManualSmokeTriggered={() => setManualSmokeTrigger(false)}
        resetTrigger={resetTrigger}
        onCigarManagerReady={setCigarManager}
      />
    </div>
  );
}

export default App;
