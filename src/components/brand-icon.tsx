'use client';

import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';

const STROKE = '#4BC5FF';
const GOLD = '#F5C451';

export default function BrandIcon({
  size = 26,
  className = '',
}: {
  size?: number;
  className?: string;
}) {
  const [drawKey, setDrawKey] = useState(0);
  const beamRef = useRef<HTMLSpanElement | null>(null);

  useEffect(() => {
    const drawTimer = setInterval(() => setDrawKey((k) => k + 1), 5200);
    return () => clearInterval(drawTimer);
  }, []);

  useEffect(() => {
    let raf = 0;
    const beam = beamRef.current;
    if (!beam) return;
    const animate = () => {
      beam.style.transform = `translateX(${-size}px)`;
      beam.style.opacity = '0';
      // force reflow then sweep
      void beam.offsetWidth;
      beam.style.transition = 'none';
      beam.style.transform = `translateX(${-size}px)`;
      beam.style.opacity = '0';
      void beam.offsetWidth;
      beam.style.transition = 'transform 1100ms cubic-bezier(.4,0,.2,1), opacity 1100ms ease';
      beam.style.transform = `translateX(${size}px)`;
      beam.style.opacity = '1';
      raf = window.setTimeout(() => {
        beam.style.opacity = '0';
      }, 1100) as unknown as number;
    };
    const beamTimer = setInterval(animate, 5200);
    const start = window.setTimeout(animate, 600) as unknown as number;
    return () => {
      clearInterval(beamTimer);
      clearTimeout(beamTimer as unknown as number);
      clearTimeout(start);
      cancelAnimationFrame(raf);
    };
  }, [size]);

  return (
    <span
      className={`relative inline-flex items-center justify-center ${className}`}
      style={{ width: size, height: size, perspective: 480 }}
    >
      <motion.svg
        key={drawKey}
        width={size}
        height={size}
        viewBox="0 0 512 512"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        initial={{ rotateX: -8, rotateY: 10, scale: 0.96 }}
        animate={{ rotateX: -8, rotateY: 10, scale: 1 }}
        transition={{ type: 'spring', stiffness: 120, damping: 14 }}
        style={{ transformStyle: 'preserve-3d', color: STROKE }}
      >
        <motion.rect
          x="64" y="64" width="384" height="384" rx="64"
          stroke="currentColor" strokeWidth="24" strokeLinejoin="round"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 1.1, ease: 'easeInOut' }}
        />
        <motion.path
          d="M176 160 H336 V224 H248 V288 H320 V352 H248 V416 H176 Z"
          stroke="currentColor" strokeWidth="24" strokeLinejoin="round" fill="none"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 1.3, ease: 'easeInOut', delay: 0.15 }}
        />
        <motion.circle
          cx="360" cy="360" r="28"
          stroke="currentColor" strokeWidth="24" fill="none"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 0.8, ease: 'easeInOut', delay: 0.5 }}
        />
      </motion.svg>

      <span
        ref={beamRef}
        aria-hidden
        className="pointer-events-none absolute top-0 left-0 h-full w-1/3"
        style={{
          background: `linear-gradient(90deg, transparent, ${GOLD}, transparent)`,
          filter: `drop-shadow(0 0 6px ${GOLD})`,
          opacity: 0,
          mixBlendMode: 'screen',
        }}
      />
    </span>
  );
}
