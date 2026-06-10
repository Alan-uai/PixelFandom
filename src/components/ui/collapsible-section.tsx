'use client';

import { useState, useRef, useEffect, useMemo, useLayoutEffect } from 'react';
import { animate, motion, useMotionValue, useTransform } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PRIMARY, GOLD, createBeamPathElement, getBeamPosition } from '@/lib/welding-utils';
import { WeldFilters, StarGlow, SparkStream, GravitySpark } from '@/components/ui/welding-effects';

interface CollapsibleSectionProps {
  id: string;
  title: string;
  description?: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
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

  useEffect(() => {
    setWeldPhase('welding');
    const t1 = setTimeout(() => setWeldPhase('complete'), 3500);
    const t2 = setTimeout(() => setWeldPhase('done'), 4300);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  useEffect(() => {
    if (contentRef.current) {
      setHeight(contentRef.current.scrollHeight);
    }
  }, [open, children]);

  useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    pathRef.current = createBeamPathElement(rect.width, rect.height, 12);

    const controls = animate(beamProgress, 1, {
      duration: 3.5,
      ease: 'linear',
    });
    return () => controls.stop();
  }, [beamProgress]);

  useEffect(() => {
    const path = pathRef.current;
    if (!path) return;
    const unsub = beamProgress.on('change', v => {
      setBeamPos(getBeamPosition(path, v));
    });
    return unsub;
  }, [beamProgress]);

  const showWelding = weldPhase === 'welding';
  const showComplete = weldPhase === 'complete';
  const rotation = useTransform(beamProgress, [0, 1], [0, 360]);

  return (
    <section
      ref={containerRef}
      id={id}
      className={cn('relative overflow-hidden rounded-xl border bg-card text-card-foreground shadow-sm', className)}
    >
      <WeldFilters />

      {showWelding && (
        <>
          <motion.div
            className="pointer-events-none absolute inset-0 z-10"
            style={{
              background: `conic-gradient(from -90deg, transparent 12%, ${PRIMARY}40 18%, transparent 22%, transparent 100%)`,
              borderRadius: '0.75rem',
              rotate: rotation,
            }}
          />
          <motion.div
            className="pointer-events-none absolute inset-0 z-10"
            style={{
              background: `conic-gradient(from -90deg, ${PRIMARY} 0%, ${PRIMARY} 2.5%, transparent 5.5%, transparent 100%)`,
              borderRadius: '0.75rem',
              rotate: rotation,
            }}
          />
          <StarGlow x={beamPos.x} y={beamPos.y} color={PRIMARY} intensity={1.2} />
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
            groundY={containerRef.current?.getBoundingClientRect().height ?? 0}
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
