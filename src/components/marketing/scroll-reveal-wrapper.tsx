'use client';

import { useRef, useState, type ReactNode } from 'react';
import { motion, useScroll, useTransform, useSpring } from 'framer-motion';
import { ScrollProgressProvider } from '@/context/scroll-progress-context';

export type SlideDirection = 'down-left' | 'down-right' | 'down';

interface ScrollRevealWrapperProps {
  children: ReactNode;
  className?: string;
  slideDirection?: SlideDirection;
  exitOnly?: boolean;
  noExit?: boolean;
  id?: string;
}

const dirs: SlideDirection[] = ['down-left', 'down-right', 'down'];
const randomDir = () => dirs[Math.floor(Math.random() * dirs.length)];

const xRange: Record<SlideDirection, [number, number, number]> = {
  'down-left': [400, 0, -400],
  'down-right': [-400, 0, 400],
  down: [0, 0, 0],
};

export default function ScrollRevealWrapper({
  children,
  className = '',
  slideDirection: propDirection,
  exitOnly = false,
  noExit = false,
  id,
}: ScrollRevealWrapperProps) {
  const [currentDirection] = useState<SlideDirection>(() =>
    propDirection ?? randomDir(),
  );
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

  const xVals = xRange[currentDirection];

  const scale = useTransform(
    progressSpring,
    exitOnly ? [0.5, 0.7, 0.85, 1]
      : noExit ? [0, 0.3, 1]
      : [0, 0.3, 0.7, 1],
    exitOnly ? [1, 1, 0.94, 0.88]
      : noExit ? [0.88, 1, 1]
      : [0.88, 1, 1, 0.88],
  );
  const opacity = useTransform(
    progressSpring,
    exitOnly ? [0.5, 0.65, 0.8, 1]
      : noExit ? [0, 0.2, 1]
      : [0, 0.2, 0.8, 1],
    exitOnly ? [1, 1, 0.4, 0]
      : noExit ? [0, 1, 1]
      : [0, 1, 1, 0],
  );
  const blurAmount = useTransform(
    progressSpring,
    exitOnly ? [0.5, 0.65, 0.8, 1]
      : noExit ? [0, 0.2, 1]
      : [0, 0.2, 0.8, 1],
    exitOnly ? [0, 0, 6, 10]
      : noExit ? [10, 0, 0]
      : [10, 0, 0, 10],
  );
  const yOffset = useTransform(
    progressSpring,
    exitOnly ? [0.5, 0.75, 1]
      : noExit ? [0, 0.5, 1]
      : [0, 0.5, 1],
    exitOnly ? [0, 0, -180]
      : noExit ? [180, 0, 0]
      : [180, 0, -180],
  );
  const xOffset = useTransform(
    progressSpring,
    exitOnly ? [0.5, 0.75, 1]
      : noExit ? [0, 0.5, 1]
      : [0, 0.5, 1],
    exitOnly ? [0, 0, xVals[2]]
      : noExit ? [xVals[0], 0, 0]
      : xVals,
  );
  const blurFilter = useTransform(blurAmount, (v) => `blur(${v}px)`);

  return (
    <div ref={ref} id={id} className={`relative snap-start snap-always ${className}`}>
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
