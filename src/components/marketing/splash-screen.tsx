'use client'

import { useEffect, useRef, useState, useCallback, memo } from 'react'
import { motion } from 'framer-motion'
import GravitationalWaveCanvas from './gravitational-wave-canvas'
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

function updateDissolveMask(overlay: HTMLDivElement | null, progress: number) {
  if (!overlay) return

  const grads: string[] = []
  for (let i = 0; i < 14; i++) {
    const cx = 50 + Math.sin(progress * 2.3 + i * 1.5) * 28
    const cy = 50 + Math.cos(progress * 1.7 + i * 1.1) * 28
    const size = 6 + progress * 170
    const rx = size * (0.6 + Math.sin(i * 3.1 + progress * 0.5) * 0.4)
    const ry = size * (0.6 + Math.cos(i * 2.7 + progress * 0.8) * 0.4)
    const threshold = progress * 100

    grads.push(
      `radial-gradient(ellipse ${rx}% ${ry}% at ${cx}% ${cy}%, transparent 0%, transparent ${threshold}%, black ${Math.min(100, threshold + 18)}%)`,
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

  const canvasActive = phase === 'black' || phase === 'waves'

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
        <div className="splash-text-container">
          <div className="w-full flex justify-center">
            <SplashSVGText showBorder={showBorder} />
          </div>
        </div>

        <motion.p
          className="text-lg sm:text-xl md:text-2xl text-muted-foreground mt-4"
          initial={{ opacity: 0, y: 16 }}
          animate={showBorder ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 }}
          transition={{ duration: 0.5, delay: 0.15, ease: 'easeOut' }}
        >
          Sua wiki, do seu jeito.
        </motion.p>
      </div>

      <GravitationalWaveCanvas active={canvasActive} intensity={intensity} />
    </div>
  )
})

export default SplashScreen
