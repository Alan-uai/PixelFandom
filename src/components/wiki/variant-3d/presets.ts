import type { DisplayFormat } from '@/lib/column-types/format-compatibility';
import type { Variant3DRegistry, Variant3DPreset, EntryEffect, AmbientEffect, HoverEffect } from './types';

/* -------------------------------------------------------------------------- */
/*  Central preset registry — format × variant (v1..v5).                       */
/*                                                                            */
/*  Each format has 5 distinct presets that COMPLEMENT the render function's   */
/*  own value animation (counting, star-spin, bar-slide, etc.).               */
/*  Entry effects are type-specific: numbers get count-up, ratings get        */
/*  star-flip, progress gets slide, text gets scramble-3D, etc.               */
/* -------------------------------------------------------------------------- */

function p(entry: EntryEffect, ambient: AmbientEffect, hover: HoverEffect, opts?: Partial<Variant3DPreset>): Variant3DPreset {
  return { entry, ambient, hover, depth: true, ...opts };
}

function row(v1: Variant3DPreset, v2: Variant3DPreset, v3: Variant3DPreset, v4: Variant3DPreset, v5: Variant3DPreset): [Variant3DPreset, Variant3DPreset, Variant3DPreset, Variant3DPreset, Variant3DPreset] {
  return [v1, v2, v3, v4, v5];
}

