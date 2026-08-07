/**
 * AudioLevels — singleton that collects live FFT data from every audio tap of
 * the voice system (microphone input, agent output) and exposes cheap,
 * per-frame smoothed levels for audio-reactive visuals.
 *
 * It never touches React state — the 3D orb pulls `sample()` inside its render
 * loop (via requestAnimationFrame / useFrame), so there are zero re-renders.
 */

export type LevelsChannel = 'input' | 'output'

export type AudioLevelsSnapshot = {
  /** Overall energy 0..1 (mean magnitude, all frequencies). */
  volume: number
  /** Low band 0..1 (≈20–200 Hz) — drives the heavy ferrofluid spikes. */
  bass: number
  /** Mid band 0..1 (≈200–2000 Hz) — voice body. */
  mid: number
  /** High band 0..1 (≈2000+ Hz) — sibilance/breathiness. */
  treble: number
  /** Spectral centroid 0..1 (0 = very dark, 1 = very bright timbre). */
  pitch: number
  /** 0..1 sustained activity with a hangover so visuals don't flicker. */
  inputActivity: number
  outputActivity: number
  /** Whether any analyser is currently registered/producing data. */
  live: boolean
  /** Number of registered taps. */
  taps: number
}

type Tap = {
  analyser: AnalyserNode
  data: Uint8Array<ArrayBuffer>
  sampleRate: number
  nyquist: number
  channel: LevelsChannel
}

const ATTACK_RATE = 14   // fast reaction when a new sound appears
const RELEASE_RATE = 5   // slow, liquid decay
const ACTIVITY_THRESHOLD = 0.022

function bandScore(data: Uint8Array, loBin: number, hiBin: number): number {
  if (hiBin <= loBin) return 0
  let sum = 0
  let count = 0
  const end = Math.min(hiBin, data.length)
  for (let i = loBin; i < end; i++) {
    sum += data[i]
    count++
  }
  return count ? sum / count / 255 : 0
}

class AudioLevels {
  private taps = new Map<AudioNode, Tap>()
  private values = {
    volume: 0,
    bass: 0,
    mid: 0,
    treble: 0,
    pitch: 0.35,
    inputActivity: 0,
    outputActivity: 0,
  }
  private lastSample = 0
  private reduced = false

  constructor() {
    if (typeof window !== 'undefined' && window.matchMedia) {
      this.reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    }
  }

  /**
   * Registers a tap: creates an AnalyserNode branching off `node` and starts
   * collecting it. Caller is responsible for the analyser → destination path
   * when throughput is required (the player re-wires gain → analyser →
   * destination).
   */
  register(channel: LevelsChannel, node: AudioNode, fftSize = 512): AnalyserNode {
    if (this.taps.has(node)) return this.taps.get(node)!.analyser
    const ctx = node.context
    const analyser = ctx.createAnalyser()
    analyser.fftSize = fftSize
    analyser.smoothingTimeConstant = 0.6
    const data = new Uint8Array(analyser.frequencyBinCount)
    node.connect(analyser)
    this.taps.set(node, { analyser, data, sampleRate: ctx.sampleRate, nyquist: ctx.sampleRate / 2, channel })
    return analyser
  }

  unregister(node: AudioNode) {
    this.taps.delete(node)
  }

  /** Computes levels, smoothing with fast attack / slow decay. Call ~60fps. */
  sample(): AudioLevelsSnapshot {
    const now = performance.now()
    const dt = Math.min(0.1, (now - this.lastSample) / 1000 || 0.016)
    this.lastSample = now

    let maxVolume = 0
    let maxBass = 0
    let maxMid = 0
    let maxTreble = 0
    let maxCentroid = 0
    let inputVol = 0
    let outputVol = 0

    for (const tap of this.taps.values()) {
      tap.analyser.getByteFrequencyData(tap.data)
      const n = tap.data.length
      const vol = bandScore(tap.data, 0, n)

      // Band edges anchored to actual sample-rate so 16 kHz input and 24 kHz
      // output taps are classified identically.
      const bassHi = Math.floor((200 / tap.nyquist) * n)
      const midLo = Math.floor((200 / tap.nyquist) * n)
      const midHi = Math.floor((2000 / tap.nyquist) * n)

      const bass = midHi > 0 ? bandScore(tap.data, 1, Math.max(bassHi, 2)) : 0
      const mid = midHi > midLo ? bandScore(tap.data, midLo, midHi) : 0
      const treble = n > midHi ? bandScore(tap.data, midHi, n) : 0

      // Spectral centroid (brightness of the timbre).
      let sum = 0
      let sumW = 0
      for (let i = 1; i < n; i++) {
        const w = tap.data[i]
        if (w > 0) { sum += w * (i / n); sumW += w }
      }
      const centroid = sumW > 0 ? sum / sumW : 0

      if (vol > maxVolume) maxVolume = vol
      if (bass > maxBass) maxBass = bass
      if (mid > maxMid) maxMid = mid
      if (treble > maxTreble) maxTreble = treble
      if (centroid > maxCentroid) maxCentroid = centroid

      if (tap.channel === 'input' && vol > inputVol) inputVol = vol
      if (tap.channel === 'output' && vol > outputVol) outputVol = vol
    }

    // Smooth with asymmetric attack/release for the liquid feel.
    const smooth = (cur: number, target: number) => {
      const rate = target > cur ? ATTACK_RATE : RELEASE_RATE
      return cur + (target - cur) * Math.min(1, dt * rate)
    }

    const v = this.values
    v.volume = smooth(v.volume, maxVolume)
    v.bass = smooth(v.bass, maxBass)
    v.mid = smooth(v.mid, maxMid)
    v.treble = smooth(v.treble, maxTreble)
    v.pitch = smooth(v.pitch, 0.2 + maxCentroid * 0.8)

    v.inputActivity = smooth(v.inputActivity, inputVol > ACTIVITY_THRESHOLD ? 1 : 0)
    v.outputActivity = smooth(v.outputActivity, outputVol > ACTIVITY_THRESHOLD ? 1 : 0)

    return {
      volume: v.volume,
      bass: v.bass,
      mid: v.mid,
      treble: v.treble,
      pitch: v.pitch,
      inputActivity: v.inputActivity,
      outputActivity: v.outputActivity,
      live: this.taps.size > 0 && maxVolume >= 0,
      taps: this.taps.size,
    }
  }

  clear() {
    this.taps.clear()
  }
}

export const audioLevels = new AudioLevels()