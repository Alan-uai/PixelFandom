'use client';

import { useRef, type ReactNode } from 'react';
import { motion, useScroll, useTransform, useSpring } from 'framer-motion';
import { ScrollProgressProvider } from '@/context/scroll-progress-context';

export type SlideDirection = 'down-left' | 'down-right' | 'down';

interface ScrollRevealWrapperProps {
  children: ReactNode;
  className?: string;
  slideDirection: SlideDirection;
}

const xRange: Record<SlideDirection, [number, number, number]> = {
  'down-left': [400, 0, -400],
  'down-right': [-400, 0, 400],
  down: [0, 0, 0],
};

export default function ScrollRevealWrapper({
  children,
  className = '',
  slideDirection,
}: ScrollRevealWrapperProps) {
  const ref = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  });

  const progressSpring = useSpring(scrollYProgress, {
    stiffness: 80,
    damping: 28,
    mass: 1.2,
  });

  const scale = useTransform(progressSpring, [0, 0.3, 0.7, 1], [0.88, 1, 1, 0.88]);
  const opacity = useTransform(progressSpring, [0, 0.2, 0.8, 1], [0, 1, 1, 0]);
  const blurAmount = useTransform(progressSpring, [0, 0.2, 0.8, 1], [10, 0, 0, 10]);
  const yOffset = useTransform(progressSpring, [0, 0.5, 1], [180, 0, -180]);
  const xOffset = useTransform(progressSpring, [0, 0.5, 1], xRange[slideDirection]);
  const blurFilter = useTransform(blurAmount, (v) => `blur(${v}px)`);

  return (
    <div ref={ref} className={`relative ${className}`}>
      <ScrollProgressProvider value={progressSpring}>
        <motion.div
          style={{
            scale,
            opacity,
            x: xOffset,
            y: yOffset,
            filter: blurFilter,
            willChange: 'transform, opacity, filter',
          }}
        >
          {children}
        </motion.div>
      </ScrollProgressProvider>
    </div>
  );
}
