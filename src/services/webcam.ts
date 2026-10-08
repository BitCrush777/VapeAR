// Webcam Service — Created by Saidarshan.K
// Production Hardened Camera Stream Capture with Multiple Constraint Fallbacks

export class WebcamService {
  private videoElement: HTMLVideoElement | null = null;
  private stream: MediaStream | null = null;
  private onStreamEndedCallback: (() => void) | null = null;

  public setOnStreamEnded(cb: (() => void) | null): void {
    this.onStreamEndedCallback = cb;
  }

  async initialize(videoElement: HTMLVideoElement): Promise<boolean> {
    this.videoElement = videoElement;

    if (typeof window !== 'undefined' && window.isSecureContext === false && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
      throw new Error('Camera access requires an HTTPS connection. Please load this page over HTTPS.');
    }

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error('Webcam API is not supported in this browser environment. Ensure permissions are granted and WebRTC is available.');
    }

    // Try primary high-definition selfie constraint first, then graceful fallback
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user'
        },
        audio: false
      });
    } catch (primaryErr) {
      console.warn('Primary camera constraints failed, attempting fallback constraints:', primaryErr);
      try {
        this.stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false
        });
      } catch (fallbackErr) {
        console.error('All camera constraint attempts failed:', fallbackErr);
        throw fallbackErr;
      }
    }

    // Attach stream disconnect/suspension listeners to all video tracks
    this.stream.getTracks().forEach((track) => {
      track.onended = () => {
        console.warn('Camera video track ended unexpectedly');
        if (this.onStreamEndedCallback) {
          this.onStreamEndedCallback();
        }
      };
    });

    this.videoElement.srcObject = this.stream;

    return new Promise((resolve, reject) => {
      if (!this.videoElement) {
        resolve(false);
        return;
      }

      let isResolved = false;
      const timeoutId = setTimeout(() => {
        if (!isResolved) {
          isResolved = true;
          if (this.videoElement && this.videoElement.readyState >= 1) {
            resolve(true);
          } else {
            reject(new Error('Camera stream timed out while loading video metadata.'));
          }
        }
      }, 4000);

      const startPlay = () => {
        if (isResolved) return;
        isResolved = true;
        clearTimeout(timeoutId);

        if (this.videoElement) {
          this.videoElement
            .play()
            .then(() => resolve(true))
            .catch((playErr) => {
              console.warn('video.play() caught error, checking readyState:', playErr);
              resolve(this.isReady());
            });
        } else {
          resolve(false);
        }
      };

      if (this.videoElement.readyState >= 1) {
        startPlay();
      } else {
        this.videoElement.onloadedmetadata = startPlay;
      }
    });
  }

  stop(): void {
    if (this.stream) {
      this.stream.getTracks().forEach((track) => {
        track.onended = null;
        track.stop();
      });
      this.stream = null;
    }
    if (this.videoElement) {
      this.videoElement.onloadedmetadata = null;
      this.videoElement.srcObject = null;
    }
  }

  isReady(): boolean {
    return (
      !!this.videoElement &&
      this.videoElement.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA
    );
  }
}
