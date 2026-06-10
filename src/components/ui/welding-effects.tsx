'use client'

import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { motion, type HTMLMotionProps } from 'framer-motion'
import {
  PRIMARY,
  GOLD,
  SPARK_STREAM_INTERVAL,
  GRAVITY_SPARK_INTERVAL,
  SPARK_STREAM_LIFETIME,
  GRAVITY_SPARK_LIFETIME,
} from '@/lib/welding-utils'

export function WeldFilters() {
  return (
    <svg className="absolute size-0" aria-hidden>
      <defs>
        <filter id="star-glow">
          <feGaussianBlur stdDeviation="6" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <filter id="weld-letter">
          <feGaussianBlur stdDeviation="2" result="glow" />
          <feComponentTransfer in="glow">
            <feFuncA type="linear" slope="2.5" />
          </feComponentTransfer>
          <feMerge>
            <feMergeNode in="glow" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <filter id="beam-glow">
          <feGaussianBlur stdDeviation="3" result="blur1" />
          <feGaussianBlur stdDeviation="8" result="blur2" />
          <feMerge>
            <feMergeNode in="blur2" />
            <feMergeNode in="blur1" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
    </svg>
  )
}

// ── StarGlow (4-point cross) ──

interface StarGlowProps {
  x: number
  y: number
  size?: number
  color?: string
  intensity?: number
}

export function StarGlow({ x, y, size = 28, color = PRIMARY, intensity = 1 }: StarGlowProps) {
  const gs = size * intensity
  const glowOpacity = Math.min(1, 0.7 * intensity)
  const armWidth = Math.max(2, gs * 0.07)
  const coreSize = Math.max(4, gs * 0.3)

  return (
    <div
      className="pointer-events-none absolute z-20"
      style={{
        left: x - gs / 2,
        top: y - gs / 2,
        width: gs,
        height: gs,
      }}
    >
      <div
        className="absolute top-1/2 left-0 -translate-y-1/2"
        style={{
          width: '100%',
          height: armWidth,
          background: `linear-gradient(90deg, transparent 0%, ${color} 25%, ${color} 75%, transparent 100%)`,
          boxShadow: `0 0 ${6 * intensity}px ${color}, 0 0 ${18 * intensity}px ${color}`,
          opacity: glowOpacity,
          filter: 'url(#star-glow)',
        }}
      />
      <div
        className="absolute left-1/2 top-0 -translate-x-1/2"
        style={{
          width: armWidth,
          height: '100%',
          background: `linear-gradient(180deg, transparent 0%, ${color} 25%, ${color} 75%, transparent 100%)`,
          boxShadow: `0 0 ${6 * intensity}px ${color}, 0 0 ${18 * intensity}px ${color}`,
          opacity: glowOpacity,
          filter: 'url(#star-glow)',
        }}
      />
      <div
        className="absolute rounded-full"
        style={{
          left: '50%',
          top: '50%',
          translate: '-50% -50%',
          width: coreSize,
          height: coreSize,
          backgroundColor: '#fff',
          boxShadow: `0 0 ${10 * intensity}px ${color}, 0 0 ${25 * intensity}px ${color}`,
          opacity: Math.min(1, glowOpacity * 1.5),
        }}
      />
    </div>
  )
}

// ── SparkStream ──

interface SparkStreamProps {
  beamX: number
  beamY: number
  beamAngle: number
  active: boolean
}

interface Spark {
  id: number
  originX: number
  originY: number
  ax: number
  ay: number
  size: number
}

