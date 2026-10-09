// VapeAR Canvas Component — Created by Saidarshan.K
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { WebcamService } from '../services/webcam';
import { HandTrackerService } from '../services/handTracker';
import { FaceTrackerService } from '../services/faceTracker';
import { GestureDetector } from '../services/gestureDetector';
import { MouthDetector } from '../services/mouthDetector';
import { HookahInteractionManager } from '../services/hookahInteraction';
import { VapourParticleSystem } from '../services/vapourParticleSystem';
import { Hookah3DScene } from '../services/hookah3DScene';
import { CigarCollectionManager } from '../services/cigarCollection/CigarCollectionManager';
import { drawHookahBase, drawHoseAndMouthpiece, drawLandmarksDebug } from '../utils/drawHookah';
import { SmokeRitualManager } from '../services/smokeRitualManager';
import { SMOKE_RITUAL_CONFIG } from '../config/smokeRitual';
import type { AppState, MouthState, PinchState, PerformanceMetrics, PipePosition, SmokeRitualTelemetry, ActiveObject } from '../types/hookah';
import { LoadingExperience } from './LoadingExperience';
import { CameraPermission } from './CameraPermission';
import { AnimatedGridPattern } from './magicui/AnimatedGridPattern';
import { AudioManager } from '../services/audioManager';

interface SpatialRipple {
  x: number;
  y: number;
  startTime: number;
  duration: number;
  maxRadius: number;
  color: string;
}

interface ARCanvasProps {
  isStarted: boolean;
  showLandmarks: boolean;
  isDebugMode?: boolean;
  activeObject?: ActiveObject;
  currentSkin?: string;
  currentEnvironment?: string;
  onStateChange: (state: AppState) => void;
  onMetricsUpdate: (
    pinch: PinchState | null,
    mouth: MouthState | null,
    perf?: PerformanceMetrics,
    ritual?: SmokeRitualTelemetry
  ) => void;
  manualSmokeTrigger: boolean;
  onManualSmokeTriggered: () => void;
  resetTrigger?: number;
  onCigarManagerReady?: (manager: CigarCollectionManager) => void;
}

