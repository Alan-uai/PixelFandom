import type { DisplayFormat } from '@/lib/column-types/format-compatibility';

/** Named entry effect — the entrance played when the item variant changes. */
export type EntryEffect =
  | 'pop'
  | 'rise'
  | 'flip-y'
  | 'flip-x'
  | 'swing'
  | 'zoom'
  | 'slide-l'
  | 'slide-r'
  | 'spin-in'
  | 'drop'
  | 'reveal-x'
  | 'morph'
  | 'wave'
  | 'expand'
  | 'glitch';

/** Named ambient effect — a subtle looping motion while idle. */
export type AmbientEffect =
  | 'none'
  | 'float'
  | 'glow'
  | 'breathe'
  | 'drift'
  | 'pulse'
  | 'spin'
  | 'tilt';

/** Named hover interaction — 3D response to the pointer. */
export type HoverEffect =
  | 'none'
  | 'tilt'
  | 'lift'
  | 'glow'
  | 'scale'
  | 'roll'
  | 'deep';

export interface Variant3DPreset {
  /** Entrance played when `trigger` changes (item variant swap). */
  entry: EntryEffect;
  /** Looping idle motion. */
  ambient: AmbientEffect;
  /** Pointer interaction. */
  hover: HoverEffect;
  /** Extra 3D depth applied to the wrapper (perspective + preserve-3d). */
  depth?: boolean;
  /** Optional extra className on the wrapper. */
  className?: string;
  /** Per-format tweak of entry intensity/axis when the default isn't ideal. */
  entryTune?: {
    rotateY?: number;
    rotateX?: number;
    rotateZ?: number;
    x?: number;
    y?: number;
    scale?: number;
    scaleX?: number;
    scaleY?: number;
    skewX?: number;
    skewY?: number;
    opacity?: number;
    duration?: number;
  };
}

/** Registry shape: format → fixed array of 5 presets (variant 1..5). */
export type Variant3DRegistry = Record<DisplayFormat, [Variant3DPreset, Variant3DPreset, Variant3DPreset, Variant3DPreset, Variant3DPreset]>;
