'use client';

import { useRef, useMemo, type ReactNode } from 'react';
import { motion, useScroll, useTransform, useSpring } from 'framer-motion';
import { ScrollProgressProvider } from '@/context/scroll-progress-context';

interface ScrollRevealWrapperProps {
  children: ReactNode;
  className?: string;
}

export default function ScrollRevealWrapper({
  children,
  className = '',
}: ScrollRevealWrapperProps) {
  const ref = useRef<HTMLDivElement>(null);

  const randomAngle = useMemo(() => {
    return (Math.random() * 2 - 1) * 90;
  }, []);

  const maxTilt = 28;
  const tiltY = maxTilt * Math.sin((randomAngle * Math.PI) / 180);
  const tiltX = maxTilt * Math.cos((randomAngle * Math.PI) / 180);

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
  const rotateX = useTransform(progressSpring, [0, 0.5, 1], [tiltX, 0, -tiltX]);
  const rotateY = useTransform(progressSpring, [0, 0.5, 1], [tiltY, 0, -tiltY]);
  const blurFilter = useTransform(blurAmount, (v) => `blur(${v}px)`);

  return (
    <div ref={ref} className={`relative ${className}`}>
      <ScrollProgressProvider value={progressSpring}>
        <motion.div
          style={{
            scale,
            opacity,
            rotateX,
            rotateY,
            y: yOffset,
            filter: blurFilter,
            transformStyle: 'preserve-3d',
            perspective: '1200px',
            transformOrigin: 'center center',
            willChange: 'transform, opacity, filter',
          }}
        >
          {children}
        </motion.div>
      </ScrollProgressProvider>
    </div>
  );
}
