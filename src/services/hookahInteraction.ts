import type { AppState, MouthState, PinchState, PipePosition, Point2D } from '../types/hookah';
import { SMOKE_RITUAL_CONFIG } from '../config/smokeRitual';

export class HookahInteractionManager {
  private pipeState: PipePosition;
  private appState: AppState = 'IDLE';
  
  // Distances in screen pixels (scalable based on canvas size and hand scale)
  private grabRadius = 120; // Default radius to grab mouthpiece
  private currentEffectiveGrabRadius = 120;
  private mouthProximityRadius = 85; // Default radius to trigger PIPE_AT_MOUTH
  private lerpFactor = 0.42; // Fast responsive tracking (source jitter filtered by One Euro Filter)
  private angleLerp = 0.16; // Angle smoothing to prevent rotation snap

  private baseRestPos: Point2D = { x: 260, y: 520 };
  private vapourStartTime: number | null = null;
  private sipCompleted: boolean = false;
  private isInteractionBlocked: boolean = false;

  setInteractionBlocked(blocked: boolean) {
    this.isInteractionBlocked = blocked;
    if (blocked && this.pipeState) {
      this.pipeState.isHeld = false;
    }
  }

  releaseHold() {
    if (this.pipeState) {
      this.pipeState.isHeld = false;
      this.pipeState.targetX = this.baseRestPos.x + 40;
      this.pipeState.targetY = this.baseRestPos.y - 120;
    }
  }

  getIsInteractionBlocked(): boolean {
    return this.isInteractionBlocked;
  }

  constructor(defaultWidth: number = 1280, defaultHeight: number = 720) {
    this.baseRestPos = {
      x: Math.max(180, defaultWidth * 0.2),
      y: defaultHeight * 0.72
    };
    this.pipeState = {
      x: this.baseRestPos.x + 40,
      y: this.baseRestPos.y - 120,
      targetX: this.baseRestPos.x + 40,
      targetY: this.baseRestPos.y - 120,
      angle: 0,
      isHeld: false
    };
    this.updateBasePosition(defaultWidth, defaultHeight);
  }

  updateBasePosition(canvasWidth: number, canvasHeight: number) {
    // Position hookah base nicely in bottom left region
    this.baseRestPos = {
      x: Math.max(180, canvasWidth * 0.2),
      y: canvasHeight * 0.72
    };

    // If pipe is not held, send target back to base rest position
    if (this.pipeState && !this.pipeState.isHeld) {
      this.pipeState.targetX = this.baseRestPos.x + 40;
      this.pipeState.targetY = this.baseRestPos.y - 120;
    }
  }

  getBasePosition(): Point2D {
    return { ...this.baseRestPos };
  }

  getPipePosition(): PipePosition {
    return { ...this.pipeState };
  }

  getEffectiveGrabRadius(): number {
    return this.currentEffectiveGrabRadius;
  }

  getAppState(): AppState {
    return this.appState;
  }

