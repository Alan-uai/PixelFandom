'use client'

import { useEffect, useRef, useState, useCallback, memo } from 'react'
import { motion, useAnimation } from 'framer-motion'
import SplashSVGText from './splash-svg-text'
import SplashWaveRings from './splash-wave-rings'
import SplashGlow from './splash-glow'
import {
  playSplashSound,
  playBlackHoleSound,
  playLaserPulseSound,
  playLightsaberHumSound,
  playCrystalShatterSound,
} from '@/lib/feedback-sounds'

type Phase = 'black' | 'rings' | 'glow' | 'particles' | 'outro'

const PHASES: Phase[] = ['black', 'rings', 'glow', 'particles', 'outro']
const DURATIONS: Record<Phase, number> = {
  black: 500,
  rings: 3500,
  glow: 2000,
  particles: 1500,
  outro: 800,
}
const TOTAL = PHASES.reduce((a, p) => a + DURATIONS[p], 0)

const CUMULATIVE = PHASES.map((p, i) => ({
  phase: p,
  start: PHASES.slice(0, i).reduce((a, p) => a + DURATIONS[p], 0),
  end: PHASES.slice(0, i + 1).reduce((a, p) => a + DURATIONS[p], 0),
}))

function getPhaseAt(elapsed: number): Phase {
  for (const c of CUMULATIVE) {
    if (elapsed >= c.start && elapsed < c.end) return c.phase
  }
  return 'outro'
}

function getProgressInPhase(elapsed: number, phase: Phase): number {
  const c = CUMULATIVE.find((x) => x.phase === phase)
  if (!c) return 1
  return Math.min((elapsed - c.start) / (c.end - c.start), 1)
}

interface SplashScreenProps {
  onComplete: () => void
}

interface ParticleSeed {
  seed: number
  speed: number
  offsetX: number
  offsetY: number
}

let particleCache: ParticleSeed[] | null = null

function updateParticleMask(overlay: HTMLDivElement | null, progress: number) {
  if (!overlay) return

  const grads: string[] = []
  const t = Math.min(progress, 1)

  if (!particleCache || particleCache.length === 0) {
    particleCache = Array.from({ length: 25 }, () => ({
      seed: Math.random(),
      speed: 0.3 + Math.random() * 0.7,
      offsetX: Math.random() * 100,
      offsetY: Math.random() * 100,
    }))
  }

  for (const p of particleCache) {
    const angle = t * p.speed * Math.PI * 4 + p.seed * 10
    const px = p.offsetX + Math.sin(angle + p.seed * 7) * 20
    const py = p.offsetY + Math.cos(angle * 1.3 + p.seed * 3) * 20
    const pr = Math.max(2, t * 12 * (0.3 + p.seed * 0.7))
    const pAlpha = Math.min(t * (0.5 + p.seed * 0.5), 1)

    grads.push(
      `radial-gradient(circle ${pr}px at ${px}% ${py}%, rgba(0,0,0,${pAlpha}) 0%, transparent ${pr * 0.8}px, transparent 100%)`,
    )
  }

  const value = grads.join(', ')
  overlay.style.setProperty('mask-image', value)
  overlay.style.setProperty('-webkit-mask-image', value)
}

