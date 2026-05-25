import { VoiceProfile } from './voiceProfile';

export type AudioConstraints = {
  noiseSuppression?: boolean;
  echoCancellation?: boolean;
  autoGainControl?: boolean;
  sampleRate?: number;
};

export class AudioStreamer {
  private context: AudioContext | null = null;
  private stream: MediaStream | null = null;
  private workletNode: AudioWorkletNode | null = null;
  private source: MediaStreamAudioSourceNode | null = null;
  public onAudio: ((base64: string) => void) | null = null;
  private isActive = false;
  private sampleRate = 16000;
  private publicMode = false;
  private energyThreshold = 0;
  private isCalibrating = false;
  private calibrationSamples: number[] = [];
  private calibrationTimer: ReturnType<typeof setTimeout> | null = null;
  private calibratingResolve: (() => void) | null = null;
  private voiceProfile: VoiceProfile | null = null;
  private voiceFilterEnabled = false;
  private voiceFilterThreshold = 0.78;

  async start(
    opts?: {
      deviceId?: string;
      constraints?: AudioConstraints;
      publicMode?: boolean;
      publicModeSensitivity?: number;
    }
  ) {
    if (this.isActive) return;
    this.isActive = true;

    const c = opts?.constraints || {};
    const publicMode = opts?.publicMode || false;
    this.publicMode = publicMode;

    const audioConstraints: MediaTrackConstraints = {
      sampleRate: c.sampleRate || this.sampleRate,
      channelCount: 1,
      echoCancellation: publicMode ? true : c.echoCancellation ?? true,
      noiseSuppression: publicMode ? true : c.noiseSuppression ?? true,
      autoGainControl: publicMode ? true : c.autoGainControl ?? true,
    };
    if (opts?.deviceId) {
      audioConstraints.deviceId = { exact: opts.deviceId };
    }

    this.stream = await navigator.mediaDevices.getUserMedia({
      audio: audioConstraints,
    });

    this.context = new AudioContext({ sampleRate: this.sampleRate });
    await this.context.audioWorklet.addModule(
      '/audio-processors/capture.worklet.js'
    );

    this.source = this.context.createMediaStreamSource(this.stream);
    this.workletNode = new AudioWorkletNode(
      this.context,
      'audio-capture-processor'
    );

    if (this.publicMode) {
      this.startCalibration(opts?.publicModeSensitivity ?? 5);
    }

    this.workletNode.port.onmessage = (e) => {
      if (!this.isActive) return;
      const float32 = e.data.data as Float32Array;

      if (this.publicMode) {
        const rms = this.calculateRMS(float32);
        if (this.isCalibrating) {
          this.calibrationSamples.push(rms);
          return;
        }
        if (this.energyThreshold > 0 && rms < this.energyThreshold) {
          return;
        }
      }

      if (
        this.voiceFilterEnabled &&
        this.voiceProfile?.isEnrolled &&
        this.context
      ) {
        const analyser = this.context.createAnalyser();
        analyser.fftSize = 2048;
        const freqData = new Float32Array(analyser.frequencyBinCount);
        analyser.getFloatFrequencyData(freqData);
        const similarity = this.voiceProfile.getSimilarity(freqData);
        if (similarity < this.voiceFilterThreshold) {
          return;
        }
      }

      const pcm16 = float32ToPcm16(float32);
      const base64 = arrayBufferToBase64(pcm16.buffer);
      this.onAudio?.(base64);
    };

    this.source.connect(this.workletNode);
  }

  setPublicMode(enabled: boolean, sensitivity?: number) {
    this.publicMode = enabled;
    if (enabled) {
      this.startCalibration(sensitivity ?? 5);
    } else {
      this.cancelCalibration();
      this.energyThreshold = 0;
    }
  }

  setVoiceProfile(profile: VoiceProfile | null) {
    this.voiceProfile = profile;
  }

  setVoiceFilter(enabled: boolean, threshold?: number) {
    this.voiceFilterEnabled = enabled;
    if (threshold !== undefined) {
      this.voiceFilterThreshold = threshold;
    }
  }

