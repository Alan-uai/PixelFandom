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
import { GOLD } from '@/lib/welding-utils';
import { WeldingCard } from '@/components/ui/welding-card';

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
  useEffect(() => { onCompleteRef.current = onComplete; }, [onComplete]);

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

  const showComplete = phase === 'complete';

  if (phase === 'idle') {
    return <div className={cn('rounded-xl bg-card', className)}>{children}</div>;
  }

  return (
    <div className="relative rounded-xl">
      <WeldingCard
        className={className}
      >
        {children}
      </WeldingCard>

      {showComplete && (
        <motion.div
          className="pointer-events-none absolute inset-0 z-20 rounded-xl"
          initial={{ boxShadow: `0 0 0px ${GOLD}` }}
          animate={{
            boxShadow: [
              `0 0 0px transparent`,
              `0 0 40px ${GOLD}`,
              `0 0 60px ${GOLD}`,
              `0 0 20px ${GOLD}`,
              `0 0 0px transparent`,
            ],
          }}
          transition={{ duration: 0.8, ease: 'easeInOut' }}
        />
      )}
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
