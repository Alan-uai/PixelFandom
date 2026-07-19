'use client';

import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { parseOperatorPrefix } from '@/lib/operator-symbols';

/* -------------------------------------------------------------------------- */
/*  VariantAnimatedValue                                                       */
/*  Modular, dynamic, per-column-type 3D transition wrapper.                   */
/*                                                                            */
/*  Picks an animation strategy purely from `renderType` (catalog-driven —    */
/*  NO hardcoded column names). Renders the provided `children` (the real     */
/*  ColumnDisplay output) when no scramble/counter is appropriate, but for    */
/*  text/jsonb/tags/number it overlays a 3D animated transition on value       */
/*  change.                                                                  */
/* -------------------------------------------------------------------------- */

const GLYPHS = '!<>-_\\/[]{}—=+*^?#@░▒▓█01ABCDEFXYZ$%&';

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
}

function toStringValue(v: unknown): string {
  if (v === null || v === undefined) return '';
  if (typeof v === 'object') {
    try {
      return JSON.stringify(v);
    } catch {
      return String(v);
    }
  }
  return String(v);
}

function isNumericRenderType(rt: string): boolean {
  return rt === 'number' || rt === 'numeric' || rt === 'slider' || rt === 'duration' || rt === 'progress';
}

function isTextishRenderType(rt: string): boolean {
  // Settings / text / tags / jsonb => scramble effect
  return (
    rt === 'text' ||
    rt === 'string' ||
    rt === 'auto' ||
    rt === 'tags' ||
    rt === 'jsonb' ||
    rt === 'multi-select' ||
    rt === 'icon-set' ||
    rt === 'color-palette' ||
    rt === 'select' ||
    rt === 'toggle-group' ||
    rt === 'link' ||
    rt === 'emoji' ||
    rt === 'entity-link'
  );
}

function isBooleanRenderType(rt: string): boolean {
  return rt === 'boolean' || rt === 'toggle' || rt === 'switch';
}

/** Render types whose ColumnDisplay output is visually rich (icons, colors,
 *  OP symbols, suffixes, badges, ratings, progress, links, images). These must
 *  be animated with a 3D flip of the already-rendered `children` — never with
 *  a plain scramble/counter that would discard the icon/color/OP/suffix. */
function isRichVisualRenderType(rt: string): boolean {
  return (
    rt === 'icon' ||
    rt === 'icon-set' ||
    rt === 'color' ||
    rt === 'color-palette' ||
    rt === 'image' ||
    rt === 'video' ||
    rt === 'audio' ||
    rt === 'link' ||
    rt === 'badge' ||
    rt === 'rating' ||
    rt === 'progress' ||
    rt === 'slider' ||
    rt === 'duration' ||
    rt === 'tags' ||
    rt === 'multi-select' ||
    rt === 'select' ||
    rt === 'toggle-group' ||
    rt === 'emoji' ||
    rt === 'entity-link'
  );
}

/** A numeric value that carries an operator prefix (e.g. "+5", "×2") or a
 *  suffix must keep its rich ColumnDisplay rendering instead of a plain
 *  counter, which would strip the symbol/suffix. */
function hasRichNumericValue(value: unknown, renderType: string): boolean {
  if (renderType === 'progress' || renderType === 'slider' || renderType === 'duration' || renderType === 'rating') {
    return true;
  }
  if (typeof value === 'string' && parseOperatorPrefix(value)) return true;
  return false;
}

/* ----------------------------- Scramble ---------------------------------- */

