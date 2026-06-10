let ctx: AudioContext | null = null;

async function getAudioContext(): Promise<AudioContext | null> {
  if (ctx) {
    if (ctx.state === 'suspended') await ctx.resume();
    return ctx;
  }
  try {
    ctx = new AudioContext();
    return ctx;
  } catch {
    return null;
  }
}

function playTone(
  frequency: number,
  endFrequency: number,
  duration: number,
  volume: number,
  type: string = 'sine',
) {
  getAudioContext().then((ac) => {
    if (!ac) return;
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.type = type as OscillatorNode['type'];
    osc.frequency.setValueAtTime(frequency, ac.currentTime);
    osc.frequency.linearRampToValueAtTime(endFrequency, ac.currentTime + duration);
    gain.gain.setValueAtTime(volume, ac.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + duration);
    osc.connect(gain);
    gain.connect(ac.destination);
    osc.start(ac.currentTime);
    osc.stop(ac.currentTime + duration);
  });
}

export function playHoverSound() {
  playTone(300, 600, 0.06, 0.05, 'sine');
}

export function playClickSound() {
  playTone(900, 100, 0.04, 0.12, 'square');
}

export function playRevealSound() {
  playTone(150, 250, 0.2, 0.08, 'sine');
}

export function playSplashSound() {
  getAudioContext().then((ac) => {
    if (!ac) return;
    const now = ac.currentTime;

    [261.63, 329.63, 392.00, 523.25].forEach((freq, i) => {
      const osc = ac.createOscillator();
      const gain = ac.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + i * 0.12);
      gain.gain.setValueAtTime(0, now + i * 0.12);
      gain.gain.linearRampToValueAtTime(0.08, now + i * 0.12 + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.12 + 0.6);
      osc.connect(gain);
      gain.connect(ac.destination);
      osc.start(now + i * 0.12);
      osc.stop(now + i * 0.12 + 0.7);
    });
  });
}

export function playSuccessSound() {
  playTone(500, 1000, 0.12, 0.15, 'sine');
}

export function playGravitationalWaveSound() {
  getAudioContext().then((ac) => {
    if (!ac) return;
    const now = ac.currentTime;

    const osc1 = ac.createOscillator();
    const gain1 = ac.createGain();
    osc1.type = 'sawtooth';
    osc1.frequency.setValueAtTime(20, now);
    osc1.frequency.exponentialRampToValueAtTime(70, now + 2);
    osc1.frequency.exponentialRampToValueAtTime(35, now + 3.5);
    gain1.gain.setValueAtTime(0.06, now);
    gain1.gain.linearRampToValueAtTime(0.12, now + 1.5);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 3.5);

    const filter1 = ac.createBiquadFilter();
    filter1.type = 'lowpass';
    filter1.frequency.setValueAtTime(80, now);
    filter1.frequency.linearRampToValueAtTime(350, now + 2);
    filter1.frequency.linearRampToValueAtTime(150, now + 3.5);
    osc1.connect(filter1);
    filter1.connect(gain1);
    gain1.connect(ac.destination);
    osc1.start(now);
    osc1.stop(now + 3.5);

    const osc2 = ac.createOscillator();
    const gain2 = ac.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(80, now + 0.3);
    osc2.frequency.exponentialRampToValueAtTime(500, now + 2);
    osc2.frequency.exponentialRampToValueAtTime(700, now + 3);
    gain2.gain.setValueAtTime(0, now + 0.3);
    gain2.gain.linearRampToValueAtTime(0.025, now + 1.5);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 3);

    const filter2 = ac.createBiquadFilter();
    filter2.type = 'bandpass';
    filter2.frequency.setValueAtTime(150, now + 0.3);
    filter2.frequency.linearRampToValueAtTime(800, now + 3);
    filter2.Q.value = 5;
    osc2.connect(filter2);
    filter2.connect(gain2);
    gain2.connect(ac.destination);
    osc2.start(now + 0.3);
    osc2.stop(now + 3.2);
  });
}

export function playBorderRevealSound() {
  playTone(300, 700, 0.25, 0.08, 'sine');
  setTimeout(() => playTone(500, 900, 0.25, 0.06, 'sine'), 120);
  setTimeout(() => playTone(750, 1100, 0.35, 0.05, 'sine'), 240);
}

export function playWavePulse() {
  playTone(40, 25, 0.4, 0.04, 'sine');
}
