'use client'

import { motion } from 'framer-motion'

function generateIrregularRingPath(outerRadius: number, wobble: number, phase: number): string {
  const steps = 48
  const cx = 200
  const cy = 200
  let d = ''

  for (let i = 0; i <= steps; i++) {
    const a = (i / steps) * Math.PI * 2
    const r = outerRadius * (1 + wobble * Math.sin(a * 4 + phase) + wobble * 0.3 * Math.sin(a * 9 + phase * 1.3))
    d += `${i === 0 ? 'M' : 'L'} ${cx + r * Math.cos(a)} ${cy + r * Math.sin(a)}`
  }

  return d + ' Z'
}

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
    const a = (i / pointCount) * Math.PI * 2 - Math.PI / 2
    const ringR = ringOuterRadius * (1 + ringWobble * Math.sin(a * 4 + ringPhase) + ringWobble * 0.3 * Math.sin(a * 9 + ringPhase * 1.3))
    const ox = ringR * Math.cos(a) * (1 - progress) + starPts[i].x * progress
    const oy = ringR * Math.sin(a) * (1 - progress) + starPts[i].y * progress
    d += `${i === 0 ? 'M' : 'L'} ${ox} ${oy}`
  }
  return d + ' Z'
}

export function generateStarConfig() {
  const count = 1 + Math.floor(Math.random() * 6)
  return Array.from({ length: count }, (_, i) => ({
    hr: 60 + Math.floor(Math.random() * 160),
    vr: 20 + Math.floor(Math.random() * 60),
    duration: 2.5 + Math.random() * 3.5,
    delay: i * (0.3 + Math.random() * 0.8),
    repeatDelay: 1.5 + Math.random() * 4,
  }))
}

interface WaveInstance {
  outerRadius: number
  wobble: number
  phaseSeed: number
  duration: number
  delay: number
  repeatDelay: number
}

interface StarWaveInstance {
  hr: number
  vr: number
  duration: number
  delay: number
  repeatDelay: number
}

interface GravitationalWaveProps {
  morphProgress: number
  isExpanded: boolean
  ringOuterRadius: number
  ringWobble: number
  ringPhaseSeed: number
  starHr: number
  starVr: number
  ringWaves?: WaveInstance[]
  starWaves?: StarWaveInstance[]
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
  ringWaves = [],
  starWaves = [],
  gradientId = 'morph-stroke-grad',
}: GravitationalWaveProps) {
  return (
    <div
      className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-visible"
      style={{ perspective: 800, transformStyle: 'preserve-3d' }}
    >
      {/* ── Ring waves (collapsed ambiance) ── */}
      <motion.div
        className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-visible"
        style={{ perspective: 800, transformStyle: 'preserve-3d' }}
        animate={{ opacity: isExpanded ? 0 : 1 }}
        transition={{ duration: 0.6 }}
      >
        <div className="absolute" style={{ transform: 'rotateX(8deg)', transformStyle: 'preserve-3d' }}>
          {ringWaves.map((w, i) => (
            <motion.div
              key={`ringwave-${i}`}
              className="absolute"
              style={{
                width: 400,
                height: 400,
                left: '50%',
                top: '50%',
                marginLeft: -200,
                marginTop: -200,
                transform: `translateZ(${(i - 2.5) * 10}px)`,
              }}
              initial={{ scale: 0.05, opacity: 0 }}
              animate={
                !isExpanded
                  ? { scale: [0.05, 1.0, 1.5 + i * 0.12], opacity: [0, 0.5, 0], rotate: [0, 4 + i * 2] }
                  : { scale: 0.05, opacity: 0 }
              }
              transition={
                !isExpanded
                  ? { duration: w.duration, times: [0, 0.2, 1], delay: w.delay, repeat: Infinity, repeatDelay: w.repeatDelay, ease: 'easeOut' }
                  : { duration: 0.3 }
              }
            >
              <svg width="400" height="400" viewBox="0 0 400 400">
                <path
                  d={generateIrregularRingPath(w.outerRadius, w.wobble, w.phaseSeed)}
                  fill="none"
                  stroke="url(#wave-ring-grad)"
                  strokeWidth={Math.max(1.2, 2.5 - i * 0.15)}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* ── Star waves (expanded ambiance) ── */}
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
        </motion.div>
      ))}

      {/* ── Morph Path (morph ring ↔ star) ── */}
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
            : { scale: [0.05, 1.0, 1.5], opacity: [0, 0.5, 0], rotate: [0, 3] }
        }
        transition={
          !isExpanded
            ? { duration: 4, times: [0, 0.2, 1], repeat: Infinity, repeatDelay: 2.5, ease: 'easeOut' }
            : { duration: 4, times: [0, 0.2, 1], repeat: Infinity, repeatDelay: 2.5, ease: 'easeOut' }
        }
      >
        <div className="w-full h-full" style={{ transform: isExpanded ? 'none' : 'rotateX(8deg)' }}>
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