  update(
    pinchState: PinchState | null,
    mouthState: MouthState | null,
    canvasWidth: number,
    canvasHeight: number
  ): { appState: AppState; shouldEmitVapour: boolean; vapourEmitterPos: Point2D } {
    this.updateBasePosition(canvasWidth, canvasHeight);

    let shouldEmitVapour = false;
    let vapourEmitterPos: Point2D = mouthState ? mouthState.center : { x: canvasWidth / 2, y: canvasHeight / 2 };

    const currentTime = performance.now();

    // 1. Handle Pipe Grab / Release logic with Hand-Scale Adaptivity
    if (this.isInteractionBlocked) {
      this.pipeState.isHeld = false;
      this.currentEffectiveGrabRadius = this.grabRadius;
    } else if (pinchState) {
      const distToPipe = Math.hypot(
        pinchState.pinchCenter.x - this.pipeState.x,
        pinchState.pinchCenter.y - this.pipeState.y
      );

      // Adaptive grab radius proportional to user hand scale
      this.currentEffectiveGrabRadius = pinchState.handScale
        ? Math.min(185, Math.max(85, pinchState.handScale * canvasHeight * 1.05))
        : this.grabRadius;

      if (pinchState.isGrabbing) {
        // Can grab if already holding OR if grab occurs within adaptive radius
        if (this.pipeState.isHeld || distToPipe < this.currentEffectiveGrabRadius) {
          this.pipeState.isHeld = true;
          this.pipeState.targetX = pinchState.pinchCenter.x;
          this.pipeState.targetY = pinchState.pinchCenter.y;
        }
      } else {
        // Confirmed release of grab
        this.pipeState.isHeld = false;
      }
    } else {
      this.pipeState.isHeld = false;
      this.currentEffectiveGrabRadius = this.grabRadius;
    }

    // 2. Responsive smooth movement
    if (this.pipeState.isHeld) {
      this.pipeState.x += (this.pipeState.targetX - this.pipeState.x) * this.lerpFactor;
      this.pipeState.y += (this.pipeState.targetY - this.pipeState.y) * this.lerpFactor;
    } else {
      // Gently float back to rest position near hookah top
      const restX = this.baseRestPos.x + 40;
      const restY = this.baseRestPos.y - 130;
      this.pipeState.x += (restX - this.pipeState.x) * 0.08;
      this.pipeState.y += (restY - this.pipeState.y) * 0.08;
    }

    // Smoothly rotate angle towards mouth (prevents snap)
    if (mouthState) {
      const dx = mouthState.center.x - this.pipeState.x;
      const dy = mouthState.center.y - this.pipeState.y;
      const targetAngle = Math.atan2(dy, dx);
      // Lerp via shortest angular path
      let da = targetAngle - this.pipeState.angle;
      if (da > Math.PI) da -= Math.PI * 2;
      if (da < -Math.PI) da += Math.PI * 2;
      this.pipeState.angle += da * this.angleLerp;
    }

    // 3. Proximity check with scale-adaptive mouth radius
    let isPipeNearMouth = false;
    if (mouthState && this.pipeState.isHeld) {
      const distToMouth = Math.hypot(
        this.pipeState.x - mouthState.center.x,
        this.pipeState.y - mouthState.center.y
      );

      const effectiveMouthRadius = pinchState?.handScale
        ? Math.min(135, Math.max(70, pinchState.handScale * canvasHeight * 0.75))
        : this.mouthProximityRadius;

      if (distToMouth < effectiveMouthRadius) {
        isPipeNearMouth = true;
      }
    }

    // 4. State Machine Transitions
    // Check VAPOUR active duration & transition to SMOKE_RITUAL
    if (this.appState === 'VAPOUR') {
      shouldEmitVapour = true;

      if (!this.vapourStartTime) {
        this.vapourStartTime = currentTime;
      }

      // Phase 8: After intentional initial exhale burst (~950ms), activate SMOKE_RITUAL
      if (currentTime - this.vapourStartTime > SMOKE_RITUAL_CONFIG.activationDelayMs) {
        this.appState = 'SMOKE_RITUAL';
      }
    } else if (this.appState === 'SMOKE_RITUAL') {
      // Continue emitting for an initial window (~2.2s total from start) so user has thick plume to play with
      if (this.vapourStartTime && currentTime - this.vapourStartTime < 2200) {
        shouldEmitVapour = true;
      } else {
        shouldEmitVapour = false;
      }
    } else if (this.sipCompleted && mouthState && mouthState.isOpen) {
      // INSTANT EXHALE TRIGGER: Moment mouth opens after sipping, start vapour instantly!
      this.appState = 'VAPOUR';
      this.vapourStartTime = currentTime;
      shouldEmitVapour = true;
    } else if (this.pipeState.isHeld) {
      if (isPipeNearMouth) {
        // Pipe is at mouth
        this.appState = 'PIPE_AT_MOUTH';

        // Check if mouth opens to take a sip OR if user holds at mouth
        if (mouthState && mouthState.isOpen) {
          this.appState = 'SIP_DETECTED';
          this.sipCompleted = true;
        } else if (this.sipCompleted) {
          this.appState = 'SIP_DETECTED';
        }
      } else {
        this.appState = 'PIPE_GRABBED';
      }
    } else {
      // Pipe not held
      if (pinchState || mouthState) {
        this.appState = 'HAND_DETECTED';
      } else {
        this.appState = 'IDLE';
      }
    }

    return {
      appState: this.appState,
      shouldEmitVapour,
      vapourEmitterPos
    };
  }

  completeRitual(pinchState: PinchState | null) {
    if (this.appState === 'SMOKE_RITUAL') {
      this.appState = this.pipeState.isHeld
        ? 'PIPE_GRABBED'
        : (pinchState ? 'HAND_DETECTED' : 'IDLE');
      this.vapourStartTime = null;
      this.sipCompleted = false;
    }
  }

  setAppState(state: AppState) {
    this.appState = state;
  }

  reset() {
    this.appState = 'IDLE';
    this.pipeState.isHeld = false;
    this.pipeState.x = this.baseRestPos.x + 40;
    this.pipeState.y = this.baseRestPos.y - 120;
    this.pipeState.targetX = this.pipeState.x;
    this.pipeState.targetY = this.pipeState.y;
    this.pipeState.angle = 0;
    this.vapourStartTime = null;
    this.sipCompleted = false;
  }
}

