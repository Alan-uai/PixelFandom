'use client';

import { useRef, useState, type ReactNode } from 'react';
import { useScroll, useSpring } from 'framer-motion';
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

const animNames: Record<string, Record<SlideDirection, string>> = {
  default: {
    down: 'slide-reveal-down',
    'down-left': 'slide-reveal-down-left',
    'down-right': 'slide-reveal-down-right',
  },
  noExit: {
    down: 'slide-enter-down',
    'down-left': 'slide-enter-left',
    'down-right': 'slide-enter-right',
  },
  exitOnly: {
    down: 'slide-exit-down',
    'down-left': 'slide-exit-left',
    'down-right': 'slide-exit-right',
  },
};

const rangeClass: Record<string, string> = {
  default: 'anim-range-entry-exit',
  noExit: 'anim-range-entry',
  exitOnly: 'anim-range-exit',
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

  const mode = exitOnly ? 'exitOnly' : noExit ? 'noExit' : 'default';
  const animName = animNames[mode][currentDirection];
  const range = rangeClass[mode];

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  });

  const progressSpring = useSpring(scrollYProgress, {
    stiffness: 80,
    damping: 28,
    mass: 1.2,
  });

  return (
    <div ref={ref} id={id} className={`relative snap-start snap-always ${className}`}>
      <ScrollProgressProvider value={progressSpring}>
        <div
          className={`anim-timeline-view ${range}`}
          style={{
            animationName: animName,
            animationDuration: '1ms',
            animationFillMode: 'both',
            willChange: 'transform',
          }}
        >
          {children}
        </div>
      </ScrollProgressProvider>
    </div>
  );
}
