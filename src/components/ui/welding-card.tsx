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

export interface TrailConfig {
  width: number
  opacity: number
  length?: number
  color?: string
}

export interface WeldingCardProps {
  className?: string
  style?: CSSProperties
  children?: ReactNode

  duration?: number
  glowBlur?: number

  trails?: TrailConfig[]
  glowWidth?: number
  glowOpacity?: number
  glowLength?: number
  coreWidth?: number
  coreLength?: number

  starColor?: string
  starIntensity?: number

  showSparks?: boolean

  text?: string
  textStartDelay?: number

  showGolden?: boolean
  goldenDuration?: number
  goldenColor?: string
  goldenStarIntensity?: number

  onWeldDone?: () => void
  onGoldenDone?: () => void
}

type Phase = 'pending' | 'welding' | 'golden' | 'done'

export function WeldingCard({
  className,
  style,
  children,
  duration = WELD_DURATION,
  glowBlur = 4,
  trails = [{ width: 2, opacity: 0.5 }],
  glowWidth = 6,
  glowOpacity = 0.6,
  glowLength = 0.12,
  coreWidth = 2,
  coreLength = 0.04,
  starColor = PRIMARY,
  starIntensity = 1.2,
  showSparks = true,
  text,
  textStartDelay,
  showGolden = true,
  goldenDuration = GOLDEN_DURATION,
  goldenColor = GOLD,
  goldenStarIntensity = 2.5,
  onWeldDone,
  onGoldenDone,
}: WeldingCardProps) {
  const [phase, setPhase] = useState<Phase>('pending')
  const containerRef = useRef<HTMLDivElement>(null)
  const pathRef = useRef<SVGPathElement | null>(null)
  const beamProgress = useMotionValue(0)
  const [beamPos, setBeamPos] = useState({ x: 0, y: 0, angle: 0 })
  const [cardSize, setCardSize] = useState({ w: 0, h: 0 })
  const [cardHeight, setCardHeight] = useState(0)
  const [pathVersion, setPathVersion] = useState(0)

  const showWelding = phase === 'welding'
  const showGoldenPhase = phase === 'golden'

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
  }, [])

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const observer = new ResizeObserver(entries => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect
        if (width > 0 && height > 0) {
          setCardSize({ w: Math.round(width), h: Math.round(height) })
          setCardHeight(Math.round(height))
          pathRef.current = createBeamPathElement(Math.round(width), Math.round(height), 12)
          setPathVersion(v => v + 1)
        }
      }
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (phase !== 'welding') return
    beamProgress.set(0)
    const controls = animate(beamProgress, 1, {
      duration: duration / 1000,
      ease: 'linear',
      onComplete: () => {
        if (showGolden) {
          setPhase('golden')
          beamProgress.set(0)
          animate(beamProgress, 1, {
            duration: goldenDuration / 1000,
            ease: 'linear',
            onComplete: () => {
              setPhase('done')
              onGoldenDone?.()
            },
          })
        } else {
          setPhase('done')
          onWeldDone?.()
        }
      },
    })
    return () => controls.stop()
  }, [phase, duration, showGolden, goldenDuration, onWeldDone, onGoldenDone, beamProgress])

  useEffect(() => {
    const path = pathRef.current
    if (!path || !showWelding) return
    const unsub = beamProgress.on('change', v => {
      setBeamPos(getBeamPosition(path, v))
    })
    return unsub
  }, [beamProgress, pathVersion, showWelding])

  const pathD = useMemo(
    () => getBeamPathD(cardSize.w, cardSize.h, 12),
    [cardSize.w, cardSize.h],
  )

  const pad = (arr: TrailConfig[], n: number): (TrailConfig | null)[] => {
    const result: (TrailConfig | null)[] = []
    for (let i = 0; i < n; i++) result.push(arr[i] ?? null)
    return result
  }

  const t = pad(trails, 3)
  const tLen = [t[0]?.length ?? 0.15, t[1]?.length ?? 0.10, t[2]?.length ?? 0.06]

  const trArr0 = useTransform(beamProgress, v => {
    if (!t[0]) return '0 1'
    const len = Math.min(tLen[0], Math.max(0, v))
    return `${len} 1`
  })
  const trOff0 = useTransform(beamProgress, v => {
    if (!t[0]) return 0
    return Math.min(0, tLen[0] - v)
  })
  const trArr1 = useTransform(beamProgress, v => {
    if (!t[1]) return '0 1'
    const len = Math.min(tLen[1], Math.max(0, v))
    return `${len} 1`
  })
  const trOff1 = useTransform(beamProgress, v => {
    if (!t[1]) return 0
    return Math.min(0, tLen[1] - v)
  })
  const trArr2 = useTransform(beamProgress, v => {
    if (!t[2]) return '0 1'
    const len = Math.min(tLen[2], Math.max(0, v))
    return `${len} 1`
  })
  const trOff2 = useTransform(beamProgress, v => {
    if (!t[2]) return 0
    return Math.min(0, tLen[2] - v)
  })

  const glowArr = useTransform(beamProgress, v => {
    const len = Math.min(glowLength, Math.max(0, v))
    return `${len} 1`
  })
  const glowOff = useTransform(beamProgress, v => Math.min(0, glowLength - v))

  const coreArr = useTransform(beamProgress, v => {
    const len = Math.min(coreLength, Math.max(0, v))
    return `${len} 1`
  })
  const coreOff = useTransform(beamProgress, v => Math.min(0, coreLength - v))

  const trailLayers = [
    { arr: trArr0, off: trOff0, cfg: t[0] },
    { arr: trArr1, off: trOff1, cfg: t[1] },
    { arr: trArr2, off: trOff2, cfg: t[2] },
  ]

  return (
    <div
      ref={containerRef}
      className={cn(
        'relative rounded-xl',
        (phase === 'pending' || phase === 'done') ? 'bg-card' : '',
        className,
      )}
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
                <feGaussianBlur stdDeviation={String(glowBlur)} result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {pathD && (
              <path d={pathD} fill="none" stroke={PRIMARY} strokeWidth={1.5} opacity={0.12} strokeLinecap="round" strokeLinejoin="round" />
            )}

            {trailLayers.map((l, i) => l.cfg && pathD && (
              <motion.path
                key={i}
                d={pathD}
                fill="none"
                stroke={l.cfg.color ?? PRIMARY}
                strokeWidth={l.cfg.width}
                strokeLinecap="round"
                strokeLinejoin="round"
                pathLength="1"
                style={{ strokeDasharray: l.arr, strokeDashoffset: l.off }}
                opacity={l.cfg.opacity}
              />
            ))}

            {pathD && (
              <motion.path
                d={pathD}
                fill="none"
                stroke={PRIMARY}
                strokeWidth={glowWidth}
                strokeLinecap="round"
                strokeLinejoin="round"
                pathLength="1"
                style={{ strokeDasharray: glowArr, strokeDashoffset: glowOff }}
                opacity={glowOpacity}
                filter="url(#svg-beam-glow)"
              />
            )}

            {pathD && (
              <motion.path
                d={pathD}
                fill="none"
                stroke="#fff"
                strokeWidth={coreWidth}
                strokeLinecap="round"
                strokeLinejoin="round"
                pathLength="1"
                style={{ strokeDasharray: coreArr, strokeDashoffset: coreOff }}
              />
            )}
          </svg>

          <StarGlow x={beamPos.x} y={beamPos.y} color={starColor} intensity={starIntensity} seed={0} />

          {showSparks && (
            <>
              <SparkStream beamX={beamPos.x} beamY={beamPos.y} beamAngle={beamPos.angle} active={showWelding} />
              <GravitySpark beamX={beamPos.x} beamY={beamPos.y} beamAngle={beamPos.angle} active={showWelding} groundY={cardHeight} />
            </>
          )}

          {text && (
            <div className="absolute inset-0 z-30 rounded-[11px] bg-card/60 pointer-events-none">
              <div className="px-6 py-4">
                <WeldedText
                  text={text}
                  startDelay={textStartDelay ?? duration * 0.35}
                  className="text-2xl font-bold text-foreground"
                />
              </div>
            </div>
          )}
        </>
      )}

      {showGoldenPhase && (
        <>
          <motion.div
            className="pointer-events-none absolute inset-0 z-20 rounded-xl"
            initial={{ boxShadow: `0 0 0px ${goldenColor}` }}
            animate={{
              boxShadow: [
                `0 0 0px transparent`,
                `0 0 40px ${goldenColor}`,
                `0 0 70px ${goldenColor}`,
                `0 0 20px ${goldenColor}`,
                `0 0 0px transparent`,
              ],
            }}
            transition={{ duration: 0.8, ease: 'easeInOut' }}
          />
          <StarGlow x={cardSize.w / 2} y={cardSize.h / 2} color={goldenColor} intensity={goldenStarIntensity} seed={1} />
        </>
      )}

      <div className={cn(
        'relative z-[1]',
        (phase === 'pending' || phase === 'done')
          ? ''
          : 'rounded-[11px] bg-card m-[1.5px]',
      )}>
        {children}
      </div>
    </div>
  )
}
