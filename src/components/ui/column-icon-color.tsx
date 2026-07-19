'use client';

import { useState, useRef, useEffect } from 'react';
import { Palette, ImageOff } from 'lucide-react';
import { IconRenderer } from './icon-renderer';
import { TableIconPicker } from '@/components/ui/table-icon-picker';
import { cn } from '@/lib/utils';

const COLOR_PRESETS = [
  '#ef4444', '#f97316', '#eab308', '#22c55e',
  '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899',
  '#78716c', '#a3a3a3',
];

interface ColorSwatchProps {
  color?: string;
  onChange: (color: string | undefined) => void;
  className?: string;
  title?: string;
}

function ColorSwatch({ color, onChange, className, title }: ColorSwatchProps) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState(color || '');
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => { setText(color || ''); }, [color]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const setColor = (c: string) => {
    setText(c);
    onChange(c);
  };
  const clear = () => {
    setText('');
    onChange(undefined);
    setOpen(false);
  };

  return (
    <div className="relative inline-flex" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={cn(
          'flex items-center justify-center border transition-all hover:scale-105',
          color ? 'border-transparent' : 'border-dashed border-muted-foreground/40 hover:border-foreground',
          className,
        )}
        style={{ backgroundColor: color || 'transparent' }}
        title={title || (color ? `Cor: ${color}` : 'Definir cor')}
      >
        {!color && <Palette className="h-3 w-3 text-muted-foreground" />}
      </button>
      {open && (
        <div className="absolute top-full left-0 mt-1 z-50 bg-card border rounded-lg p-2 shadow-xl min-w-[180px]">
          <div className="flex flex-wrap gap-1">
            {COLOR_PRESETS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                className={cn(
                  'h-5 w-5 rounded-full border transition-all hover:scale-110',
                  color === c ? 'border-foreground ring-2 ring-foreground/30' : 'border-border',
                )}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
          <div className="flex items-center gap-1.5 mt-1.5">
            <input
              type="text"
              value={text}
              onChange={(e) => setColor(e.target.value)}
              placeholder="#ff6600"
              className="flex-1 h-6 rounded border bg-background px-1.5 text-[10px] font-mono focus:outline-none focus:ring-1 focus:ring-primary/50"
            />
            <div className="h-5 w-5 rounded border shrink-0" style={{ backgroundColor: text || 'transparent' }} />
          </div>
          {color && (
            <button
              type="button"
              onClick={clear}
              className="mt-1 text-[10px] text-muted-foreground hover:text-destructive transition-colors w-full text-left"
            >
              Remover cor
            </button>
          )}
        </div>
      )}
    </div>
  );
}

interface LabelIconBoxProps {
  icon?: string;
  onChange: (iconId: string | undefined) => void;
  className?: string;
  slug?: string;
  tenantId?: string;
}

export function LabelIconBox({ icon, onChange, className, slug, tenantId }: LabelIconBoxProps) {
  return (
    <TableIconPicker
      value={icon || ''}
      onChange={(v) => onChange(v || undefined)}
      slug={slug || ''}
      tenantId={tenantId}
      size="sm"
    />
  );
}

interface LabelColorCircleProps {
  color?: string;
  onChange: (color: string | undefined) => void;
}

export function LabelColorCircle({ color, onChange }: LabelColorCircleProps) {
  return (
    <ColorSwatch
      color={color}
      onChange={onChange}
      className="h-4 w-4 rounded-full"
      title={color ? `Cor do rótulo: ${color}` : 'Cor do rótulo + conteúdo'}
    />
  );
}

interface ValueColorLineProps {
  color?: string;
  onChange: (color: string | undefined) => void;
  children?: React.ReactNode;
}

export function ValueColorLine({ color, onChange, children }: ValueColorLineProps) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState(color || '');
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => { setText(color || ''); }, [color]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const setColor = (c: string) => {
    setText(c);
    onChange(c);
  };
  const clear = () => {
    setText('');
    onChange(undefined);
    setOpen(false);
  };

  return (
    <div className="flex flex-col items-center gap-1 pt-1.5" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="block w-[3px] rounded-full shrink-0 transition-all hover:scale-x-150"
        style={{
          backgroundColor: color || 'transparent',
          minHeight: '18px',
          ...(!color ? { border: '1px dashed', borderColor: 'var(--muted-foreground)' } : {}),
        }}
        title={color ? `Cor do valor: ${color}` : 'Cor do valor'}
      />
      {children}
      {open && (
        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 z-50 bg-card border rounded-lg p-2 shadow-xl min-w-[180px]">
          <div className="flex flex-wrap gap-1">
            {COLOR_PRESETS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                className="h-5 w-5 rounded-full border transition-all hover:scale-110"
                style={{ backgroundColor: c, ...(color === c ? { borderColor: 'var(--foreground)', boxShadow: '0 0 0 2px var(--foreground)' } : {}) }}
              />
            ))}
          </div>
          <div className="flex items-center gap-1.5 mt-1.5">
            <input
              type="text"
              value={text}
              onChange={(e) => setColor(e.target.value)}
              placeholder="#ff6600"
              className="flex-1 h-6 rounded border bg-background px-1.5 text-[10px] font-mono focus:outline-none focus:ring-1 focus:ring-primary/50"
            />
            <div className="h-5 w-5 rounded border shrink-0" style={{ backgroundColor: text || 'transparent' }} />
          </div>
          {color && (
            <button
              type="button"
              onClick={clear}
              className="mt-1 text-[10px] text-muted-foreground hover:text-destructive transition-colors w-full text-left"
            >
              Remover cor
            </button>
          )}
        </div>
      )}
    </div>
  );
}