export function SparkStream({ beamX, beamY, beamAngle, active }: SparkStreamProps) {
  const idRef = useRef(0)
  const [sparks, setSparks] = useState<Spark[]>([])

  useEffect(() => {
    if (!active) {
      setSparks([])
      return
    }

    const interval = setInterval(() => {
      idRef.current++
      const spread = beamAngle + (Math.random() - 0.5) * Math.PI * 2
      const dist = 8 + Math.random() * 22
      setSparks(prev => [
        ...prev,
        {
          id: idRef.current,
          originX: beamX,
          originY: beamY,
          ax: Math.cos(spread) * dist,
          ay: Math.sin(spread) * dist,
          size: 1 + Math.random() * 2,
        },
      ])
    }, SPARK_STREAM_INTERVAL)

    return () => clearInterval(interval)
  }, [active, beamX, beamY, beamAngle])

  const removeSpark = useCallback((id: number) => {
    setSparks(prev => prev.filter(s => s.id !== id))
  }, [])

  return (
    <div className="pointer-events-none absolute inset-0 z-15 overflow-hidden rounded-xl">
      {sparks.map(s => (
        <SparkParticle
          key={s.id}
          originX={s.originX}
          originY={s.originY}
          ax={s.ax}
          ay={s.ay}
          size={s.size}
          lifetime={SPARK_STREAM_LIFETIME}
          color={PRIMARY}
          onDone={() => removeSpark(s.id)}
        />
      ))}
    </div>
  )
}

// ── GravitySpark ──

interface GravitySparkProps {
  beamX: number
  beamY: number
  beamAngle: number
  active: boolean
  groundY: number
}

interface GravSpark {
  id: number
  originX: number
  originY: number
  vx: number
  vy: number
  size: number
  rotation: number
}

export function GravitySpark({ beamX, beamY, beamAngle, active, groundY }: GravitySparkProps) {
  const idRef = useRef(0)
  const [sparks, setSparks] = useState<GravSpark[]>([])

  useEffect(() => {
    if (!active) {
      setSparks([])
      return
    }

    const interval = setInterval(() => {
      idRef.current++
      const dist = 30 + Math.random() * 55
      const spreadAngle = beamAngle + (Math.random() - 0.5) * Math.PI * 0.8 - 0.3
      const rotation = Math.random() * Math.PI
      setSparks(prev => [
        ...prev,
        {
          id: idRef.current,
          originX: beamX,
          originY: beamY,
          vx: Math.cos(spreadAngle) * dist,
          vy: Math.sin(spreadAngle) * dist - 20,
          size: 2 + Math.random() * 3,
          rotation,
        },
      ])
    }, GRAVITY_SPARK_INTERVAL)

    return () => clearInterval(interval)
  }, [active, beamX, beamY, beamAngle])

  const removeSpark = useCallback((id: number) => {
    setSparks(prev => prev.filter(s => s.id !== id))
  }, [])

  return (
    <div className="pointer-events-none absolute inset-0 z-15 overflow-hidden rounded-xl">
      {sparks.map(s => (
        <GravityParticle
          key={s.id}
          originX={s.originX}
          originY={s.originY}
          vx={s.vx}
          vy={s.vy}
          size={s.size}
          rotation={s.rotation}
          groundY={groundY}
          onDone={() => removeSpark(s.id)}
        />
      ))}
    </div>
  )
}

// ── Individual Spark Particle ──

interface SparkParticleProps {
  originX: number
  originY: number
  ax: number
  ay: number
  size: number
  lifetime: number
  color: string
  onDone: () => void
}

function SparkParticle({ originX, originY, ax, ay, size, lifetime, color, onDone }: SparkParticleProps) {
  const isElongated = size > 1.5
  return (
    <motion.div
      className="absolute rounded-full"
      style={{
        width: isElongated ? size * 1.5 : size,
        height: isElongated ? size * 0.6 : size,
        backgroundColor: color,
        boxShadow: `0 0 ${Math.max(2, size)}px ${color}`,
        transformOrigin: 'center',
      }}
      initial={{ x: originX, y: originY, opacity: 1, scale: 1, rotate: 0 }}
      animate={{
        x: originX + ax,
        y: originY + ay,
        opacity: [1, 0.8, 0],
        scale: [1, 0.6, 0],
        rotate: isElongated ? [0, 45] : 0,
      }}
      transition={{ duration: lifetime / 1000, ease: 'easeOut' }}
      onAnimationComplete={onDone}
    />
  )
}

// ── Individual Gravity Particle ──

interface GravityParticleProps {
  originX: number
  originY: number
  vx: number
  vy: number
  size: number
  rotation: number
  groundY: number
  onDone: () => void
}

