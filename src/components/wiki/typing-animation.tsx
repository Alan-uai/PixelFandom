'use client';

import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

type Props = {
  color?: string;
  size?: 'sm' | 'md' | 'lg';
};

const SIZE_MAP = {
  sm: { container: 40, dot: 4 },
  md: { container: 64, dot: 7 },
  lg: { container: 96, dot: 10 },
};

function useParticleAnimation(canvasRef: React.RefObject<HTMLCanvasElement | null>, color: string) {
  useEffect(() => {
    const el = canvasRef.current!;
    const cx = el.getContext('2d')!;
    let animating = true;
    const particles: { x: number; y: number; vx: number; vy: number; life: number; hue: number }[] = [];
    const centerX = el.width / 2;
    const centerY = el.height / 2;

    function spawnParticle() {
      const angle = Math.random() * Math.PI * 2;
      const dist = Math.random() * 16 + 4;
      particles.push({
        x: centerX + Math.cos(angle) * dist,
        y: centerY + Math.sin(angle) * dist,
        vx: Math.cos(angle) * (Math.random() * 0.5 + 0.1),
        vy: Math.sin(angle) * (Math.random() * 0.5 + 0.1),
        life: 1,
        hue: Math.random() * 40 - 20,
      });
    }

    function animate() {
      if (!animating) return;
      cx.clearRect(0, 0, el.width, el.height);

      if (particles.length < 40) spawnParticle();

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life -= 0.02;
        if (p.life <= 0) { particles.splice(i, 1); continue; }

        cx.beginPath();
        cx.arc(p.x, p.y, 2 * p.life, 0, Math.PI * 2);
        cx.fillStyle = `hsla(${p.hue + 200}, 80%, 65%, ${p.life * 0.6})`;
        cx.fill();
      }
      requestAnimationFrame(animate);
    }
    animate();
    return () => { animating = false; };
  }, [canvasRef, color]);
}

export default function TypingAnimation({ color = 'var(--primary)', size = 'md' }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dims = SIZE_MAP[size];
  useParticleAnimation(canvasRef, color);

  return (
    <div className="relative" style={{ width: dims.container, height: dims.container }}>
      <canvas
        ref={canvasRef}
        width={dims.container}
        height={dims.container}
        className="absolute inset-0 pointer-events-none"
        style={{ filter: 'blur(1px)' }}
      />

      <motion.div
        className="absolute inset-0 flex items-center justify-center"
        animate={{ rotate: 360 }}
        transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
      >
        <div className="relative flex items-center justify-center">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="absolute rounded-full"
              style={{
                width: dims.dot,
                height: dims.dot,
                backgroundColor: color,
                x: Math.cos((i * Math.PI * 2) / 3) * (dims.container * 0.25),
                y: Math.sin((i * Math.PI * 2) / 3) * (dims.container * 0.25),
              }}
              animate={{
                scale: [1, 1.8, 1],
                opacity: [0.4, 1, 0.4],
                filter: ['blur(0px)', 'blur(2px)', 'blur(0px)'],
              }}
              transition={{
                duration: 1.2,
                repeat: Infinity,
                delay: i * 0.4,
                ease: 'easeInOut',
              }}
            />
          ))}
        </div>
      </motion.div>


    </div>
  );
}