type GlowPhase = 'idle' | 'focus';

interface InputGlowProps {
  color: string;
  children: React.ReactNode;
}

const GLOW_RADIUS = 0;
const GLOW_INSET = 0;

const COMET_MAX_SPEED = 900;
const COMET_ACCEL = 6;

export function InputGlow({ color, children }: InputGlowProps) {
  const [phase, setPhase] = useState<GlowPhase>('idle');
  const [size, setSize] = useState<{ w: number; h: number }>({ w: 0, h: 0 });
  const wrapRef = useRef<HTMLDivElement>(null);
  const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cometElRef = useRef<SVGRectElement>(null);
  const pulseGroupRef = useRef<SVGGElement>(null);
  const typingRef = useRef(false);
  const focusedRef = useRef(false);
  const offsetRef = useRef(0);
  const velRef = useRef(0);
  const mixRef = useRef(0);
  const rafRef = useRef<number | null>(null);
  const lastTsRef = useRef(0);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const r = entries[0]?.contentRect;
      if (r) setSize({ w: r.width, h: r.height });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const stopLoop = () => {
    if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    lastTsRef.current = 0;
  };

  const ensureLoop = () => {
    if (rafRef.current != null) return;
    const tick = (ts: number) => {
      const last = lastTsRef.current || ts;
      const dt = Math.min(0.05, (ts - last) / 1000);
      lastTsRef.current = ts;

      // Rotation speed eases toward its target; the comet keeps advancing.
      const speedTarget = typingRef.current ? COMET_MAX_SPEED : 0;
      velRef.current += (speedTarget - velRef.current) * Math.min(1, COMET_ACCEL * dt);
      offsetRef.current -= velRef.current * dt;

      // Cross-fade weight (1 = comet, 0 = pulse) eases toward its target too,
      // so switching direction mid-fade continues smoothly from the current
      // blend instead of snapping.
      const mixTarget = typingRef.current ? 1 : 0;
      mixRef.current += (mixTarget - mixRef.current) * Math.min(1, COMET_ACCEL * dt);
      const mix = mixRef.current;

      if (cometElRef.current) {
        cometElRef.current.style.strokeDashoffset = String(offsetRef.current);
        cometElRef.current.style.opacity = String(mix);
      }
      if (pulseGroupRef.current) {
        pulseGroupRef.current.style.opacity = String(1 - mix);
      }

      // Settled into pure pulse state: stop the loop until typing resumes.
      if (!typingRef.current && velRef.current < 1 && mix < 0.01) {
        velRef.current = 0;
        mixRef.current = 0;
        if (cometElRef.current) cometElRef.current.style.opacity = '0';
        if (pulseGroupRef.current) pulseGroupRef.current.style.opacity = '1';
        stopLoop();
        return;
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
  };

  useEffect(() => {
    return () => {
      if (typingTimer.current) clearTimeout(typingTimer.current);
      stopLoop();
    };
  }, []);

  const handleKeyDown = () => {
    typingRef.current = true;
    if (phase !== 'focus') setPhase('focus');
    ensureLoop();
    if (typingTimer.current) clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => {
      typingRef.current = false;
      ensureLoop();
    }, 500);
  };

  const active = phase !== 'idle' && size.w > 0 && size.h > 0;
  const w = size.w + GLOW_INSET * 2;
  const h = size.h + GLOW_INSET * 2;
  const rectW = Math.max(0, w - 2);
  const rectH = Math.max(0, h - 2);
  const perimeter = 2 * (rectW + rectH - 2 * GLOW_RADIUS) + 2 * Math.PI * GLOW_RADIUS;
  const dash = Math.max(24, perimeter * 0.18);

  return (
    <div
      ref={wrapRef}
      className="ig-glow-wrap relative flex-1 min-w-0"
      style={{ ['--glow-c' as string]: color }}
      onFocus={() => {
        focusedRef.current = true;
        if (phase === 'idle') setPhase('focus');
      }}
      onBlur={() => {
        focusedRef.current = false;
        typingRef.current = false;
        if (typingTimer.current) clearTimeout(typingTimer.current);
        stopLoop();
        velRef.current = 0;
        mixRef.current = 0;
        setPhase('idle');
      }}
      onKeyDown={handleKeyDown}
    >
      {active && (
        <svg
          className="pointer-events-none absolute z-10"
          style={{
            top: -GLOW_INSET,
            left: -GLOW_INSET,
            width: w,
            height: h,
            filter: 'drop-shadow(0 0 5px var(--glow-c))',
          }}
          width={w}
          height={h}
          viewBox={`0 0 ${w} ${h}`}
          fill="none"
        >
          {phase === 'focus' && (
            <>
              <g ref={pulseGroupRef} style={{ opacity: 1 }}>
                <rect
                  className="ig-svg-pulse"
                  x={1}
                  y={1}
                  width={rectW}
                  height={rectH}
                  rx={GLOW_RADIUS}
                  ry={GLOW_RADIUS}
                  stroke="var(--glow-c)"
                  strokeWidth={2}
                  fill="none"
                />
              </g>
              <rect
                ref={cometElRef}
                x={1}
                y={1}
                width={rectW}
                height={rectH}
                rx={GLOW_RADIUS}
                ry={GLOW_RADIUS}
                stroke="var(--glow-c)"
                strokeWidth={2}
                strokeLinecap="round"
                style={{ strokeDasharray: `${dash} ${perimeter}`, opacity: 0 }}
              />
            </>
          )}
        </svg>
      )}
      {children}
    </div>
  );
}

