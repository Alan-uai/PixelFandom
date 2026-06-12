'use client'

import { motion } from 'framer-motion'

function generateStarPath(hr: number, vr: number): string {
  return `M 0,-${vr} C ${hr*0.06},-${vr*0.93} ${hr*0.5},-${vr*0.17} ${hr},0 C ${hr*0.5},${vr*0.17} ${hr*0.06},${vr*0.93} 0,${vr} C -${hr*0.06},${vr*0.93} -${hr*0.5},${vr*0.17} -${hr},0 C -${hr*0.5},-${vr*0.17} -${hr*0.06},-${vr*0.93} 0,-${vr} Z`
}

function sampleStarPoints(hr: number, vr: number, total: number): { x: number; y: number }[] {
  const segs: { p0: { x: number; y: number }; p1: { x: number; y: number }; p2: { x: number; y: number }; p3: { x: number; y: number } }[] = [
    { p0: { x: 0, y: -vr }, p1: { x: hr * 0.06, y: -vr * 0.93 }, p2: { x: hr * 0.5, y: -vr * 0.17 }, p3: { x: hr, y: 0 } },
    { p0: { x: hr, y: 0 }, p1: { x: hr * 0.5, y: vr * 0.17 }, p2: { x: hr * 0.06, y: vr * 0.93 }, p3: { x: 0, y: vr } },
    { p0: { x: 0, y: vr }, p1: { x: -hr * 0.06, y: vr * 0.93 }, p2: { x: -hr * 0.5, y: vr * 0.17 }, p3: { x: -hr, y: 0 } },
    { p0: { x: -hr, y: 0 }, p1: { x: -hr * 0.5, y: -vr * 0.17 }, p2: { x: -hr * 0.06, y: -vr * 0.93 }, p3: { x: 0, y: -vr } },
  ]
  const points: { x: number; y: number }[] = []
  const stepsPerSeg = Math.max(1, Math.floor(total / 4))
  for (const seg of segs) {
    for (let i = 0; i < stepsPerSeg; i++) {
      const t = i / stepsPerSeg
      const u = 1 - t
      points.push({
        x: u * u * u * seg.p0.x + 3 * u * u * t * seg.p1.x + 3 * u * t * t * seg.p2.x + t * t * t * seg.p3.x,
        y: u * u * u * seg.p0.y + 3 * u * u * t * seg.p1.y + 3 * u * t * t * seg.p2.y + t * t * t * seg.p3.y,
      })
    }
  }
  return points
}

function generateMorphPath(
  progress: number,
  ringOuterRadius: number,
  ringWobble: number,
  ringPhase: number,
  starHr: number,
  starVr: number,
  pointCount: number = 60
): string {
  let d = ''
  const starPts = sampleStarPoints(starHr, starVr, pointCount)
  for (let i = 0; i < pointCount; i++) {
    const a = (i / pointCount) * Math.PI * 2
    const ringR = ringOuterRadius * (1 + ringWobble * Math.sin(a * 4 + ringPhase) + ringWobble * 0.3 * Math.sin(a * 9 + ringPhase * 1.3))
    const ox = ringR * Math.cos(a) * (1 - progress) + starPts[i].x * progress
    const oy = ringR * Math.sin(a) * (1 - progress) + starPts[i].y * progress
    d += `${i === 0 ? 'M' : 'L'} ${ox} ${oy}`
  }
  return d + ' Z'
}

export function generateStarConfig() {
  return Array.from({ length: 3 }, (_, i) => ({
    hr: 130 + Math.floor(Math.random() * 90),
    vr: 40 + Math.floor(Math.random() * 30),
    duration: 3.5 + Math.random() * 2,
    delay: i * (0.5 + Math.random()),
    repeatDelay: 2 + Math.random() * 3,
  }))
}

interface GravitationalWaveProps {
  morphProgress: number
  isExpanded: boolean
  ringOuterRadius: number
  ringWobble: number
  ringPhaseSeed: number
  starHr: number
  starVr: number
  starWaves?: Array<{ hr: number; vr: number; duration: number; delay: number; repeatDelay: number }>
  gradientId?: string
}

export default function GravitationalWave({
  morphProgress,
  isExpanded,
  ringOuterRadius,
  ringWobble,
  ringPhaseSeed,
  starHr,
  starVr,
  starWaves = [],
  gradientId = 'morph-stroke-grad',
}: GravitationalWaveProps) {
  return (
    <div
      className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-visible"
      style={{ perspective: 800, transformStyle: 'preserve-3d' }}
    >
      {starWaves.map((sw, i) => (
        <motion.div
          key={`starwave-${i}`}
          className="absolute"
          style={{
            width: 400,
            height: 400,
            left: '50%',
            top: '50%',
            marginLeft: -200,
            marginTop: -200,
          }}
          initial={{ scale: 0.05, opacity: 0 }}
          animate={
            isExpanded
              ? { scale: [0.05, 1.0, 1.5 + i * 0.15], opacity: [0, 0.35, 0], rotate: [0, 3 + i * 2] }
              : { scale: 0.05, opacity: 0 }
          }
          transition={
            isExpanded
              ? { duration: sw.duration, times: [0, 0.2, 1], delay: sw.delay, repeat: Infinity, repeatDelay: sw.repeatDelay, ease: 'easeOut' }
              : { duration: 0.3 }
          }
        >
          <div className="w-full h-full" style={{ transform: 'rotateX(8deg)' }}>
            <svg width="400" height="400" viewBox="-200 -200 400 400">
              <path
                d={generateStarPath(sw.hr, sw.vr)}
                fill="none"
                stroke={`url(#${gradientId})`}
                strokeWidth={Math.max(1, 2.5 - i * 0.5)}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </motion.div>
      ))}

      <motion.div
        className="absolute"
        style={{
          width: 400,
          height: 400,
          left: '50%',
          top: '50%',
          marginLeft: -200,
          marginTop: -200,
          transformStyle: 'preserve-3d',
        }}
        animate={
          !isExpanded
            ? { scale: [0.05, 1.0, 1.5], opacity: [0, 0.4, 0], rotate: [0, 4] }
            : { scale: 1, opacity: 0.5, rotate: 0 }
        }
        transition={
          !isExpanded
            ? { duration: 4, times: [0, 0.2, 1], repeat: Infinity, repeatDelay: 2.5, ease: 'easeOut' }
            : { duration: 0.6 }
        }
      >
        <div className="w-full h-full" style={{ transform: 'rotateX(8deg)' }}>
          <svg width="400" height="400" viewBox="-200 -200 400 400">
            <path
              d={generateMorphPath(
                morphProgress,
                ringOuterRadius,
                ringWobble,
                ringPhaseSeed,
                starHr,
                starVr,
                60
              )}
              fill="none"
              stroke={`url(#${gradientId})`}
              strokeWidth={Math.max(2, 4 - ringOuterRadius * 0.01)}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </motion.div>
    </div>
  )
}
