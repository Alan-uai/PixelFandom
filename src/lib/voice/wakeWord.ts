export const DEFAULT_WAKE_WORDS = ['psycho', 'psyco'];

type WakeWordCallback = () => void;

export class WakeWordDetector {
  private wakeWords: string[];
  private onWake: WakeWordCallback | null = null;
  private isListening = false;
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private source: MediaStreamAudioSourceNode | null = null;
  private stream: MediaStream | null = null;
  private animationId: number | null = null;
  private consecutiveActivations = 0;
  private readonly ACTIVATION_THRESHOLD = 0.08;
  private readonly REQUIRED_CONSECUTIVE = 3;
  private readonly LOW_FREQ_CUTOFF = 50;
  private readonly HIGH_FREQ_CUTOFF = 300;

  constructor(wakeWords?: string[]) {
    this.wakeWords = wakeWords || DEFAULT_WAKE_WORDS;
  }

  get active(): boolean {
    return this.isListening;
  }

  setWakeWord(word: string) {
    this.wakeWords = [word.toLowerCase()];
  }

  onWakeDetected(callback: WakeWordCallback) {
    this.onWake = callback;
  }

  async start(stream?: MediaStream) {
    if (this.isListening) return;

    try {
      if (!stream) {
        this.stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            sampleRate: 16000,
            channelCount: 1,
            echoCancellation: true,
            noiseSuppression: true,
          },
        });
      } else {
        this.stream = stream;
      }

      this.audioContext = new AudioContext({ sampleRate: 16000 });
      this.source = this.audioContext.createMediaStreamSource(this.stream);

      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 2048;
      this.source.connect(this.analyser);

      this.isListening = true;
      this.detectLoop();
    } catch {
      this.isListening = false;
    }
  }

  stop() {
    this.isListening = false;
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
    this.consecutiveActivations = 0;
    this.source?.disconnect();
    this.audioContext?.close();
    this.stream?.getTracks().forEach((t) => t.stop());
    this.source = null;
    this.audioContext = null;
    this.stream = null;
    this.analyser = null;
  }

  private detectLoop() {
    if (!this.isListening || !this.analyser) return;

    const data = new Uint8Array(this.analyser.frequencyBinCount);
    this.analyser.getByteFrequencyData(data);

    if (this.detectWakeWordPattern(data)) {
      this.consecutiveActivations++;
      if (this.consecutiveActivations >= this.REQUIRED_CONSECUTIVE) {
        this.onWake?.();
        this.consecutiveActivations = 0;
      }
    } else {
      this.consecutiveActivations = Math.max(0, this.consecutiveActivations - 1);
    }

    this.animationId = requestAnimationFrame(() => this.detectLoop());
  }

  private detectWakeWordPattern(data: Uint8Array): boolean {
    const binCount = data.length;
    const nyquist = 8000;
    const lowBin = Math.floor((this.LOW_FREQ_CUTOFF / nyquist) * (binCount / 2));
    const highBin = Math.floor((this.HIGH_FREQ_CUTOFF / nyquist) * (binCount / 2));

    let lowFreqEnergy = 0;
    let highFreqEnergy = 0;

    for (let i = lowBin; i < highBin && i < binCount; i++) {
      lowFreqEnergy += data[i];
    }

    const highStart = Math.floor((1000 / nyquist) * (binCount / 2));
    for (let i = highStart; i < binCount; i++) {
      highFreqEnergy += data[i];
    }

    const lowAvg = lowFreqEnergy / (highBin - lowBin);
    const highAvg = highFreqEnergy / (binCount - highStart);

    const ratio = highAvg > 0 ? lowAvg / highAvg : 0;

    return ratio > this.ACTIVATION_THRESHOLD * 10;
  }
}
