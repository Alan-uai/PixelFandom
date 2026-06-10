'use client'

import { motion } from 'framer-motion'

function generateIrregularRingPath(
  outerRadius: number,
  innerRatio: number,
  wobble: number,
  phase: number,
): string {
  const steps = 48
  const innerRadius = outerRadius * innerRatio
  const cx = 200
  const cy = 200
  let d = ''

  for (let i = 0; i <= steps; i++) {
    const a = (i / steps) * Math.PI * 2
    const r =
      outerRadius *
      (1 +
        wobble * Math.sin(a * 4 + phase) +
        wobble * 0.3 * Math.sin(a * 9 + phase * 1.3))
    d += `${i === 0 ? 'M' : 'L'} ${cx + r * Math.cos(a)} ${cy + r * Math.sin(a)}`
  }
  for (let i = 0; i <= steps; i++) {
    const a = (i / steps) * Math.PI * -2
    const r =
      innerRadius *
      (1 +
        wobble * Math.sin(a * 4 + phase + 1.5) +
        wobble * 0.3 * Math.sin(a * 9 + phase * 1.7))
    d += ` L ${cx + r * Math.cos(a)} ${cy + r * Math.sin(a)}`
  }

  return d + ' Z'
}

const RINGS = Array.from({ length: 6 }, (_, i) => ({
  outerRadius: 18 + i * 20,
  innerRatio: 0.5 + (i * 17) % 15 * 0.01,
  wobble: 0.02 + (i * 3) % 4 * 0.008,
  phaseSeed: i * 0.73 + 1.2,
  delay: i * 0.15,
}))

interface SplashWaveRingsProps {
  ringCount: number
  speed: number
}

export default function SplashWaveRings({ ringCount, speed }: SplashWaveRingsProps) {
  const visibleCount = Math.max(0, Math.min(6, ringCount))

  const baseDuration = Math.max(1.2, 3 - visibleCount * 0.2)

  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-visible">
      <svg width="0" height="0" className="absolute">
        <defs>
          <linearGradient id="splashWaveGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="hsl(270,80%,60%)" stopOpacity="0.7" />
            <stop offset="50%" stopColor="hsl(350,90%,60%)" stopOpacity="0.45" />
            <stop offset="100%" stopColor="hsl(350,90%,60%)" stopOpacity="0.15" />
          </linearGradient>
        </defs>
      </svg>

      {RINGS.map((arc, i) => {
        const visible = i < visibleCount
        return (
          <motion.div
            key={i}
            className="absolute"
            style={{
              width: 400,
              height: 400,
              left: '50%',
              top: '50%',
              marginLeft: -200,
              marginTop: -200,
            }}
            initial={{ scale: 0.2, opacity: 0 }}
            animate={
              visible
                ? {
                    scale: [0.2, 0.7, 1.5 + i * 0.2],
                    opacity: [0, 0.5, 0],
                    rotate: [0, 6 + i * 4],
                  }
                : { scale: 0.2, opacity: 0 }
            }
            transition={{
              duration: baseDuration / speed,
              times: [0, 0.2, 1],
              delay: visible ? arc.delay : 0,
              ease: 'easeOut',
            }}
          >
            <svg width="400" height="400" viewBox="0 0 400 400">
              <path
                d={generateIrregularRingPath(
                  arc.outerRadius,
                  arc.innerRatio,
                  arc.wobble,
                  arc.phaseSeed,
                )}
                fill="none"
                stroke="url(#splashWaveGrad)"
                strokeWidth={Math.max(1.5, 3 - i * 0.25)}
                strokeLinejoin="round"
              />
            </svg>
          </motion.div>
        )
      })}
    </div>
  )
}
