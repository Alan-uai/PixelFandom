export const WELD_DURATION = 3500
export const GOLDEN_DURATION = 600
export const SPARK_STREAM_INTERVAL = 40
export const GRAVITY_SPARK_INTERVAL = 280
export const SPARK_STREAM_LIFETIME = 500
export const GRAVITY_SPARK_LIFETIME = 1200
export const PRIMARY = 'hsl(var(--primary))'
export const GOLD = 'hsla(45, 100%, 60%, 0.8)'

export function createBeamPathElement(w: number, h: number, r: number): SVGPathElement {
  const ns = 'http://www.w3.org/2000/svg'
  const path = document.createElementNS(ns, 'path')
  const R = Math.min(r, w / 2, h / 2)

  const d = [
    `M 0,${h / 2}`,
    `L 0,${R}`,
    `A ${R},${R} 0 0,1 ${R},0`,
    `L ${w - R},0`,
    `A ${R},${R} 0 0,1 ${w},${R}`,
    `L ${w},${h - R}`,
    `A ${R},${R} 0 0,1 ${w - R},${h}`,
    `L ${R},${h}`,
    `A ${R},${R} 0 0,1 0,${h - R}`,
    `L 0,${h / 2}`,
  ].join(' ')

  path.setAttribute('d', d)
  return path
}

export function getBeamPosition(
  path: SVGPathElement,
  progress: number,
): { x: number; y: number; angle: number } {
  const len = path.getTotalLength()
  const dist = Math.max(0, Math.min(len, len * Math.max(0, Math.min(1, progress))))
  const pt = path.getPointAtLength(dist)

  const e = 0.5
  const d1 = Math.max(0, dist - e)
  const d2 = Math.min(len, dist + e)
  const p1 = path.getPointAtLength(d1)
  const p2 = path.getPointAtLength(d2)
  const angle = Math.atan2(p2.y - p1.y, p2.x - p1.x)

  return { x: pt.x, y: pt.y, angle }
}

export function easeInCubic(t: number): number {
  return t * t * t
}
