'use client';

import { useState, useEffect, useMemo, type CSSProperties, type ReactNode } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface SparkBurstProps {
  x: number;
  y: number;
  delay: number;
  count: number;
  color: string;
}

function SparkBurst({ x, y, delay, count, color }: SparkBurstProps) {
  const particles = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => {
        const angle = (i / count) * Math.PI * 2 + (Math.random() - 0.5) * 0.6;
        return {
          angle,
          distance: 12 + Math.random() * 28,
          size: 1.5 + Math.random() * 2,
        };
      }),
    [count],
  );

  return (
    <div className="pointer-events-none absolute inset-0 z-10 overflow-hidden rounded-xl">
      {particles.map((p, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            left: `${x}%`,
            top: `${y}%`,
            width: p.size,
            height: p.size,
            backgroundColor: color,
            boxShadow: `0 0 3px ${color}`,
          }}
          initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
          animate={{
            x: Math.cos(p.angle) * p.distance,
            y: Math.sin(p.angle) * p.distance,
            opacity: [1, 0.8, 0],
            scale: [1, 0.5, 0],
          }}
          transition={{
            delay,
            duration: 0.6 + Math.random() * 0.3,
            ease: [0.17, 0.67, 0.12, 0.99],
          }}
        />
      ))}
    </div>
  );
}

interface WeldingCardProps {
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
}

export function WeldingCard({ className, style, children }: WeldingCardProps) {
  const [phase, setPhase] = useState<'idle' | 'welding' | 'complete' | 'done'>('idle');

  useEffect(() => {
    setPhase('welding');
    const t1 = setTimeout(() => setPhase('complete'), 1800);
    const t2 = setTimeout(() => setPhase('done'), 2600);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  const primary = 'hsl(var(--primary))';
  const gold = 'hsla(45, 100%, 60%, 0.6)';
  const showWelding = phase === 'welding';
  const showComplete = phase === 'complete';

  const bursts = useMemo(() => {
    if (!showWelding) return [];
    return Array.from({ length: 8 }, (_, i) => {
      const t = i / 8;
      let x: number; let y: number;
      if (t < 0.25) { x = (t / 0.25) * 90 + 5; y = 0; }
      else if (t < 0.5) { x = 95; y = ((t - 0.25) / 0.25) * 90 + 5; }
      else if (t < 0.75) { x = 95 - ((t - 0.5) / 0.5) * 90; y = 95; }
      else { x = 5; y = 95 - ((t - 0.75) / 0.25) * 90; }
      return { id: i, x, y, delay: i * 0.15 };
    });
  }, [showWelding]);

  if (phase === 'idle' || phase === 'done') {
    return <div className={cn('rounded-xl bg-card', className)} style={style}>{children}</div>;
  }

  return (
    <div className={cn('relative overflow-hidden rounded-xl', className)} style={{ padding: '1.5px', ...style }}>
      {showWelding && (
        <motion.div
          className="pointer-events-none absolute inset-0"
          style={{
            background: `conic-gradient(from 0deg, transparent 55%, ${primary} 78%, ${primary} 85%, transparent 90%)`,
            borderRadius: '0.75rem',
          }}
          initial={{ rotate: 0 }}
          animate={{ rotate: 360 }}
          transition={{ duration: 1.8, ease: 'linear' }}
        />
      )}

      {showWelding && bursts.map((b) => (
        <SparkBurst key={b.id} x={b.x} y={b.y} delay={b.delay} count={6} color={primary} />
      ))}

      {showComplete && (
        <motion.div
          className="pointer-events-none absolute inset-0 z-20 rounded-xl"
          initial={{ boxShadow: `0 0 0px ${gold}` }}
          animate={{
            boxShadow: [
              `0 0 0px transparent`,
              `0 0 40px ${gold}`,
              `0 0 60px ${gold}`,
              `0 0 20px ${gold}`,
              `0 0 0px transparent`,
            ],
          }}
          transition={{ duration: 0.8, ease: 'easeInOut' }}
        />
      )}

      <div className="relative rounded-[11px] bg-card">{children}</div>
    </div>
  );
}
