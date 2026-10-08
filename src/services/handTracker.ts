// Hand Tracker Service — Created by Saidarshan.K
import { FilesetResolver, HandLandmarker, type HandLandmarkerResult } from '@mediapipe/tasks-vision';

export type { HandLandmarkerResult };

export class HandTrackerService {
  private handLandmarker: HandLandmarker | null = null;
  private isInitializing = false;
  private isDetecting = false;
  private lastTimestampMs = -1;
  private lastInferenceTimeMs = 0;
  private inferenceCount = 0;
  private fpsWindowStartTime = 0;
  private currentInferenceFps = 0;

  async initialize(): Promise<void> {
    if (this.handLandmarker || this.isInitializing) return;
    this.isInitializing = true;

    try {
      const vision = await FilesetResolver.forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm'
      );

      this.handLandmarker = await HandLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath:
            'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task',
          delegate: 'GPU'
        },
        runningMode: 'VIDEO',
        numHands: 2,
        minHandDetectionConfidence: 0.5,
        minHandPresenceConfidence: 0.5,
        minTrackingConfidence: 0.5
      });
      console.log('HandLandmarker initialized successfully');
    } catch (err) {
      console.error('Failed to initialize HandLandmarker:', err);
      // Fallback to CPU if GPU fails
      try {
        const vision = await FilesetResolver.forVisionTasks(
          'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm'
        );
        this.handLandmarker = await HandLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath:
              'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task',
            delegate: 'CPU'
          },
          runningMode: 'VIDEO',
          numHands: 2,
          minHandDetectionConfidence: 0.5,
          minHandPresenceConfidence: 0.5,
          minTrackingConfidence: 0.5
        });
      } catch (fallbackErr) {
        console.error('HandLandmarker CPU fallback failed:', fallbackErr);
      }
    } finally {
      this.isInitializing = false;
    }
  }

  detect(videoElement: HTMLVideoElement, timestampMs: number): HandLandmarkerResult | null {
    if (!this.handLandmarker || this.isDetecting) return null;

    // Enforce strictly monotonically increasing timestamps for MediaPipe VIDEO mode
    const safeTimestamp = timestampMs <= this.lastTimestampMs ? this.lastTimestampMs + 0.001 : timestampMs;
    this.lastTimestampMs = safeTimestamp;

    this.isDetecting = true;
    const t0 = performance.now();
    try {
      const result = this.handLandmarker.detectForVideo(videoElement, safeTimestamp);
      const elapsed = performance.now() - t0;
      this.lastInferenceTimeMs = this.lastInferenceTimeMs === 0 ? elapsed : this.lastInferenceTimeMs * 0.8 + elapsed * 0.2;

      this.inferenceCount++;
      if (this.fpsWindowStartTime === 0) {
        this.fpsWindowStartTime = t0;
      } else if (t0 - this.fpsWindowStartTime >= 500) {
        this.currentInferenceFps = Math.round((this.inferenceCount * 1000) / (t0 - this.fpsWindowStartTime));
        this.inferenceCount = 0;
        this.fpsWindowStartTime = t0;
      }

      return result;
    } catch (e) {
      console.warn('Error during hand detection:', e);
      return null;
    } finally {
      this.isDetecting = false;
    }
  }

  getMetrics(): { inferenceTimeMs: number; inferenceFps: number } {
    return {
      inferenceTimeMs: Math.round(this.lastInferenceTimeMs * 10) / 10,
      inferenceFps: this.currentInferenceFps
    };
  }

  isReady(): boolean {
    return this.handLandmarker !== null;
  }

  destroy(): void {
    if (this.handLandmarker) {
      try {
        this.handLandmarker.close();
      } catch (e) {
        console.warn('Error closing HandLandmarker:', e);
      }
      this.handLandmarker = null;
    }
    this.isDetecting = false;
    this.lastTimestampMs = -1;
    this.lastInferenceTimeMs = 0;
    this.inferenceCount = 0;
    this.fpsWindowStartTime = 0;
    this.currentInferenceFps = 0;
  }
}
