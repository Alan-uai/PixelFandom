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
  const staggerOffset = index * stagger;

  const letterProgress = useTransform(scrollProgress, (p) => {
    const half = 0.5;
    const effectiveDuration = Math.max(half - staggerOffset, 0.01);
    if (p < half) {
      const v = (p - staggerOffset) / effectiveDuration;
      return Math.max(0, Math.min(1, v));
    }
    const v = (1 - p - staggerOffset) / effectiveDuration;
    return Math.max(0, Math.min(1, v));
  });

  const opacity = useTransform(letterProgress, [0, 0.4, 1], [0, 1, 1]);
  const y = useTransform(letterProgress, [0, 1], [70, 0]);
  const rotateX = useTransform(letterProgress, [0, 1], [-95, 0]);
  const scale = useTransform(letterProgress, [0, 1], [0.45, 1]);
  const blur = useTransform(letterProgress, [0, 1], [8, 0]);
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
      className={`${className} tracking-tight`}
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