export const VARIANT_3D_PRESETS: Variant3DRegistry = {
  // ── text: character-by-character 3D reveal ─────────────────────────────
  text: row(
    p('morph', 'none', 'lift', { entryTune: { scale: 0.92, rotateY: 10 } }),
    p('glitch', 'none', 'scale', { entryTune: { x: -4, skewX: -1.5 } }),
    p('wave', 'breathe', 'tilt', { entryTune: { y: 6, rotateX: -8 } }),
    p('expand', 'drift', 'glow', { entryTune: { scaleX: 0.85 } }),
    p('flip-x', 'pulse', 'roll', { entryTune: { rotateX: -35 } }),
  ),

  // ── badge: clip-path circle reveal + scale bounce ──────────────────────
  badge: row(
    p('zoom', 'glow', 'lift', { entryTune: { scale: 0.85 } }),
    p('expand', 'pulse', 'scale', { entryTune: { scaleX: 0.7, scaleY: 0.9 } }),
    p('morph', 'float', 'tilt', { entryTune: { scale: 0.88, rotateY: 12 } }),
    p('flip-x', 'breathe', 'roll', { entryTune: { rotateX: -40 } }),
    p('wave', 'drift', 'deep', { entryTune: { y: 6, rotateX: -6 } }),
  ),

  // ── number: count-up entrance with perspective tilt ────────────────────
  number: row(
    p('rise', 'none', 'lift', { entryTune: { y: 8, rotateX: -5 } }),
    p('morph', 'float', 'tilt', { entryTune: { scale: 0.88, rotateY: 12 } }),
    p('expand', 'glow', 'scale', { entryTune: { scaleX: 0.8 } }),
    p('drop', 'breathe', 'deep', { entryTune: { y: -10, rotateX: 5 } }),
    p('flip-x', 'pulse', 'roll', { entryTune: { rotateX: -30 } }),
  ),

  // ── rating: star-flip entrance (complements star-spin in render) ───────
  rating: row(
    p('spin-in', 'none', 'tilt', { entryTune: { rotateZ: -8 } }),
    p('flip-y', 'float', 'scale', { entryTune: { rotateY: -40 } }),
    p('wave', 'pulse', 'roll', { entryTune: { y: 5, rotateX: -8 } }),
    p('morph', 'glow', 'lift', { entryTune: { scale: 0.9, rotateY: 10 } }),
    p('expand', 'breathe', 'deep', { entryTune: { scaleX: 0.85 } }),
  ),

  // ── progress: bar-slide entrance (complements bar-slide in render) ─────
  progress: row(
    p('slide-r', 'none', 'lift', { entryTune: { x: 10 } }),
    p('expand', 'drift', 'scale', { entryTune: { scaleX: 0.7 } }),
    p('wave', 'breathe', 'tilt', { entryTune: { y: 5, rotateX: -6 } }),
    p('morph', 'pulse', 'roll', { entryTune: { scale: 0.9, rotateY: 8 } }),
    p('flip-x', 'glow', 'deep', { entryTune: { rotateX: -25 } }),
  ),

  // ── slider: elastic slide entrance (complements ElasticSlider3D) ───────
  slider: row(
    p('slide-r', 'none', 'lift', { entryTune: { x: 10 } }),
    p('expand', 'drift', 'scale', { entryTune: { scaleX: 0.7 } }),
    p('wave', 'breathe', 'tilt', { entryTune: { y: 5, rotateX: -6 } }),
    p('morph', 'pulse', 'roll', { entryTune: { scale: 0.9, rotateY: 8 } }),
    p('flip-x', 'glow', 'deep', { entryTune: { rotateX: -25 } }),
  ),

  // ── duration: clock-hand spin entrance ─────────────────────────────────
  duration: row(
    p('spin-in', 'none', 'lift', { entryTune: { rotateZ: -10 } }),
    p('morph', 'float', 'tilt', { entryTune: { scale: 0.9, rotateY: 10 } }),
    p('flip-y', 'pulse', 'roll', { entryTune: { rotateY: -35 } }),
    p('expand', 'breathe', 'scale', { entryTune: { scaleX: 0.85 } }),
    p('wave', 'glow', 'deep', { entryTune: { y: 5, rotateX: -6 } }),
  ),

  // ── boolean: toggle pulse entrance ─────────────────────────────────────
  boolean: row(
    p('zoom', 'none', 'scale', { entryTune: { scale: 0.75 } }),
    p('expand', 'float', 'lift', { entryTune: { scaleX: 0.6 } }),
    p('flip-x', 'pulse', 'roll', { entryTune: { rotateX: -45 } }),
    p('morph', 'breathe', 'tilt', { entryTune: { scale: 0.85, rotateY: 10 } }),
    p('wave', 'drift', 'deep', { entryTune: { y: 4, rotateX: -5 } }),
  ),

  // ── color: morph/scale entrance (color swatch transitions) ────────────
  color: row(
    p('morph', 'glow', 'tilt', { entryTune: { scale: 0.82, rotateY: 15 } }),
    p('expand', 'breathe', 'scale', { entryTune: { scaleX: 0.7, scaleY: 0.85 } }),
    p('zoom', 'float', 'roll', { entryTune: { scale: 0.85 } }),
    p('wave', 'pulse', 'lift', { entryTune: { y: 5, rotateX: -6 } }),
    p('flip-x', 'spin', 'deep', { entryTune: { rotateX: -35 } }),
  ),

  // ── color-palette: wave entrance (colors fade in sequence) ────────────
  'color-palette': row(
    p('wave', 'none', 'lift', { entryTune: { y: 6, rotateX: -5 } }),
    p('expand', 'float', 'scale', { entryTune: { scaleX: 0.8 } }),
    p('morph', 'breathe', 'tilt', { entryTune: { scale: 0.9, rotateY: 8 } }),
    p('slide-l', 'drift', 'roll', { entryTune: { x: -6 } }),
    p('flip-x', 'pulse', 'deep', { entryTune: { rotateX: -30 } }),
  ),

  // ── icon: 3D pop + rotate entrance ────────────────────────────────────
  icon: row(
    p('zoom', 'none', 'tilt', { entryTune: { scale: 0.7 } }),
    p('spin-in', 'spin', 'roll', { entryTune: { rotateZ: -12 } }),
    p('flip-y', 'float', 'deep', { entryTune: { rotateY: -45 } }),
    p('morph', 'pulse', 'scale', { entryTune: { scale: 0.8, rotateY: 12 } }),
    p('wave', 'breathe', 'lift', { entryTune: { y: 5, rotateX: -6 } }),
  ),

  // ── emoji: bounce + scale entrance ─────────────────────────────────────
  emoji: row(
    p('zoom', 'none', 'lift', { entryTune: { scale: 0.6 } }),
    p('wave', 'breathe', 'roll', { entryTune: { y: 6, rotateZ: 5 } }),
    p('morph', 'float', 'scale', { entryTune: { scale: 0.75, rotateY: 10 } }),
    p('expand', 'pulse', 'tilt', { entryTune: { scaleX: 0.7 } }),
    p('spin-in', 'spin', 'deep', { entryTune: { rotateZ: -15 } }),
  ),

  // ── icon-set: cascade entrance ─────────────────────────────────────────
  'icon-set': row(
    p('wave', 'none', 'lift', { entryTune: { y: 6, rotateX: -5 } }),
    p('expand', 'float', 'scale', { entryTune: { scaleX: 0.8 } }),
    p('morph', 'breathe', 'tilt', { entryTune: { scale: 0.9, rotateY: 8 } }),
    p('slide-l', 'drift', 'roll', { entryTune: { x: -6 } }),
    p('flip-x', 'pulse', 'deep', { entryTune: { rotateX: -30 } }),
  ),

  // ── image: fade + scale entrance ───────────────────────────────────────
  image: row(
    p('morph', 'none', 'tilt', { entryTune: { scale: 0.88, rotateY: 8 } }),
    p('expand', 'float', 'lift', { entryTune: { scaleX: 0.85, scaleY: 0.9 } }),
    p('wave', 'breathe', 'roll', { entryTune: { y: 5, rotateX: -5 } }),
    p('slide-r', 'drift', 'scale', { entryTune: { x: 6 } }),
    p('zoom', 'glow', 'deep', { entryTune: { scale: 0.85 } }),
  ),

  // ── video: play-button pulse entrance ──────────────────────────────────
  video: row(
    p('zoom', 'none', 'tilt', { entryTune: { scale: 0.88 } }),
    p('morph', 'float', 'lift', { entryTune: { scale: 0.9, rotateY: 10 } }),
    p('expand', 'breathe', 'scale', { entryTune: { scaleX: 0.85 } }),
    p('wave', 'drift', 'roll', { entryTune: { y: 5, rotateX: -5 } }),
    p('flip-y', 'glow', 'deep', { entryTune: { rotateY: -30 } }),
  ),

  // ── audio: waveform pulse entrance ─────────────────────────────────────
  audio: row(
    p('expand', 'none', 'scale', { entryTune: { scaleX: 0.7 } }),
    p('wave', 'pulse', 'lift', { entryTune: { y: 5, rotateX: -5 } }),
    p('morph', 'breathe', 'roll', { entryTune: { scale: 0.9, rotateY: 8 } }),
    p('zoom', 'float', 'tilt', { entryTune: { scale: 0.85 } }),
    p('flip-x', 'glow', 'deep', { entryTune: { rotateX: -30 } }),
  ),

  // ── file: slide-in entrance ────────────────────────────────────────────
  file: row(
    p('slide-r', 'none', 'lift', { entryTune: { x: 8 } }),
    p('morph', 'drift', 'scale', { entryTune: { scale: 0.9, rotateY: 8 } }),
    p('expand', 'float', 'tilt', { entryTune: { scaleX: 0.8 } }),
    p('wave', 'breathe', 'roll', { entryTune: { y: 5, rotateX: -5 } }),
    p('zoom', 'pulse', 'deep', { entryTune: { scale: 0.88 } }),
  ),

  // ── link: underline-draw entrance ──────────────────────────────────────
  link: row(
    p('slide-l', 'none', 'lift', { entryTune: { x: -6 } }),
    p('morph', 'float', 'scale', { entryTune: { scale: 0.92, rotateY: 8 } }),
    p('wave', 'glow', 'tilt', { entryTune: { y: 4, rotateX: -5 } }),
    p('expand', 'drift', 'roll', { entryTune: { scaleX: 0.85 } }),
    p('flip-x', 'breathe', 'deep', { entryTune: { rotateX: -25 } }),
  ),

  // ── date: calendar-flip entrance ───────────────────────────────────────
  date: row(
    p('flip-x', 'none', 'lift', { entryTune: { rotateX: -40 } }),
    p('morph', 'float', 'scale', { entryTune: { scale: 0.9, rotateY: 10 } }),
    p('wave', 'drift', 'tilt', { entryTune: { y: 5, rotateX: -6 } }),
    p('expand', 'breathe', 'roll', { entryTune: { scaleX: 0.85 } }),
    p('spin-in', 'pulse', 'deep', { entryTune: { rotateZ: -8 } }),
  ),

  // ── jsonb: staggered key reveal ────────────────────────────────────────
  jsonb: row(
    p('morph', 'none', 'lift', { entryTune: { scale: 0.92, rotateY: 8 } }),
    p('expand', 'float', 'scale', { entryTune: { scaleX: 0.85 } }),
    p('wave', 'breathe', 'tilt', { entryTune: { y: 5, rotateX: -5 } }),
    p('slide-r', 'drift', 'roll', { entryTune: { x: 6 } }),
    p('flip-y', 'glow', 'deep', { entryTune: { rotateY: -30 } }),
  ),

  'jsonb-structured': row(
    p('morph', 'none', 'lift', { entryTune: { scale: 0.92, rotateY: 8 } }),
    p('expand', 'float', 'scale', { entryTune: { scaleX: 0.85 } }),
    p('wave', 'breathe', 'tilt', { entryTune: { y: 5, rotateX: -5 } }),
    p('slide-r', 'drift', 'roll', { entryTune: { x: 6 } }),
    p('flip-y', 'glow', 'deep', { entryTune: { rotateY: -30 } }),
  ),

  // ── select: selection-highlight slide ──────────────────────────────────
  select: row(
    p('morph', 'none', 'lift', { entryTune: { scale: 0.9, rotateY: 8 } }),
    p('wave', 'drift', 'scale', { entryTune: { y: 4, rotateX: -5 } }),
    p('expand', 'breathe', 'tilt', { entryTune: { scaleX: 0.8 } }),
    p('slide-l', 'float', 'roll', { entryTune: { x: -6 } }),
    p('flip-x', 'pulse', 'deep', { entryTune: { rotateX: -30 } }),
  ),

  // ── multi-select: staggered tag entrance ───────────────────────────────
  'multi-select': row(
    p('wave', 'none', 'lift', { entryTune: { y: 5, rotateX: -5 } }),
    p('expand', 'float', 'scale', { entryTune: { scaleX: 0.8 } }),
    p('morph', 'breathe', 'tilt', { entryTune: { scale: 0.9, rotateY: 8 } }),
    p('slide-l', 'drift', 'roll', { entryTune: { x: -6 } }),
    p('flip-x', 'pulse', 'deep', { entryTune: { rotateX: -30 } }),
  ),

  // ── toggle-group: toggle-switch entrance ───────────────────────────────
  'toggle-group': row(
    p('expand', 'none', 'lift', { entryTune: { scaleX: 0.6 } }),
    p('morph', 'float', 'scale', { entryTune: { scale: 0.85, rotateY: 10 } }),
    p('wave', 'breathe', 'tilt', { entryTune: { y: 4, rotateX: -5 } }),
    p('zoom', 'pulse', 'roll', { entryTune: { scale: 0.8 } }),
    p('flip-x', 'glow', 'deep', { entryTune: { rotateX: -35 } }),
  ),

  // ── tags: staggered tag slide entrance ─────────────────────────────────
  tags: row(
    p('wave', 'none', 'lift', { entryTune: { y: 5, rotateX: -5 } }),
    p('morph', 'float', 'scale', { entryTune: { scale: 0.9, rotateY: 8 } }),
    p('slide-r', 'drift', 'roll', { entryTune: { x: 6 } }),
    p('expand', 'breathe', 'tilt', { entryTune: { scaleX: 0.8 } }),
    p('flip-x', 'pulse', 'deep', { entryTune: { rotateX: -30 } }),
  ),

  // ── popover: content reveal from trigger ───────────────────────────────
  popover: row(
    p('morph', 'none', 'none', { entryTune: { scale: 0.9, rotateY: 8 } }),
    p('expand', 'float', 'none', { entryTune: { scaleX: 0.8 } }),
    p('wave', 'pulse', 'none', { entryTune: { y: 4, rotateX: -5 } }),
    p('zoom', 'breathe', 'none', { entryTune: { scale: 0.85 } }),
    p('flip-x', 'glow', 'none', { entryTune: { rotateX: -30 } }),
  ),

  // ── baseXmax: scale/slide entrance reflecting the scaled value ─────────
  baseXmax: row(
    p('zoom', 'glow', 'lift', { entryTune: { scale: 0.85 } }),
    p('expand', 'pulse', 'scale', { entryTune: { scaleX: 0.8 } }),
    p('wave', 'float', 'tilt', { entryTune: { y: 4, rotateX: -6 } }),
    p('morph', 'breathe', 'roll', { entryTune: { scale: 0.9, rotateY: 10 } }),
    p('flip-x', 'drift', 'deep', { entryTune: { rotateX: -30 } }),
  ),
};

export function getVariant3DPreset(format: DisplayFormat, variant: number): Variant3DPreset {
  const list = VARIANT_3D_PRESETS[format] ?? VARIANT_3D_PRESETS.text;
  const idx = Math.max(0, Math.min(4, variant - 1));
  return list[idx];
}