function useScramble(text: string, trigger: number, enabled: boolean): string {
  const [display, setDisplay] = useState(text);
  const frame = useRef<number | null>(null);

  useEffect(() => {
    if (frame.current) cancelAnimationFrame(frame.current);
    if (!enabled || prefersReducedMotion()) {
      setDisplay(text);
      return;
    }
    const oldText = display;
    const newText = text;
    const len = Math.max(oldText.length, newText.length, 6);
    const duration = 400;
    const start = performance.now();

    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      // progress reveals new chars left-to-right; remaining are random glyphs
      const reveal = Math.floor(t * len);
      let out = '';
      for (let i = 0; i < len; i++) {
        if (i < reveal) {
          out += newText[i] ?? (i < oldText.length ? oldText[i] : '');
        } else {
          out += GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
        }
      }
      setDisplay(out.slice(0, Math.max(newText.length, 1)));
      if (t < 1) {
        frame.current = requestAnimationFrame(tick);
      } else {
        setDisplay(newText);
      }
    };
    frame.current = requestAnimationFrame(tick);
    return () => {
      if (frame.current) cancelAnimationFrame(frame.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trigger, text, enabled]);

  return display;
}

/* ----------------------------- Counter ----------------------------------- */

function useCounter(value: number, trigger: number, enabled: boolean): number {
  const [display, setDisplay] = useState(value);
  const frame = useRef<number | null>(null);

  useEffect(() => {
    if (frame.current) cancelAnimationFrame(frame.current);
    if (!enabled || prefersReducedMotion()) {
      setDisplay(value);
      return;
    }
    const from = display;
    const to = value;
    if (from === to) {
      setDisplay(to);
      return;
    }
    const duration = 400;
    const start = performance.now();

    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      const current = Math.round(from + (to - from) * eased);
      setDisplay(current);
      if (t < 1) {
        frame.current = requestAnimationFrame(tick);
      } else {
        setDisplay(to);
      }
    };
    frame.current = requestAnimationFrame(tick);
    return () => {
      if (frame.current) cancelAnimationFrame(frame.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trigger, value, enabled]);

  return display;
}

/* ------------------------- 3D flip fallback ------------------------------ */

function ThreeDFlip({ children, trigger }: { children: React.ReactNode; trigger: number }) {
  const reduced = prefersReducedMotion();
  const [animating, setAnimating] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    if (reduced) return;
    setAnimating(true);
    timer.current = setTimeout(() => setAnimating(false), 520);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [trigger, reduced]);

  return (
    <span
      className={cn('inline-block transition-transform', animating && 'animate-[vflip_0.5s_ease-in-out]')}
      style={{ transformStyle: 'preserve-3d', perspective: '500px' }}
    >
      {children}
    </span>
  );
}

/* --------------------------- Main component ------------------------------ */

export interface VariantAnimatedValueProps {
  value: unknown;
  renderType: string;
  /** increment to retrigger the transition */
  trigger?: number;
  className?: string;
  /** optional explicit formatter for numeric values */
  formatNumber?: (n: number) => string;
  /** whether to abbreviate/use suffix + scientific notation on numeric output */
  useSuffix?: boolean;
  children?: React.ReactNode;
}

export function VariantAnimatedValue({
  value,
  renderType,
  trigger = 0,
  className,
  formatNumber,
  useSuffix,
  children,
}: VariantAnimatedValueProps) {
  const reduced = prefersReducedMotion();
  const strVal = toStringValue(value);

  // Scramble for textish
  const scrambled = useScramble(strVal, trigger, isTextishRenderType(renderType));
  // Counter for numeric
  const numericVal = typeof value === 'number' ? value : Number(value);
  // When a suffix/scientific notation is requested we keep the rich ColumnDisplay
  // rendering (with the abbreviate formatter) instead of a bare counter.
  const isNum = !Number.isNaN(numericVal) && isNumericRenderType(renderType) && !hasRichNumericValue(value, renderType) && !useSuffix;
  const counted = useCounter(isNum ? numericVal : 0, trigger, isNum);

  // Boolean pulse
  const isBool = isBooleanRenderType(renderType);
  const boolVal = typeof value === 'boolean' ? value : String(value).toLowerCase() === 'true';

  // Rich visual render types (icon, color, OP, badge, rating, progress, link,
  // image, tags, …) keep their already-rendered `children` and only get a 3D
  // flip — this preserves icons, colors, OP symbols and suffixes.
  if (isRichVisualRenderType(renderType)) {
    return (
      <ThreeDFlip trigger={trigger}>
        <span className={className}>{children ?? strVal}</span>
      </ThreeDFlip>
    );
  }

  if (isNum) {
    return (
      <span
        className={cn('inline-flex items-center', className)}
        style={{ perspective: '500px', transformStyle: 'preserve-3d' }}
      >
        <span
          key={trigger}
          className={cn(!reduced && 'animate-[vcount_0.4s_ease-out]')}
          style={{ display: 'inline-block', transformStyle: 'preserve-3d' }}
        >
          {formatNumber ? formatNumber(counted) : counted}
        </span>
      </span>
    );
  }

  if (isBool) {
    return (
      <span
        className={cn('inline-flex items-center gap-1', className)}
        style={{ perspective: '500px' }}
      >
        <span
          key={trigger}
          className={cn(
            !reduced && 'animate-[vpulse_0.45s_ease-out]',
            'inline-block rounded-full px-1.5 py-0.5 text-[10px] font-semibold',
            boolVal ? 'bg-emerald-500/20 text-emerald-300' : 'bg-muted text-muted-foreground',
          )}
        >
          {boolVal ? 'Sim' : 'Não'}
        </span>
      </span>
    );
  }

  if (isTextishRenderType(renderType)) {
    return (
      <span
        className={cn('relative inline-block', className)}
        style={{ perspective: '500px', transformStyle: 'preserve-3d' }}
      >
        {/* Real formatted display sits underneath; scramble overlay shows during transition */}
        <span key={trigger} className={cn('inline-block', !reduced && 'animate-[vscramble_0.4s_ease-out]')}>
          {scrambled}
        </span>
      </span>
    );
  }

  // Fallback: 3D flip of the children
  return (
    <ThreeDFlip trigger={trigger}>
      <span className={className}>{children ?? strVal}</span>
    </ThreeDFlip>
  );
}

/* --------------------------- Keyframes ----------------------------------- */
/* These are injected once at module load into a <style> tag so they are      */
/* available globally without touching tailwind config.                      */

let injected = false;
if (typeof document !== 'undefined' && !injected) {
  injected = true;
  const styleId = 'variant-animated-value-kf';
  if (!document.getElementById(styleId)) {
    const el = document.createElement('style');
    el.id = styleId;
    el.textContent = `
@keyframes vscramble {
  0% { transform: translateZ(0) scale(0.96); filter: blur(0.5px); opacity: 0.65; }
  50% { transform: translateZ(14px) scale(1.04); filter: blur(0); opacity: 1; }
  100% { transform: translateZ(0) scale(1); opacity: 1; }
}
@keyframes vcount {
  0% { transform: translateZ(0) rotateX(0); }
  35% { transform: translateZ(20px) rotateX(22deg) scale(1.12); }
  100% { transform: translateZ(0) rotateX(0) scale(1); }
}
@keyframes vpulse {
  0% { transform: translateZ(0) scale(0.9); }
  45% { transform: translateZ(16px) scale(1.18); }
  100% { transform: translateZ(0) scale(1); }
}
@keyframes vflip {
  0% { transform: rotateY(0deg); }
  50% { transform: rotateY(90deg); }
  100% { transform: rotateY(0deg); }
}
@media (prefers-reduced-motion: reduce) {
  .animate-\\[vscramble_0\\.4s_ease-out\\], .animate-\\[vcount_0\\.4s_ease-out\\], .animate-\\[vpulse_0\\.45s_ease-out\\], .animate-\\[vflip_0\\.5s_ease-in-out\\] {
    animation: none !important;
  }
}
`;
    document.head.appendChild(el);
  }
}
