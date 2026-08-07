'use client';

import { useEffect, useRef, useState } from 'react';

interface DurationEditorProps {
  value: string;
  onChange: (value: string) => void;
}

interface Seg {
  d: number;
  h: number;
  m: number;
  s: number;
}

function parseDuration(value: string): Seg {
  const parts = String(value || '').split(':').map((p) => parseInt(p, 10) || 0);
  // Normalize any of: ss | mm:ss | hh:mm:ss | dd:hh:mm:ss
  let d = 0, h = 0, m = 0, s = 0;
  if (parts.length === 4) { d = parts[0]; h = parts[1]; m = parts[2]; s = parts[3]; }
  else if (parts.length === 3) { h = parts[0]; m = parts[1]; s = parts[2]; }
  else if (parts.length === 2) { m = parts[0]; s = parts[1]; }
  else if (parts.length === 1) { s = parts[0]; }
  return { d, h, m, s };
}

const pad = (n: number) => Math.max(0, Math.min(9999, n || 0)).toString().padStart(2, '0');

interface SegmentProps {
  value: number;
  min: number;
  max: number;
  label: string;
  onChange: (n: number) => void;
}

function DurationSegment({ value, min, max, label, onChange }: SegmentProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const clamp = (n: number) => Math.max(0, Math.min(max, n));

  return (
    <div ref={containerRef} className="relative">
      <input
        type="text"
        inputMode="numeric"
        value={value === 0 ? '' : String(value)}
        placeholder="00"
        onChange={(e) => {
          const digits = e.target.value.replace(/[^0-9]/g, '');
          onChange(clamp(digits === '' ? 0 : parseInt(digits, 10)));
        }}
        onFocus={() => setOpen(true)}
        className="w-12 h-9 rounded-lg border bg-background px-1 text-sm text-center font-mono focus:outline-none focus:ring-2 focus:ring-primary/50 placeholder:text-muted-foreground/40"
        aria-label={label}
      />

      {open && (
        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 z-50 flex flex-col items-center gap-1 rounded-lg border bg-popover shadow-xl p-2 min-w-[56px]">
          <span className="text-base font-bold font-mono text-primary leading-none">
            {value || '00'}
          </span>
          <div className="relative h-40 w-8">
            <input
              type="range"
              min={min}
              max={max}
              step={1}
              value={clamp(value || min)}
              onChange={(e) => onChange(clamp(parseInt(e.target.value, 10)))}
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-2 w-40 -rotate-90 accent-[var(--primary)] cursor-pointer"
              aria-label={`Ajustar ${label}`}
            />
          </div>
          <span className="text-[10px] text-muted-foreground capitalize">{label}</span>
        </div>
      )}
    </div>
  );
}

export function DurationEditor({ value, onChange }: DurationEditorProps) {
  const seg = parseDuration(value);

  const commit = (next: Seg) => {
    onChange(`${pad(next.d)}:${pad(next.h)}:${pad(next.m)}:${pad(next.s)}`);
  };

  return (
    <div className="flex items-center gap-0.5">
      <DurationSegment
        value={seg.d}
        min={1}
        max={999}
        label="dias"
        onChange={(n) => commit({ ...seg, d: n })}
      />
      <span className="text-muted-foreground text-sm select-none">:</span>
      <DurationSegment
        value={seg.h}
        min={1}
        max={99}
        label="horas"
        onChange={(n) => commit({ ...seg, h: n })}
      />
      <span className="text-muted-foreground text-sm select-none">:</span>
      <DurationSegment
        value={seg.m}
        min={1}
        max={59}
        label="minutos"
        onChange={(n) => commit({ ...seg, m: n })}
      />
      <span className="text-muted-foreground text-sm select-none">:</span>
      <DurationSegment
        value={seg.s}
        min={1}
        max={59}
        label="segundos"
        onChange={(n) => commit({ ...seg, s: n })}
      />
    </div>
  );
}