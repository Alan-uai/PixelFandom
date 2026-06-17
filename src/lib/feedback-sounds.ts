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

export function playBlackHoleSound() {
  getAudioContext().then((ac) => {
    if (!ac) return
    const now = ac.currentTime

    const osc = ac.createOscillator()
    const gain = ac.createGain()
    osc.type = 'sawtooth'
    osc.frequency.setValueAtTime(80, now)
    osc.frequency.exponentialRampToValueAtTime(12, now + 1.8)
    gain.gain.setValueAtTime(0.1, now)
    gain.gain.linearRampToValueAtTime(0.15, now + 0.5)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 2)

    const filter = ac.createBiquadFilter()
    filter.type = 'lowpass'
    filter.frequency.setValueAtTime(200, now)
    filter.frequency.exponentialRampToValueAtTime(30, now + 2)

    osc.connect(filter)
    filter.connect(gain)
    gain.connect(ac.destination)
    osc.start(now)
    osc.stop(now + 2)
  })
}

export function playLaserPulseSound() {
  getAudioContext().then((ac) => {
    if (!ac) return
    const now = ac.currentTime

    const osc = ac.createOscillator()
    const gain = ac.createGain()
    osc.type = 'square'
    osc.frequency.setValueAtTime(2200, now)
    osc.frequency.exponentialRampToValueAtTime(150, now + 0.12)
    gain.gain.setValueAtTime(0.08, now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15)

    const filter = ac.createBiquadFilter()
    filter.type = 'highpass'
    filter.frequency.setValueAtTime(800, now)

    osc.connect(filter)
    filter.connect(gain)
    gain.connect(ac.destination)
    osc.start(now)
    osc.stop(now + 0.15)
  })
}

export function playLightsaberHumSound(): () => void {
  let stopped = false
  let cleanup: (() => void) | null = null

  getAudioContext().then((ac) => {
    if (stopped || !ac) return
    const now = ac.currentTime

    const osc = ac.createOscillator()
    const gain = ac.createGain()
    osc.type = 'sawtooth'
    osc.frequency.setValueAtTime(110, now)

    const lfo = ac.createOscillator()
    const lfoGain = ac.createGain()
    lfo.type = 'sine'
    lfo.frequency.setValueAtTime(3, now)
    lfoGain.gain.setValueAtTime(15, now)
    lfo.connect(lfoGain)
    lfoGain.connect(osc.frequency)

    const filter = ac.createBiquadFilter()
    filter.type = 'bandpass'
    filter.frequency.setValueAtTime(300, now)
    filter.Q.value = 8

    gain.gain.setValueAtTime(0.06, now)
    gain.gain.linearRampToValueAtTime(0.02, now + 0.3)

    osc.connect(filter)
    filter.connect(gain)
    gain.connect(ac.destination)
    osc.start(now)
    lfo.start(now)

    cleanup = () => {
      if (stopped) return
      stopped = true
      try {
        gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.2)
        setTimeout(() => {
          try { osc.stop(ac.currentTime) } catch {/* noop */}
          try { lfo.stop(ac.currentTime) } catch {/* noop */}
        }, 250)
      } catch {/* noop */}
    }
  })

  return () => {
    stopped = true
    cleanup?.()
  }
}

export function playCrystalShatterSound() {
  getAudioContext().then((ac) => {
    if (!ac) return
    const now = ac.currentTime

    const bufferSize = ac.sampleRate * 0.5
    const buffer = ac.createBuffer(1, bufferSize, ac.sampleRate)
    const data = buffer.getChannelData(0)
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 3)
    }

    const noise = ac.createBufferSource()
    noise.buffer = buffer

    const gain = ac.createGain()
    gain.gain.setValueAtTime(0.12, now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5)

    const filter = ac.createBiquadFilter()
    filter.type = 'highpass'
    filter.frequency.setValueAtTime(2000, now)
    filter.frequency.exponentialRampToValueAtTime(200, now + 0.5)

    noise.connect(filter)
    filter.connect(gain)
    gain.connect(ac.destination)
    noise.start(now)
    noise.stop(now + 0.5)
  })
}
