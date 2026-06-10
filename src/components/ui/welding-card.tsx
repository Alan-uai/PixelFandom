'use client'

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { animate, motion, useMotionValue, useTransform } from 'framer-motion'
import { cn } from '@/lib/utils'
import {
  WELD_DURATION,
  GOLDEN_DURATION,
  PRIMARY,
  GOLD,
  createBeamPathElement,
  getBeamPosition,
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

  const showWelding = phase === 'welding'
  const showGolden = phase === 'golden'

  useLayoutEffect(() => {
    const el = containerRef.current
    if (!el) return

    const rect = el.getBoundingClientRect()
    const w = rect.width
    const h = rect.height
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

  const rotation = useTransform(beamProgress, [0, 1], [0, 360])

  if (phase === 'idle' || phase === 'done') {
    return <div className={cn('rounded-xl bg-card', className)} style={style}>{children}</div>
  }

  return (
    <div
      ref={containerRef}
      className={cn('relative overflow-hidden rounded-xl', className)}
      style={{ padding: '1.5px', ...style }}
    >
      <WeldFilters />

      {showWelding && (
        <>
          <motion.div
            className="pointer-events-none absolute inset-0 z-10"
            style={{
              background: `conic-gradient(from -90deg, transparent 12%, ${PRIMARY}40 18%, transparent 22%, transparent 100%)`,
              borderRadius: '0.75rem',
              rotate: rotation,
            }}
          />
          <motion.div
            className="pointer-events-none absolute inset-0 z-10"
            style={{
              background: `conic-gradient(from -90deg, ${PRIMARY} 0%, ${PRIMARY} 2.5%, transparent 5.5%, transparent 100%)`,
              borderRadius: '0.75rem',
              rotate: rotation,
            }}
          />
          <StarGlow x={beamPos.x} y={beamPos.y} color={PRIMARY} intensity={1.2} />
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
            className="pointer-events-none absolute inset-0 z-10"
            style={{
              background: `conic-gradient(from -90deg, ${GOLD} 0%, ${GOLD} 3%, transparent 6%, transparent 100%)`,
              borderRadius: '0.75rem',
              rotate: rotation,
            }}
          />
          <StarGlow x={beamPos.x} y={beamPos.y} color={GOLD} intensity={2.5} />
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
        </>
      )}

      <div className="relative z-[1] rounded-[11px] bg-card">
        {children}
      </div>
    </div>
  )
}
