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
  const glyphRef = useRef<HTMLSpanElement | null>(null);

  useEffect(() => {
    const drawTimer = setInterval(() => setDrawKey((k) => k + 1), 5200);
    return () => clearInterval(drawTimer);
  }, []);

  useEffect(() => {
    const beam = beamRef.current;
    const glyph = glyphRef.current;
    if (!beam || !glyph) return;

    const sweep = () => {
      const w = glyph.offsetWidth || size;
      // start above-left, end below-right (diagonal)
      beam.style.transition = 'none';
      beam.style.transform = `translate(-${w * 0.4}px, -${w * 0.4}px)`;
      beam.style.opacity = '0';
      void beam.offsetWidth;
      beam.style.transition =
        'transform 1100ms cubic-bezier(.4,0,.2,1), opacity 1100ms ease';
      beam.style.transform = `translate(${w * 0.4}px, ${w * 0.4}px)`;
      beam.style.opacity = '1';
      window.setTimeout(() => {
        beam.style.opacity = '0';
      }, 1100);
    };

    const beamTimer = setInterval(sweep, 5200);
    const start = window.setTimeout(sweep, 600);
    return () => {
      clearInterval(beamTimer);
      clearTimeout(start);
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
        {/* box (border only, not the beam target) */}
        <motion.rect
          x="64" y="64" width="384" height="384" rx="64"
          stroke="currentColor" strokeWidth="20" strokeLinejoin="round"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 1.1, ease: 'easeInOut' }}
        />
        {/* glyph clipped region — beam applies only here */}
        <defs>
          <clipPath id="brandGlyphClip">
            <rect x="176" y="176" width="160" height="160" rx="32" />
          </clipPath>
        </defs>
        <motion.path
          clipPath="url(#brandGlyphClip)"
          d="M176 176 H336 V240 H248 V304 H320 V368 H248 V432 H176 Z"
          stroke="currentColor" strokeWidth="22" strokeLinejoin="round" fill="none"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 1.3, ease: 'easeInOut', delay: 0.15 }}
        />
      </motion.svg>

      {/* beam: diagonal, restricted to the glyph box only */}
      <span
        ref={glyphRef}
        aria-hidden
        className="pointer-events-none absolute"
        style={{
          left: '34%',
          top: '34%',
          width: '32%',
          height: '32%',
          overflow: 'hidden',
          borderRadius: size * 0.06,
        }}
      >
        <span
          ref={beamRef}
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            width: '40%',
            height: '140%',
            left: '30%',
            top: '-20%',
            background: `linear-gradient(180deg, transparent, ${GOLD}, transparent)`,
            transform: 'rotate(45deg)',
            filter: `drop-shadow(0 0 6px ${GOLD})`,
            opacity: 0,
            mixBlendMode: 'screen',
          }}
        />
      </span>
    </span>
  );
}
