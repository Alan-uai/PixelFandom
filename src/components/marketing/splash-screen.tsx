'use client'

import { useEffect, useRef, useState, useCallback, memo } from 'react'
import { motion, useAnimation } from 'framer-motion'
import GravitationalWaveMask from './gravitational-wave-mask'
import SplashSVGText from './splash-svg-text'
import {
  playSplashSound,
  playGravitationalWaveSound,
  playBorderRevealSound,
  playWavePulse,
} from '@/lib/feedback-sounds'

type Phase = 'black' | 'waves' | 'border' | 'dissolve' | 'outro'

const PHASES: Phase[] = ['black', 'waves', 'border', 'dissolve', 'outro']
const DURATIONS: Record<Phase, number> = {
  black: 1000,
  waves: 3500,
  border: 2200,
  dissolve: 2500,
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

function seededRandom(seed: number): () => number {
  let s = seed
  return () => {
    s = (s * 16807 + 0) % 2147483647
    return (s - 1) / 2147483646
  }
}

interface ParticleSeed {
  seed: number
  speed: number
  offsetX: number
  offsetY: number
}

let particleCache: ParticleSeed[] | null = null

function updateDissolveMask(overlay: HTMLDivElement | null, progress: number) {
  if (!overlay) return

  const grads: string[] = []
  const t = Math.min(progress, 1)

  for (let i = 0; i < 14; i++) {
    const cx = 50 + Math.sin(t * 2.3 + i * 1.5) * 28
    const cy = 50 + Math.cos(t * 1.7 + i * 1.1) * 28
    const size = 6 + t * 170
    const rx = size * (0.6 + Math.sin(i * 3.1 + t * 0.5) * 0.4)
    const ry = size * (0.6 + Math.cos(i * 2.7 + t * 0.8) * 0.4)
    const th = t * 100

    grads.push(
      `radial-gradient(ellipse ${rx}% ${ry}% at ${cx}% ${cy}%, transparent 0%, transparent ${th * 0.7}%, rgba(0,0,0,0.1) ${th * 0.85}%, rgba(0,0,0,0.5) ${th}%, black ${Math.min(100, th + 15)}%, black 100%)`,
    )
  }

  if (!particleCache || particleCache.length === 0) {
    const prand = seededRandom(42)
    particleCache = Array.from({ length: 80 }, () => ({
      seed: prand(),
      speed: 0.3 + prand() * 0.7,
      offsetX: prand() * 100,
      offsetY: prand() * 100,
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
  const [showBorder, setShowBorder] = useState(false)
  const [intensity, setIntensity] = useState(0)
  const [exiting, setExiting] = useState(false)
  const [letterVisible, setLetterVisible] = useState(false)

  const heroControls = useAnimation()
  const taglineControls = useAnimation()
  const letterVisibleRef = useRef(false)

  const speedRef = useRef(1)
  const elapsedRef = useRef(0)
  const rafRef = useRef(0)
  const completeRef = useRef(false)
  const startTimeRef = useRef(0)
  const lastTimeRef = useRef(0)
  const overlayRef = useRef<HTMLDivElement>(null)
  const clickCountRef = useRef(0)
  const clickTimerRef = useRef<ReturnType<typeof setTimeout>>()
  const soundPlayedRef = useRef({ waves: false, border: false, dissolve: false })
  const stableOnComplete = useRef(onComplete)

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

      const wavesProgress = getProgressInPhase(elapsed, 'waves')
      if (newPhase === 'black' || newPhase === 'waves') {
        const i = newPhase === 'black' ? 0 : Math.min(wavesProgress * 1.5, 1)
        setIntensity(i)
      }

      if (!letterVisibleRef.current && (newPhase === 'waves' || newPhase === 'border')) {
        letterVisibleRef.current = true
        setLetterVisible(true)
      }

      if (newPhase === 'border' || newPhase === 'dissolve' || newPhase === 'outro') {
        setShowBorder(true)
      }

      if (newPhase === 'dissolve') {
        const dissolveProgress = getProgressInPhase(elapsed, 'dissolve')
        updateDissolveMask(overlayRef.current, dissolveProgress)
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
    if (phase === 'waves' && !soundPlayedRef.current.waves) {
      soundPlayedRef.current.waves = true
      playGravitationalWaveSound()
    }
    if ((phase === 'border' || phase === 'dissolve') && !soundPlayedRef.current.border) {
      soundPlayedRef.current.border = true
      playBorderRevealSound()
    }
  }, [phase])

  useEffect(() => {
    if (phase === 'waves') {
      const interval = setInterval(() => playWavePulse(), 600)
      return () => clearInterval(interval)
    }
  }, [phase])

  useEffect(() => {
    stableOnComplete.current = onComplete
  }, [onComplete])

  useEffect(() => {
    return () => {
      if (clickTimerRef.current) clearTimeout(clickTimerRef.current)
    }
  }, [])

  useEffect(() => {
    if (phase !== 'dissolve') return

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
          x: { duration: 2.5, ease: 'easeInOut' },
          y: { duration: 2.5, ease: 'easeInOut' },
          scaleX: { duration: 2.5, ease: 'easeInOut' },
          scaleY: { duration: 2.5, ease: 'easeInOut' },
          opacity: { duration: 0.3, ease: 'easeOut', delay: 2.2 },
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

  const accelerate = useCallback(() => {
    speedRef.current = 3
  }, [])

  const skipToBorder = useCallback(() => {
    const borderStart = CUMULATIVE.find((c) => c.phase === 'border')!.start
    elapsedRef.current = borderStart + DURATIONS.border * 0.2
    speedRef.current = 1.5
    setShowBorder(true)
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
      skipToBorder()
    }
  }, [accelerate, skipToBorder])

  if (!ready) return null
  if (!shouldShow) return null

  const maskActive = phase === 'black' || phase === 'waves'

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
        <motion.div
          className="flex flex-col items-center"
          initial={{ x: 0, y: 0, scaleX: 1, scaleY: 1, opacity: 1 }}
          animate={heroControls}
        >
          <div className="splash-text-container">
            <div className="w-full flex justify-center">
              <SplashSVGText showBorder={showBorder} visible={letterVisible} />
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

      <GravitationalWaveMask active={maskActive} intensity={intensity} />
    </div>
  )
})

export default SplashScreen