const SplashScreen = memo(function SplashScreen({ onComplete }: SplashScreenProps) {
  const [ready, setReady] = useState(false)
  const [shouldShow, setShouldShow] = useState(true)
  const [phase, setPhase] = useState<Phase>('black')
  const [exiting, setExiting] = useState(false)
  const [glowActive, setGlowActive] = useState(false)
  const [ringCount, setRingCount] = useState(0)
  const [ringSpeed, setRingSpeed] = useState(1)
  const [ringsProgress, setRingsProgress] = useState(0)

  const heroControls = useAnimation()
  const taglineControls = useAnimation()

  const speedRef = useRef(1)
  const elapsedRef = useRef(0)
  const rafRef = useRef(0)
  const completeRef = useRef(false)
  const startTimeRef = useRef(0)
  const lastTimeRef = useRef(0)
  const overlayRef = useRef<HTMLDivElement>(null)
  const clickCountRef = useRef(0)
  const clickTimerRef = useRef<ReturnType<typeof setTimeout>>()
  const soundPlayedRef = useRef({ black: false, glow: false, particles: false })
  const lightsaberStopRef = useRef<(() => void) | null>(null)
  const stableOnComplete = useRef(onComplete)
  const ringCountRef = useRef(0)
  const lastPulseIdxRef = useRef(-1)

  const finish = useCallback(() => {
    if (completeRef.current) return
    completeRef.current = true
    stableOnComplete.current()
  }, [])

  const tick = useCallback(
    (timestamp: number) => {
      if (completeRef.current) return

      if (!startTimeRef.current) startTimeRef.current = timestamp
      if (!lastTimeRef.current) lastTimeRef.current = timestamp

      const realDelta = Math.min(timestamp - lastTimeRef.current, 50)
      lastTimeRef.current = timestamp

      elapsedRef.current += realDelta * speedRef.current
      const elapsed = elapsedRef.current

      if (elapsed >= TOTAL) {
        setExiting(true)
        setTimeout(finish, 700)
        return
      }

      const newPhase = getPhaseAt(elapsed)
      setPhase(newPhase)

      if (newPhase === 'rings') {
        const p = getProgressInPhase(elapsed, 'rings')
        setRingsProgress(p)
        const count = Math.min(6, Math.floor(p * 6) + 1)
        if (count !== ringCountRef.current) {
          ringCountRef.current = count
          setRingCount(count)
          if (count > (lastPulseIdxRef.current + 1)) {
            lastPulseIdxRef.current = count
            playLaserPulseSound()
          }
        }
        const spd = 0.5 + p * 1.5
        setRingSpeed(spd)
      }

      if (newPhase === 'glow' || newPhase === 'particles') {
        setRingsProgress(1)
      }

      if (newPhase === 'glow') {
        setGlowActive(true)
      }

      if (newPhase === 'particles') {
        const p = getProgressInPhase(elapsed, 'particles')
        updateParticleMask(overlayRef.current, p)
      }

      rafRef.current = requestAnimationFrame(tick)
    },
    [finish],
  )

  useEffect(() => {
    try {
      const stored = localStorage.getItem('pf_splash')
      if (stored) {
        const diff = Date.now() - new Date(stored).getTime()
        if (diff < 72 * 60 * 60 * 1000) {
          setShouldShow(false)
          setReady(true)
          return
        }
      }
    } catch {
      /* localStorage unavailable */
    }
    setShouldShow(true)
    setReady(true)
  }, [])

  useEffect(() => {
    if (!shouldShow && ready) finish()
  }, [shouldShow, ready, finish])

  useEffect(() => {
    if (!shouldShow || !ready) return
    rafRef.current = requestAnimationFrame(tick)
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [shouldShow, ready, tick])

  useEffect(() => {
    playSplashSound()
  }, [])

  useEffect(() => {
    if (phase === 'black' && !soundPlayedRef.current.black) {
      soundPlayedRef.current.black = true
      playBlackHoleSound()
    }
    if (phase === 'glow' && !soundPlayedRef.current.glow) {
      soundPlayedRef.current.glow = true
      lightsaberStopRef.current = playLightsaberHumSound()
    }
    if (phase === 'particles' && !soundPlayedRef.current.particles) {
      soundPlayedRef.current.particles = true
      playCrystalShatterSound()
    }
  }, [phase])

  useEffect(() => {
    if (phase !== 'glow') return

    const h1 = document.querySelector<HTMLElement>('h1')
    const splashText = document.querySelector<HTMLElement>('.splash-text-container')
    if (h1 && splashText) {
      const heroRect = h1.getBoundingClientRect()
      const splashRect = splashText.getBoundingClientRect()
      const tx = heroRect.left - splashRect.left
      const ty = heroRect.top - splashRect.top
      const sx = heroRect.width / splashRect.width
      const sy = heroRect.height / splashRect.height

      heroControls.start({
        x: tx, y: ty, scaleX: sx, scaleY: sy,
        opacity: 0,
        transition: {
          x: { duration: 1.8, ease: 'easeInOut' },
          y: { duration: 1.8, ease: 'easeInOut' },
          scaleX: { duration: 1.8, ease: 'easeInOut' },
          scaleY: { duration: 1.8, ease: 'easeInOut' },
          opacity: { duration: 0.3, ease: 'easeOut', delay: 1.5 },
        },
      })
    }

    taglineControls.start({
      opacity: 0,
      y: -10,
      transition: { duration: 0.8, ease: 'easeOut' },
    })
  }, [phase, heroControls, taglineControls])

  useEffect(() => {
    particleCache = null
  }, [])

  useEffect(() => {
    stableOnComplete.current = onComplete
  }, [onComplete])

  useEffect(() => {
    return () => {
      if (clickTimerRef.current) clearTimeout(clickTimerRef.current)
      if (lightsaberStopRef.current) lightsaberStopRef.current()
    }
  }, [])

  const accelerate = useCallback(() => {
    speedRef.current = 3
  }, [])

  const skipToGlow = useCallback(() => {
    const glowStart = CUMULATIVE.find((c) => c.phase === 'glow')!.start
    elapsedRef.current = glowStart + DURATIONS.glow * 0.2
    speedRef.current = 1.5
  }, [])

  const handleClick = useCallback(() => {
    clickCountRef.current += 1
    if (clickCountRef.current === 1) {
      if (clickTimerRef.current) clearTimeout(clickTimerRef.current)
      clickTimerRef.current = setTimeout(() => {
        accelerate()
        clickCountRef.current = 0
      }, 280)
    } else {
      if (clickTimerRef.current) clearTimeout(clickTimerRef.current)
      clickCountRef.current = 0
      skipToGlow()
    }
  }, [accelerate, skipToGlow])

  if (!ready) return null
  if (!shouldShow) return null

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center select-none transition-opacity duration-700 ${exiting ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
      onClick={handleClick}
    >
      <div
        ref={overlayRef}
        className="absolute inset-0 bg-black pointer-events-none"
        style={{ zIndex: 0 }}
      />

      <div className="relative flex flex-col items-center" style={{ zIndex: 1 }}>
        <SplashGlow active={glowActive} />

        <motion.div
          className="flex flex-col items-center"
          initial={{ x: 0, y: 0, scaleX: 1, scaleY: 1, opacity: 1 }}
          animate={heroControls}
        >
          <div className="splash-text-container">
            <div className="w-full flex justify-center">
              <SplashSVGText ringProgress={ringsProgress} />
            </div>
          </div>
        </motion.div>

        <motion.p
          className="text-lg sm:text-xl md:text-2xl text-muted-foreground mt-4"
          initial={{ opacity: 0, y: 16 }}
          animate={taglineControls}
        >
          Sua wiki, do seu jeito.
        </motion.p>
      </div>

      {(phase === 'rings' || phase === 'glow') && (
        <SplashWaveRings ringCount={ringCount} speed={ringSpeed} />
      )}
    </div>
  )
})

export default SplashScreen
