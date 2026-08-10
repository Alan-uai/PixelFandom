'use client';

import { useEffect, useMemo } from 'react';
import { motion, useReducedMotion, type Target } from 'framer-motion';
import { cn } from '@/lib/utils';
import type { DisplayFormat } from '@/lib/column-types/format-compatibility';
import { useAnimationsEnabled } from '@/lib/animation-prefs';
import { getVariant3DPreset } from './presets';
import type { EntryEffect, Variant3DPreset } from './types';
import { ensureVariant3DKeyframes } from './keyframes';

/* -------------------------------------------------------------------------- */
/*  Variant3D — outer 3D wrapper for the per-format × per-variant presets.    */
/*                                                                            */
/*  Complementary to VariantAnimatedValue (which scrambles/counters the       */
/*  inner value). Variant3D owns the container-level motion: a distinct       */
/*  entry, a looping ambient and a pointer hover, all chosen from             */
/*  VARIANT_3D_PRESETS for the current format + variant.                      */
/*                                                                            */
/*  The ambient effect lives on an inner <span> so its infinite CSS           */
/*  transform animation composes with the entry/hover transforms of the       */
/*  motion.div instead of overriding them.                                    */
/* -------------------------------------------------------------------------- */

const ENTRY_MAP: Record<EntryEffect, { initial: Target; animate: Target }> = {
  pop:       { initial: { scale: 0.94 }, animate: { scale: 1 } },
  rise:      { initial: { y: 10 }, animate: { y: 0 } },
  'flip-y':  { initial: { rotateY: -50, scale: 0.95 }, animate: { rotateY: 0, scale: 1 } },
  swing:     { initial: { rotateZ: 5 }, animate: { rotateZ: 0 } },
  zoom:      { initial: { scale: 0.9 }, animate: { scale: 1 } },
  'slide-l': { initial: { x: -12 }, animate: { x: 0 } },
  'slide-r': { initial: { x: 12 }, animate: { x: 0 } },
  'spin-in': { initial: { rotateZ: -12, scale: 0.92 }, animate: { rotateZ: 0, scale: 1 } },
  drop:      { initial: { y: -14 }, animate: { y: 0 } },
  'reveal-x': { initial: { x: -8, opacity: 0 }, animate: { x: 0, opacity: 1 } },
};

const HOVER_MAP: Record<string, { whileHover?: Target; className?: string }> = {
  none:  {},
  tilt:  { whileHover: { rotateX: 6, rotateY: -6, scale: 1.02 } },
  lift:  { whileHover: { y: -3, scale: 1.02 } },
  glow:  { className: 'transition-shadow hover:shadow-lg hover:shadow-primary/20' },
  scale: { whileHover: { scale: 1.05 } },
  roll:  { whileHover: { rotateZ: -4, scale: 1.03 } },
  deep:  { whileHover: { rotateX: 8, rotateY: 10, scale: 1.03 } },
};

const AMBIENT_CLASS: Record<string, string> = {
  none: '',
  float: 'v3d-ambient-float',
  glow: 'v3d-ambient-glow',
  breathe: 'v3d-ambient-breathe',
  drift: 'v3d-ambient-drift',
  pulse: 'v3d-ambient-pulse',
  spin: 'v3d-ambient-spin',
  tilt: 'v3d-ambient-tilt',
};

export interface Variant3DProps {
  format: DisplayFormat;
  /** 1..5 — picks the preset for this variant. */
  variant: number;
  /** Increment to replay the entry animation (item variant swap). */
  trigger?: number;
  className?: string;
  children: React.ReactNode;
  /** Bento grid: number of columns this tile spans. */
  'data-bento-cols'?: number;
  /** Bento grid: number of rows this tile spans. */
  'data-bento-rows'?: number;
}

export function Variant3D({ format, variant, trigger = 0, className, children, 'data-bento-cols': bentoCols, 'data-bento-rows': bentoRows }: Variant3DProps) {
  const animsOn = useAnimationsEnabled();
  const prefersReduced = useReducedMotion();
  const preset = useMemo(() => getVariant3DPreset(format, variant), [format, variant]);

  useEffect(() => {
    ensureVariant3DKeyframes();
  }, []);

  const entry = preset.entry in ENTRY_MAP ? ENTRY_MAP[preset.entry] : ENTRY_MAP.pop;
  const { duration, ...tuneRaw } = preset.entryTune ?? {};
  const tune = Object.fromEntries(
    Object.entries(tuneRaw).filter(([, val]) => val !== undefined),
  ) as Partial<NonNullable<Variant3DPreset['entryTune']>>;
  const hover = HOVER_MAP[preset.hover] ?? HOVER_MAP.none;
  const ambientCls = AMBIENT_CLASS[preset.ambient] ?? '';
  const ambient = preset.ambient !== 'none';

  const disabled = !animsOn || prefersReduced;

  const initialTarget = { ...entry.initial, ...tune } as Target;
  const animateTarget = { ...entry.animate } as Target;

  // Bounce (overshoot) na entrada por transform para não "atropelar" quando o
  // usuário alterna variantes rapidamente; entradas com opacity mantêm tween.
  const transition = 'opacity' in initialTarget
    ? { duration: duration ?? 0.4, ease: 'easeOut' as const }
    : { type: 'spring' as const, duration: duration ?? 0.5, bounce: 0.3 };

  return (
    <motion.div
      key={trigger}
      initial={disabled ? undefined : initialTarget}
      animate={disabled ? undefined : animateTarget}
      transition={transition}
      whileHover={disabled ? undefined : hover.whileHover}
      className={cn('h-full', hover.className, preset.className, className)}
      style={preset.depth ? { transformStyle: 'preserve-3d', perspective: 600 } : undefined}
      {...(bentoCols != null ? { 'data-bento-cols': bentoCols } : {})}
      {...(bentoRows != null ? { 'data-bento-rows': bentoRows } : {})}
    >
      <span className={cn('block h-full', ambient && ambientCls)}>{children}</span>
    </motion.div>
  );
}

export default Variant3D;