export const ARCanvas: React.FC<ARCanvasProps> = ({
  isStarted,
  showLandmarks,
  isDebugMode = false,
  activeObject = 'hookah',
  currentSkin,
  currentEnvironment,
  onStateChange,
  onMetricsUpdate,
  manualSmokeTrigger,
  onManualSmokeTriggered,
  resetTrigger,
  onCigarManagerReady
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const webglCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [loadingStep, setLoadingStep] = useState<string>('Connecting camera feed...');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Services refs
  const webcamServiceRef = useRef<WebcamService>(new WebcamService());
  const handTrackerRef = useRef<HandTrackerService>(new HandTrackerService());
  const faceTrackerRef = useRef<FaceTrackerService>(new FaceTrackerService());
  const gestureDetectorRef = useRef<GestureDetector>(new GestureDetector());
  const mouthDetectorRef = useRef<MouthDetector>(new MouthDetector());
  const hookahManagerRef = useRef<HookahInteractionManager>(new HookahInteractionManager());
  const particleSystemRef = useRef<VapourParticleSystem>(new VapourParticleSystem());
  const smokeRitualManagerRef = useRef<SmokeRitualManager>(new SmokeRitualManager());
  const hookah3DSceneRef = useRef<Hookah3DScene | null>(null);

  const animFrameIdRef = useRef<number | null>(null);
  const activeRipplesRef = useRef<SpatialRipple[]>([]);

  // Sync latest props into refs
  const showLandmarksRef = useRef(showLandmarks);
  const isDebugModeRef = useRef(isDebugMode);
  const activeObjectRef = useRef<ActiveObject>(activeObject);
  const onMetricsUpdateRef = useRef(onMetricsUpdate);
  const onStateChangeRef = useRef(onStateChange);
  const currentSkinRef = useRef(currentSkin);
  const currentEnvironmentRef = useRef(currentEnvironment);
  const onCigarManagerReadyRef = useRef(onCigarManagerReady);

  useEffect(() => {
    showLandmarksRef.current = showLandmarks;
    isDebugModeRef.current = isDebugMode;
    activeObjectRef.current = activeObject;
    onMetricsUpdateRef.current = onMetricsUpdate;
    onStateChangeRef.current = onStateChange;
    currentSkinRef.current = currentSkin;
    currentEnvironmentRef.current = currentEnvironment;
    onCigarManagerReadyRef.current = onCigarManagerReady;
  }, [showLandmarks, isDebugMode, activeObject, onMetricsUpdate, onStateChange, currentSkin, currentEnvironment, onCigarManagerReady]);

  // Object Switcher: Hookah vs Cigar dynamic switching
  useEffect(() => {
    if (hookah3DSceneRef.current && activeObject) {
      hookah3DSceneRef.current.setActiveObject(activeObject);
      if (activeObject === 'cigar') {
        hookahManagerRef.current.releaseHold();
        hookahManagerRef.current.setInteractionBlocked(true);
      } else {
        hookahManagerRef.current.setInteractionBlocked(false);
        hookah3DSceneRef.current.setPrimaryCigarGrabbed(false);
      }
    }
  }, [activeObject]);

  // Phase 7: Dynamic skin & environment preset update without scene restart
  useEffect(() => {
    if (hookah3DSceneRef.current && currentSkin) {
      hookah3DSceneRef.current.applySkin(currentSkin);
    }
  }, [currentSkin]);

  useEffect(() => {
    if (hookah3DSceneRef.current && currentEnvironment) {
      hookah3DSceneRef.current.applyEnvironment(currentEnvironment);
    }
  }, [currentEnvironment]);

  const triggerRipple = useCallback((x: number, y: number, color: string, maxRadius = 45, duration = 360) => {
    if (activeRipplesRef.current.length >= 6) {
      activeRipplesRef.current.shift();
    }
    activeRipplesRef.current.push({
      x,
      y,
      startTime: performance.now(),
      duration,
      maxRadius,
      color
    });
  }, []);

  // Spatial Visual Interaction Target (Phase 5.14)
  const drawTargetingReticle = useCallback((
    ctx: CanvasRenderingContext2D,
    pipePos: PipePosition,
    pinchState: PinchState | null,
    effectiveGrabRadius: number,
    timestampMs: number
  ) => {
    if (pipePos.isHeld) return;
    if (!pinchState) return;

    const dist = Math.hypot(
      pinchState.pinchCenter.x - pipePos.x,
      pinchState.pinchCenter.y - pipePos.y
    );

    // Proximity range for spatial indicator
    if (dist > 250) return;

    const isCandidate = dist <= effectiveGrabRadius;
    const alpha = isCandidate
      ? 0.85
      : Math.max(0.15, (1 - dist / 250) * 0.55);

    ctx.save();
    ctx.translate(pipePos.x, pipePos.y);

    // Subtle continuous rotation
    const rot = (timestampMs * 0.0018) % (Math.PI * 2);
    ctx.rotate(rot);

    const ringColor = isCandidate ? 'rgba(233, 30, 99, ' : 'rgba(0, 229, 255, ';
    const ringRadius = isCandidate ? 28 : 22 + (dist / 250) * 8;

    // Outer reticle ring
    ctx.beginPath();
    ctx.arc(0, 0, ringRadius, 0, Math.PI * 2);
    ctx.strokeStyle = `${ringColor}${alpha})`;
    ctx.lineWidth = isCandidate ? 2 : 1.2;
    if (!isCandidate) {
      ctx.setLineDash([4, 4]);
    }
    ctx.stroke();

    // 4 Inward targeting notches
    ctx.beginPath();
    const notchLen = isCandidate ? 6 : 4;
    for (let i = 0; i < 4; i++) {
      const angle = (i * Math.PI) / 2;
      const nx = Math.cos(angle) * (ringRadius + 2);
      const ny = Math.sin(angle) * (ringRadius + 2);
      const ex = Math.cos(angle) * (ringRadius + 2 + notchLen);
      const ey = Math.sin(angle) * (ringRadius + 2 + notchLen);
      ctx.moveTo(nx, ny);
      ctx.lineTo(ex, ey);
    }
    ctx.strokeStyle = `${ringColor}${alpha * 0.9})`;
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Center dot if candidate
    if (isCandidate) {
      ctx.beginPath();
      ctx.arc(0, 0, 3, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
      ctx.fill();
    }

    ctx.restore();
  }, []);

  // Spatial Success Feedback Ripples (Phase 5.15)
  const drawRipples = useCallback((ctx: CanvasRenderingContext2D, timestampMs: number) => {
    const ripples = activeRipplesRef.current;
    for (let i = ripples.length - 1; i >= 0; i--) {
      const ripple = ripples[i];
      const elapsed = timestampMs - ripple.startTime;
      const progress = elapsed / ripple.duration;

      if (progress >= 1) {
        ripples.splice(i, 1);
        continue;
      }

      // Smooth ease-out expansion
      const easeOut = 1 - Math.pow(1 - progress, 2);
      const r = 12 + ripple.maxRadius * easeOut;
      const alpha = (1 - progress) * 0.75;

      ctx.save();
      ctx.beginPath();
      ctx.arc(ripple.x, ripple.y, r, 0, Math.PI * 2);
      ctx.strokeStyle = ripple.color;
      ctx.globalAlpha = alpha;
      ctx.lineWidth = Math.max(1, 2.5 * (1 - progress * 0.6));
      ctx.stroke();
      ctx.restore();
    }
  }, []);

  const [retryKey, setRetryKey] = useState(0);
  const handleRetry = useCallback(() => {
    setErrorMsg(null);
    setIsLoading(true);
    setRetryKey((k) => k + 1);
  }, []);

  useEffect(() => {
    if (!isStarted) return;
    let isMounted = true;
    let rvfcId: number | null = null;

    function startRenderLoop() {
      let lastVideoTime = -1;
      let cachedHandResults: ReturnType<HandTrackerService['detect']> = null;
      let cachedFaceResults: ReturnType<FaceTrackerService['detect']> = null;
      let lastTelemetryTime = 0;
      let prevAppState: AppState = 'IDLE';
      let prevIsGrabbing = false;
      let cigarPuffActive = false;

      // Render performance tracking
      let renderFrameCount = 0;
      let lastFpsCalcTime = performance.now();
      let currentRenderFps = 60;

      let isInferenceRunning = false;
      let inferenceTickCount = 0;

      const runVisionInference = (timestampMs: number) => {
        const video = videoRef.current;
        if (!video || !webcamServiceRef.current.isReady() || isInferenceRunning) return;

        isInferenceRunning = true;
        try {
          // Hand tracking on every frame
          cachedHandResults = handTrackerRef.current.detect(video, timestampMs);

          // Interleaved face tracking on alternate frames
          inferenceTickCount++;
          if (inferenceTickCount % 2 === 0 || !cachedFaceResults) {
            cachedFaceResults = faceTrackerRef.current.detect(video, timestampMs);
          }
        } finally {
          isInferenceRunning = false;
        }
      };

      const video = videoRef.current;
      const hasRvfc = !!(video && 'requestVideoFrameCallback' in video);

      const onVideoFrameCallback = (now: DOMHighResTimeStamp) => {
        if (!isMounted) return;
        runVisionInference(now);
        const vid = videoRef.current;
        if (vid && 'requestVideoFrameCallback' in vid) {
          rvfcId = (vid as unknown as { requestVideoFrameCallback: (cb: (now: number) => void) => number }).requestVideoFrameCallback(onVideoFrameCallback);
        }
      };

      if (hasRvfc && video) {
        rvfcId = (video as unknown as { requestVideoFrameCallback: (cb: (now: number) => void) => number }).requestVideoFrameCallback(onVideoFrameCallback);
      }

      const loop = () => {
        if (typeof document !== 'undefined' && document.hidden) {
          animFrameIdRef.current = requestAnimationFrame(loop);
          return;
        }

        const vid = videoRef.current;
        const webglCanvas = webglCanvasRef.current;
        const overlayCanvas = overlayCanvasRef.current;

        const width = window.innerWidth;
        const height = window.innerHeight;

        // Ensure canvas dimensions match viewport
        if (webglCanvas && (webglCanvas.width !== width || webglCanvas.height !== height)) {
          webglCanvas.width = width;
          webglCanvas.height = height;
          if (hookah3DSceneRef.current) {
            hookah3DSceneRef.current.resize(width, height);
          }
        }

        if (overlayCanvas && (overlayCanvas.width !== width || overlayCanvas.height !== height)) {
          overlayCanvas.width = width;
          overlayCanvas.height = height;
        }

        if (vid && webcamServiceRef.current.isReady()) {
          const timestampMs = performance.now();

          // Render FPS calculation
          renderFrameCount++;
          if (timestampMs - lastFpsCalcTime >= 1000) {
            currentRenderFps = Math.round((renderFrameCount * 1000) / (timestampMs - lastFpsCalcTime));
            renderFrameCount = 0;
            lastFpsCalcTime = timestampMs;
          }

          // Fallback for browsers without rVFC
          if (!hasRvfc && vid.currentTime !== lastVideoTime) {
            lastVideoTime = vid.currentTime;
            runVisionInference(timestampMs);
          }

          const priorPipePos = hookahManagerRef.current.getPipePosition();

          // Gesture & Mouth Detection
          const handednessData = cachedHandResults?.handedness || (cachedHandResults as unknown as { handednesses?: Array<Array<{ categoryName: string; score: number }>> })?.handednesses;
          const pinchState = gestureDetectorRef.current.detectPinch(
            cachedHandResults?.landmarks || [],
            width,
            height,
            true, // Mirrored selfie view
            handednessData || [],
            timestampMs,
            priorPipePos
          );

          const mouthState = mouthDetectorRef.current.detectMouth(
            cachedFaceResults?.faceLandmarks || [],
            width,
            height,
            true
          );

          const isGrabbingNow = pinchState?.isGrabbing ?? false;
          const isDebug = isDebugModeRef.current;

          let appState: AppState = 'IDLE';
          let shouldEmitVapour = false;
          let vapourEmitterPos = { x: width / 2, y: height * 0.4 };

          if (activeObjectRef.current === 'cigar') {
            // Block hookah manipulation in Cigar Mode
            hookahManagerRef.current.setInteractionBlocked(true);

            if (hookah3DSceneRef.current && pinchState) {
              const cigarWorldPos = hookah3DSceneRef.current.getPrimaryCigarWorldPosition();
              const cigarScreenPos = hookah3DSceneRef.current.worldToScreen(cigarWorldPos);
              const distToCigar = Math.hypot(
                pinchState.pinchCenter.x - cigarScreenPos.x,
                pinchState.pinchCenter.y - cigarScreenPos.y
              );

              const cigarGrabThreshold = 140;
              const wasCigarHeld = hookah3DSceneRef.current.isPrimaryCigarGrabbed();

              if (pinchState.isGrabbing) {
                if (wasCigarHeld || distToCigar < cigarGrabThreshold) {
                  hookah3DSceneRef.current.setPrimaryCigarGrabbed(true);
                  const targetWorldPos = hookah3DSceneRef.current.screenToWorld(
                    pinchState.pinchCenter.x,
                    pinchState.pinchCenter.y,
                    cigarWorldPos.z
                  );
                  hookah3DSceneRef.current.setPrimaryCigarTargetPosition(targetWorldPos);
                }
              } else {
                if (wasCigarHeld) {
                  hookah3DSceneRef.current.setPrimaryCigarGrabbed(false);
                }
              }
            } else if (hookah3DSceneRef.current?.isPrimaryCigarGrabbed()) {
              hookah3DSceneRef.current.setPrimaryCigarGrabbed(false);
            }

            // Cigar Mode Interaction State Machine (Grabbed -> Mouth -> Puff -> Smoke)
            const isCigarHeld = hookah3DSceneRef.current?.isPrimaryCigarGrabbed() ?? false;
            if (isCigarHeld) {
              if (mouthState && hookah3DSceneRef.current) {
                const headWorld = hookah3DSceneRef.current.getPrimaryCigarHeadWorldPosition();
                const headScreen = hookah3DSceneRef.current.worldToScreen(headWorld);
                const distHeadToMouth = Math.hypot(
                  headScreen.x - mouthState.center.x,
                  headScreen.y - mouthState.center.y
                );

                if (distHeadToMouth < 135) {
                  if (mouthState.isOpen || mouthState.openRatio > 0.18) {
                    appState = 'SIP_DETECTED';
                    cigarPuffActive = true;
                  } else {
                    appState = 'PIPE_AT_MOUTH';
                  }
                } else if (cigarPuffActive) {
                  appState = 'VAPOUR';
                  cigarPuffActive = false;
                  shouldEmitVapour = true;
                  vapourEmitterPos = mouthState.center;
                } else {
                  appState = 'PIPE_GRABBED';
                }
              } else {
                appState = 'PIPE_GRABBED';
              }
            } else {
              appState = pinchState ? 'HAND_DETECTED' : 'IDLE';
              cigarPuffActive = false;
            }
          } else {
            // Hookah Mode: Normal interaction state machine & side cigar isolation
            hookahManagerRef.current.setInteractionBlocked(false);

            // Side Cigar Collection Hand-Tracking Interaction (if collection drawer is active)
            const cigarManager = hookah3DSceneRef.current?.getCigarCollectionManager();
            if (cigarManager && cigarManager.getRootGroup().visible && pinchState) {
              const cigarWorldPos = cigarManager.getDisplayCigarWorldPosition();
              const cigarScreenPos = hookah3DSceneRef.current!.worldToScreen(cigarWorldPos);
              const distToCigar = Math.hypot(
                pinchState.pinchCenter.x - cigarScreenPos.x,
                pinchState.pinchCenter.y - cigarScreenPos.y
              );

              const cigarGrabThreshold = 120;
              const isPipeHeld = hookahManagerRef.current.getPipePosition().isHeld;

              if (pinchState.isGrabbing) {
                if (cigarManager.hasActiveOwnership() || (distToCigar < cigarGrabThreshold && !isPipeHeld)) {
                  cigarManager.setGrabbed(true);
                  hookahManagerRef.current.setInteractionBlocked(true);

                  const targetWorldPos = hookah3DSceneRef.current!.screenToWorld(
                    pinchState.pinchCenter.x,
                    pinchState.pinchCenter.y,
                    cigarWorldPos.z
                  );
                  cigarManager.setTargetPosition(targetWorldPos);
                }
              } else {
                if (cigarManager.hasActiveOwnership()) {
                  cigarManager.setGrabbed(false);
                  hookahManagerRef.current.setInteractionBlocked(false);
                }
              }
            } else if (cigarManager?.hasActiveOwnership()) {
              cigarManager.setGrabbed(false);
              hookahManagerRef.current.setInteractionBlocked(false);
            }

            // Update Hookah Interaction State Machine
            const hookahRes = hookahManagerRef.current.update(
              pinchState,
              mouthState,
              width,
              height
            );
            appState = hookahRes.appState;
            shouldEmitVapour = hookahRes.shouldEmitVapour;
            vapourEmitterPos = hookahRes.vapourEmitterPos;

            // Phase 8: Smoke Ritual lifecycle orchestration
            if (appState === 'SMOKE_RITUAL') {
              if (!smokeRitualManagerRef.current.isActive()) {
                smokeRitualManagerRef.current.startRitual(timestampMs, vapourEmitterPos);
              }
              const ritualResult = smokeRitualManagerRef.current.update(
                pinchState,
                particleSystemRef.current,
                timestampMs,
                width,
                height
              );
              if (!ritualResult.isStillActive) {
                hookahManagerRef.current.completeRitual(pinchState);
                appState = hookahManagerRef.current.getAppState();
              }
            } else if (smokeRitualManagerRef.current.isActive()) {
              smokeRitualManagerRef.current.endRitual();
            }
          }

          const pipePos = hookahManagerRef.current.getPipePosition();
          const effectiveGrabRadius = hookahManagerRef.current.getEffectiveGrabRadius();

          // Spatial Success Feedback Triggers (Phase 5.15 & Phase 8)
          if (!prevIsGrabbing && isGrabbingNow && pinchState) {
            if (activeObjectRef.current === 'cigar' && hookah3DSceneRef.current?.isPrimaryCigarGrabbed()) {
              const cigarWorld = hookah3DSceneRef.current.getPrimaryCigarWorldPosition();
              const cigarScreen = hookah3DSceneRef.current.worldToScreen(cigarWorld);
              triggerRipple(cigarScreen.x, cigarScreen.y, '#ffd700', 52, 380);
            } else {
              const dist = Math.hypot(pinchState.pinchCenter.x - pipePos.x, pinchState.pinchCenter.y - pipePos.y);
              if (dist <= effectiveGrabRadius + 20) {
                triggerRipple(pipePos.x, pipePos.y, '#e91e63', 52, 380);
              }
            }
          }
          if (prevAppState !== 'PIPE_AT_MOUTH' && appState === 'PIPE_AT_MOUTH' && mouthState) {
            triggerRipple(mouthState.center.x, mouthState.center.y, '#ffa726', 44, 400);
          }
          if (prevAppState !== 'SIP_DETECTED' && appState === 'SIP_DETECTED' && mouthState) {
            triggerRipple(mouthState.center.x, mouthState.center.y, '#00e676', 56, 450);
          }
          if (prevAppState !== 'VAPOUR' && appState === 'VAPOUR' && mouthState) {
            triggerRipple(mouthState.center.x, mouthState.center.y, '#ff1744', 68, 500);
          }
          if (prevAppState !== 'SMOKE_RITUAL' && appState === 'SMOKE_RITUAL') {
            triggerRipple(vapourEmitterPos.x, vapourEmitterPos.y, '#ffd700', 64, 550);
          }

          prevIsGrabbing = isGrabbingNow;

          if (appState !== prevAppState) {
            prevAppState = appState;
            onStateChangeRef.current(appState);
          }

          // Rate-limited telemetry to React (Phase 8: Includes Smoke Ritual telemetry)
          const ritualTelemetry = smokeRitualManagerRef.current.getTelemetry();
          const shouldUpdateTelemetry =
            isGrabbingNow !== prevIsGrabbing ||
            (isDebug && timestampMs - lastTelemetryTime > 66) ||
            (ritualTelemetry.isActive && timestampMs - lastTelemetryTime > 66);

          if (shouldUpdateTelemetry) {
            lastTelemetryTime = timestampMs;
            const handMetrics = handTrackerRef.current.getMetrics();
            onMetricsUpdateRef.current(
              pinchState,
              mouthState,
              {
                renderFps: currentRenderFps,
                inferenceFps: handMetrics.inferenceFps,
                inferenceTimeMs: handMetrics.inferenceTimeMs
              },
              ritualTelemetry
            );
          }

          // Update spatial audio state machine (Phase 6 & 8)
          const isHeldForAudio = activeObjectRef.current === 'cigar'
            ? (hookah3DSceneRef.current?.isPrimaryCigarGrabbed() ?? false)
            : pipePos.isHeld;
          AudioManager.getInstance().updateState(appState, isHeldForAudio);

          // Emit Vapour if active
          if (shouldEmitVapour) {
            const faceW = mouthState ? mouthState.width * 3.5 : 160;
            particleSystemRef.current.emit(vapourEmitterPos.x, vapourEmitterPos.y, 14, faceW);

            if (activeObjectRef.current === 'cigar' && hookah3DSceneRef.current) {
              const footWorld = hookah3DSceneRef.current.getPrimaryCigarFootWorldPosition();
              const footScreen = hookah3DSceneRef.current.worldToScreen(footWorld);
              particleSystemRef.current.emit(footScreen.x, footScreen.y, 6, 45);
            }
          }

          // Update particle physics
          particleSystemRef.current.update();

          // RENDER 3D HOOKAH SCENE
          const basePos = hookahManagerRef.current.getBasePosition();
          if (hookah3DSceneRef.current) {
            hookah3DSceneRef.current.update(basePos, pipePos, appState, timestampMs);
          }

          // RENDER 2D OVERLAY
          if (overlayCanvas) {
            const ctx = overlayCanvas.getContext('2d');
            if (ctx) {
              ctx.clearRect(0, 0, width, height);

              const isSipping = appState === 'SIP_DETECTED' || appState === 'PIPE_AT_MOUTH';

              // Backup Hookah graphic if 3D scene is inactive (Hookah mode only)
              if (!hookah3DSceneRef.current && activeObjectRef.current === 'hookah') {
                drawHookahBase(ctx, basePos, isSipping, timestampMs);
                drawHoseAndMouthpiece(ctx, basePos, pipePos, appState);
              }

              // Draw Vapour Particles (Smoke overlay) with Phase 7 theme harmonization
              particleSystemRef.current.draw(ctx, currentSkinRef.current);

              // Draw Spatial Visual Interaction Target (Phase 5.14)
              if (activeObjectRef.current === 'cigar' && hookah3DSceneRef.current) {
                const cigarWorld = hookah3DSceneRef.current.getPrimaryCigarWorldPosition();
                const cigarScreen = hookah3DSceneRef.current.worldToScreen(cigarWorld);
                const isCigarHeld = hookah3DSceneRef.current.isPrimaryCigarGrabbed();
                drawTargetingReticle(
                  ctx,
                  { x: cigarScreen.x, y: cigarScreen.y, targetX: cigarScreen.x, targetY: cigarScreen.y, angle: 0, isHeld: isCigarHeld },
                  pinchState,
                  140,
                  timestampMs
                );
              } else {
                drawTargetingReticle(ctx, pipePos, pinchState, effectiveGrabRadius, timestampMs);
              }

              // Draw Spatial Success Feedback Ripples (Phase 5.15)
              drawRipples(ctx, timestampMs);

              // Draw Hand & Face Landmark debugging if enabled
              if (showLandmarksRef.current) {
                drawLandmarksDebug(ctx, pinchState, mouthState, pipePos, effectiveGrabRadius, basePos);
              }

              // Phase 8: Draw Smoke Ritual Debug Visual Overlays if in debug mode
              if (isDebug) {
                if (pinchState) {
                  ctx.save();
                  // Hand influence radius dashed circle
                  ctx.beginPath();
                  ctx.arc(pinchState.pinchCenter.x, pinchState.pinchCenter.y, SMOKE_RITUAL_CONFIG.handInfluenceRadius, 0, Math.PI * 2);
                  ctx.strokeStyle = pinchState.isPinching
                    ? 'rgba(255, 215, 0, 0.5)'
                    : (pinchState.isOpenHand ? 'rgba(0, 229, 255, 0.5)' : 'rgba(255, 255, 255, 0.25)');
                  ctx.lineWidth = 1.5;
                  ctx.setLineDash([5, 5]);
                  ctx.stroke();

                  // Hand velocity vector line
                  if (pinchState.velocity && Math.hypot(pinchState.velocity.x, pinchState.velocity.y) > 20) {
                    const vScale = 0.12;
                    ctx.beginPath();
                    ctx.moveTo(pinchState.pinchCenter.x, pinchState.pinchCenter.y);
                    ctx.lineTo(pinchState.pinchCenter.x + pinchState.velocity.x * vScale, pinchState.pinchCenter.y + pinchState.velocity.y * vScale);
                    ctx.strokeStyle = '#ffd700';
                    ctx.lineWidth = 2;
                    ctx.setLineDash([]);
                    ctx.stroke();
                  }
                  ctx.restore();
                }

                if (ritualTelemetry.isActive) {
                  ctx.save();
                  if (ritualTelemetry.isVortexActive) {
                    const vc = smokeRitualManagerRef.current.getVortexCenter();
                    ctx.beginPath();
                    ctx.arc(vc.x, vc.y, SMOKE_RITUAL_CONFIG.vortexRadius, 0, Math.PI * 2);
                    ctx.strokeStyle = 'rgba(255, 105, 180, 0.65)';
                    ctx.lineWidth = 2;
                    ctx.setLineDash([4, 4]);
                    ctx.stroke();
                  }
                  if (ritualTelemetry.activeShape === 'RING') {
                    const rc = smokeRitualManagerRef.current.getRingCenter();
                    ctx.beginPath();
                    ctx.arc(rc.x, rc.y, 45, 0, Math.PI * 2);
                    ctx.strokeStyle = 'rgba(255, 215, 0, 0.85)';
                    ctx.lineWidth = 2;
                    ctx.setLineDash([]);
                    ctx.stroke();
                  }
                  ctx.restore();
                }
              }
            }
          }
        }

        animFrameIdRef.current = requestAnimationFrame(loop);
      };

      animFrameIdRef.current = requestAnimationFrame(loop);
    }

    async function initAR() {
      try {
        setLoadingStep('Connecting camera hardware...');
        if (videoRef.current) {
          webcamServiceRef.current.setOnStreamEnded(() => {
            if (isMounted) {
              setErrorMsg('Camera stream was disconnected or suspended by the operating system.');
            }
          });
          const success = await webcamServiceRef.current.initialize(videoRef.current);
          if (!success) throw new Error('Webcam initialization failed');
        }

        if (!isMounted) return;

        setLoadingStep('Initializing 3D Lounge Scene...');
        if (webglCanvasRef.current) {
          webglCanvasRef.current.width = window.innerWidth;
          webglCanvasRef.current.height = window.innerHeight;
          try {
            hookah3DSceneRef.current = new Hookah3DScene(webglCanvasRef.current);
            if (activeObjectRef.current) {
              hookah3DSceneRef.current.setActiveObject(activeObjectRef.current);
            }
            if (currentSkinRef.current) {
              hookah3DSceneRef.current.applySkin(currentSkinRef.current);
            }
            if (currentEnvironmentRef.current) {
              hookah3DSceneRef.current.applyEnvironment(currentEnvironmentRef.current);
            }
            onCigarManagerReadyRef.current?.(hookah3DSceneRef.current.getCigarCollectionManager());
          } catch (e) {
            console.warn('3D WebGL scene initialization failed, using 2D fallback:', e);
          }
        }

        setLoadingStep('Loading AI Vision models (Hand & Face)...');
        await Promise.all([
          handTrackerRef.current.initialize(),
          faceTrackerRef.current.initialize()
        ]);

        if (!isMounted) return;

        if (!handTrackerRef.current.isReady()) {
          throw new Error('AI Vision model failed to load. Please verify your internet connection and retry.');
        }

        setLoadingStep('Calibrating AR Spatial Pipeline...');
        setIsLoading(false);
        startRenderLoop();
      } catch (err: unknown) {
        console.error('AR initialization error:', err);
        if (isMounted) {
          const message = err instanceof Error ? err.message : 'Failed to start AR experience';
          setErrorMsg(message);
          setIsLoading(false);
        }
      }
    }

    initAR();

    const handleResize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;

      if (webglCanvasRef.current) {
        webglCanvasRef.current.width = width;
        webglCanvasRef.current.height = height;
      }
      if (overlayCanvasRef.current) {
        overlayCanvasRef.current.width = width;
        overlayCanvasRef.current.height = height;
      }
      if (hookah3DSceneRef.current) {
        hookah3DSceneRef.current.resize(width, height);
      }
    };

    const handleOrientationChange = () => {
      setTimeout(handleResize, 120);
    };

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        handleResize();
      }
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleOrientationChange);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    const vidEl = videoRef.current;
    const webcam = webcamServiceRef.current;
    const handTracker = handTrackerRef.current;
    const faceTracker = faceTrackerRef.current;

    return () => {
      isMounted = false;
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleOrientationChange);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      webcam.setOnStreamEnded(null);
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
      }
      if (rvfcId !== null && vidEl && 'cancelVideoFrameCallback' in vidEl) {
        (vidEl as unknown as { cancelVideoFrameCallback: (id: number) => void }).cancelVideoFrameCallback(rvfcId);
      }
      if (hookah3DSceneRef.current) {
        hookah3DSceneRef.current.destroy();
      }
      handTracker.destroy();
      faceTracker.destroy();
      webcam.stop();
    };
  }, [isStarted, retryKey, triggerRipple, drawTargetingReticle, drawRipples]);

  // Handle manual smoke trigger
  useEffect(() => {
    if (manualSmokeTrigger) {
      if (overlayCanvasRef.current) {
        const cx = overlayCanvasRef.current.width / 2;
        const cy = overlayCanvasRef.current.height * 0.5;
        particleSystemRef.current.emit(cx, cy, 30, 180);
        AudioManager.getInstance().playExhaleCue();
        hookahManagerRef.current.setAppState('VAPOUR');
        onStateChange('VAPOUR');
      }
      onManualSmokeTriggered();
    }
  }, [manualSmokeTrigger, onStateChange, onManualSmokeTriggered]);

  // Handle reset trigger from ControlDock
  useEffect(() => {
    if (resetTrigger && resetTrigger > 0) {
      smokeRitualManagerRef.current.reset();
      hookahManagerRef.current.reset();
      particleSystemRef.current.clear();
      activeRipplesRef.current = [];
      AudioManager.getInstance().updateState('IDLE', false);
      if (hookah3DSceneRef.current) {
        hookah3DSceneRef.current.resetPrimaryCigar();
        hookah3DSceneRef.current.getCigarCollectionManager()?.resetDisplayCigar();
      }
      onStateChange('IDLE');
    }
  }, [resetTrigger, onStateChange]);

  return (
    <div style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', overflow: 'hidden', backgroundColor: '#000' }}>
      {/* Fullscreen Webcam Video */}
      <video
        ref={videoRef}
        playsInline
        muted
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          transform: 'scaleX(-1)' // Selfie mirroring
        }}
      />

      {/* Photorealistic 3D WebGL Canvas Layer */}
      <canvas
        ref={webglCanvasRef}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
          zIndex: 10
        }}
      />

      {/* 2D Vapour Particles & Spatial Feedback Overlay Canvas Layer */}
      <canvas
        ref={overlayCanvasRef}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
          zIndex: 15
        }}
      />

      {/* Subtle Spatial Viewfinder Overlays */}
      <AnimatedGridPattern />

      {/* Cinematic Immersive Loading Screen */}
      {isStarted && isLoading && <LoadingExperience loadingStep={loadingStep} />}

      {/* High-End Camera Permission Error Dialog */}
      {errorMsg && (
        <CameraPermission
          errorMsg={errorMsg}
          onRetry={handleRetry}
          isDebugMode={isDebugMode}
        />
      )}
    </div>
  );
};
