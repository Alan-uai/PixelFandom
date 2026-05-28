export const DEFAULT_WAKE_WORDS = ['xwiki'];

type WakeWordCallback = () => void;

export class WakeWordDetector {
  private recognition: any;
  private wakeWords: string[];
  private onWake: WakeWordCallback | null = null;
  private isListening = false;
  private restartTimeout: ReturnType<typeof setTimeout> | null = null;

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

  async start() {
    if (this.isListening) return;

    const SpeechRecognitionAPI = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognitionAPI) {
      throw new Error('Speech recognition not supported in this browser');
    }

    const recognition = new SpeechRecognitionAPI() as {
      continuous: boolean;
      interimResults: boolean;
      lang: string;
      maxAlternatives: number;
      onresult: ((event: any) => void) | null;
      onerror: (() => void) | null;
      onend: (() => void) | null;
      start(): void;
      stop(): void;
      abort(): void;
    };

    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'pt-BR';
    recognition.maxAlternatives = 3;

    recognition.onresult = (event: any) => {
      const text = Array.from(event.results as { 0: { transcript: string } }[])
        .map((r) => r[0].transcript)
        .join(' ')
        .toLowerCase();

      if (this.wakeWords.some((w) => text.includes(w))) {
        this.onWake?.();
      }
    };

    recognition.onerror = () => {
      this.stop();
    };

    recognition.onend = () => {
      if (this.isListening) {
        this.restartTimeout = setTimeout(() => {
          if (this.isListening) {
            try { recognition.start(); } catch {}
          }
        }, 100);
      }
    };

    recognition.start();
    this.recognition = recognition as any;
    this.isListening = true;
  }

  stop() {
    this.isListening = false;

    if (this.restartTimeout) {
      clearTimeout(this.restartTimeout);
      this.restartTimeout = null;
    }

    if (this.recognition) {
      this.recognition.onresult = null;
      this.recognition.onerror = null;
      this.recognition.onend = null;
      try { this.recognition.abort(); } catch {}
      this.recognition = null;
    }
  }
}
