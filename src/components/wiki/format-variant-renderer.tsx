'use client';

import Image from 'next/image';
import {
  Star, Heart, ExternalLink, Clock, Download, Play,
  FileIcon, Video, Music, CalendarIcon, List,
} from 'lucide-react';
import { IconRenderer } from '@/components/ui/icon-renderer';
import type { DisplayFormat } from '@/lib/column-types/format-compatibility';
import { ensureDetectorsRegistered, findBestDetector } from '@/lib/jsonb-detectors';
import { normalizeOperatorText, normalizeValue, humanizeLabel } from '@/lib/operator-symbols';
import { formatNumber } from '@/lib/format-number';

type Props = {
  format: DisplayFormat;
  variant: number;
  value: unknown;
  label: string;
  useSuffix?: boolean;
  opEnabled?: boolean;
  labelColor?: string;
  valueColors?: Record<string, string>;
  jsonbKeyColors?: Record<string, string>;
};

function v(n: number) { return Math.max(1, Math.min(5, n)); }

function Row({ label, children, className = '', labelColor }: { label: string; children: React.ReactNode; className?: string; labelColor?: string }) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <span className="text-xs font-medium min-w-[100px] shrink-0" style={labelColor ? { color: labelColor } : {}}>{label}</span>
      {children}
    </div>
  );
}

function ColWrap({ label, children, labelColor }: { label: string; children: React.ReactNode; labelColor?: string }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs font-medium text-muted-foreground min-w-[100px]" style={labelColor ? { color: labelColor } : {}}>{label}</span>
      {children}
    </div>
  );
}

// ── text ──────────────────────────────────────────────────
function renderText(v: number, str: string, label: string, labelColor?: string, valueColors?: Record<string, string>) {
  const color = valueColors?.[str];
  const valStyle: React.CSSProperties = color ? { color } : {};
  if (v === 2) {
    return (
      <Row label={label} labelColor={labelColor}>
        <code className="text-xs bg-muted rounded px-1.5 py-0.5 font-mono text-foreground" style={valStyle}>{str}</code>
      </Row>
    );
  }
  if (v === 3) {
    return (
      <Row label={label} labelColor={labelColor}>
        <span className="text-xs bg-muted/70 rounded px-1.5 py-0.5 text-foreground" style={valStyle}>{str}</span>
      </Row>
    );
  }
  if (v === 4) {
    return (
      <Row label={label} labelColor={labelColor}>
        <span className="text-xs border-l-2 border-primary pl-2 text-foreground" style={valStyle}>{str}</span>
      </Row>
    );
  }
  if (v === 5) {
    return (
      <Row label={label} labelColor={labelColor}>
        <span className="text-xs font-semibold text-foreground" style={valStyle}>{str}</span>
      </Row>
    );
  }
  return (
    <Row label={label} labelColor={labelColor}>
      <span className="text-xs text-foreground" style={valStyle}>{str}</span>
    </Row>
  );
}

// ── badge ─────────────────────────────────────────────────
function renderBadge(v: number, str: string, label: string, labelColor?: string, valueColors?: Record<string, string>) {
  const color = valueColors?.[str];
  const valStyle: React.CSSProperties = color ? { color, borderColor: color, backgroundColor: `${color}1a` } : {};
  if (v === 2) {
    return (
      <Row label={label} labelColor={labelColor}>
        <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium bg-primary/20 text-primary" style={valStyle}>{str}</span>
      </Row>
    );
  }
  if (v === 3) {
    return (
      <Row label={label} labelColor={labelColor}>
        <span className="inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-medium bg-muted/30 border-border text-foreground" style={valStyle}>{str}</span>
      </Row>
    );
  }
  if (v === 4) {
    return (
      <Row label={label} labelColor={labelColor}>
        <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium border border-primary/40 text-primary shadow-[0_0_8px] shadow-primary/30" style={valStyle}>{str}</span>
      </Row>
    );
  }
  if (v === 5) {
    return (
      <Row label={label} labelColor={labelColor}>
        <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium bg-primary/10 border border-primary/30 text-primary" style={valStyle}>
          <span className="text-[10px]">✦</span>
          {str}
        </span>
      </Row>
    );
  }
  return (
    <Row label={label} labelColor={labelColor}>
      <span className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium bg-primary/10 border-primary/30 text-primary" style={valStyle}>{str}</span>
    </Row>
  );
}

// ── color ─────────────────────────────────────────────────
function renderColor(v: number, str: string, label: string, labelColor?: string) {
  const isColor = str.startsWith('#') || str.startsWith('hsl') || str.startsWith('rgb');
  if (v === 2) {
    return (
      <Row label={label} labelColor={labelColor}>
        <div className="h-5 w-5 rounded-md border" style={{ backgroundColor: str }} />
        {isColor && <span className="text-xs font-mono text-muted-foreground">{str}</span>}
      </Row>
    );
  }
  if (v === 3) {
    return (
      <Row label={label} labelColor={labelColor}>
        <div className="flex-1 h-5 rounded border max-w-[120px]" style={{ backgroundColor: str }} />
        {isColor && <span className="text-xs font-mono text-muted-foreground">{str}</span>}
      </Row>
    );
  }
  if (v === 4) {
    return (
      <Row label={label} labelColor={labelColor}>
        <div className="h-2.5 w-2.5 rounded-full border" style={{ backgroundColor: str }} />
        <span className="text-xs font-mono text-muted-foreground">{str}</span>
      </Row>
    );
  }
  if (v === 5) {
    const colors = str.split(',').map(s => s.trim()).filter(Boolean);
    if (colors.length > 1) {
      const gradient = `linear-gradient(90deg, ${colors.join(', ')})`;
      return (
        <Row label={label} labelColor={labelColor}>
          <div className="h-5 w-24 rounded border" style={{ background: gradient }} />
          <span className="text-[10px] font-mono text-muted-foreground">{colors.length} cores</span>
        </Row>
      );
    }
  }
  return (
    <Row label={label} labelColor={labelColor}>
      <div className="h-5 w-5 rounded-full border" style={{ backgroundColor: str }} />
      {isColor && <span className="text-xs font-mono text-muted-foreground">{str}</span>}
    </Row>
  );
}

