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

  return (
    <div ref={ref} id={id} className={`relative snap-start snap-always ${className}`}>
      <ScrollProgressProvider value={progressSpring}>
        <motion.div
          style={{
            y: yOffset,
            x: xOffset,
            willChange: 'transform',
          }}
        >
          {children}
        </motion.div>
      </ScrollProgressProvider>
    </div>
  );
}
