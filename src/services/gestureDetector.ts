import type { PinchState, Point2D } from '../types/hookah';
import { OneEuroFilter2D } from '../utils/oneEuroFilter';

export class GestureDetector {
  // Hysteresis thresholds (normalized to palm length L_palm)
  private readonly PINCH_ACQUIRE_RATIO = 0.32;
  private readonly PINCH_RELEASE_RATIO = 0.46;

  // Fist thresholds
  private readonly FIST_ACQUIRE_SCORE = 0.72;
  private readonly FIST_RELEASE_SCORE = 0.50;

  // Temporal confirmation window (frames)
  private readonly GRAB_CONFIRM_MIN_FRAMES = 2;
  private readonly RELEASE_CONFIRM_MIN_FRAMES = 3;

  // Tracking loss grace period (milliseconds)
  private readonly GRACE_PERIOD_MS = 250;

  // Motion prediction forward horizon (seconds)
  private readonly PREDICTION_TIME_SEC = 0.018;

  // Adaptive smoothing filter for grab anchor
  private anchorFilter = new OneEuroFilter2D(1.2, 0.008, 1.0);

  // Pre-allocated landmark buffer pool to eliminate 2,500+ GC allocations/second
  private readonly screenLandmarksBuffer: Point2D[] = Array.from({ length: 21 }, () => ({ x: 0, y: 0 }));

  // Hand locking state
  private isHandLocked = false;
  private lockedHandedness: string | null = null;
  private lockedPalmPosition: Point2D | null = null;

  // Temporal confirmation state
  private confirmedIsGrabbing = false;
  private confirmedIsPinch = false;
  private confirmedIsFist = false;
  private consecutiveGrabFrames = 0;
  private consecutiveReleaseFrames = 0;

  // Grace period state
  private lastValidTrackingTime = 0;
  private lastStablePinchState: PinchState | null = null;

  // Velocity state
  private lastFilteredAnchor: Point2D | null = null;
  private lastFilteredTime = 0;
  private filteredVelocity: Point2D = { x: 0, y: 0 };

  reset(): void {
    this.anchorFilter.reset();
    this.isHandLocked = false;
    this.lockedHandedness = null;
    this.lockedPalmPosition = null;
    this.confirmedIsGrabbing = false;
    this.confirmedIsPinch = false;
    this.confirmedIsFist = false;
    this.consecutiveGrabFrames = 0;
    this.consecutiveReleaseFrames = 0;
    this.lastValidTrackingTime = 0;
    this.lastStablePinchState = null;
    this.lastFilteredAnchor = null;
    this.lastFilteredTime = 0;
    this.filteredVelocity = { x: 0, y: 0 };
  }