// ── icon ──────────────────────────────────────────────────
function renderIcon(v: number, str: string, label: string, labelColor?: string) {
  if (v === 2) {
    return (
      <Row label={label} labelColor={labelColor}>
        <div className="flex items-center justify-center h-7 w-7 rounded-full bg-muted/50">
          <IconRenderer icon={str} size="sm" />
        </div>
      </Row>
    );
  }
  if (v === 3) {
    return (
      <Row label={label} labelColor={labelColor}>
        <IconRenderer icon={str} size="lg" />
      </Row>
    );
  }
  if (v === 4) {
    return (
      <Row label={label} labelColor={labelColor}>
        <IconRenderer icon={str} size="sm" />
        <span className="text-xs text-muted-foreground">{str}</span>
      </Row>
    );
  }
  if (v === 5) {
    return (
      <Row label={label} labelColor={labelColor}>
        <div className="flex items-center justify-center h-8 w-8 rounded-lg border bg-muted/20">
          <IconRenderer icon={str} size="md" />
        </div>
      </Row>
    );
  }
  return (
    <Row label={label} labelColor={labelColor}>
      <IconRenderer icon={str} size="md" />
    </Row>
  );
}

// ── link ──────────────────────────────────────────────────
function renderLink(v: number, str: string, label: string, labelColor?: string) {
  const isValid = str.startsWith('http://') || str.startsWith('https://');
  const content = isValid ? (
    <a href={str} target="_blank" rel="noopener noreferrer" className="text-xs truncate max-w-[300px]">{str}</a>
  ) : (
    <span className="text-xs text-muted-foreground">{str}</span>
  );

  if (v === 2) {
    return (
      <Row label={label} labelColor={labelColor}>
        {isValid ? (
          <a href={str} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-medium text-primary border-primary/30 hover:bg-primary/5 transition-colors">
            {str.replace(/^https?:\/\//, '').replace(/\/$/, '').slice(0, 40)}
          </a>
        ) : content}
      </Row>
    );
  }
  if (v === 3) {
    return (
      <Row label={label} labelColor={labelColor}>
        {isValid ? (
          <a href={str} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline inline-flex items-center gap-1 truncate max-w-[300px]">
            {str}
            <ExternalLink className="h-3 w-3 shrink-0" />
          </a>
        ) : content}
      </Row>
    );
  }
  if (v === 4) {
    return (
      <Row label={label} labelColor={labelColor}>
        {isValid ? (
          <div className="rounded-md border bg-muted/20 px-3 py-1.5 max-w-[300px]">
            <p className="text-[10px] text-muted-foreground truncate">{str.replace(/^https?:\/\//, '').replace(/\/$/, '')}</p>
            <a href={str} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline">Abrir link</a>
          </div>
        ) : content}
      </Row>
    );
  }
  if (v === 5) {
    return (
      <Row label={label} labelColor={labelColor}>
        {isValid ? (
          <a href={str} target="_blank" rel="noopener noreferrer" className="text-xs text-primary no-underline hover:text-primary/80 transition-colors truncate max-w-[300px]">{str}</a>
        ) : content}
      </Row>
    );
  }
  return (
    <Row label={label} labelColor={labelColor}>
      {isValid ? (
        <a href={str} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline truncate max-w-[300px]">{str}</a>
      ) : (
        <span className="text-xs text-muted-foreground">{str}</span>
      )}
    </Row>
  );
}

// ── image ─────────────────────────────────────────────────
function renderImage(v: number, str: string, label: string, labelColor?: string) {
  const isValid = str.startsWith('http://') || str.startsWith('https://') || str.startsWith('data:');

  if (v === 2) {
    return (
      <Row label={label} labelColor={labelColor} className="items-start">
        {isValid ? (
          <div className="relative w-14 h-14 rounded-full overflow-hidden border shrink-0">
            <Image src={str} alt={label} fill className="object-cover" />
          </div>
        ) : (
          <span className="text-xs text-muted-foreground">{str}</span>
        )}
      </Row>
    );
  }
  if (v === 3) {
    return (
      <Row label={label} labelColor={labelColor} className="items-start">
        {isValid ? (
          <div className="relative w-20 h-20 rounded-lg overflow-hidden border shadow-lg">
            <Image src={str} alt={label} fill className="object-cover" />
          </div>
        ) : (
          <span className="text-xs text-muted-foreground">{str}</span>
        )}
      </Row>
    );
  }
  if (v === 4) {
    return (
      <Row label={label} labelColor={labelColor} className="items-start">
        {isValid ? (
          <div className="relative w-20 h-20 rounded overflow-hidden border bg-white p-1 shadow-md">
            <div className="relative w-full h-full">
              <Image src={str} alt={label} fill className="object-cover" />
            </div>
          </div>
        ) : (
          <span className="text-xs text-muted-foreground">{str}</span>
        )}
      </Row>
    );
  }
  if (v === 5) {
    return (
      <ColWrap label={label} labelColor={labelColor}>
        {isValid ? (
          <div className="relative w-full h-32 rounded-lg overflow-hidden border">
            <Image src={str} alt={label} fill className="object-cover" />
          </div>
        ) : (
          <span className="text-xs text-muted-foreground">{str}</span>
        )}
      </ColWrap>
    );
  }
  return (
    <Row label={label} labelColor={labelColor} className="items-start">
      {isValid ? (
        <div className="relative w-20 h-20 rounded-lg overflow-hidden border">
          <Image src={str} alt={label} fill className="object-cover" />
        </div>
      ) : (
        <span className="text-xs text-muted-foreground">{str}</span>
      )}
    </Row>
  );
}

// ── rating ────────────────────────────────────────────────
function renderRating(v: number, val: unknown, label: string, labelColor?: string, opEnabled?: boolean) {
  const num = Number(val);
  const stars = isNaN(num) ? 0 : Math.round(Math.min(5, Math.max(0, num)));
  const fraction = !isNaN(num) && opEnabled ? `${num}/5` : '';

  if (v === 2) {
    return (
      <Row label={label} labelColor={labelColor}>
        <div className="flex gap-0.5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Heart key={i} className={`h-3.5 w-3.5 ${i < stars ? 'text-red-400 fill-red-400' : 'text-muted-foreground/30'}`} />
          ))}
          {fraction && <span className="text-[10px] text-muted-foreground ml-1">{fraction}</span>}
          {!fraction && isNaN(num) && <span className="text-xs text-muted-foreground ml-1">{String(val)}</span>}
        </div>
      </Row>
    );
  }
  if (v === 3) {
    return (
      <Row label={label} labelColor={labelColor}>
        <span className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium bg-amber-500/10 border-amber-500/30 text-amber-400">
          {isNaN(num) ? String(val) : `${num}/5`}
        </span>
      </Row>
    );
  }
  if (v === 4) {
    const pct = isNaN(num) ? 0 : Math.min(100, Math.max(0, (num / 5) * 100));
    return (
      <Row label={label} labelColor={labelColor}>
        <div className="flex items-center gap-2">
          <div className="w-20 h-2 rounded-full bg-muted overflow-hidden">
            <div className="h-full rounded-full bg-amber-400 transition-all" style={{ width: `${pct}%` }} />
          </div>
          <span className="text-xs font-mono text-muted-foreground">{isNaN(num) ? String(val) : `${num}/5`}</span>
        </div>
      </Row>
    );
  }
  if (v === 5) {
    return (
      <ColWrap label={label} labelColor={labelColor}>
        <div className="flex items-baseline gap-0.5">
          <span className="text-3xl font-bold text-amber-400">{isNaN(num) ? '?' : num}</span>
          <span className="text-sm text-muted-foreground">/5</span>
        </div>
      </ColWrap>
    );
  }
  return (
    <Row label={label} labelColor={labelColor}>
      <div className="flex gap-0.5 items-center">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star key={i} className={`h-3.5 w-3.5 ${i < stars ? 'text-yellow-400 fill-yellow-400' : 'text-muted-foreground/30'}`} />
        ))}
        {fraction && <span className="text-[10px] text-muted-foreground ml-1">{fraction}</span>}
        {!fraction && isNaN(num) && <span className="text-xs text-muted-foreground ml-1">{String(val)}</span>}
      </div>
    </Row>
  );
}

