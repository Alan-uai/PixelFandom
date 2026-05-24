export class AudioStreamer {
  private context: AudioContext | null = null;
  private stream: MediaStream | null = null;
  private workletNode: AudioWorkletNode | null = null;
  private source: MediaStreamAudioSourceNode | null = null;
  public onAudio: ((base64: string) => void) | null = null;
  private isActive = false;

  async start() {
    if (this.isActive) return;
    this.isActive = true;

    this.stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        sampleRate: 16000,
        channelCount: 1,
        echoCancellation: true,
        noiseSuppression: true,
      },
    });

    this.context = new AudioContext({ sampleRate: 16000 });
    await this.context.audioWorklet.addModule('/audio-processors/capture.worklet.js');

    this.source = this.context.createMediaStreamSource(this.stream);
    this.workletNode = new AudioWorkletNode(this.context, 'audio-capture-processor');

    this.workletNode.port.onmessage = (e) => {
      if (!this.isActive) return;
      const float32 = e.data.data as Float32Array;
      const pcm16 = float32ToPcm16(float32);
      const base64 = arrayBufferToBase64(pcm16.buffer);
      this.onAudio?.(base64);
    };

    this.source.connect(this.workletNode);
  }

  stop() {
    this.isActive = false;
    this.workletNode?.disconnect();
    this.source?.disconnect();
    this.stream?.getTracks().forEach((t) => t.stop());
    this.context?.close();
    this.workletNode = null;
    this.source = null;
    this.stream = null;
    this.context = null;
  }

  get active() { return this.isActive; }
}

export class AudioPlayer {
  private context: AudioContext | null = null;
  private gainNode: GainNode | null = null;
  private workletNode: AudioWorkletNode | null = null;
  private isReady = false;

  async init() {
    this.context = new AudioContext({ sampleRate: 24000 });
    await this.context.audioWorklet.addModule('/audio-processors/playback.worklet.js');

    this.gainNode = this.context.createGain();
    this.gainNode.gain.value = 1;
    this.gainNode.connect(this.context.destination);

    this.workletNode = new AudioWorkletNode(this.context, 'pcm-playback-processor');
    this.workletNode.connect(this.gainNode);
    this.isReady = true;
  }

  playBase64(base64: string) {
    if (!this.isReady || !this.workletNode) return;
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
