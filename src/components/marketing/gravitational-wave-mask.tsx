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
    const el = document.querySelector('.splash-text-container') as HTMLElement | null
    if (!el) return

    if (!active) {
      el.style.removeProperty('mask-image')
      el.style.removeProperty('-webkit-mask-image')
      wavesRef.current = []
      return
    }

    randRef.current = seededRandom(Date.now())
    wavesRef.current = []
    startTimeRef.current = 0
    lastSpawnRef.current = 0

    const target = el

    function animate(now: number) {
      if (!startTimeRef.current) startTimeRef.current = now
      const elapsed = (now - startTimeRef.current) / 1000
      const progress = Math.min(elapsed / 3.2, 1)

      const elRect = target.getBoundingClientRect()
      const epicenterX = progress * elRect.width
      const epicenterY = elRect.height / 2 + Math.sin(progress * Math.PI * 3) * 50 * intensity

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
        const radius = Math.round(20 + t * 400 * (0.3 + intensity * 0.7))
        const alpha = ((1 - t) * wave.amplitude * 0.9).toFixed(3)

        grads.push(
          `radial-gradient(circle ${radius}px at ${wave.cx.toFixed(1)}px ${wave.cy.toFixed(1)}px, black 0%, rgba(0,0,0,${alpha}) ${Math.round(radius * 0.5)}px, transparent ${radius}px)`,
        )
      }

      if (grads.length > 0) {
        const mask = grads.join(', ')
        target.style.maskImage = mask
        target.style.webkitMaskImage = mask
      }

      rafRef.current = requestAnimationFrame(animate)
    }

    rafRef.current = requestAnimationFrame(animate)

    return () => {
      cancelAnimationFrame(rafRef.current)
      target.style.removeProperty('mask-image')
      target.style.removeProperty('webkitMaskImage')
    }
  }, [active, intensity])

  return null
}
