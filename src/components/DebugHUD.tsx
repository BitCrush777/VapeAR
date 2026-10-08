import React from 'react';
import { TechnicalHUD } from './TechnicalHUD';
import type { AppState, MouthState, PinchState, PerformanceMetrics } from '../types/hookah';
import type { AudioTelemetry } from '../services/audioManager';

export interface DebugHUDProps {
  appState: AppState;
  showLandmarks: boolean;
  onToggleLandmarks: () => void;
  onTriggerSmoke: () => void;
  pinchState: PinchState | null;
  mouthState: MouthState | null;
  perfMetrics?: PerformanceMetrics;
  audioTelemetry?: AudioTelemetry;
  onClose?: () => void;
}

export const DebugHUD: React.FC<DebugHUDProps> = (props) => {
  return <TechnicalHUD {...props} onClose={props.onClose || (() => {})} />;
};

export default DebugHUD;
