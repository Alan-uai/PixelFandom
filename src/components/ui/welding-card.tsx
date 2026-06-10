'use client'

import { useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { animate, motion, useMotionValue, useTransform } from 'framer-motion'
import { cn } from '@/lib/utils'
import {
  WELD_DURATION,
  GOLDEN_DURATION,
  PRIMARY,
  GOLD,
  getBeamPathD,
  getBeamPosition,
  createBeamPathElement,
} from '@/lib/welding-utils'
import {
  WeldFilters,
  StarGlow,
  SparkStream,
  GravitySpark,
  WeldedText,
} from '@/components/ui/welding-effects'

interface WeldingCardProps {
  className?: string
  style?: CSSProperties
  children: ReactNode
  text?: string
}

type Phase = 'idle' | 'welding' | 'golden' | 'done'

export function WeldingCard({ className, style, children, text }: WeldingCardProps) {
  const [phase, setPhase] = useState<Phase>('idle')
  const containerRef = useRef<HTMLDivElement>(null)
  const pathRef = useRef<SVGPathElement | null>(null)
  const beamProgress = useMotionValue(0)
  const [beamPos, setBeamPos] = useState({ x: 0, y: 0, angle: 0 })
  const [cardHeight, setCardHeight] = useState(0)
  const [cardSize, setCardSize] = useState({ w: 0, h: 0 })

  const showWelding = phase === 'welding'
  const showGolden = phase === 'golden'

  useLayoutEffect(() => {
    const el = containerRef.current
    if (!el) return

    const rect = el.getBoundingClientRect()
    const w = rect.width
    const h = rect.height
    setCardSize({ w, h })
    setCardHeight(h)

    pathRef.current = createBeamPathElement(w, h, 12)

    setPhase('welding')

    const controls = animate(beamProgress, 1, {
      duration: WELD_DURATION / 1000,
      ease: 'linear',
      onComplete: () => {
        setPhase('golden')
        beamProgress.set(0)
        animate(beamProgress, 1, {
          duration: GOLDEN_DURATION / 1000,
          ease: 'linear',
          onComplete: () => setPhase('done'),
        })
      },
    })

    return () => controls.stop()
  }, [beamProgress])

  useEffect(() => {
    const path = pathRef.current
    if (!path) return
    const unsub = beamProgress.on('change', v => {
      setBeamPos(getBeamPosition(path, v))
    })
    return unsub
  }, [beamProgress])

  const pathD = useMemo(
    () => getBeamPathD(cardSize.w, cardSize.h, 12),
    [cardSize.w, cardSize.h],
  )

  const dashOffset = useTransform(beamProgress, [0, 1], [1, 0])
  const beamTrail = useTransform(beamProgress, (v) => `${v} ${1 - v}`)

  if (phase === 'idle' || phase === 'done') {
    return <div className={cn('rounded-xl bg-card', className)} style={style}>{children}</div>
  }

  return (
    <div
      ref={containerRef}
      className={cn('relative rounded-xl', className)}
      style={style}
    >
      <WeldFilters />

      {showWelding && (
        <>
          <svg
            className="pointer-events-none absolute inset-0 z-10"
            width={cardSize.w || '100%'}
            height={cardSize.h || '100%'}
            viewBox={`0 0 ${cardSize.w || 0} ${cardSize.h || 0}`}
          >
            <defs>
              <filter id="svg-beam-glow">
                <feGaussianBlur stdDeviation="4" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* Track path - faint */}
            {pathD && (
              <path d={pathD} fill="none" stroke={PRIMARY} strokeWidth={1.5} opacity={0.12} strokeLinecap="round" strokeLinejoin="round" />
            )}

            {/* Welded trail - reveals from 0 to progress */}
            {pathD && (
              <motion.path
                d={pathD}
                fill="none"
                stroke={PRIMARY}
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                pathLength="1"
                style={{ strokeDasharray: beamTrail }}
                opacity={0.5}
              />
            )}

            {/* Beam head glow - wide glow at beam head */}
            {pathD && (
              <motion.path
                d={pathD}
                fill="none"
                stroke={PRIMARY}
                strokeWidth={6}
                strokeLinecap="round"
                strokeLinejoin="round"
                pathLength="1"
                style={{ strokeDasharray: '0.12 1', strokeDashoffset: dashOffset }}
                opacity={0.6}
                filter="url(#svg-beam-glow)"
              />
            )}

            {/* Beam head core - narrow bright */}
            {pathD && (
              <motion.path
                d={pathD}
                fill="none"
                stroke="#fff"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                pathLength="1"
                style={{ strokeDasharray: '0.04 1', strokeDashoffset: dashOffset }}
              />
            )}
          </svg>
          <StarGlow x={beamPos.x} y={beamPos.y} color={PRIMARY} intensity={1.2} seed={0} />
          <SparkStream
            beamX={beamPos.x}
            beamY={beamPos.y}
            beamAngle={beamPos.angle}
            active={showWelding}
          />
          <GravitySpark
            beamX={beamPos.x}
            beamY={beamPos.y}
            beamAngle={beamPos.angle}
            active={showWelding}
            groundY={cardHeight}
          />
          {text && (
            <div className="absolute inset-0 z-30 flex items-center justify-center rounded-[11px] bg-card/60 pointer-events-none">
              <WeldedText
                text={text}
                startDelay={WELD_DURATION * 0.35}
                className="text-2xl font-bold text-foreground"
              />
            </div>
          )}
        </>
      )}

      {showGolden && (
        <>
          <motion.div
            className="pointer-events-none absolute inset-0 z-20 rounded-xl"
            initial={{ boxShadow: `0 0 0px ${GOLD}` }}
            animate={{
              boxShadow: [
                `0 0 0px transparent`,
                `0 0 40px ${GOLD}`,
                `0 0 70px ${GOLD}`,
                `0 0 20px ${GOLD}`,
                `0 0 0px transparent`,
              ],
            }}
            transition={{ duration: 0.8, ease: 'easeInOut' }}
          />
          <StarGlow x={cardSize.w / 2} y={cardSize.h / 2} color={GOLD} intensity={2.5} seed={1} />
        </>
      )}

      <div className="relative z-[1] rounded-[11px] bg-card m-[1.5px]">
        {children}
      </div>
    </div>
  )
}
