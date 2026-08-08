import type { DisplayFormat } from '@/lib/column-types/format-compatibility';
import type { Variant3DRegistry, Variant3DPreset, EntryEffect, AmbientEffect, HoverEffect } from './types';

/* -------------------------------------------------------------------------- */
/*  Central preset registry — format × variant (v1..v5).                       */
/*                                                                            */
/*  Every format + variant combination has its own entry / ambient / hover     */
/*  animation, deliberately distinct from every other combination. The         */
/*  factories below keep it terse; edit here to retune a single effect.        */
/* -------------------------------------------------------------------------- */

function p(entry: EntryEffect, ambient: AmbientEffect, hover: HoverEffect, opts?: Partial<Variant3DPreset>): Variant3DPreset {
  return { entry, ambient, hover, depth: true, ...opts };
}

/* Row of five distinct variants for a format. The order v1..v5 always maps to
   the visual variant the renderer already draws, so the animation complements
   it instead of fighting it. */
function row(v1: Variant3DPreset, v2: Variant3DPreset, v3: Variant3DPreset, v4: Variant3DPreset, v5: Variant3DPreset): [Variant3DPreset, Variant3DPreset, Variant3DPreset, Variant3DPreset, Variant3DPreset] {
  return [v1, v2, v3, v4, v5];
}

