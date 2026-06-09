'use client';

import { useCallback, type ReactNode } from 'react';
import { motion, useTransform, type MotionValue } from 'framer-motion';
import { useScrollProgress } from '@/context/scroll-progress-context';

interface AnimatedGradientTextProps {
  text: string;
  as?: 'h1' | 'h2' | 'h3' | 'span';
  className?: string;
  gradient?: string;
  scrollProgress?: MotionValue<number> | null;
  stagger?: number;
  onFirstLetterAnimated?: () => void;
  children?: ReactNode;
}

const defaultGradient = 'linear-gradient(135deg, hsl(198 100% 65%), hsl(270 80% 60%), hsl(350 90% 60%))';

function ScrollLetter({
  letter,
  index,
  scrollProgress,
  gradient,
  stagger,
}: {
  letter: string;
  index: number;
  scrollProgress: MotionValue<number>;
  gradient: string;
  stagger: number;
}) {
  const adjustedStart = Math.min(0.2 + index * stagger * 0.4, 0.5);
  const adjustedEnd = Math.min(adjustedStart + 0.35, 1);

  const exitProgress = useTransform(scrollProgress, (p) => {
    if (p <= adjustedStart) return 0;
    if (p >= adjustedEnd) return 1;
    return (p - adjustedStart) / (adjustedEnd - adjustedStart);
  });

  const opacity = useTransform(exitProgress, [0, 1], [1, 0]);
  const y = useTransform(exitProgress, [0, 1], [0, -80]);
  const rotateX = useTransform(exitProgress, [0, 1], [0, 95]);
  const scale = useTransform(exitProgress, [0, 1], [1, 0.4]);
  const blur = useTransform(exitProgress, [0, 1], [0, 8]);
  const blurFilter = useTransform(blur, (v) => `blur(${v}px)`);

  return (
    <motion.span
      className="inline-block"
      style={{
        opacity,
        y,
        rotateX,
        scale,
        filter: blurFilter,
        background: gradient,
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text',
        transformStyle: 'preserve-3d',
      }}
    >
      {letter === ' ' ? '\u00A0' : letter}
    </motion.span>
  );
}

function SpringLetter({
  letter,
  index,
  gradient,
  onComplete,
}: {
  letter: string;
  index: number;
  gradient: string;
  onComplete?: () => void;
}) {
  return (
    <motion.span
      className="inline-block"
      initial={{ opacity: 0, y: 60, rotateX: -90, scale: 0.5 }}
      animate={{ opacity: 1, y: 0, rotateX: 0, scale: 1 }}
      transition={{ type: 'spring', stiffness: 200, damping: 14, delay: 0.6 + index * 0.05 }}
      onAnimationComplete={index === 0 ? onComplete : undefined}
      style={{
        background: gradient,
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text',
        transformStyle: 'preserve-3d',
      }}
    >
      {letter === ' ' ? '\u00A0' : letter}
    </motion.span>
  );
}

const TagMap = { h1: motion.h1, h2: motion.h2, h3: motion.h3, span: motion.span } as const;

export default function AnimatedGradientText({
  text,
  as = 'h1',
  className = '',
  gradient = defaultGradient,
  scrollProgress: externalScrollProgress,
  stagger = 0.04,
  onFirstLetterAnimated,
  children,
}: AnimatedGradientTextProps) {
  const contextScroll = useScrollProgress();
  const scrollProgress = externalScrollProgress !== undefined ? externalScrollProgress : contextScroll;

  const letters = text.split('');
  const Tag = TagMap[as];
  const handleFirstComplete = useCallback(() => {
    onFirstLetterAnimated?.();
  }, [onFirstLetterAnimated]);

  return (
    <Tag
      className={`${className} tracking-tight animate-text-glow-pulse`}
      style={{ transformStyle: 'preserve-3d', perspective: '1200px' }}
    >
      <span className="inline-flex flex-wrap justify-center gap-x-2 md:gap-x-4" style={{ transformStyle: 'preserve-3d' }}>
        {scrollProgress
          ? letters.map((letter, i) => (
              <ScrollLetter
                key={i}
                letter={letter}
                index={i}
                scrollProgress={scrollProgress as MotionValue<number>}
                gradient={gradient}
                stagger={stagger}
              />
            ))
          : letters.map((letter, i) => (
              <SpringLetter
                key={i}
                letter={letter}
                index={i}
                gradient={gradient}
                onComplete={handleFirstComplete}
              />
            ))}
        {children}
      </span>
    </Tag>
  );
}