// ── progress ──────────────────────────────────────────────
function renderProgress(v: number, val: unknown, label: string, labelColor?: string) {
  const num = Number(val);
  const pct = isNaN(num) ? 0 : Math.min(100, Math.max(0, num));

  if (v === 2) {
    return (
      <Row label={label} labelColor={labelColor}>
        <div className="flex-1 flex items-center gap-2 max-w-[200px]">
          <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
            <div className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${pct}%`, backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 3px, rgba(255,255,255,0.15) 3px, rgba(255,255,255,0.15) 6px)' }}
            />
          </div>
          <span className="text-xs font-mono text-muted-foreground">{isNaN(num) ? String(val) : `${pct}%`}</span>
        </div>
      </Row>
    );
  }
  if (v === 3) {
    return (
      <Row label={label} labelColor={labelColor}>
        <div className="flex-1 flex items-center gap-2 max-w-[200px]">
          <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
            <div className="h-full rounded-full transition-all bg-gradient-to-r from-primary to-primary/60"
              style={{ width: `${pct}%` }}
            />
          </div>
          <span className="text-xs font-mono text-muted-foreground">{isNaN(num) ? String(val) : `${pct}%`}</span>
        </div>
      </Row>
    );
  }
  if (v === 4) {
    const segments = 5;
    const filled = Math.round((pct / 100) * segments);
    return (
      <Row label={label} labelColor={labelColor}>
        <div className="flex gap-0.5 items-center">
          {Array.from({ length: segments }).map((_, i) => (
            <div key={i} className={`h-4 w-3 rounded-sm transition-colors ${i < filled ? 'bg-primary' : 'bg-muted'}`} />
          ))}
          <span className="text-xs font-mono text-muted-foreground ml-1">{isNaN(num) ? String(val) : `${pct}%`}</span>
        </div>
      </Row>
    );
  }
  if (v === 5) {
    const r = 14;
    const circumference = 2 * Math.PI * r;
    const offset = circumference - (pct / 100) * circumference;
    return (
      <Row label={label} labelColor={labelColor}>
        <div className="relative h-10 w-10">
          <svg className="h-10 w-10 -rotate-90" viewBox="0 0 32 32">
            <circle cx="16" cy="16" r={r} fill="none" stroke="hsl(var(--muted))" strokeWidth="3" />
            <circle cx="16" cy="16" r={r} fill="none" stroke="hsl(var(--primary))" strokeWidth="3"
              strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center text-[9px] font-bold text-foreground">
            {isNaN(num) ? '?' : `${Math.round(pct)}%`}
          </span>
        </div>
      </Row>
    );
  }
  return (
    <Row label={label} labelColor={labelColor}>
      <div className="flex-1 flex items-center gap-2">
        <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden max-w-[200px]">
          <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${pct}%` }} />
        </div>
        <span className="text-xs font-mono text-muted-foreground">{isNaN(num) ? String(val) : `${pct}%`}</span>
      </div>
    </Row>
  );
}

