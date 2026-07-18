'use client';

import { useState, useRef, useEffect } from 'react';
import { Palette, ImageOff } from 'lucide-react';
import { IconPicker } from './icon-picker';
import { IconRenderer } from './icon-renderer';
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
}

export function LabelIconBox({ icon, onChange, className }: LabelIconBoxProps) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          'flex items-center justify-center border transition-all hover:scale-105 shrink-0',
          icon ? 'border-transparent' : 'border-dashed border-muted-foreground/40 hover:border-foreground',
          className,
        )}
        title={icon ? `Ícone: ${icon}` : 'Definir ícone'}
      >
        {icon ? (
          <IconRenderer icon={icon} size="sm" />
        ) : (
          <ImageOff className="h-3 w-3 text-muted-foreground" />
        )}
      </button>
      {open && (
        <IconPicker
          value={icon?.includes(':') ? icon.split(':')[0] : icon}
          onChange={(iconId) => {
            onChange(iconId || undefined);
            setOpen(false);
          }}
          onClose={() => setOpen(false)}
        />
      )}
    </>
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
}

export function ValueColorLine({ color, onChange }: ValueColorLineProps) {
  return (
    <div className="flex flex-col items-center gap-1 pt-1.5">
      <span
        className="block w-[3px] rounded-full shrink-0"
        style={{ backgroundColor: color || 'transparent', minHeight: '18px' }}
        title={color ? `Cor do valor: ${color}` : 'Cor do valor'}
      />
      <ColorSwatch
        color={color}
        onChange={onChange}
        className="h-3.5 w-3.5 rounded"
        title={color ? `Cor do valor: ${color}` : 'Cor do valor'}
      />
    </div>
  );
}

type GlowPhase = 'idle' | 'typing' | 'focus';

interface InputGlowProps {
  color: string;
  children: React.ReactNode;
}

const GLOW_RADIUS = 8;
const GLOW_INSET = 1.5;

export function InputGlow({ color, children }: InputGlowProps) {
  const [phase, setPhase] = useState<GlowPhase>('idle');
  const [size, setSize] = useState<{ w: number; h: number }>({ w: 0, h: 0 });
  const wrapRef = useRef<HTMLDivElement>(null);
  const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  useEffect(() => {
    return () => {
      if (typingTimer.current) clearTimeout(typingTimer.current);
    };
  }, []);

  const handleKeyDown = () => {
    setPhase('typing');
    if (typingTimer.current) clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => setPhase('focus'), 600);
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
      className="relative flex-1 min-w-0"
      style={{ ['--glow-c' as string]: color }}
      onFocus={() => {
        if (phase !== 'typing') setPhase('focus');
      }}
      onBlur={() => {
        if (typingTimer.current) clearTimeout(typingTimer.current);
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
          <rect
            className={
              phase === 'typing'
                ? 'ig-svg-comet'
                : phase === 'focus'
                  ? 'ig-svg-comet ig-svg-paused'
                  : ''
            }
            x={1}
            y={1}
            width={rectW}
            height={rectH}
            rx={GLOW_RADIUS}
            ry={GLOW_RADIUS}
            stroke="var(--glow-c)"
            strokeWidth={2}
            strokeLinecap="round"
            style={{
              strokeDasharray: `${dash} ${perimeter}`,
              ['--ig-perim' as string]: `${dash + perimeter}`,
            }}
          />
          {phase === 'focus' && (
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
          )}
        </svg>
      )}
      {children}
    </div>
  );
}

