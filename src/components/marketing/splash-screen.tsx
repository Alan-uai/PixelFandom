'use client'

import { useEffect, useRef, useState, useCallback, memo } from 'react'
import { motion } from 'framer-motion'
import ParticleField from '@/components/marketing/particle-field'
import { playRevealSound, playSplashSound } from '@/lib/feedback-sounds'

type Phase = 'intro' | 'stars' | 'text' | 'border' | 'outro'

const PHASE_ORDER: Phase[] = ['intro', 'stars', 'text', 'border', 'outro']
const PHASE_DURATIONS: Record<Phase, number> = {
  intro: 400,
  stars: 800,
  text: 1200,
  border: 1000,
  outro: 800,
}
const TOTAL_DURATION = PHASE_ORDER.reduce((a, p) => a + PHASE_DURATIONS[p], 0)

const CUMULATIVE = PHASE_ORDER.map((p, i) => {
  const start = PHASE_ORDER.slice(0, i).reduce((a, p) => a + PHASE_DURATIONS[p], 0)
  return { phase: p, start, end: start + PHASE_DURATIONS[p] }
})

const TEXT = 'PixelFandom'

interface SplashScreenProps {
  onComplete: () => void
}

const SplashScreen = memo(function SplashScreen({ onComplete }: SplashScreenProps) {
  const [ready, setReady] = useState(false)
  const [shouldShow, setShouldShow] = useState(true)
  const [phase, setPhase] = useState<Phase>('intro')
  const [showBorder, setShowBorder] = useState(false)
  const [exiting, setExiting] = useState(false)

  const speedRef = useRef(1)
  const elapsedRef = useRef(0)
  const lastTimeRef = useRef(0)
  const rafRef = useRef(0)
  const completeRef = useRef(false)
  const startTimeRef = useRef(0)
  const clickCountRef = useRef(0)
  const clickTimerRef = useRef<ReturnType<typeof setTimeout>>()
  const soundPlayedRef = useRef(false)
  const stableOnComplete = useRef(onComplete)
  stableOnComplete.current = onComplete

  const getPhaseAtProgress = useCallback((progress: number): Phase => {
    const elapsed = progress * TOTAL_DURATION
    for (const cum of CUMULATIVE) {
      if (elapsed >= cum.start && elapsed < cum.end) return cum.phase
    }
    return 'outro'
  }, [])

  const finish = useCallback(() => {
    if (completeRef.current) return
    completeRef.current = true
    stableOnComplete.current()
  }, [])

  const tick = useCallback((timestamp: number) => {
    if (completeRef.current) return

    if (!startTimeRef.current) startTimeRef.current = timestamp
    if (!lastTimeRef.current) lastTimeRef.current = timestamp

    const realDelta = Math.min(timestamp - lastTimeRef.current, 50)
    lastTimeRef.current = timestamp

    elapsedRef.current += realDelta * speedRef.current
    const elapsed = elapsedRef.current

    if (elapsed >= TOTAL_DURATION) {
      setExiting(true)
      setTimeout(finish, 700)
      return
    }

    const progress = Math.min(elapsed / TOTAL_DURATION, 1)
    const newPhase = getPhaseAtProgress(progress)

    setPhase(newPhase)
    if (newPhase === 'border' || newPhase === 'outro') setShowBorder(true)

    rafRef.current = requestAnimationFrame(tick)
  }, [getPhaseAtProgress, finish])

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
    } catch {}
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
    if (phase === 'text' && !soundPlayedRef.current) {
      soundPlayedRef.current = true
      playRevealSound()
    }
  }, [phase])

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
    elapsedRef.current = borderStart + PHASE_DURATIONS.border * 0.3
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

  const textVisible = phase === 'text' || phase === 'border' || phase === 'outro'
  const starsVisible = phase !== 'intro'
  const borderActive = phase === 'border' || phase === 'outro'

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-black select-none transition-opacity duration-700 ${exiting ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
      onClick={handleClick}
    >
      {starsVisible && <ParticleField />}

      <div className="relative flex flex-col items-center">
        <div className={`splash-border-wrapper ${borderActive ? 'border-active' : ''}`}>
          <h1
            className="text-5xl sm:text-6xl md:text-8xl font-bold tracking-tight px-8 py-4"
            style={{ transformStyle: 'preserve-3d', perspective: '1200px' }}
          >
            {TEXT.split('').map((letter, i) => (
              <motion.span
                key={i}
                className="inline-block"
                initial={{ opacity: 0, y: 60, rotateX: -90, scale: 0.3, filter: 'blur(4px)' }}
                animate={
                  textVisible
                    ? { opacity: 1, y: 0, rotateX: 0, scale: 1, filter: 'blur(0px)' }
                    : { opacity: 0, y: 60, rotateX: -90, scale: 0.3, filter: 'blur(4px)' }
                }
                transition={{
                  type: 'spring',
                  stiffness: phase === 'text' ? 220 : 300,
                  damping: phase === 'text' ? 15 : 18,
                  delay: textVisible && phase === 'text' ? 0.6 + i * 0.05 : (textVisible ? i * 0.02 : 0),
                }}
                style={{
                  background: 'linear-gradient(135deg, hsl(198 100% 65%), hsl(270 80% 60%), hsl(350 90% 60%))',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  transformStyle: 'preserve-3d',
                }}
              >
                {letter === ' ' ? '\u00A0' : letter}
              </motion.span>
            ))}
          </h1>
        </div>

        <motion.p
          className="text-lg sm:text-xl md:text-2xl text-muted-foreground mt-4"
          initial={{ opacity: 0, y: 16 }}
          animate={borderActive ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 }}
          transition={{ duration: 0.5, delay: 0.15, ease: 'easeOut' }}
        >
          Sua wiki, do seu jeito.
        </motion.p>
      </div>
    </div>
  )
})

export default SplashScreen
