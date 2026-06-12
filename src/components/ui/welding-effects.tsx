'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { animate, motion, useMotionValue, useTransform } from 'framer-motion'
import { cn } from '@/lib/utils'
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

// ── StarGlow (4-point cross with morphing core & pulse rings) ──

interface StarGlowProps {
  x: number
  y: number
  size?: number
  color?: string
  intensity?: number
  seed?: number
}

export function StarGlow({ x, y, size = 28, color = PRIMARY, intensity = 1, seed = 0 }: StarGlowProps) {
  const gs = size * intensity
  const glowOpacity = Math.min(1, 0.7 * intensity)
  const armWidth = Math.max(2, gs * 0.07)
  const coreSize = Math.max(4, gs * 0.3)

  const phase1 = seed * 1.7
  const phase2 = seed * 2.3 + 1.2
  const phase3 = seed * 0.9 + 0.7

  const blob1 = 'polygon(50% 0%,68% 32%,100% 50%,68% 68%,50% 100%,32% 68%,0% 50%,32% 32%)'
  const blob2 = 'polygon(50% 3%,65% 35%,95% 50%,65% 65%,50% 97%,35% 65%,5% 50%,35% 35%)'
  const blob3 = 'polygon(52% 2%,70% 30%,100% 48%,70% 70%,48% 98%,30% 70%,0% 52%,30% 30%)'

  return (
    <motion.div
      className="pointer-events-none absolute z-20"
      style={{
        left: x - gs / 2,
        top: y - gs / 2,
        width: gs,
        height: gs,
      }}
      animate={{ rotate: 360 }}
      transition={{ duration: 3 + (seed % 2), repeat: Infinity, ease: 'linear' }}
    >
      {/* Inner pulse ring */}
      <motion.div
        className="absolute rounded-full"
        style={{
          left: '50%',
          top: '50%',
          translate: '-50% -50%',
          width: coreSize * 1.8,
          height: coreSize * 1.8,
          border: `1.5px solid ${color}`,
        }}
        animate={{ opacity: [0, 0.8, 0], scale: [0.8, 1.4, 0.8] }}
        transition={{
          duration: 1.2 + (seed % 3) * 0.1,
          repeat: Infinity,
          ease: 'easeOut',
          delay: phase3,
        }}
      />

      {/* Outer pulse ring */}
      <motion.div
        className="absolute rounded-full"
        style={{
          left: '50%',
          top: '50%',
          translate: '-50% -50%',
          width: coreSize * 2.5,
          height: coreSize * 2.5,
          border: `1px solid ${color}`,
        }}
        animate={{ opacity: [0, 0.4, 0], scale: [0.6, 1.8, 0.6] }}
        transition={{
          duration: 2 + (seed % 4) * 0.15,
          repeat: Infinity,
          ease: 'easeOut',
          delay: phase3 + 0.3,
        }}
      />

      {/* Horizontal arm */}
      <motion.div
        className="absolute top-1/2 left-0 -translate-y-1/2"
        style={{
          width: '100%',
          height: armWidth,
          background: `linear-gradient(90deg, transparent 0%, ${color} 25%, ${color} 75%, transparent 100%)`,
          boxShadow: `0 0 ${6 * intensity}px ${color}, 0 0 ${18 * intensity}px ${color}`,
          filter: 'url(#star-glow)',
        }}
        animate={{
          opacity: [glowOpacity * 0.7, glowOpacity, glowOpacity * 0.85, glowOpacity * 1.1, glowOpacity * 0.7],
          scaleX: [1, 1.15, 0.9, 1.08, 1],
        }}
        transition={{
          duration: 0.6 + (seed % 5) * 0.08,
          repeat: Infinity,
          ease: 'easeInOut',
          delay: phase1,
        }}
      />

      {/* Vertical arm */}
      <motion.div
        className="absolute left-1/2 top-0 -translate-x-1/2"
        style={{
          width: armWidth,
          height: '100%',
          background: `linear-gradient(180deg, transparent 0%, ${color} 25%, ${color} 75%, transparent 100%)`,
          boxShadow: `0 0 ${6 * intensity}px ${color}, 0 0 ${18 * intensity}px ${color}`,
          filter: 'url(#star-glow)',
        }}
        animate={{
          opacity: [glowOpacity, glowOpacity * 0.75, glowOpacity * 1.05, glowOpacity * 0.85, glowOpacity],
          scaleY: [1, 0.9, 1.12, 0.95, 1],
        }}
        transition={{
          duration: 0.7 + (seed % 3) * 0.1,
          repeat: Infinity,
          ease: 'easeInOut',
          delay: phase2,
        }}
      />

      {/* Morphing irregular blob center */}
      <motion.div
        className="absolute"
        style={{
          left: '50%',
          top: '50%',
          translate: '-50% -50%',
          width: coreSize,
          height: coreSize,
          backgroundColor: '#fff',
          boxShadow: `0 0 ${10 * intensity}px ${color}, 0 0 ${25 * intensity}px ${color}`,
          clipPath: blob1,
        }}
        animate={{
          clipPath: [blob1, blob2, blob3, blob1],
          scale: [1, 0.9, 1.1, 0.95, 1],
          opacity: [0.9, 1, 0.85, 1, 0.9],
        }}
        transition={{
          duration: 2.5 + (seed % 3) * 0.3,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
    </motion.div>
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
      const dist = 12 + Math.random() * 35
      setSparks(prev => [
        ...prev,
        {
          id: idRef.current,
          originX: beamX,
          originY: beamY,
          ax: Math.cos(spread) * dist,
          ay: Math.sin(spread) * dist,
          size: 2 + Math.random() * 3,
        },
      ])
    }, SPARK_STREAM_INTERVAL)

    return () => clearInterval(interval)
  }, [active, beamX, beamY, beamAngle])

  const removeSpark = useCallback((id: number) => {
    setSparks(prev => prev.filter(s => s.id !== id))
  }, [])

  return (
    <div className="pointer-events-none absolute inset-0 z-[15] overflow-visible" style={{ perspective: 600 }}>
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
    <div className="pointer-events-none absolute inset-0 z-[15] overflow-visible" style={{ perspective: 600 }}>
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
  const z = useMemo(() => -20 + Math.random() * 40, [])
  return (
    <motion.div
      className="absolute rounded-full"
      style={{
        width: size * 2,
        height: size * 2,
        backgroundColor: color,
        boxShadow: `0 0 ${Math.max(4, size * 2)}px ${color}, 0 0 ${Math.max(8, size * 4)}px ${color}`,
        transformOrigin: 'center',
      }}
      initial={{ x: originX, y: originY, opacity: 1, scale: 1, z: 0 }}
      animate={{
        x: originX + ax,
        y: originY + ay,
        z: [0, z, z * 0.5],
        opacity: [1, 0.6, 0],
        scale: [1.2, 0.8, 0],
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

function GravityParticle({ originX, originY, vx, vy, size, rotation, onDone, ...rest }: GravityParticleProps) {
  void rest.groundY
  const zStart = useMemo(() => Math.random() * 30, [])
  const colorTemp = useMemo(() => Math.random() > 0.5 ? GOLD : (Math.random() > 0.5 ? '#ff8844' : '#ffcc66'), [])
  return (
    <motion.div
      className="absolute rounded-sm"
      style={{
        width: size * 2,
        height: size * 0.6,
        backgroundColor: colorTemp,
        boxShadow: `0 0 ${Math.max(5, size * 2)}px ${colorTemp}, 0 0 ${Math.max(10, size * 3)}px ${colorTemp}`,
        transformOrigin: 'center',
        rotate: `${rotation}rad`,
      }}
      initial={{ x: originX, y: originY, opacity: 1, scale: 1, z: 0 }}
      animate={{
        x: originX + vx,
        y: [
          originY,
          originY + vy * 0.35,
          originY + vy * 0.6 + 25,
          originY + vy * 0.85 + 60,
          originY + vy + 100,
        ],
        z: [0, zStart, zStart * 0.3, -zStart * 0.2, 0],
        opacity: [1, 0.8, 0.5, 0.2, 0],
        scale: [1.5, 1.3, 0.8, 0.4, 0],
        rotate: [`${rotation}rad`, `${rotation + Math.PI * 1.5}rad`],
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

// ── WeldedText (SVG stroke-dasharray letter tracing) ──

interface WeldedTextProps {
  text: string
  startDelay: number
  className?: string
}

const DASH_TOTAL = 600

export function WeldedText({ text, startDelay, className }: WeldedTextProps) {
  const letters = text.split('')
  const [drawnCount, setDrawnCount] = useState(-1)
  const [activeIdx, setActiveIdx] = useState(-1)
  const dashProgress = useMotionValue(DASH_TOTAL)
  const [charWidths, setCharWidths] = useState<number[]>([])
  const measuredRef = useRef(false)

  useEffect(() => {
    if (measuredRef.current || !text) return
    measuredRef.current = true

    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
    svg.setAttribute('width', '0')
    svg.setAttribute('height', '0')
    svg.style.position = 'absolute'
    svg.style.visibility = 'hidden'
    document.body.appendChild(svg)

    const textEl = document.createElementNS('http://www.w3.org/2000/svg', 'text')
    textEl.setAttribute('x', '0')
    textEl.setAttribute('y', '90')
    textEl.setAttribute('font-size', '90')
    textEl.setAttribute('font-family', 'inherit')
    textEl.setAttribute('font-weight', 'inherit')
    textEl.textContent = text
    svg.appendChild(textEl)

    svg.getBoundingClientRect()
    const widths = text.split('').map((_, i) => {
      try { return textEl.getSubStringLength(i, 1) }
      catch { return 62 }
    })
    setCharWidths(widths)

    document.body.removeChild(svg)
  }, [text])

  useEffect(() => {
    if (!letters.length) return

    const t = setTimeout(() => {
      let idx = 0

      const traceNext = () => {
        if (idx >= letters.length) {
          setActiveIdx(-1)
          setDrawnCount(letters.length)
          return
        }

        setActiveIdx(idx)
        dashProgress.set(DASH_TOTAL)

        animate(dashProgress, 0, {
          duration: 0.35,
          ease: 'easeInOut',
          onComplete: () => {
            setDrawnCount(idx)
            idx++
            setTimeout(traceNext, 80)
          },
        })
      }

      traceNext()
    }, startDelay)

    return () => clearTimeout(t)
  }, [startDelay, letters.length])

  const dashOffset = useTransform(dashProgress, v => v)
  const beamHead = useTransform(dashProgress, v => `${v + DASH_TOTAL * 0.06} ${DASH_TOTAL}`)
  const whiteHead = useTransform(dashProgress, v => `${v + DASH_TOTAL * 0.03} ${DASH_TOTAL}`)

  return (
    <span className={cn('inline leading-none', className)}>
      {letters.map((letter, i) => {
        if (letter === ' ') return <span key={i}>&nbsp;</span>

        const isDone = i < drawnCount
        const isActive = i === activeIdx
        const cw = charWidths[i] || 62
        const svgWidth = `${cw / 120}em`

        return (
          <svg
            key={i}
            className="inline-block align-middle overflow-visible"
            style={{ width: svgWidth, height: '1em' }}
            viewBox={`0 0 ${cw} 120`}
          >
            {isDone && (
              <text
                x={cw / 2} y="90"
                textAnchor="middle"
                fill="hsl(var(--primary))"
                fontSize="90"
                fontFamily="inherit"
                fontWeight="inherit"
                dominantBaseline="central"
              >
                {letter}
              </text>
            )}

            {isActive && (
              <>
                {/* Tracing stroke */}
                <motion.text
                  x={cw / 2} y="90"
                  textAnchor="middle"
                  fill="transparent"
                  stroke="hsl(var(--primary))"
                  strokeWidth={4}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeDasharray={String(DASH_TOTAL)}
                  style={{ strokeDashoffset: dashOffset }}
                  fontSize="90"
                  fontFamily="inherit"
                  fontWeight="inherit"
                  dominantBaseline="central"
                >
                  {letter}
                </motion.text>

                {/* Beam head glow (thick, filtered) */}
                <motion.text
                  x={cw / 2} y="90"
                  textAnchor="middle"
                  fill="transparent"
                  stroke="hsl(var(--primary))"
                  strokeWidth={12}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeDasharray={beamHead}
                  style={{ strokeDashoffset: dashOffset }}
                  opacity={0.5}
                  filter="url(#weld-letter)"
                  fontSize="90"
                  fontFamily="inherit"
                  fontWeight="inherit"
                  dominantBaseline="central"
                >
                  {letter}
                </motion.text>

                {/* White core */}
                <motion.text
                  x={cw / 2} y="90"
                  textAnchor="middle"
                  fill="transparent"
                  stroke="#fff"
                  strokeWidth={3}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeDasharray={whiteHead}
                  style={{ strokeDashoffset: dashOffset }}
                  fontSize="90"
                  fontFamily="inherit"
                  fontWeight="inherit"
                  dominantBaseline="central"
                >
                  {letter}
                </motion.text>

                {/* Pulsing mini-beam */}
                <motion.circle
                  cx={cw / 2} cy="55"
                  r={10}
                  fill="hsl(var(--primary))"
                  filter="url(#weld-letter)"
                  animate={{ scale: [0.8, 1.3, 0.8], opacity: [0.3, 0.9, 0.3] }}
                  transition={{ duration: 0.35, repeat: Infinity, ease: 'easeInOut' }}
                />
              </>
            )}
          </svg>
        )
      })}
    </span>
  )
}

// ── TextBeamSweep (gradient sweep across entire text) ──

// ── TextBeamSweep (gradient sweep across entire text) ──

interface TextBeamSweepProps {
  text: string
  delay: number
  className?: string
}

export function TextBeamSweep({ text: _text, delay, className }: TextBeamSweepProps) {
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
