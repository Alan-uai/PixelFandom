'use client'

interface SplashGlowProps {
  active: boolean
}

export default function SplashGlow({ active }: SplashGlowProps) {
  return (
    <div
      className="splash-glow absolute"
      style={{
        width: '80vw',
        maxWidth: 700,
        height: '60vw',
        maxHeight: 400,
        left: '50%',
        top: '50%',
        transform: 'translate(-50%, -50%)',
        opacity: active ? 0.4 : 0,
        transition: 'opacity 1.2s ease-in-out',
        pointerEvents: 'none',
        zIndex: -1,
      }}
    />
  )
}
