export interface VoiceProfileData {
  version: number;
  meanSpectrum: number[];
  spectra: number[][];
  wakeWordSpectrum: number[];
  fftSize: number;
  sampleRate: number;
  createdAt: string;
  textsRecorded: number;
}

export const TRAINING_TEXTS = [
  'O rato roeu a roupa do rei de Roma.',
  'A vida é feita de escolhas e consequências.',
  'Hoje o sol brilha forte no jardim.',
  'Preciso organizar meus pensamentos com calma.',
  'Assistente, me ajude a refletir sobre o meu dia.',
];

const STORAGE_KEY = 'pixelfandom_voice_profile';

export class VoiceProfile {
  private profile: VoiceProfileData | null = null;
  private fftSize = 2048;

  get isEnrolled(): boolean {
    return this.profile !== null && this.profile.meanSpectrum.length > 0;
  }

  get data(): VoiceProfileData | null {
    return this.profile;
  }

  loadFromStorage(): boolean {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        this.profile = JSON.parse(stored);
        return true;
      }
    } catch {
      // ignore
    }
    return false;
  }

  saveToStorage() {
    if (this.profile) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.profile));
      } catch {
        // ignore
      }
    }
  }

  load(data: VoiceProfileData) {
    this.profile = data;
  }

  reset() {
    this.profile = null;
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  }

  async enroll(
    onProgress: (textIndex: number, phase: 'recording' | 'processing' | 'done') => void
  ): Promise<VoiceProfileData> {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false },
    });

    const audioContext = new AudioContext({ sampleRate: 16000 });
    const source = audioContext.createMediaStreamSource(stream);
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = this.fftSize;
    source.connect(analyser);

    const allSpectra: number[][] = [];
    const bufferLength = analyser.frequencyBinCount;

    for (let i = 0; i < TRAINING_TEXTS.length; i++) {
      onProgress(i, 'recording');
      const frames = await this.recordFrames(analyser, bufferLength, 3000);
      onProgress(i, 'processing');

      for (const frame of frames) {
        allSpectra.push(this.normalizeSpectrum(frame));
      }

      onProgress(i, 'done');
      await this.sleep(300);
    }

    onProgress(TRAINING_TEXTS.length, 'recording');
    const wakeWordFrames = await this.recordFrames(analyser, bufferLength, 2000);
    onProgress(TRAINING_TEXTS.length, 'processing');

    const wakeWordSpectrum = this.normalizeSpectrum(this.averageSpectra(wakeWordFrames));

    stream.getTracks().forEach((t) => t.stop());
    audioContext.close();

    const meanSpectrum = this.averageSpectra(allSpectra);

    this.profile = {
      version: 1,
      meanSpectrum: Array.from(meanSpectrum),
      spectra: allSpectra,
      wakeWordSpectrum: Array.from(wakeWordSpectrum),
      fftSize: this.fftSize,
      sampleRate: 16000,
      createdAt: new Date().toISOString(),
      textsRecorded: TRAINING_TEXTS.length,
    };

    this.saveToStorage();
    return this.profile;
  }

  private recordFrames(
    analyser: AnalyserNode,
    bufferLength: number,
    durationMs: number
  ): Promise<number[][]> {
    return new Promise((resolve) => {
      const frames: number[][] = [];
      const freqData = new Float32Array(bufferLength);
      const interval = 100;
      let elapsed = 0;

      const capture = () => {
        analyser.getFloatFrequencyData(freqData);
        frames.push(Array.from(freqData));
        elapsed += interval;

        if (elapsed < durationMs) {
          setTimeout(capture, interval);
        } else {
          resolve(frames);
        }
      };

      capture();
    });
  }

  private averageSpectra(spectra: number[][]): number[] {
    if (spectra.length === 0) return [];
    const len = spectra[0].length;
    const avg = new Float32Array(len);
    for (const frame of spectra) {
      for (let i = 0; i < len; i++) {
        avg[i] += frame[i];
      }
    }
    for (let i = 0; i < len; i++) {
      avg[i] /= spectra.length;
    }
    return Array.from(avg);
  }

  private normalizeSpectrum(spectrum: number[]): number[] {
    const linear = spectrum.map((v) => Math.pow(10, v / 20));
    let norm = 0;
    for (const v of linear) {
      norm += v * v;
    }
    norm = Math.sqrt(norm);
    if (norm > 0) {
      for (let i = 0; i < linear.length; i++) {
        linear[i] /= norm;
      }
    }
    return linear;
  }

  getSimilarity(frequencyData: Float32Array): number {
    if (!this.profile) return 0;
    const linear: number[] = [];
    for (let i = 0; i < frequencyData.length; i++) {
      linear.push(Math.pow(10, frequencyData[i] / 20));
    }
    let norm = 0;
    for (const v of linear) {
      norm += v * v;
    }
    norm = Math.sqrt(norm);
    if (norm > 0) {
      for (let i = 0; i < linear.length; i++) {
        linear[i] /= norm;
      }
    }
    const mean = this.profile.meanSpectrum;
    const minLen = Math.min(linear.length, mean.length);
    let dot = 0;
    let normA = 0;
    let normB = 0;
    for (let i = 0; i < minLen; i++) {
      dot += linear[i] * mean[i];
      normA += linear[i] * linear[i];
      normB += mean[i] * mean[i];
    }
    const denom = Math.sqrt(normA) * Math.sqrt(normB);
    return denom > 0 ? dot / denom : 0;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((r) => setTimeout(r, ms));
  }
}
