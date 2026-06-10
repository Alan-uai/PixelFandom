'use client';

import { useState, useRef, useEffect, useMemo, useLayoutEffect, type ReactNode } from 'react';
import { animate, motion, useMotionValue, useTransform } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PRIMARY, GOLD, getBeamPathD, getBeamPosition, createBeamPathElement } from '@/lib/welding-utils';
import { WeldFilters, StarGlow, SparkStream, GravitySpark, WeldedText } from '@/components/ui/welding-effects';

interface CollapsibleSectionProps {
  id: string;
  title: string;
  description?: string;
  defaultOpen?: boolean;
  children: ReactNode;
  className?: string;
}

export function CollapsibleSection({
  id,
  title,
  description,
  defaultOpen = true,
  children,
  className,
}: CollapsibleSectionProps) {
  const [open, setOpen] = useState(defaultOpen);
  const contentRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState(0);
  const [weldPhase, setWeldPhase] = useState<'idle' | 'welding' | 'complete' | 'done'>('idle');
  const containerRef = useRef<HTMLDivElement>(null);
  const pathRef = useRef<SVGPathElement | null>(null);
  const beamProgress = useMotionValue(0);
  const [beamPos, setBeamPos] = useState({ x: 0, y: 0, angle: 0 });
  const [cardSize, setCardSize] = useState({ w: 0, h: 0 });
  const [groundY, setGroundY] = useState(0);
  const [pathVersion, setPathVersion] = useState(0);
  const weldSeed = useMemo(() => Math.random() * 100, []);
  const [initialWeldDone, setInitialWeldDone] = useState(false);

  useEffect(() => {
    if (contentRef.current) {
      setHeight(contentRef.current.scrollHeight);
    }
  }, [open, children]);

  // Initial measurement + weld (synchronous, avoids race condition)
  useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const rect = el.getBoundingClientRect();
    const w = Math.round(rect.width);
    const h = Math.round(rect.height);
    if (w > 0 && h > 0) {
      setCardSize({ w, h });
      setGroundY(h);
      pathRef.current = createBeamPathElement(w, h, 12);
    }

    setWeldPhase('welding');

    const controls = animate(beamProgress, 1, {
      duration: 3.5,
      ease: 'linear',
    });
    const t1 = setTimeout(() => setWeldPhase('complete'), 3500);
    const t2 = setTimeout(() => {
      setWeldPhase('done');
      setInitialWeldDone(true);
    }, 4300);
    return () => { controls.stop(); clearTimeout(t1); clearTimeout(t2); };
  }, []);

  // ResizeObserver to update path when card (de)collapses
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new ResizeObserver(entries => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (width > 0 && height > 0) {
          setCardSize({ w: Math.round(width), h: Math.round(height) });
          setGroundY(Math.round(height));
          pathRef.current = createBeamPathElement(Math.round(width), Math.round(height), 12);
          setPathVersion(v => v + 1);
        }
      }
    });

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Re-trigger welding when open/close changes
  useEffect(() => {
    if (weldPhase === 'idle') return;
    setWeldPhase('welding');
    beamProgress.set(0);

    const controls = animate(beamProgress, 1, {
      duration: 3.5,
      ease: 'linear',
    });
    const t1 = setTimeout(() => setWeldPhase('complete'), 3500);
    const t2 = setTimeout(() => setWeldPhase('done'), 4300);
    return () => { controls.stop(); clearTimeout(t1); clearTimeout(t2); };
  }, [open]);

  useEffect(() => {
    const path = pathRef.current;
    if (!path) return;
    const unsub = beamProgress.on('change', v => {
      setBeamPos(getBeamPosition(path, v));
    });
    return unsub;
  }, [beamProgress, pathVersion]);

  const showWelding = weldPhase === 'welding';
  const showComplete = weldPhase === 'complete';

  const pathD = useMemo(
    () => getBeamPathD(cardSize.w, cardSize.h, 12),
    [cardSize.w, cardSize.h],
  );

  const dashOffset = useTransform(beamProgress, [0, 1], [1, 0]);
  const beamTrail = useTransform(beamProgress, (v) => `${v} ${1 - v}`);

  // Tapered trail layers (thick at start → thin at head)
  const taperWide = useTransform(beamProgress, (v) => {
    const r = Math.max(0, v - 0.1)
    return `${r} ${1 - r}`
  })
  const taperMedium = useTransform(beamProgress, (v) => {
    const r = Math.max(0, v - 0.05)
    return `${r} ${1 - r}`
  })

  // Concentrated glow at beam head
  const headGlow = useTransform(beamProgress, (v) => {
    const segLen = 0.1
    const start = Math.max(0, v - segLen)
    return `${v - start} ${1 - (v - start)}`
  })
  const headWhite = useTransform(beamProgress, (v) => {
    const segLen = 0.04
    const start = Math.max(0, v - segLen)
    return `${v - start} ${1 - (v - start)}`
  })

  return (
    <section
      ref={containerRef}
      id={id}
      className={cn('relative rounded-xl border bg-card text-card-foreground shadow-sm', className)}
    >
      <WeldFilters />

      {showWelding && (
        <>
          {!initialWeldDone && (
            <div className="pointer-events-none absolute inset-0 z-30 flex items-center justify-center text-3xl font-bold tracking-wider">
              <WeldedText text={title} startDelay={200} />
            </div>
          )}

          <svg
            className="pointer-events-none absolute inset-0 z-10"
            width={cardSize.w || '100%'}
            height={cardSize.h || '100%'}
            viewBox={`0 0 ${cardSize.w || 0} ${cardSize.h || 0}`}
          >
            <defs>
              <filter id="svg-collapsible-beam-glow">
                <feGaussianBlur stdDeviation="5" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {pathD && (
              <path d={pathD} fill="none" stroke={PRIMARY} strokeWidth={1.5} opacity={0.1} strokeLinecap="round" strokeLinejoin="round" />
            )}

            {/* Taper layer 1: wide thick trail (bottom) */}
            {pathD && (
              <motion.path
                d={pathD}
                fill="none"
                stroke={PRIMARY}
                strokeWidth={8}
                strokeLinecap="round"
                strokeLinejoin="round"
                pathLength="1"
                style={{ strokeDasharray: taperWide }}
                opacity={0.12}
              />
            )}

            {/* Taper layer 2: medium trail */}
            {pathD && (
              <motion.path
                d={pathD}
                fill="none"
                stroke={PRIMARY}
                strokeWidth={5}
                strokeLinecap="round"
                strokeLinejoin="round"
                pathLength="1"
                style={{ strokeDasharray: taperMedium }}
                opacity={0.25}
              />
            )}

            {/* Taper layer 3: thin trail */}
            {pathD && (
              <motion.path
                d={pathD}
                fill="none"
                stroke={PRIMARY}
                strokeWidth={2.5}
                strokeLinecap="round"
                strokeLinejoin="round"
                pathLength="1"
                style={{ strokeDasharray: beamTrail }}
                opacity={0.45}
              />
            )}

            {/* Head glow (thick, blurred) */}
            {pathD && (
              <motion.path
                d={pathD}
                fill="none"
                stroke={PRIMARY}
                strokeWidth={8}
                strokeLinecap="round"
                strokeLinejoin="round"
                pathLength="1"
                style={{ strokeDasharray: headGlow, strokeDashoffset: dashOffset }}
                opacity={0.65}
                filter="url(#svg-collapsible-beam-glow)"
              />
            )}

            {/* White core (top) */}
            {pathD && (
              <motion.path
                d={pathD}
                fill="none"
                stroke="#fff"
                strokeWidth={3}
                strokeLinecap="round"
                strokeLinejoin="round"
                pathLength="1"
                style={{ strokeDasharray: headWhite, strokeDashoffset: dashOffset }}
              />
            )}
          </svg>
          <StarGlow x={beamPos.x} y={beamPos.y} color={PRIMARY} intensity={1.2} seed={weldSeed} />
          <SparkStream
            beamX={beamPos.x}
            beamY={beamPos.y}
            beamAngle={beamPos.angle}
            active={showWelding}
          />
          <GravitySpark
            beamX={beamPos.x}
            beamY={beamPos.y}
            beamAngle={beamPos.angle}
            active={showWelding}
            groundY={groundY}
          />
        </>
      )}

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

      <div className="relative z-[1]">
        <motion.button
          onClick={() => setOpen(!open)}
          className="flex items-center justify-between gap-4 w-full px-6 py-4 text-left cursor-pointer select-none hover:bg-accent/50 transition-colors rounded-t-xl"
          whileTap={{ scale: 0.995 }}
          style={{ perspective: 1000, transformStyle: 'preserve-3d' }}
        >
          <div className="space-y-1 min-w-0 flex-1">
            <motion.h3
              className="font-semibold leading-none tracking-tight relative"
              animate={{ x: open ? 4 : 0 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
            >
              {showWelding ? (
                <WeldedText text={title} startDelay={200} className="block" />
              ) : (
                <>
                  <motion.span
                    className="block"
                    animate={{ opacity: open ? 0 : 1 }}
                    transition={{ duration: 0.25 }}
                  >
                    {title}
                  </motion.span>
                  <motion.span
                    className="absolute inset-0 bg-gradient-to-r from-primary via-primary/70 to-primary/40 bg-clip-text text-transparent"
                    animate={{ opacity: open ? 1 : 0 }}
                    transition={{ duration: 0.25 }}
                    aria-hidden
                  >
                    {title}
                  </motion.span>
                </>
              )}
            </motion.h3>
            {description && (
              <p className="text-sm text-muted-foreground">{description}</p>
            )}
          </div>
          <motion.div
            animate={{ rotate: open ? 180 : 0, scale: open ? 1.2 : 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 12, mass: 0.8 }}
            style={{ transformStyle: 'preserve-3d' }}
          >
            <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
          </motion.div>
        </motion.button>

        <motion.div
          initial={false}
          animate={{
            height: open ? height : 0,
            opacity: open ? 1 : 0,
            rotateX: open ? 0 : -15,
            scaleY: open ? 1 : 0.92,
            filter: open ? 'blur(0px)' : 'blur(6px)',
          }}
          transition={{
            duration: 0.5,
            ease: [0.22, 1, 0.36, 1],
            height: { duration: 0.4, ease: [0.22, 1, 0.36, 1] },
            opacity: { duration: 0.3, delay: open ? 0.08 : 0 },
            rotateX: { duration: 0.45 },
            scaleY: { duration: 0.4 },
            filter: { duration: 0.35, delay: open ? 0.05 : 0 },
          }}
          style={{
            transformOrigin: 'top center',
            perspective: 1200,
            transformStyle: 'preserve-3d',
            overflow: 'hidden',
          }}
        >
          <div ref={contentRef} className="px-6 pb-4 pt-2">
            {children}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