  private startCalibration(sensitivity: number) {
    if (this.isCalibrating) return;
    this.cancelCalibration();
    this.isCalibrating = true;
    this.calibrationSamples = [];
    this.energyThreshold = 0;

    this.calibrationTimer = setTimeout(() => {
      this.finishCalibration(sensitivity);
    }, 2000);
  }

  private cancelCalibration() {
    if (this.calibrationTimer !== null) {
      clearTimeout(this.calibrationTimer);
      this.calibrationTimer = null;
    }
    this.isCalibrating = false;
    this.calibrationSamples = [];
    if (this.calibratingResolve) {
      this.calibratingResolve();
      this.calibratingResolve = null;
    }
  }

  private finishCalibration(sensitivity: number) {
    this.calibrationTimer = null;
    this.isCalibrating = false;

    if (this.calibrationSamples.length === 0) {
      this.energyThreshold = 0.015;
      return;
    }

    const sorted = [...this.calibrationSamples].sort((a, b) => a - b);
    const noiseFloor = sorted[Math.floor(sorted.length * 0.2)] || 0.001;
    const maxRMS = sorted[sorted.length - 1] || noiseFloor;

    const multiplier = 3 + (sensitivity - 1) * (12 / 9);
    this.energyThreshold = Math.max(
      noiseFloor * multiplier,
      maxRMS * 0.25,
      0.008
    );

    if (this.calibratingResolve) {
      this.calibratingResolve();
      this.calibratingResolve = null;
    }
  }

  private calculateRMS(data: Float32Array): number {
    let sumSquares = 0;
    for (let i = 0; i < data.length; i++) {
      sumSquares += data[i] * data[i];
    }
    return Math.sqrt(sumSquares / data.length);
  }

  stop() {
    this.isActive = false;
    this.cancelCalibration();
    this.workletNode?.disconnect();
    this.source?.disconnect();
    this.stream?.getTracks().forEach((t) => t.stop());
    this.context?.close();
    this.workletNode = null;
    this.source = null;
    this.stream = null;
    this.context = null;
  }

  get active() {
    return this.isActive;
  }
}

export class AudioPlayer {
  private context: AudioContext | null = null;
  private gainNode: GainNode | null = null;
  private workletNode: AudioWorkletNode | null = null;
  private isReady = false;

  async init() {
    this.context = new AudioContext({ sampleRate: 24000 });
    await this.context.audioWorklet.addModule(
      '/audio-processors/playback.worklet.js'
    );

    this.gainNode = this.context.createGain();
    this.gainNode.gain.value = 1;
    this.gainNode.connect(this.context.destination);

    this.workletNode = new AudioWorkletNode(
      this.context,
      'pcm-playback-processor'
    );
    this.workletNode.connect(this.gainNode);
    this.isReady = true;
  }

  async playBase64(base64: string) {
    if (!this.isReady || !this.workletNode) return;
    if (this.context?.state === 'suspended') {
      await this.context.resume();
    }
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    const int16 = new Int16Array(bytes.buffer);
    const float32 = new Float32Array(int16.length);
    for (let i = 0; i < int16.length; i++) {
      float32[i] = int16[i] / 32768;
    }
    this.workletNode.port.postMessage({ type: 'audio', data: float32 });
  }

  interrupt() {
    this.workletNode?.port.postMessage({ type: 'interrupt' });
  }

  setVolume(volume: number) {
    if (this.gainNode) {
      this.gainNode.gain.value = Math.max(0, Math.min(1, volume / 100));
    }
  }

  close() {
    this.isReady = false;
    this.workletNode?.disconnect();
    this.gainNode?.disconnect();
    this.context?.close();
    this.workletNode = null;
    this.gainNode = null;
    this.context = null;
  }
}

function float32ToPcm16(float32: Float32Array): Int16Array {
  const int16 = new Int16Array(float32.length);
  for (let i = 0; i < float32.length; i++) {
    const s = Math.max(-1, Math.min(1, float32[i]));
    int16[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
  }
  return int16;
}

function arrayBufferToBase64(buffer: ArrayBufferLike): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}