export const VARIANT_3D_PRESETS: Variant3DRegistry = {
  // ── text / strings ──────────────────────────────────────────────────
  text: row(
    p('pop', 'none', 'lift', { entryTune: { scale: 0.94 } }),
    p('reveal-x', 'none', 'scale', { entryTune: { x: -6 } }),
    p('rise', 'breathe', 'tilt', { entryTune: { y: 8 } }),
    p('slide-l', 'drift', 'glow', { entryTune: { x: -10 } }),
    p('swing', 'pulse', 'roll', { entryTune: { rotateZ: 3 } }),
  ),
  badge: row(
    p('pop', 'glow', 'lift', { entryTune: { scale: 0.9 } }),
    p('zoom', 'pulse', 'scale', { entryTune: { scale: 0.9 } }),
    p('rise', 'float', 'tilt', { entryTune: { y: 6 } }),
    p('swing', 'breathe', 'roll', { entryTune: { rotateZ: -4 } }),
    p('flip-y', 'drift', 'deep', { entryTune: { rotateY: -40 } }),
  ),
  // ── numbers ─────────────────────────────────────────────────────────
  number: row(
    p('rise', 'none', 'lift', { entryTune: { y: 10 } }),
    p('flip-y', 'float', 'tilt', { entryTune: { rotateY: -45, scale: 0.92 } }),
    p('pop', 'glow', 'scale', { entryTune: { scale: 0.85 } }),
    p('drop', 'breathe', 'deep', { entryTune: { y: -12 } }),
    p('spin-in', 'pulse', 'roll', { entryTune: { rotateZ: -6 } }),
  ),
  rating: row(
    p('pop', 'none', 'tilt', { entryTune: { scale: 0.92 } }),
    p('rise', 'float', 'scale', { entryTune: { y: 8 } }),
    p('swing', 'pulse', 'roll', { entryTune: { rotateZ: -5 } }),
    p('zoom', 'glow', 'lift', { entryTune: { scale: 0.9 } }),
    p('drop', 'breathe', 'deep', { entryTune: { y: -10 } }),
  ),
  progress: row(
    p('reveal-x', 'none', 'lift', { entryTune: { x: -8 } }),
    p('slide-r', 'drift', 'scale', { entryTune: { x: 8 } }),
    p('rise', 'breathe', 'tilt', { entryTune: { y: 6 } }),
    p('zoom', 'pulse', 'roll', { entryTune: { scale: 0.92 } }),
    p('spin-in', 'glow', 'deep', { entryTune: { rotateZ: -4 } }),
  ),
  duration: row(
    p('pop', 'none', 'lift', { entryTune: { scale: 0.94 } }),
    p('rise', 'float', 'tilt', { entryTune: { y: 6 } }),
    p('swing', 'pulse', 'roll', { entryTune: { rotateZ: -3 } }),
    p('zoom', 'breathe', 'scale', { entryTune: { scale: 0.92 } }),
    p('flip-y', 'glow', 'deep', { entryTune: { rotateY: -35 } }),
  ),
  boolean: row(
    p('pop', 'none', 'scale', { entryTune: { scale: 0.8 } }),
    p('rise', 'float', 'lift', { entryTune: { y: 8 } }),
    p('swing', 'pulse', 'roll', { entryTune: { rotateZ: -6 } }),
    p('zoom', 'breathe', 'tilt', { entryTune: { scale: 0.9 } }),
    p('flip-y', 'drift', 'deep', { entryTune: { rotateY: -50 } }),
  ),
  // ── colors / icons ──────────────────────────────────────────────────
  color: row(
    p('pop', 'glow', 'tilt', { entryTune: { scale: 0.88 } }),
    p('zoom', 'breathe', 'scale', { entryTune: { scale: 0.85 } }),
    p('swing', 'float', 'roll', { entryTune: { rotateZ: 5 } }),
    p('rise', 'pulse', 'lift', { entryTune: { y: 8 } }),
    p('spin-in', 'spin', 'deep', { entryTune: { rotateZ: -8 } }),
  ),
  'color-palette': row(
    p('rise', 'none', 'lift', { entryTune: { y: 8 } }),
    p('zoom', 'float', 'scale', { entryTune: { scale: 0.9 } }),
    p('pop', 'breathe', 'tilt', { entryTune: { scale: 0.92 } }),
    p('slide-l', 'drift', 'roll', { entryTune: { x: -8 } }),
    p('swing', 'pulse', 'deep', { entryTune: { rotateZ: 4 } }),
  ),
  icon: row(
    p('pop', 'none', 'tilt', { entryTune: { scale: 0.8 } }),
    p('spin-in', 'spin', 'roll', { entryTune: { rotateZ: -10 } }),
    p('swing', 'float', 'deep', { entryTune: { rotateZ: 6 } }),
    p('rise', 'pulse', 'scale', { entryTune: { y: 8 } }),
    p('flip-y', 'breathe', 'lift', { entryTune: { rotateY: -45 } }),
  ),
  emoji: row(
    p('pop', 'none', 'lift', { entryTune: { scale: 0.85 } }),
    p('swing', 'breathe', 'roll', { entryTune: { rotateZ: 8 } }),
    p('rise', 'float', 'scale', { entryTune: { y: 8 } }),
    p('zoom', 'pulse', 'tilt', { entryTune: { scale: 0.9 } }),
    p('spin-in', 'spin', 'deep', { entryTune: { rotateZ: -12 } }),
  ),
  'icon-set': row(
    p('rise', 'none', 'lift', { entryTune: { y: 8 } }),
    p('zoom', 'float', 'scale', { entryTune: { scale: 0.9 } }),
    p('pop', 'breathe', 'tilt', { entryTune: { scale: 0.92 } }),
    p('slide-l', 'drift', 'roll', { entryTune: { x: -8 } }),
    p('swing', 'pulse', 'deep', { entryTune: { rotateZ: 4 } }),
  ),
  // ── media ───────────────────────────────────────────────────────────
  image: row(
    p('zoom', 'none', 'tilt', { entryTune: { scale: 0.92 } }),
    p('rise', 'float', 'lift', { entryTune: { y: 8 } }),
    p('swing', 'breathe', 'roll', { entryTune: { rotateZ: -2 } }),
    p('slide-r', 'drift', 'scale', { entryTune: { x: 8 } }),
    p('pop', 'glow', 'deep', { entryTune: { scale: 0.9 } }),
  ),
  video: row(
    p('pop', 'none', 'tilt', { entryTune: { scale: 0.92 } }),
    p('rise', 'float', 'lift', { entryTune: { y: 6 } }),
    p('zoom', 'breathe', 'scale', { entryTune: { scale: 0.9 } }),
    p('slide-l', 'drift', 'roll', { entryTune: { x: -8 } }),
    p('flip-y', 'glow', 'deep', { entryTune: { rotateY: -30 } }),
  ),
  audio: row(
    p('pop', 'none', 'scale', { entryTune: { scale: 0.9 } }),
    p('rise', 'pulse', 'lift', { entryTune: { y: 6 } }),
    p('swing', 'breathe', 'roll', { entryTune: { rotateZ: -3 } }),
    p('zoom', 'float', 'tilt', { entryTune: { scale: 0.92 } }),
    p('flip-y', 'glow', 'deep', { entryTune: { rotateY: -40 } }),
  ),
  file: row(
    p('rise', 'none', 'lift', { entryTune: { y: 8 } }),
    p('slide-r', 'drift', 'scale', { entryTune: { x: 8 } }),
    p('pop', 'float', 'tilt', { entryTune: { scale: 0.9 } }),
    p('swing', 'breathe', 'roll', { entryTune: { rotateZ: 3 } }),
    p('zoom', 'pulse', 'deep', { entryTune: { scale: 0.92 } }),
  ),
  link: row(
    p('reveal-x', 'none', 'lift', { entryTune: { x: -6 } }),
    p('rise', 'float', 'scale', { entryTune: { y: 6 } }),
    p('pop', 'glow', 'tilt', { entryTune: { scale: 0.94 } }),
    p('slide-l', 'drift', 'roll', { entryTune: { x: -8 } }),
    p('swing', 'breathe', 'deep', { entryTune: { rotateZ: 2 } }),
  ),
  // ── datetime ────────────────────────────────────────────────────────
  date: row(
    p('pop', 'none', 'lift', { entryTune: { scale: 0.94 } }),
    p('rise', 'float', 'scale', { entryTune: { y: 6 } }),
    p('reveal-x', 'drift', 'tilt', { entryTune: { x: -8 } }),
    p('swing', 'breathe', 'roll', { entryTune: { rotateZ: 3 } }),
    p('zoom', 'pulse', 'deep', { entryTune: { scale: 0.92 } }),
  ),
  // ── structured / jsonb ──────────────────────────────────────────────
  jsonb: row(
    p('pop', 'none', 'lift', { entryTune: { scale: 0.95 } }),
    p('zoom', 'float', 'scale', { entryTune: { scale: 0.92 } }),
    p('rise', 'breathe', 'tilt', { entryTune: { y: 8 } }),
    p('slide-r', 'drift', 'roll', { entryTune: { x: 8 } }),
    p('flip-y', 'glow', 'deep', { entryTune: { rotateY: -35 } }),
  ),
  'jsonb-structured': row(
    p('pop', 'none', 'lift', { entryTune: { scale: 0.95 } }),
    p('zoom', 'float', 'scale', { entryTune: { scale: 0.92 } }),
    p('rise', 'breathe', 'tilt', { entryTune: { y: 8 } }),
    p('slide-r', 'drift', 'roll', { entryTune: { x: 8 } }),
    p('flip-y', 'glow', 'deep', { entryTune: { rotateY: -35 } }),
  ),
  // ── selectors ───────────────────────────────────────────────────────
  select: row(
    p('pop', 'none', 'lift', { entryTune: { scale: 0.94 } }),
    p('reveal-x', 'drift', 'scale', { entryTune: { x: -6 } }),
    p('rise', 'breathe', 'tilt', { entryTune: { y: 8 } }),
    p('slide-l', 'float', 'roll', { entryTune: { x: -8 } }),
    p('swing', 'pulse', 'deep', { entryTune: { rotateZ: 3 } }),
  ),
  'multi-select': row(
    p('rise', 'none', 'lift', { entryTune: { y: 8 } }),
    p('zoom', 'float', 'scale', { entryTune: { scale: 0.9 } }),
    p('pop', 'breathe', 'tilt', { entryTune: { scale: 0.92 } }),
    p('slide-l', 'drift', 'roll', { entryTune: { x: -8 } }),
    p('swing', 'pulse', 'deep', { entryTune: { rotateZ: 4 } }),
  ),
  'toggle-group': row(
    p('pop', 'none', 'lift', { entryTune: { scale: 0.94 } }),
    p('zoom', 'float', 'scale', { entryTune: { scale: 0.9 } }),
    p('rise', 'breathe', 'tilt', { entryTune: { y: 8 } }),
    p('swing', 'pulse', 'roll', { entryTune: { rotateZ: 3 } }),
    p('flip-y', 'glow', 'deep', { entryTune: { rotateY: -40 } }),
  ),
  // ── tags / misc ─────────────────────────────────────────────────────
  tags: row(
    p('pop', 'none', 'lift', { entryTune: { scale: 0.94 } }),
    p('rise', 'float', 'scale', { entryTune: { y: 6 } }),
    p('slide-r', 'drift', 'roll', { entryTune: { x: 8 } }),
    p('zoom', 'breathe', 'tilt', { entryTune: { scale: 0.92 } }),
    p('swing', 'pulse', 'deep', { entryTune: { rotateZ: 4 } }),
  ),
  popover: row(
    p('pop', 'none', 'none', { entryTune: { scale: 0.92 } }),
    p('zoom', 'float', 'none', { entryTune: { scale: 0.9 } }),
    p('swing', 'pulse', 'none', { entryTune: { rotateZ: -3 } }),
    p('rise', 'breathe', 'none', { entryTune: { y: 8 } }),
    p('flip-y', 'glow', 'none', { entryTune: { rotateY: -30 } }),
  ),
};

export function getVariant3DPreset(format: DisplayFormat, variant: number): Variant3DPreset {
  const list = VARIANT_3D_PRESETS[format];
  const idx = Math.max(0, Math.min(4, variant - 1));
  return list[idx];
}
