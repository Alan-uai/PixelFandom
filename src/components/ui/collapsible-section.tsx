'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CollapsibleSectionProps {
  id: string;
  title: string;
  description?: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
  className?: string;
}

function SparkBurst({ x, y, delay, count, color }: { x: number; y: number; delay: number; count: number; color: string }) {
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

export function CollapsibleSection({
  id,
  title,
  description,
  defaultOpen = true,
  children,
  className,
}: CollapsibleSectionProps) {
  const [open, setOpen] = useState(defaultOpen);
  const contentRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState(0);
  const [weldPhase, setWeldPhase] = useState<'idle' | 'welding' | 'complete' | 'done'>('idle');

  useEffect(() => {
    setWeldPhase('welding');
    const t1 = setTimeout(() => setWeldPhase('complete'), 1800);
    const t2 = setTimeout(() => setWeldPhase('done'), 2600);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  useEffect(() => {
    if (contentRef.current) {
      setHeight(contentRef.current.scrollHeight);
    }
  }, [open, children]);

  const primary = 'hsl(var(--primary))';
  const gold = 'hsla(45, 100%, 60%, 0.6)';
  const showWelding = weldPhase === 'welding';
  const showComplete = weldPhase === 'complete';

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

  return (
    <section id={id} className={cn('relative overflow-hidden rounded-xl border bg-card text-card-foreground shadow-sm', className)}>
      {showWelding && (
        <motion.div
          className="pointer-events-none absolute inset-0 z-10"
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

      <div className="relative z-[1]">
        <motion.button
          onClick={() => setOpen(!open)}
          className="flex items-center justify-between gap-4 w-full px-6 py-4 text-left cursor-pointer select-none hover:bg-accent/50 transition-colors rounded-t-xl"
          whileTap={{ scale: 0.995 }}
          style={{ perspective: 1000, transformStyle: 'preserve-3d' }}
        >
          <div className="space-y-1 min-w-0 flex-1">
            <motion.h3
              className="font-semibold leading-none tracking-tight relative"
              animate={{ x: open ? 4 : 0 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
            >
              <motion.span
                className="block"
                animate={{ opacity: open ? 0 : 1 }}
                transition={{ duration: 0.25 }}
              >
                {title}
              </motion.span>
              <motion.span
                className="absolute inset-0 bg-gradient-to-r from-primary via-primary/70 to-primary/40 bg-clip-text text-transparent"
                animate={{ opacity: open ? 1 : 0 }}
                transition={{ duration: 0.25 }}
                aria-hidden
              >
                {title}
              </motion.span>
            </motion.h3>
            {description && (
              <p className="text-sm text-muted-foreground">{description}</p>
            )}
          </div>
          <motion.div
            animate={{ rotate: open ? 180 : 0, scale: open ? 1.2 : 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 12, mass: 0.8 }}
            style={{ transformStyle: 'preserve-3d' }}
          >
            <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
          </motion.div>
        </motion.button>

        <motion.div
          initial={false}
          animate={{
            height: open ? height : 0,
            opacity: open ? 1 : 0,
            rotateX: open ? 0 : -15,
            scaleY: open ? 1 : 0.92,
            filter: open ? 'blur(0px)' : 'blur(6px)',
          }}
          transition={{
            duration: 0.5,
            ease: [0.22, 1, 0.36, 1],
            height: { duration: 0.4, ease: [0.22, 1, 0.36, 1] },
            opacity: { duration: 0.3, delay: open ? 0.08 : 0 },
            rotateX: { duration: 0.45 },
            scaleY: { duration: 0.4 },
            filter: { duration: 0.35, delay: open ? 0.05 : 0 },
          }}
          style={{
            transformOrigin: 'top center',
            perspective: 1200,
            transformStyle: 'preserve-3d',
            overflow: 'hidden',
          }}
        >
          <div ref={contentRef} className="px-6 pb-4 pt-2">
            {children}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
