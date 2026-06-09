'use client'

import { useMemo } from 'react'

interface ParticleFieldProps {
  count?: number
}

export default function ParticleField({ count = 60 }: ParticleFieldProps) {
  const particles = useMemo(() => {
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      size: Math.random() * 2.5 + 0.5,
      delay: Math.random() * 4,
      duration: Math.random() * 3 + 3,
      opacity: Math.random() * 0.5 + 0.15,
    }))
  }, [count])

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute rounded-full bg-white"
          style={{
            left: p.left,
            top: p.top,
            width: p.size,
            height: p.size,
            opacity: 0,
            animation: `splash-particle-fade ${p.duration}s ease-in-out ${p.delay}s infinite`,
            boxShadow: `0 0 ${p.size * 3}px rgba(255,255,255,0.3)`,
          }}
        />
      ))}
    </div>
  )
}
