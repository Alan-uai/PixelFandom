'use client'

import { useEffect, useRef } from 'react'

interface GravitationalWaveMaskProps {
  active: boolean
  intensity: number
}

interface WaveRing {
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

export default function GravitationalWaveMask({ active, intensity }: GravitationalWaveMaskProps) {
  const rafRef = useRef(0)
  const wavesRef = useRef<WaveRing[]>([])
  const startTimeRef = useRef(0)
  const lastSpawnRef = useRef(0)
  const randRef = useRef(seededRandom(Date.now()))

  useEffect(() => {
    if (!active) {
      const el = document.querySelector('.splash-text-container') as HTMLElement | null
      if (el) {
        el.style.removeProperty('mask-image')
        el.style.removeProperty('-webkit-mask-image')
      }
      return
    }

    randRef.current = seededRandom(Date.now())
    wavesRef.current = []
    startTimeRef.current = 0
    lastSpawnRef.current = 0

    function getTextBounds() {
      const el = document.querySelector('.splash-text-container') as HTMLElement | null
      if (!el) return { x: window.innerWidth / 2, y: window.innerHeight / 2, width: window.innerWidth, height: window.innerHeight }
      const r = el.getBoundingClientRect()
      return { x: r.left, y: r.top, width: r.width, height: r.height }
    }

    function animate(now: number) {
      if (!startTimeRef.current) startTimeRef.current = now
      const elapsed = (now - startTimeRef.current) / 1000
      const progress = Math.min(elapsed / 3.2, 1)

      const bounds = getTextBounds()
      const epicenterX = bounds.x + progress * bounds.width
      const epicenterY = bounds.y + bounds.height / 2 + Math.sin(progress * Math.PI * 3) * 50 * intensity

      const spawnInterval = Math.max(40, 180 - intensity * 140)
      if (elapsed - lastSpawnRef.current > spawnInterval / 1000) {
        lastSpawnRef.current = elapsed
        wavesRef.current.push({
          cx: epicenterX + (randRef.current() - 0.5) * 100,
          cy: epicenterY + (randRef.current() - 0.5) * 80,
          birth: elapsed,
          amplitude: 0.4 + randRef.current() * 0.6 * intensity,
        })
      }

      const waveDuration = 1.0 + intensity * 0.5
      const grads: string[] = []

      for (let i = wavesRef.current.length - 1; i >= 0; i--) {
        const wave = wavesRef.current[i]
        const age = elapsed - wave.birth
        if (age > waveDuration) {
          wavesRef.current.splice(i, 1)
          continue
        }
        const t = age / waveDuration
        const radius = 20 + t * 400 * (0.3 + intensity * 0.7)
        const innerFade = Math.max(6, radius * 0.12)

        grads.push(
          `radial-gradient(circle ${radius}px at ${wave.cx}px ${wave.cy}px, transparent 0%, transparent ${innerFade}px, black ${radius * 0.7}px, black 100%)`,
        )
      }

      const el = document.querySelector('.splash-text-container') as HTMLElement | null
      if (el) {
        const mask = grads.join(', ')
        el.style.maskImage = mask
        el.style.WebkitMaskImage = mask
      }

      rafRef.current = requestAnimationFrame(animate)
    }

    rafRef.current = requestAnimationFrame(animate)

    return () => {
      cancelAnimationFrame(rafRef.current)
    }
  }, [active, intensity])

  return null
}
