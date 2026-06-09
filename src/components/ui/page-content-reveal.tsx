'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useMemo,
  type ReactNode,
} from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

// ── Types ──

type Phase = 'idle' | 'border' | 'title' | 'text' | 'complete';

interface RevealContextValue {
  phase: Phase;
}

const RevealContext = createContext<RevealContextValue>({ phase: 'idle' });

// ── Helpers ──

function getTextContent(node: ReactNode): string {
  if (node == null) return '';
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(getTextContent).join('');
  if (typeof node === 'object' && 'props' in node)
    return getTextContent((node as { props: { children: ReactNode } }).props.children);
  return '';
}

// ── Spark Burst ──

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

// ── Sparks Field (scattered across a container) ──

interface SparksFieldProps {
  count: number;
  color: string;
  delay?: number;
  stagger?: number;
  spread?: number;
}

function SparksField({ count, color, delay = 0, stagger = 0.08, spread = 40 }: SparksFieldProps) {
  const sparks = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        x: 10 + Math.random() * 80,
        y: 10 + Math.random() * 80,
        angle: Math.random() * Math.PI * 2,
        distance: 8 + Math.random() * spread,
        delay: delay + i * stagger,
        size: 1 + Math.random() * 2,
      })),
    [count, delay, stagger, spread],
  );

  return (
    <div className="pointer-events-none absolute inset-0 z-10 overflow-hidden rounded-xl">
      {sparks.map((s, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            left: `${s.x}%`,
            top: `${s.y}%`,
            width: s.size,
            height: s.size,
            backgroundColor: color,
            boxShadow: `0 0 3px ${color}`,
          }}
          initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
          animate={{
            x: Math.cos(s.angle) * s.distance,
            y: Math.sin(s.angle) * s.distance,
            opacity: [1, 0.6, 0],
            scale: [1, 0.3, 0],
          }}
          transition={{
            duration: 0.8 + Math.random() * 0.4,
            ease: 'easeOut',
          }}
        />
      ))}
    </div>
  );
}

// ── Root ──

interface PageContentRevealProps {
  skeleton?: boolean;
  delay?: number;
  onComplete?: () => void;
  className?: string;
  children: ReactNode;
}

export default function PageContentReveal({
  skeleton = false,
  delay = 0,
  onComplete,
  className,
  children,
}: PageContentRevealProps) {
  const [phase, setPhase] = useState<Phase>('idle');
  const mounted = useRef(true);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    return () => {
      mounted.current = false;
    };
  }, []);

  useEffect(() => {
    if (!skeleton) {
      setPhase('idle');
      return;
    }

    const timers: ReturnType<typeof setTimeout>[] = [];

    const add = (fn: () => void, ms: number) => {
      timers.push(setTimeout(fn, ms));
    };

    add(() => mounted.current && setPhase('border'), delay);
    add(() => mounted.current && setPhase('title'), delay + 1800);
    add(() => mounted.current && setPhase('text'), delay + 3400);
    add(() => {
      if (mounted.current) {
        setPhase('complete');
        onCompleteRef.current?.();
      }
    }, delay + 5000);
    add(() => mounted.current && setPhase('idle'), delay + 5800);

    return () => timers.forEach(clearTimeout);
  }, [skeleton, delay]);

  if (!skeleton) return <>{children}</>;

  return (
    <RevealContext.Provider value={{ phase }}>
      <div className={cn('relative', className)}>{children}</div>
    </RevealContext.Provider>
  );
}

// ── Card ──

interface CardProps {
  className?: string;
  children: ReactNode;
}

function Card({ className, children }: CardProps) {
  const { phase } = useContext(RevealContext);
  if (phase === 'idle') return <div className={cn('rounded-xl bg-card', className)}>{children}</div>;

  const primary = 'hsl(var(--primary))';
  const gold = 'hsla(45, 100%, 60%, 0.6)';
  const showBorder = phase === 'border';
  const showComplete = phase === 'complete';

  const bursts = useMemo(() => {
    if (!showBorder) return [];
    return Array.from({ length: 8 }, (_, i) => {
      const t = i / 8;
      let x: number; let y: number;
      if (t < 0.25) { x = (t / 0.25) * 90 + 5; y = 0; }           // top
      else if (t < 0.5) { x = 95; y = ((t - 0.25) / 0.25) * 90 + 5; } // right
      else if (t < 0.75) { x = 95 - ((t - 0.5) / 0.25) * 90; y = 95; } // bottom
      else { x = 5; y = 95 - ((t - 0.75) / 0.25) * 90; }             // left
      return { id: i, x, y, delay: i * 0.15 };
    });
  }, [showBorder]);

  return (
    <div className={cn('relative overflow-hidden rounded-xl', className)} style={{ padding: '1.5px' }}>
      {/* Phase 1: border glow beam */}
      {showBorder && (
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

      {/* Phase 1: border sparks */}
      {showBorder && bursts.map((b) => (
        <SparkBurst key={b.id} x={b.x} y={b.y} delay={b.delay} count={6} color={primary} />
      ))}

      {/* Phase 4: completion glow */}
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

      {/* Content */}
      <div className="relative rounded-[11px] bg-card">{children}</div>
    </div>
  );
}

// ── Title ──

interface TitleProps {
  className?: string;
  children: ReactNode;
}

function Title({ className, children }: TitleProps) {
  const { phase } = useContext(RevealContext);
  const isActive = phase === 'title';
  const text = getTextContent(children);
  const words = useMemo(() => text.split(' ').filter(Boolean), [text]);
  const primary = 'hsl(var(--primary))';

  return (
    <div className={cn('relative', className)}>
      {isActive && <SparksField count={12} color={primary} delay={0.2} stagger={0.1} spread={30} />}
      {isActive ? (
        <span className="inline">
          {words.map((word, i) => (
            <motion.span
              key={i}
              className="inline-block"
              initial={{ textShadow: '0 0 0px transparent' }}
              animate={{
                textShadow: [
                  '0 0 0px transparent',
                  `0 0 12px ${primary}`,
                  `0 0 4px ${primary}40`,
                ],
              }}
              transition={{
                delay: i * 0.12,
                duration: 0.5,
                ease: 'easeInOut',
              }}
            >
              {word}{' '}
            </motion.span>
          ))}
        </span>
      ) : (
        children
      )}
    </div>
  );
}

// ── Text ──

interface TextProps {
  className?: string;
  children: ReactNode;
}

function Text({ className, children }: TextProps) {
  const { phase } = useContext(RevealContext);
  const isActive = phase === 'text';
  const text = getTextContent(children);
  const lines = useMemo(() => text.split('\n').filter(Boolean), [text]);
  const primary = 'hsl(var(--primary))';

  return (
    <div className={cn('relative', className)}>
      {isActive && <SparksField count={10} color={primary} delay={0.1} stagger={0.12} spread={25} />}
      {isActive ? (
        <span className="inline">
          {lines.map((line, i) => (
            <motion.span
              key={i}
              className="block"
              initial={{ textShadow: '0 0 0px transparent' }}
              animate={{
                textShadow: [
                  '0 0 0px transparent',
                  `0 0 8px ${primary}`,
                  `0 0 3px ${primary}30`,
                ],
              }}
              transition={{
                delay: i * 0.15,
                duration: 0.5,
                ease: 'easeInOut',
              }}
            >
              {line}
            </motion.span>
          ))}
        </span>
      ) : (
        children
      )}
    </div>
  );
}

// ── Attach sub-components ──

PageContentReveal.Card = Card;
PageContentReveal.Title = Title;
PageContentReveal.Text = Text;