function GravityParticle({ originX, originY, vx, vy, size, rotation, groundY, onDone }: GravityParticleProps) {
  return (
    <motion.div
      className="absolute rounded-sm"
      style={{
        width: size,
        height: size * 0.4,
        backgroundColor: GOLD,
        boxShadow: `0 0 ${Math.max(3, size)}px ${GOLD}, 0 0 ${Math.max(6, size * 2)}px ${PRIMARY}`,
        transformOrigin: 'center',
        rotate: `${rotation}rad`,
      }}
      initial={{ x: originX, y: originY, opacity: 1, scale: 1 }}
      animate={{
        x: originX + vx,
        y: [
          originY,
          originY + vy * 0.35,
          originY + vy * 0.6 + 25,
          originY + vy * 0.85 + 60,
          originY + vy + 100,
        ],
        opacity: [1, 0.8, 0.5, 0.2, 0],
        scale: [1, 1.1, 0.8, 0.5, 0],
        rotate: [`${rotation}rad`, `${rotation + Math.PI}rad`],
      }}
      transition={{
        duration: GRAVITY_SPARK_LIFETIME / 1000,
        times: [0, 0.25, 0.5, 0.75, 1],
        ease: 'easeIn',
      }}
      onAnimationComplete={onDone}
    />
  )
}

// ── WeldedText ──

interface WeldedTextProps {
  text: string
  startDelay: number
  className?: string
}

export function WeldedText({ text, startDelay, className }: WeldedTextProps) {
  const letters = text.split('')
  const [weldedIndex, setWeldedIndex] = useState(-1)
  const [beamLetter, setBeamLetter] = useState(-1)

  useEffect(() => {
    const t1 = setTimeout(() => {
      let i = 0
      setWeldedIndex(0)
      setBeamLetter(0)
      const interval = setInterval(() => {
        i++
        setWeldedIndex(i)
        setBeamLetter(i)
        if (i >= letters.length - 1) {
          clearInterval(interval)
          setTimeout(() => setBeamLetter(-1), 150)
        }
      }, 90)
      return () => clearInterval(interval)
    }, startDelay)
    return () => clearTimeout(t1)
  }, [startDelay, letters.length])

  return (
    <span className={className}>
      {letters.map((letter, i) => (
        <motion.span
          key={i}
          className="inline-block relative"
          animate={{
            filter:
              i <= weldedIndex ? 'url(#weld-letter)' : 'none',
            textShadow:
              i <= weldedIndex
                ? i === weldedIndex
                  ? `0 0 18px ${GOLD}`
                  : `0 0 4px ${GOLD}40`
                : 'none',
          }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
        >
          {letter === ' ' ? '\u00A0' : letter}
          {i === beamLetter && (
            <motion.span
              className="absolute inset-y-0"
              style={{
                width: 3,
                left: '-5%',
                backgroundColor: GOLD,
                boxShadow: `0 0 10px ${GOLD}, 0 0 25px ${GOLD}`,
                filter: 'url(#beam-glow)',
                pointerEvents: 'none',
              }}
              animate={{ left: ['-5%', '105%'] }}
              transition={{ duration: 0.14, ease: 'linear' }}
            />
          )}
        </motion.span>
      ))}
    </span>
  )
}

// ── TextBeamSweep (gradient sweep across entire text) ──

interface TextBeamSweepProps {
  text: string
  delay: number
  className?: string
}

export function TextBeamSweep({ text, delay, className }: TextBeamSweepProps) {
  const [active, setActive] = useState(false)
  const [done, setDone] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setActive(true), delay)
    return () => clearTimeout(t)
  }, [delay])

  if (!active || done) return null

  return (
    <motion.div
      className={className}
      style={{
        position: 'absolute',
        inset: 0,
        background: `linear-gradient(90deg, transparent 0%, ${GOLD}40 50%, transparent 100%)`,
        backgroundSize: '200% 100%',
        filter: 'url(#star-glow)',
        pointerEvents: 'none',
        mixBlendMode: 'screen',
      }}
      initial={{ backgroundPosition: '200% 0%' }}
      animate={{ backgroundPosition: '-200% 0%' }}
      transition={{ duration: 0.8, ease: 'linear' }}
      onAnimationComplete={() => setDone(true)}
    />
  )
}
