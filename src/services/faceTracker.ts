// Face Tracker Service — Created by Saidarshan.K
import { FilesetResolver, FaceLandmarker } from '@mediapipe/tasks-vision';

export class FaceTrackerService {
  private faceLandmarker: FaceLandmarker | null = null;
  private isInitializing = false;
  private isDetecting = false;
  private lastTimestampMs = -1;

  async initialize(): Promise<void> {
    if (this.faceLandmarker || this.isInitializing) return;
    this.isInitializing = true;

    try {
      const vision = await FilesetResolver.forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm'
      );

      this.faceLandmarker = await FaceLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath:
            'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task',
          delegate: 'GPU'
        },
        runningMode: 'VIDEO',
        numFaces: 1
      });
      console.log('FaceLandmarker initialized successfully');
    } catch (err) {
      console.error('Failed to initialize FaceLandmarker GPU:', err);
      try {
        const vision = await FilesetResolver.forVisionTasks(
          'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm'
        );
        this.faceLandmarker = await FaceLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath:
              'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task',
            delegate: 'CPU'
          },
          runningMode: 'VIDEO',
          numFaces: 1
        });
      } catch (fallbackErr) {
        console.error('FaceLandmarker CPU fallback failed:', fallbackErr);
      }
    } finally {
      this.isInitializing = false;
    }
  }

  detect(videoElement: HTMLVideoElement, timestampMs: number) {
    if (!this.faceLandmarker || this.isDetecting) return null;

    // Enforce strictly monotonically increasing timestamps for MediaPipe VIDEO mode
    const safeTimestamp = timestampMs <= this.lastTimestampMs ? this.lastTimestampMs + 0.001 : timestampMs;
    this.lastTimestampMs = safeTimestamp;

    this.isDetecting = true;
    try {
      return this.faceLandmarker.detectForVideo(videoElement, safeTimestamp);
    } catch (e) {
      console.warn('Error during face detection:', e);
      return null;
    } finally {
      this.isDetecting = false;
    }
  }

  isReady(): boolean {
    return this.faceLandmarker !== null;
  }

  destroy(): void {
    if (this.faceLandmarker) {
      try {
        this.faceLandmarker.close();
      } catch (e) {
        console.warn('Error closing FaceLandmarker:', e);
      }
      this.faceLandmarker = null;
    }
    this.isDetecting = false;
    this.lastTimestampMs = -1;
  }
}
