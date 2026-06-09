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
  type: OscillatorType = 'sine',
) {
  getAudioContext().then((ac) => {
    if (!ac) return;
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.type = type;
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