  detectPinch(
    landmarksList: Array<Array<{ x: number; y: number; z?: number }>>,
    canvasWidth: number,
    canvasHeight: number,
    isMirrored: boolean = true,
    handednessList?: Array<Array<{ categoryName: string; score: number }>>,
    timestampMs: number = performance.now(),
    pipePos?: { x: number; y: number; isHeld: boolean }
  ): PinchState | null {
    // 1. Handle No Hands / Tracking Loss
    if (!landmarksList || landmarksList.length === 0) {
      if (pipePos?.isHeld && this.lastStablePinchState) {
        const elapsed = timestampMs - this.lastValidTrackingTime;
        if (elapsed < this.GRACE_PERIOD_MS) {
          // Grace period: keep last stable grab to prevent 1-frame drop
          return {
            ...this.lastStablePinchState,
            isGrabbing: true,
            trackingStable: false,
            confidence: Math.max(0.1, 0.5 * (1 - elapsed / this.GRACE_PERIOD_MS))
          };
        }
      }
      this.reset();
      return null;
    }

    // 2. Select Active Hand (Multi-hand management & lock)
    let selectedIndex = 0;

    if (landmarksList.length > 1) {
      if (this.isHandLocked && pipePos?.isHeld && this.lockedPalmPosition) {
        // Locked mode: track the hand with best spatial continuity and matching handedness
        let bestScore = -Infinity;
        for (let i = 0; i < landmarksList.length; i++) {
          const lms = landmarksList[i];
          if (!lms || lms.length < 21) continue;

          const palmNormX = (lms[0].x + lms[5].x + lms[9].x + lms[17].x) * 0.25;
          const palmNormY = (lms[0].y + lms[5].y + lms[9].y + lms[17].y) * 0.25;
          const dx = palmNormX - this.lockedPalmPosition.x;
          const dy = palmNormY - this.lockedPalmPosition.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          const handednessName = handednessList?.[i]?.[0]?.categoryName;
          const matchesHandedness = handednessName && handednessName === this.lockedHandedness;

          // Continuity score: closer in space is preferred, handedness bonus
          const score = -dist * 2.0 + (matchesHandedness ? 0.35 : 0);
          if (score > bestScore) {
            bestScore = score;
            selectedIndex = i;
          }
        }
      } else if (pipePos) {
        // Candidate selection prior to grab: pick hand closest to pipe mouthpiece
        let minPipeDistSq = Infinity;
        for (let i = 0; i < landmarksList.length; i++) {
          const lms = landmarksList[i];
          if (!lms || lms.length < 21) continue;

          const palmNormX = (lms[0].x + lms[5].x + lms[9].x + lms[17].x) * 0.25;
          const palmNormY = (lms[0].y + lms[5].y + lms[9].y + lms[17].y) * 0.25;
          const palmScrX = (isMirrored ? 1 - palmNormX : palmNormX) * canvasWidth;
          const palmScrY = palmNormY * canvasHeight;
          const dx = palmScrX - pipePos.x;
          const dy = palmScrY - pipePos.y;
          const distSq = dx * dx + dy * dy;

          if (distSq < minPipeDistSq) {
            minPipeDistSq = distSq;
            selectedIndex = i;
          }
        }
      }
    }

    const landmarks = landmarksList[selectedIndex];
    if (!landmarks || landmarks.length < 21) {
      return null;
    }

    const handednessCategory = handednessList?.[selectedIndex]?.[0];
    const handednessName = handednessCategory?.categoryName;
    const handednessScore = handednessCategory?.score ?? 0.9;

    // 3. Extract Key Landmarks
    const wristRaw = landmarks[0];
    const thumbTipRaw = landmarks[4];
    const indexMcpRaw = landmarks[5];
    const indexTipRaw = landmarks[8];
    const middleMcpRaw = landmarks[9];
    const middleTipRaw = landmarks[12];
    const ringMcpRaw = landmarks[13];
    const ringTipRaw = landmarks[16];
    const pinkyMcpRaw = landmarks[17];
    const pinkyTipRaw = landmarks[20];

    // Compute Anatomical Hand Scale (Wrist to Middle MCP distance)
    const dxMcp = middleMcpRaw.x - wristRaw.x;
    const dyMcp = middleMcpRaw.y - wristRaw.y;
    const dzMcp = (middleMcpRaw.z ?? 0) - (wristRaw.z ?? 0);
    const palmLengthNorm = Math.sqrt(dxMcp * dxMcp + dyMcp * dyMcp + dzMcp * dzMcp);
    const handScale = Math.max(0.06, Math.min(0.55, palmLengthNorm));

    // Fill pre-allocated visual screen space buffer (0 heap allocations)
    for (let i = 0; i < 21; i++) {
      const pt = landmarks[i];
      this.screenLandmarksBuffer[i].x = (isMirrored ? 1 - pt.x : pt.x) * canvasWidth;
      this.screenLandmarksBuffer[i].y = pt.y * canvasHeight;
    }

    const wrist = this.screenLandmarksBuffer[0];
    const thumbTip = this.screenLandmarksBuffer[4];
    const indexMcp = this.screenLandmarksBuffer[5];
    const indexTip = this.screenLandmarksBuffer[8];
    const middleMcp = this.screenLandmarksBuffer[9];
    const pinkyMcp = this.screenLandmarksBuffer[17];

    const palmCenterNormX = (wristRaw.x + indexMcpRaw.x + middleMcpRaw.x + pinkyMcpRaw.x) * 0.25;
    const palmCenterNormY = (wristRaw.y + indexMcpRaw.y + middleMcpRaw.y + pinkyMcpRaw.y) * 0.25;

    // 4. Multi-Signal Pinch Detection with Scale Normalization & Hysteresis
    const dxPinch = thumbTipRaw.x - indexTipRaw.x;
    const dyPinch = thumbTipRaw.y - indexTipRaw.y;
    const dzPinch = (thumbTipRaw.z ?? 0) - (indexTipRaw.z ?? 0);
    const pinchDist3D = Math.sqrt(dxPinch * dxPinch + dyPinch * dyPinch + dzPinch * dzPinch * 0.5);

    const pinchRatio = pinchDist3D / handScale;

    // Hysteresis: strict acquire, forgiving hold
    const rawIsPinch = this.confirmedIsPinch
      ? pinchRatio < this.PINCH_RELEASE_RATIO
      : pinchRatio < this.PINCH_ACQUIRE_RATIO;

    const pinchConfidence = Math.max(
      0,
      Math.min(
        1,
        (this.PINCH_RELEASE_RATIO - pinchRatio) /
          (this.PINCH_RELEASE_RATIO - this.PINCH_ACQUIRE_RATIO * 0.7)
      )
    );

    // 5. Robust Fist Detection (Finger Curls & Anti-Pointing Filter)
    const computeCurl = (
      tipX: number, tipY: number,
      mcpX: number, mcpY: number
    ): number => {
      const dxTip = tipX - wristRaw.x;
      const dyTip = tipY - wristRaw.y;
      const dTipWrist = Math.sqrt(dxTip * dxTip + dyTip * dyTip);

      const dxMcp = mcpX - wristRaw.x;
      const dyMcp = mcpY - wristRaw.y;
      const dMcpWrist = Math.sqrt(dxMcp * dxMcp + dyMcp * dyMcp);

      return Math.max(0, Math.min(1, (dMcpWrist * 1.25 - dTipWrist) / (dMcpWrist * 0.65)));
    };

    const curlIndex = computeCurl(indexTipRaw.x, indexTipRaw.y, indexMcpRaw.x, indexMcpRaw.y);
    const curlMiddle = computeCurl(middleTipRaw.x, middleTipRaw.y, middleMcpRaw.x, middleMcpRaw.y);
    const curlRing = computeCurl(ringTipRaw.x, ringTipRaw.y, ringMcpRaw.x, ringMcpRaw.y);
    const curlPinky = computeCurl(pinkyTipRaw.x, pinkyTipRaw.y, pinkyMcpRaw.x, pinkyMcpRaw.y);

    // Curled fingers count (threshold 0.52)
    let curledCount = 0;
    if (curlIndex > 0.52) curledCount++;
    if (curlMiddle > 0.52) curledCount++;
    if (curlRing > 0.52) curledCount++;
    if (curlPinky > 0.52) curledCount++;

    // Calculate weighted curl score
    let fistScore = curlIndex * 0.3 + curlMiddle * 0.25 + curlRing * 0.25 + curlPinky * 0.2;

    // Reject pointing finger pose: index must not be extended
    if (curlIndex < 0.35) {
      fistScore = 0;
    }

    const rawIsFist = this.confirmedIsFist
      ? fistScore >= this.FIST_RELEASE_SCORE && curledCount >= 3
      : fistScore >= this.FIST_ACQUIRE_SCORE && curledCount >= 3 && curlIndex >= 0.45;

    const fistConfidence = Math.max(
      0,
      Math.min(
        1,
        (fistScore - this.FIST_RELEASE_SCORE) /
          (this.FIST_ACQUIRE_SCORE - this.FIST_RELEASE_SCORE + 0.1)
      )
    );

    // 6. Combined Raw Gesture & Confidence
    const rawIsGrabbing = rawIsPinch || rawIsFist;
    const gestureConfidence = Math.max(pinchConfidence, fistConfidence);

    // 7. Temporal Confirmation (Anti-flicker window)
    if (rawIsGrabbing) {
      this.consecutiveGrabFrames++;
      this.consecutiveReleaseFrames = 0;
    } else {
      this.consecutiveReleaseFrames++;
      this.consecutiveGrabFrames = 0;
    }

    if (!this.confirmedIsGrabbing) {
      if (this.consecutiveGrabFrames >= this.GRAB_CONFIRM_MIN_FRAMES) {
        this.confirmedIsGrabbing = true;
      }
    } else {
      if (this.consecutiveReleaseFrames >= this.RELEASE_CONFIRM_MIN_FRAMES) {
        this.confirmedIsGrabbing = false;
      }
    }

    this.confirmedIsPinch = this.confirmedIsGrabbing && rawIsPinch;
    this.confirmedIsFist = this.confirmedIsGrabbing && rawIsFist && !rawIsPinch;
    const isOpenHand = !this.confirmedIsGrabbing && !rawIsPinch && !rawIsFist && (curledCount <= 1) && (fistScore < 0.38);

    // 8. Grab Anchor Calculation & Seamless Blend
    const pinchAnchorX = (thumbTip.x + indexTip.x) * 0.5;
    const pinchAnchorY = (thumbTip.y + indexTip.y) * 0.5;

    const fistAnchorX = (indexMcp.x + middleMcp.x + pinkyMcp.x + wrist.x) * 0.25;
    const fistAnchorY = (indexMcp.y + middleMcp.y + pinkyMcp.y + wrist.y) * 0.25;

    // Blend between pinch and fist anchors to prevent sudden teleportation
    const fistWeight = Math.max(0, Math.min(1, (fistScore - 0.35) / 0.35));
    const blendedAnchorX = (1 - fistWeight) * pinchAnchorX + fistWeight * fistAnchorX;
    const blendedAnchorY = (1 - fistWeight) * pinchAnchorY + fistWeight * fistAnchorY;

    // 9. Adaptive Smoothing with One Euro Filter
    const filteredAnchor = this.anchorFilter.filter(
      blendedAnchorX,
      blendedAnchorY,
      timestampMs
    );

    // 10. Conservative Motion Prediction
    if (this.lastFilteredAnchor && this.lastFilteredTime > 0) {
      const dt = Math.max((timestampMs - this.lastFilteredTime) / 1000, 0.001);
      const rawVx = (filteredAnchor.x - this.lastFilteredAnchor.x) / dt;
      const rawVy = (filteredAnchor.y - this.lastFilteredAnchor.y) / dt;

      // Clamp speed magnitude to prevent prediction overshoot
      const speedSq = rawVx * rawVx + rawVy * rawVy;
      if (speedSq > 2250000) { // 1500 * 1500
        const speed = Math.sqrt(speedSq);
        const scale = 1500 / speed;
        this.filteredVelocity.x = this.filteredVelocity.x * 0.6 + (rawVx * scale) * 0.4;
        this.filteredVelocity.y = this.filteredVelocity.y * 0.6 + (rawVy * scale) * 0.4;
      } else {
        this.filteredVelocity.x = this.filteredVelocity.x * 0.6 + rawVx * 0.4;
        this.filteredVelocity.y = this.filteredVelocity.y * 0.6 + rawVy * 0.4;
      }
    }

    this.lastFilteredAnchor = { ...filteredAnchor };
    this.lastFilteredTime = timestampMs;

    const finalAnchor: Point2D = {
      x: filteredAnchor.x + this.filteredVelocity.x * this.PREDICTION_TIME_SEC,
      y: filteredAnchor.y + this.filteredVelocity.y * this.PREDICTION_TIME_SEC
    };

    // 11. Hand Lock Management
    if (this.confirmedIsGrabbing) {
      this.isHandLocked = true;
      this.lockedHandedness = handednessName || null;
      this.lockedPalmPosition = { x: palmCenterNormX, y: palmCenterNormY };
    } else if (!pipePos?.isHeld && !this.confirmedIsGrabbing) {
      this.isHandLocked = false;
      this.lockedHandedness = null;
      this.lockedPalmPosition = null;
    }

    // 12. Build Output State
    this.lastValidTrackingTime = timestampMs;

    const result: PinchState = {
      isPinching: this.confirmedIsPinch,
      isGrabbing: this.confirmedIsGrabbing,
      isFist: this.confirmedIsFist,
      isOpenHand,
      pinchCenter: finalAnchor,
      distance: pinchDist3D,
      thumbTip,
      indexTip,
      confidence: handednessScore,
      handScale,
      gestureConfidence,
      trackingStable: true,
      handedness:
        handednessName === 'Left'
          ? 'Left'
          : handednessName === 'Right'
            ? 'Right'
            : 'Unknown',
      velocity: { ...this.filteredVelocity },
      activeHandIndex: selectedIndex,
      rawLandmarks: this.screenLandmarksBuffer
    };

    this.lastStablePinchState = result;
    return result;
  }
}