// ── tags ──────────────────────────────────────────────────
function renderTags(v: number, val: unknown, label: string, labelColor?: string) {
  const arr = Array.isArray(val) ? val : typeof val === 'string' ? val.split(',').map(s => s.trim()).filter(Boolean) : [];
  if (arr.length === 0) return null;

  if (v === 2) {
    return (
      <Row label={label} labelColor={labelColor} className="items-start">
        <div className="flex flex-wrap gap-1">
          {arr.map((t: string, i: number) => (
            <span key={i} className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-primary/15 text-primary">{t}</span>
          ))}
        </div>
      </Row>
    );
  }
  if (v === 3) {
    return (
      <Row label={label} labelColor={labelColor} className="items-start">
        <div className="flex flex-wrap gap-1">
          {arr.map((t: string, i: number) => (
            <span key={i} className="inline-flex items-center rounded-full border px-1.5 py-0.5 text-[10px] font-medium bg-muted/30 text-muted-foreground">{t}</span>
          ))}
        </div>
      </Row>
    );
  }
  if (v === 4) {
    return (
      <Row label={label} labelColor={labelColor} className="items-start">
        <div className="flex flex-wrap gap-1">
          {arr.map((t: string, i: number) => (
            <span key={i} className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium bg-muted/30 text-muted-foreground">
              <span className="text-[10px]">#</span>
              {t}
            </span>
          ))}
        </div>
      </Row>
    );
  }
  if (v === 5) {
    const colors = ['border-blue-500/30 text-blue-400 bg-blue-500/10', 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10', 'border-amber-500/30 text-amber-400 bg-amber-500/10', 'border-purple-500/30 text-purple-400 bg-purple-500/10', 'border-rose-500/30 text-rose-400 bg-rose-500/10'];
    return (
      <Row label={label} labelColor={labelColor} className="items-start">
        <div className="flex flex-wrap gap-1">
          {arr.map((t: string, i: number) => (
            <span key={i} className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${colors[i % colors.length]}`}>{t}</span>
          ))}
        </div>
      </Row>
    );
  }
  return (
    <Row label={label} labelColor={labelColor} className="items-start">
      <div className="flex flex-wrap gap-1">
        {arr.map((t: string, i: number) => (
          <span key={i} className="inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium bg-muted/50 text-muted-foreground">{t}</span>
        ))}
      </div>
    </Row>
  );
}

// ── boolean ───────────────────────────────────────────────
function renderBoolean(v: number, val: unknown, label: string, labelColor?: string) {
  const truthy = val === true || val === 'true' || val === 1 || val === '1' || val === 'yes' || val === 'sim';
  const falsy = val === false || val === 'false' || val === 0 || val === '0' || val === 'no' || val === 'não' || val === 'nao';

  if (v === 2) {
    return (
      <Row label={label} labelColor={labelColor}>
        <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium ${truthy
          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
          : falsy
            ? 'bg-red-500/10 border-red-500/30 text-red-400'
            : 'bg-muted/30 border-border text-muted-foreground'
        }`}>
          {truthy ? 'ON' : falsy ? 'OFF' : String(val)}
        </span>
      </Row>
    );
  }
  if (v === 3) {
    return (
      <Row label={label} labelColor={labelColor}>
        <div className={`h-3 w-3 rounded-full ${truthy ? 'bg-emerald-500' : falsy ? 'bg-red-400' : 'bg-muted'}`} />
        <span className={`text-xs ${truthy ? 'text-emerald-500' : falsy ? 'text-red-400' : 'text-muted-foreground'}`}>
          {truthy ? 'Sim' : falsy ? 'Não' : String(val)}
        </span>
      </Row>
    );
  }
  if (v === 4) {
    return (
      <Row label={label} labelColor={labelColor}>
        <div className={`relative h-4 w-8 rounded-full transition-colors ${truthy ? 'bg-emerald-500' : 'bg-muted'}`}>
          <div className={`absolute top-0.5 h-3 w-3 rounded-full bg-white shadow-sm transition-transform ${truthy ? 'translate-x-[18px]' : 'translate-x-0.5'}`} />
        </div>
        <span className="text-xs text-muted-foreground">{truthy ? 'ON' : falsy ? 'OFF' : String(val)}</span>
      </Row>
    );
  }
  if (v === 5) {
    return (
      <Row label={label} labelColor={labelColor}>
        <span className="text-sm leading-none">
          {truthy ? '✅' : falsy ? '❌' : String(val)}
        </span>
      </Row>
    );
  }
  return (
    <Row label={label} labelColor={labelColor}>
      <span className={`text-sm ${truthy ? 'text-emerald-500' : falsy ? 'text-red-400' : 'text-muted-foreground'}`}>
        {truthy ? '✓' : falsy ? '✗' : String(val)}
      </span>
    </Row>
  );
}

// ── date ──────────────────────────────────────────────────
function renderDate(v: number, val: unknown, label: string, labelColor?: string) {
  const d = new Date(val as string);
  const valid = !isNaN(d.getTime());

  if (v === 2) {
    return (
      <Row label={label} labelColor={labelColor}>
        <span className="text-xs text-foreground">
          {valid ? d.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short', year: 'numeric' }) : String(val)}
        </span>
      </Row>
    );
  }
  if (v === 3) {
    if (!valid) {
      return <Row label={label} labelColor={labelColor}><span className="text-xs text-muted-foreground">{String(val)}</span></Row>;
    }
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffDays = Math.floor(diffMs / 86400000);
    const relative = diffDays < 1 ? 'hoje' : diffDays === 1 ? 'ontem' : diffDays < 7 ? `há ${diffDays} dias` : diffDays < 30 ? `há ${Math.floor(diffDays / 7)} semanas` : diffDays < 365 ? `há ${Math.floor(diffDays / 30)} meses` : `há ${Math.floor(diffDays / 365)} anos`;
    return (
      <Row label={label} labelColor={labelColor}>
        <span className="text-xs text-foreground">{relative}</span>
        <span className="text-[10px] text-muted-foreground">({d.toLocaleDateString('pt-BR')})</span>
      </Row>
    );
  }
  if (v === 4) {
    return (
      <Row label={label} labelColor={labelColor}>
        <CalendarIcon className="h-3.5 w-3.5 text-muted-foreground" />
        <span className="text-xs text-foreground">
          {valid ? d.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' }) : String(val)}
        </span>
      </Row>
    );
  }
  if (v === 5) {
    return (
      <Row label={label} labelColor={labelColor}>
        <span className="text-xs font-mono text-foreground">
          {valid ? d.toLocaleDateString('pt-BR') : String(val)}
        </span>
      </Row>
    );
  }
  return (
    <Row label={label} labelColor={labelColor}>
      <span className="text-xs text-foreground">
        {valid ? d.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' }) : String(val)}
      </span>
    </Row>
  );
}

// ── duration ──────────────────────────────────────────────
function renderDuration(v: number, val: unknown, label: string, labelColor?: string) {
  const str = String(val ?? '');
  let display = str;
  if (/^\d+:\d{2}(:\d{2})?$/.test(str)) {
    const parts = str.split(':').map(Number);
    if (parts.length === 3) display = `${parts[0]}h ${parts[1]}m${parts[2] > 0 ? ` ${parts[2]}s` : ''}`;
    else if (parts.length === 2) display = `${parts[0]}m ${parts[1]}s`;
  }

  if (v === 2) {
    return (
      <Row label={label} labelColor={labelColor}>
        <Clock className="h-3.5 w-3.5 text-muted-foreground" />
        <span className="text-xs text-foreground">{display}</span>
      </Row>
    );
  }
  if (v === 3) {
    const num = parseInt(str, 10);
    const color = isNaN(num) ? 'text-muted-foreground' : num > 3600 ? 'text-red-400' : num > 600 ? 'text-amber-400' : 'text-emerald-400';
    return (
      <Row label={label} labelColor={labelColor}>
        <span className={`text-xs font-medium ${color}`}>{display}</span>
      </Row>
    );
  }
  if (v === 4) {
    return (
      <Row label={label} labelColor={labelColor}>
        <span className="text-xs font-mono text-foreground">{str}</span>
      </Row>
    );
  }
  if (v === 5) {
    return (
      <Row label={label} labelColor={labelColor}>
        <span className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium bg-muted/30 text-muted-foreground">{display}</span>
      </Row>
    );
  }
  return (
    <Row label={label} labelColor={labelColor}>
      <span className="text-xs text-foreground">{display}</span>
    </Row>
  );
}

// ── file ──────────────────────────────────────────────────
function renderFile(v: number, str: string, label: string, labelColor?: string) {
  const isValid = str.startsWith('http://') || str.startsWith('https://');
  const filename = str.split('/').pop() || str;

  if (v === 2) {
    return (
      <Row label={label} labelColor={labelColor}>
        {isValid ? (
          <a href={str} target="_blank" rel="noopener noreferrer" download
            className="inline-flex items-center gap-1 rounded-md border border-primary/30 px-2.5 py-1 text-xs font-medium text-primary hover:bg-primary/5 transition-colors"
          >
            <Download className="h-3 w-3" />
            {filename}
          </a>
        ) : (
          <span className="text-xs text-muted-foreground">{str}</span>
        )}
      </Row>
    );
  }
  if (v === 3) {
    return (
      <Row label={label} labelColor={labelColor}>
        {isValid ? (
          <div className="rounded-md border bg-muted/20 px-3 py-1.5 max-w-[250px]">
            <div className="flex items-center gap-2">
              <FileIcon className="h-4 w-4 text-primary shrink-0" />
              <div className="min-w-0">
                <p className="text-xs font-medium text-foreground truncate">{filename}</p>
                <a href={str} target="_blank" rel="noopener noreferrer" className="text-[10px] text-primary hover:underline" download>Download</a>
              </div>
            </div>
          </div>
        ) : (
          <span className="text-xs text-muted-foreground">{str}</span>
        )}
      </Row>
    );
  }
  if (v === 4) {
    return (
      <Row label={label} labelColor={labelColor}>
        {isValid ? (
          <a href={str} target="_blank" rel="noopener noreferrer" download className="text-primary hover:text-primary/80 transition-colors">
            <FileIcon className="h-5 w-5" />
          </a>
        ) : (
          <span className="text-xs text-muted-foreground">{str}</span>
        )}
      </Row>
    );
  }
  if (v === 5) {
    return (
      <Row label={label} labelColor={labelColor}>
        <span className="text-xs font-mono text-muted-foreground truncate max-w-[300px]">{str}</span>
      </Row>
    );
  }
  return (
    <Row label={label} labelColor={labelColor}>
      {isValid ? (
        <a href={str} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline truncate max-w-[300px] flex items-center gap-1" download>
          <FileIcon className="h-3 w-3" />
          {filename}
        </a>
      ) : (
        <span className="text-xs text-muted-foreground">{str}</span>
      )}
    </Row>
  );
}

// ── video ─────────────────────────────────────────────────
function renderVideo(v: number, str: string, label: string, labelColor?: string) {
  const isValid = str.startsWith('http://') || str.startsWith('https://');

  if (v === 2) {
    return (
      <ColWrap label={label} labelColor={labelColor}>
        {isValid ? (
          <div className="relative aspect-video rounded-lg overflow-hidden border bg-black/50 max-w-md group cursor-pointer">
            <video src={str} className="w-full h-full" preload="metadata" />
            <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity">
              <Play className="h-8 w-8 text-white fill-white" />
            </div>
          </div>
        ) : (
          <span className="text-xs text-muted-foreground">{str}</span>
        )}
      </ColWrap>
    );
  }
  if (v === 3) {
    return (
      <Row label={label} labelColor={labelColor}>
        {isValid ? (
          <a href={str} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline">
            <Video className="h-3.5 w-3.5" />
            {str.replace(/^https?:\/\//, '').slice(0, 50)}
          </a>
        ) : (
          <span className="text-xs text-muted-foreground">{str}</span>
        )}
      </Row>
    );
  }
  if (v === 4) {
    return (
      <Row label={label} labelColor={labelColor}>
        {isValid ? (
          <a href={str} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline truncate max-w-[300px]">
            {str.split('/').pop() || str}
          </a>
        ) : (
          <span className="text-xs text-muted-foreground">{str}</span>
        )}
      </Row>
    );
  }
  if (v === 5) {
    return (
      <ColWrap label={label} labelColor={labelColor}>
        {isValid ? (
          <div className="rounded-lg border bg-muted/20 p-3 max-w-md">
            <div className="flex items-center gap-2 mb-1">
              <Video className="h-4 w-4 text-primary" />
              <span className="text-xs font-medium text-foreground truncate">{str.split('/').pop() || str}</span>
            </div>
            <video src={str} controls className="w-full rounded" preload="metadata" />
          </div>
        ) : (
          <span className="text-xs text-muted-foreground">{str}</span>
        )}
      </ColWrap>
    );
  }
  return (
    <ColWrap label={label} labelColor={labelColor}>
      {isValid ? (
        <div className="relative aspect-video rounded-lg overflow-hidden border bg-black/50 max-w-md">
          <video src={str} controls className="w-full h-full" preload="metadata">
            <a href={str} target="_blank" rel="noopener noreferrer" className="text-xs text-primary">Abrir vídeo</a>
          </video>
        </div>
      ) : (
        <span className="text-xs text-muted-foreground">{str}</span>
      )}
    </ColWrap>
  );
}

// ── audio ─────────────────────────────────────────────────
function renderAudio(v: number, str: string, label: string, labelColor?: string) {
  const isValid = str.startsWith('http://') || str.startsWith('https://');

  if (v === 2) {
    return (
      <ColWrap label={label} labelColor={labelColor}>
        {isValid ? (
          <div className="rounded-lg border bg-muted/20 p-3 max-w-xs">
            <div className="flex items-center gap-2 mb-2">
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                <Play className="h-4 w-4 text-primary fill-primary" />
              </div>
              <span className="text-xs font-medium text-foreground truncate">{str.split('/').pop() || str}</span>
            </div>
            <audio src={str} controls className="h-7 w-full" preload="none" />
          </div>
        ) : (
          <span className="text-xs text-muted-foreground">{str}</span>
        )}
      </ColWrap>
    );
  }
  if (v === 3) {
    return (
      <Row label={label} labelColor={labelColor}>
        {isValid ? (
          <div className="flex items-center gap-2">
            <Music className="h-4 w-4 text-muted-foreground" />
            <div className="flex gap-0.5 items-end h-5">
              {[3, 5, 4, 6, 3, 7, 4, 5].map((h, i) => (
                <div key={i} className="w-1 bg-primary/40 rounded-full animate-pulse" style={{ height: `${h * 4}px`, animationDelay: `${i * 0.1}s` }} />
              ))}
            </div>
            <audio src={str} controls className="h-7 w-32" preload="none" />
          </div>
        ) : (
          <span className="text-xs text-muted-foreground">{str}</span>
        )}
      </Row>
    );
  }
  if (v === 4) {
    return (
      <Row label={label} labelColor={labelColor}>
        {isValid ? (
          <a href={str} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline">
            <Music className="h-3.5 w-3.5" />
            {str.split('/').pop() || str}
          </a>
        ) : (
          <span className="text-xs text-muted-foreground">{str}</span>
        )}
      </Row>
    );
  }
  if (v === 5) {
    return (
      <Row label={label} labelColor={labelColor}>
        {isValid ? (
          <audio src={str} controls className="h-6 max-w-[140px]" preload="none" />
        ) : (
          <span className="text-xs text-muted-foreground">{str}</span>
        )}
      </Row>
    );
  }
  return (
    <ColWrap label={label} labelColor={labelColor}>
      {isValid ? (
        <audio src={str} controls className="h-8 max-w-xs" preload="none">
          <a href={str} target="_blank" rel="noopener noreferrer" className="text-xs text-primary">Ouvir áudio</a>
        </audio>
      ) : (
        <span className="text-xs text-muted-foreground">{str}</span>
      )}
    </ColWrap>
  );
}

// ── emoji ─────────────────────────────────────────────────
function renderEmoji(v: number, str: string, label: string, labelColor?: string) {
  if (v === 2) {
    return (
      <Row label={label} labelColor={labelColor}>
        <span className="text-4xl leading-none">{str}</span>
      </Row>
    );
  }
  if (v === 3) {
    return (
      <Row label={label} labelColor={labelColor}>
        <div className="flex items-center justify-center h-10 w-10 rounded-full bg-muted/30">
          <span className="text-xl leading-none">{str}</span>
        </div>
      </Row>
    );
  }
  if (v === 4) {
    return (
      <Row label={label} labelColor={labelColor}>
        <div className="flex flex-col items-center gap-0.5">
          <span className="text-3xl leading-none">{str}</span>
          <span className="text-[10px] text-muted-foreground">{str}</span>
        </div>
      </Row>
    );
  }
  if (v === 5) {
    return (
      <Row label={label} labelColor={labelColor}>
        <span className="text-2xl leading-none animate-bounce inline-block">{str}</span>
      </Row>
    );
  }
  return (
    <Row label={label} labelColor={labelColor}>
      <span className="text-2xl leading-none">{str}</span>
    </Row>
  );
}

// ── icon-set ──────────────────────────────────────────────
function renderIconSet(v: number, val: unknown, label: string, labelColor?: string) {
  const arr = Array.isArray(val) ? val : typeof val === 'string' ? (() => { try { return JSON.parse(val); } catch { return [val]; } })() : [];
  if (!Array.isArray(arr)) return null;
  if (v === 2) {
    return (
      <Row label={label} labelColor={labelColor} className="items-start">
        <div className="flex flex-wrap gap-1">
          {arr.map((item: string, i: number) => (
            <div key={i} className="flex items-center justify-center h-6 w-6 rounded-md bg-muted/50"><IconRenderer icon={item} size={12} /></div>
          ))}
        </div>
      </Row>
    );
  }
  if (v === 3) {
    return (
      <Row label={label} labelColor={labelColor} className="items-start">
        <div className="flex flex-wrap gap-2">
          {arr.map((item: string, i: number) => (
            <div key={i} className="flex items-center gap-1.5 rounded-md border bg-muted/20 px-2 py-1 text-xs">
              <IconRenderer icon={item} size={12} />
              <span className="text-muted-foreground">{item}</span>
            </div>
          ))}
        </div>
      </Row>
    );
  }
  if (v === 4) {
    return (
      <Row label={label} labelColor={labelColor}>
        <div className="flex -space-x-1.5">
          {arr.slice(0, 5).map((item: string, i: number) => (
            <div key={i} className="flex items-center justify-center h-6 w-6 rounded-full border-2 border-background bg-muted/50"><IconRenderer icon={item} size={12} /></div>
          ))}
          {arr.length > 5 && <span className="flex items-center justify-center h-6 w-6 rounded-full border-2 border-background bg-muted text-[10px] font-medium text-muted-foreground">+{arr.length-5}</span>}
        </div>
      </Row>
    );
  }
  if (v === 5) {
    return (
      <Row label={label} labelColor={labelColor}>
        <div className="flex flex-wrap gap-1">
          {arr.map((item: string, i: number) => (
            <div key={i} className="flex items-center justify-center h-8 w-8 rounded-lg border bg-card"><IconRenderer icon={item} size="sm" /></div>
          ))}
        </div>
      </Row>
    );
  }
  return (
    <Row label={label} labelColor={labelColor} className="items-start">
      <div className="flex flex-wrap gap-1">
        {arr.map((item: string, i: number) => (
          <div key={i} className="flex items-center justify-center h-5 w-5 rounded bg-muted/30"><IconRenderer icon={item} size={12} /></div>
        ))}
      </div>
    </Row>
  );
}

// ── color-palette ─────────────────────────────────────────
function renderColorPalette(v: number, val: unknown, label: string, labelColor?: string) {
  const arr = Array.isArray(val) ? val : typeof val === 'string' ? (() => { try { return JSON.parse(val); } catch { return [val]; } })() : [];
  if (!Array.isArray(arr)) return null;
  if (v === 2) {
    return (
      <Row label={label} labelColor={labelColor} className="items-start">
        <div className="flex flex-wrap gap-1">
          {arr.map((color: string, i: number) => (
            <div key={i} className="h-4 w-8 rounded border" style={{ backgroundColor: color }} />
          ))}
        </div>
      </Row>
    );
  }
  if (v === 3) {
    return (
      <Row label={label} labelColor={labelColor}>
        <div className="flex rounded-lg overflow-hidden border h-5">
          {arr.map((color: string, i: number) => (
            <div key={i} className="flex-1" style={{ backgroundColor: color }} />
          ))}
        </div>
      </Row>
    );
  }
  if (v === 4) {
    return (
      <Row label={label} labelColor={labelColor} className="items-start">
        <div className="flex flex-wrap gap-1.5">
          {arr.map((color: string, i: number) => (
            <div key={i} className="flex items-center gap-1.5 rounded-md border bg-muted/20 px-2 py-0.5 text-xs">
              <div className="h-3 w-3 rounded-full border" style={{ backgroundColor: color }} />
              <span className="font-mono text-[10px] text-muted-foreground">{color}</span>
            </div>
          ))}
        </div>
      </Row>
    );
  }
  if (v === 5) {
    return (
      <Row label={label} labelColor={labelColor}>
        <div className="flex -space-x-1">
          {arr.slice(0, 6).map((color: string, i: number) => (
            <div key={i} className="h-5 w-5 rounded-full border-2 border-background" style={{ backgroundColor: color }} />
          ))}
          {arr.length > 6 && <span className="flex items-center justify-center h-5 w-5 rounded-full border-2 border-background bg-muted text-[9px] font-medium text-muted-foreground">+{arr.length-6}</span>}
        </div>
      </Row>
    );
  }
  return (
    <Row label={label} labelColor={labelColor} className="items-start">
      <div className="flex flex-wrap gap-1">
        {arr.map((color: string, i: number) => (
          <div key={i} className="h-4 w-4 rounded border" style={{ backgroundColor: color }} />
        ))}
      </div>
    </Row>
  );
}

// ── multi-select ──────────────────────────────────────────
function renderMultiSelect(v: number, val: unknown, label: string, labelColor?: string, valueColors?: Record<string, string>) {
  const arr = Array.isArray(val) ? val : typeof val === 'string' ? (() => { try { return JSON.parse(val); } catch { return [val]; } })() : [];
  if (!Array.isArray(arr)) return null;
  if (v === 2) {
    return (
      <Row label={label} labelColor={labelColor} className="items-start">
        <div className="flex flex-wrap gap-1">
          {arr.map((t: string, i: number) => (
            <span key={i} className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-primary/15 text-primary" style={valueColors?.[t] ? { color: valueColors[t] } : {}}>{t}</span>
          ))}
        </div>
      </Row>
    );
  }
  if (v === 3) {
    return (
      <Row label={label} labelColor={labelColor} className="items-start">
        <div className="flex flex-wrap gap-1">
          {arr.map((t: string, i: number) => (
            <span key={i} className="inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs bg-muted/30 text-foreground" style={valueColors?.[t] ? { color: valueColors[t] } : {}}>
              <List className="h-3 w-3 text-muted-foreground" />
              {t}
            </span>
          ))}
        </div>
      </Row>
    );
  }
  if (v === 4) {
    return (
      <Row label={label} labelColor={labelColor}>
        <div className="flex -space-x-1.5">
          {arr.slice(0, 4).map((t: string, i: number) => (
            <span key={i} className="inline-flex items-center rounded-full border bg-muted/50 px-2 py-0.5 text-[10px] font-medium text-muted-foreground" style={valueColors?.[t] ? { color: valueColors[t] } : {}}>{t}</span>
          ))}
          {arr.length > 4 && <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">+{arr.length-4}</span>}
        </div>
      </Row>
    );
  }
  if (v === 5) {
    return (
      <Row label={label} labelColor={labelColor}>
        <span className="text-xs text-muted-foreground">
          <span className="font-medium text-foreground">{arr.length}</span> selecionado{arr.length !== 1 ? 's' : ''}
        </span>
      </Row>
    );
  }
  return (
    <Row label={label} labelColor={labelColor} className="items-start">
      <div className="flex flex-wrap gap-1">
        {arr.map((t: string, i: number) => (
          <span key={i} className="inline-flex items-center rounded-md bg-secondary px-2 py-0.5 text-xs font-medium" style={valueColors?.[t] ? { color: valueColors[t] } : {}}>{t}</span>
        ))}
      </div>
    </Row>
  );
}

function isComplexValue(value: unknown): boolean {
  if (value === null || value === undefined) return false;
  if (typeof value === 'object' && !Array.isArray(value)) return true;
  if (Array.isArray(value) && value.some(i => typeof i === 'object' && i !== null)) return true;
  return false;
}

// ── Complex value variants ────────────────────────────────

function fmtComplexVal(v: unknown, useSuffix?: boolean): string {
  if (typeof v === 'number') return formatNumber(v, !!useSuffix);
  if (typeof v === 'boolean') return v ? 'Sim' : 'Não';
  if (typeof v === 'string') return humanizeLabel(v);
  if (v === null || v === undefined) return '—';
  return String(v);
}

function renderMiniCards(value: unknown, label: string, useSuffix?: boolean, jsonbKeyColors?: Record<string, string>): React.ReactNode {
  ensureDetectorsRegistered();
  if (Array.isArray(value)) {
    return (
      <div className="flex flex-wrap gap-2">
        {value.map((obj: unknown, i: number) => {
          if (typeof obj === 'object' && obj !== null) {
            const d = findBestDetector(obj);
            return d ? (
              <div key={i} className="min-w-[130px]">{d.render({ value: obj, useSuffix })}</div>
            ) : (
              <div key={i} className="rounded-lg border bg-card p-2.5 text-xs space-y-1 min-w-[130px]">
                {Object.entries(obj as Record<string, unknown>).map(([k, val]) => (
                  <div key={k} className="flex items-center gap-1.5">
                    <span className="font-medium text-foreground capitalize" style={jsonbKeyColors?.[k] ? { color: jsonbKeyColors[k] } : {}}>{k.replace(/_/g, ' ')}:</span>
                    <span className="text-muted-foreground">{fmtComplexVal(val, useSuffix)}</span>
                  </div>
                ))}
              </div>
            );
          }
          return (
            <span key={i} className="inline-flex rounded-md bg-secondary px-2 py-0.5 text-xs font-medium">{String(obj)}</span>
          );
        })}
      </div>
    );
  }
  const obj = value as Record<string, unknown>;
  const d = findBestDetector(obj);
  if (d) return d.render({ value: obj, useSuffix });
  return (
    <div className="rounded-xl border bg-card p-3 text-xs space-y-1.5">
      {Object.entries(obj).map(([k, val]) => (
        <div key={k} className="flex items-start gap-2">
          <span className="font-medium text-foreground shrink-0 min-w-[80px] capitalize" style={jsonbKeyColors?.[k] ? { color: jsonbKeyColors[k] } : {}}>{k.replace(/_/g, ' ')}:</span>
          <span className="text-muted-foreground">{fmtComplexVal(val, useSuffix)}</span>
        </div>
      ))}
    </div>
  );
}

function renderComplexTable(value: unknown, _label: string, useSuffix?: boolean, jsonbKeyColors?: Record<string, string>): React.ReactNode {
  const rows: React.ReactNode[] = [];
  if (Array.isArray(value)) {
    const allKeys = [...new Set(value.flatMap((item: unknown) =>
      typeof item === 'object' && item !== null ? Object.keys(item as Record<string, unknown>) : []
    ))];
    if (allKeys.length > 0) {
      rows.push(
        <thead key="thead" className="sticky top-0 bg-card">
          <tr className="border-b text-xs text-muted-foreground">
            <th className="text-left px-2 py-1.5 font-medium">#</th>
            {allKeys.map(k => <th key={k} className="text-left px-2 py-1.5 font-medium capitalize" style={jsonbKeyColors?.[k] ? { color: jsonbKeyColors[k] } : {}}>{k.replace(/_/g, ' ')}</th>)}
          </tr>
        </thead>,
      );
    }
    rows.push(
      <tbody key="tbody">
        {value.map((item: unknown, i: number) => (
          <tr key={i} className="border-b last:border-0 text-xs hover:bg-muted/50">
            <td className="px-2 py-1.5 text-muted-foreground">{i + 1}</td>
            {allKeys.map(k => (
              <td key={k} className="px-2 py-1.5 text-foreground">
                {fmtComplexVal((item as Record<string, unknown>)?.[k], useSuffix)}
              </td>
            ))}
          </tr>
        ))}
      </tbody>,
    );
    return <table className="w-full text-sm">{rows}</table>;
  }
  const obj = value as Record<string, unknown>;
  rows.push(
    <tbody key="tbody">
      {Object.entries(obj).map(([k, val]) => (
        <tr key={k} className="border-b last:border-0 text-xs">
          <td className="px-3 py-1.5 font-medium text-foreground capitalize whitespace-nowrap" style={jsonbKeyColors?.[k] ? { color: jsonbKeyColors[k] } : {}}>{k.replace(/_/g, ' ')}</td>
          <td className="px-3 py-1.5 text-muted-foreground">{fmtComplexVal(val, useSuffix)}</td>
        </tr>
      ))}
    </tbody>,
  );
  return <table className="w-full text-sm">{rows}</table>;
}

function renderComplexInline(value: unknown, _label: string, useSuffix?: boolean, jsonbKeyColors?: Record<string, string>): React.ReactNode {
  const parts: React.ReactNode[] = [];
  const addKeyValue = (k: string, val: unknown) => {
    const keyColor = jsonbKeyColors?.[k];
    parts.push(
      <span key={parts.length} style={keyColor ? { color: keyColor } : {}}>
        {k.replace(/_/g, ' ')}: {fmtComplexVal(val, useSuffix)}
      </span>
    );
  };
  if (Array.isArray(value)) {
    value.forEach((item: unknown) => {
      if (typeof item === 'object' && item !== null) {
        Object.entries(item as Record<string, unknown>).forEach(([k, val]) => addKeyValue(k, val));
      } else {
        parts.push(fmtComplexVal(item, useSuffix));
      }
    });
  } else {
    Object.entries(value as Record<string, unknown>).forEach(([k, val]) => addKeyValue(k, val));
  }
  const result: React.ReactNode[] = [];
  parts.forEach((p, i) => {
    if (i > 0) result.push(' · ');
    result.push(p);
  });
  return <span className="text-xs text-muted-foreground leading-relaxed">{result}</span>;
}

function renderComplexRaw(value: unknown): React.ReactNode {
  return (
    <pre className="text-[10px] font-mono bg-muted/30 rounded-lg p-3 overflow-x-auto max-h-48 text-foreground/80 border">
      <code>{JSON.stringify(value, null, 2)}</code>
    </pre>
  );
}

function renderComplexMinimal(value: unknown, useSuffix?: boolean): React.ReactNode {
  if (Array.isArray(value)) {
    const first = value[0];
    let preview = '';
    if (typeof first === 'object' && first !== null) {
      const vals = Object.values(first as Record<string, unknown>).slice(0, 2).map(v => fmtComplexVal(v, useSuffix));
      preview = vals.length > 0 ? `ex: ${vals.join(', ')}` : '';
    } else {
      preview = value.slice(0, 2).map(v => fmtComplexVal(v, useSuffix)).join(', ');
    }
    return (
      <span className="text-xs text-muted-foreground">
        <span className="font-medium text-foreground">{value.length}</span> {value.length === 1 ? 'item' : 'itens'}
        {preview && <span className="ml-1">({preview})</span>}
      </span>
    );
  }
  const obj = value as Record<string, unknown>;
  const keyCount = Object.keys(obj).length;
  return (
    <span className="text-xs text-muted-foreground">
      <span className="font-medium text-foreground">{keyCount}</span> {keyCount === 1 ? 'chave' : 'chaves'}
    </span>
  );
}

function renderComplexValue(v: number, value: unknown, label: string, useSuffix?: boolean, jsonbKeyColors?: Record<string, string>): React.ReactNode {
  if (v === 1) return renderMiniCards(value, label, useSuffix, jsonbKeyColors);
  if (v === 2) return renderComplexTable(value, label, useSuffix, jsonbKeyColors);
  if (v === 3) return renderComplexInline(value, label, useSuffix, jsonbKeyColors);
  if (v === 4) return renderComplexRaw(value);
  return renderComplexMinimal(value, useSuffix);
}

// ── Main component ────────────────────────────────────────
export default function FormatVariantRenderer({ format, variant, value, label, useSuffix, opEnabled, labelColor, valueColors, jsonbKeyColors }: Props) {
  const n = v(variant);

  // For complex values (objects/arrays of objects), use variant-aware rendering
  if (isComplexValue(value)) {
    const normalized = normalizeValue(value, useSuffix, opEnabled);
    return renderComplexValue(n, normalized, label, useSuffix, jsonbKeyColors);
  }

  const str = opEnabled ? normalizeOperatorText(String(value ?? ''), useSuffix) : String(value ?? '');

  switch (format) {
    case 'text':     return renderText(n, str, label, labelColor, valueColors);
    case 'badge':    return renderBadge(n, str, label, labelColor, valueColors);
    case 'color':    return renderColor(n, str, label, labelColor);
    case 'icon':     return renderIcon(n, str, label, labelColor);
    case 'link':     return renderLink(n, str, label, labelColor);
    case 'image':    return renderImage(n, str, label, labelColor);
    case 'rating':   return renderRating(n, value, label, labelColor, opEnabled);
    case 'progress': return renderProgress(n, value, label, labelColor);
    case 'tags':     return renderTags(n, value, label, labelColor);
    case 'boolean':  return renderBoolean(n, value, label, labelColor);
    case 'date':     return renderDate(n, value, label, labelColor);
    case 'duration': return renderDuration(n, value, label, labelColor);
    case 'file':     return renderFile(n, str, label, labelColor);
    case 'video':    return renderVideo(n, str, label, labelColor);
    case 'audio':    return renderAudio(n, str, label, labelColor);
    case 'emoji':    return renderEmoji(n, str, label, labelColor);
    case 'icon-set': return renderIconSet(n, value, label, labelColor);
    case 'color-palette': return renderColorPalette(n, value, label, labelColor);
    case 'multi-select': return renderMultiSelect(n, value, label, labelColor, valueColors);
    case 'jsonb-structured': {
      const detectValue = typeof value === 'string' ? (() => { try { return JSON.parse(value); } catch { return value; } })() : value;
      if (typeof detectValue === 'object' && detectValue !== null && !Array.isArray(detectValue)) {
        ensureDetectorsRegistered();
        const detector = findBestDetector(detectValue);
        if (detector) return detector.render({ value: detectValue, useSuffix }, n);
      }
      if (isComplexValue(detectValue)) {
        return renderComplexValue(n, detectValue, label, useSuffix, jsonbKeyColors);
      }
      return renderText(n, String(detectValue ?? ''), label, labelColor, valueColors);
    }
    default:         return renderText(n, str, label, labelColor, valueColors);
  }
}
