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

export function playSuccessSound() {
  playTone(500, 1000, 0.12, 0.15, 'sine');
}
