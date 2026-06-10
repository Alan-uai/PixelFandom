'use client'

import { useEffect, useRef } from 'react'

interface GravitationalWaveCanvasProps {
  active: boolean
  intensity: number
}

interface Wave {
  cx: number
  cy: number
  birth: number
  amplitude: number
}

function seededRandom(seed: number): () => number {
  let s = seed
  return () => {
    s = (s * 16807 + 0) % 2147483647
    return (s - 1) / 2147483646
  }
}

export default function GravitationalWaveCanvas({ active, intensity }: GravitationalWaveCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (!active) return

    const cvs = canvasRef.current!
    const context = cvs.getContext('2d')!

    let w = 0
    let h = 0
    const dpr = window.devicePixelRatio || 1

    function resize() {
      w = window.innerWidth
      h = window.innerHeight
      cvs.width = w * dpr
      cvs.height = h * dpr
      cvs.style.width = w + 'px'
      cvs.style.height = h + 'px'
      context.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    resize()
    window.addEventListener('resize', resize)

    const waves: Wave[] = []
    const rand = seededRandom(Date.now())
    let lastSpawn = 0
    let startTime = 0
    let raf = 0

    function getTextCenter() {
      const el = document.querySelector('.splash-text-container') as HTMLElement | null
      if (!el) return { x: w / 2, y: h / 2, width: w, height: h }
      const r = el.getBoundingClientRect()
      return { x: r.left, y: r.top, width: r.width, height: r.height }
    }

    function animate(now: number) {
      if (!startTime) startTime = now
      const elapsed = (now - startTime) / 1000
      const progress = Math.min(elapsed / 3.2, 1)

      context.fillStyle = 'black'
      context.fillRect(0, 0, w, h)

      const bounds = getTextCenter()
      const epicenterX = bounds.x + progress * bounds.width
      const epicenterY = bounds.y + bounds.height / 2 + Math.sin(progress * Math.PI * 3) * 50 * intensity

      const spawnInterval = Math.max(40, 180 - intensity * 140)
      if (elapsed - lastSpawn > spawnInterval / 1000) {
        lastSpawn = elapsed
        waves.push({
          cx: epicenterX + (rand() - 0.5) * 100,
          cy: epicenterY + (rand() - 0.5) * 80,
          birth: elapsed,
          amplitude: 0.4 + rand() * 0.6 * intensity,
        })
      }

      context.globalCompositeOperation = 'lighter'

      const waveDuration = 1.0 + intensity * 0.5
      for (let i = waves.length - 1; i >= 0; i--) {
        const wave = waves[i]
        const age = elapsed - wave.birth
        if (age > waveDuration) {
          waves.splice(i, 1)
          continue
        }
        const t = age / waveDuration
        const radius = 20 + t * 400 * (0.3 + intensity * 0.7)
        const alpha = (1 - t) * wave.amplitude * 0.9

        const grad = context.createRadialGradient(wave.cx, wave.cy, 0, wave.cx, wave.cy, radius)
        grad.addColorStop(0, `rgba(255,255,255,${alpha})`)
        grad.addColorStop(0.15, `rgba(255,255,255,${alpha * 0.8})`)
        grad.addColorStop(0.4, `rgba(200,220,255,${alpha * 0.4})`)
        grad.addColorStop(0.7, `rgba(150,180,255,${alpha * 0.15})`)
        grad.addColorStop(1, 'rgba(255,255,255,0)')

        context.beginPath()
        context.fillStyle = grad
        context.arc(wave.cx, wave.cy, radius, 0, Math.PI * 2)
        context.fill()
      }

      context.globalCompositeOperation = 'source-over'

      raf = requestAnimationFrame(animate)
    }

    raf = requestAnimationFrame(animate)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
    }
  }, [active, intensity])

  if (!active) return null

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none"
      style={{ mixBlendMode: 'multiply', zIndex: 5 }}
    />
  )
}
