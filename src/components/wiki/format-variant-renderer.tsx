'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import {
  Star, Heart, ExternalLink, Clock, Download, Play, Info,
  FileIcon, Video, Music, CalendarIcon,
} from 'lucide-react';
import { IconRenderer } from '@/components/ui/icon-renderer';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import type { DisplayFormat } from '@/lib/column-types/format-compatibility';
import { ensureDetectorsRegistered, findBestDetector } from '@/lib/jsonb-detectors';
import { normalizeOperatorText, normalizeValue, humanizeLabel, detectOpArray, renderOpMiniCards, parseOperatorPrefix } from '@/lib/operator-symbols';
import { formatNumber } from '@/lib/format-number';
import { MiniCard3D } from '@/components/wiki/mini-card-3d';
import { VariantAnimatedValue } from '@/components/wiki/variant-animated-value';
import { hasBaseMaxShape } from '@/lib/scaling-engine';
import { ScaledValue } from '@/lib/scaling-context';

export interface AllowedValue {
  value: string;
  label?: string;
  color?: string;
  icon?: string;
  imageUrl?: string;
  linkedEntity?: string;
  autoFill?: Record<string, string>;
}

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
  maxValue?: number;
  allowedValues?: AllowedValue[];
  /** Called when a mini card is clicked. `subKey` carries the jsonb sub-path
   *  (e.g. `stats.damage` / `stats[].damage`) so each jsonb mini card can open
   *  the comparison popup for its specific value; omit for the whole column. */
  onCompareClick?: (subKey?: string) => void;
  /** Parent column name — used to build jsonb sub-paths when provided. */
  column?: string;
  plain?: boolean;
  /** Optional icon rendered in the card's leading slot (variant 1 column card). */
  icon?: React.ReactNode;
  /** Optional rich label (e.g. with an icon) overriding `label` on the v1 column card. */
  labelNode?: React.ReactNode;
  /** Animation trigger counter — incremented when variant changes to fire entry animations. */
  animTrigger?: number;
};

function findAllowed(allowedValues: AllowedValue[] | undefined, val: string): AllowedValue | undefined {
  return allowedValues?.find((a) => a.value === val);
}

function v(n: number) { return Math.max(1, Math.min(5, n)); }

function Row({ label, children, className = '', labelColor }: { label: string; children: React.ReactNode; className?: string; labelColor?: string }) {
  if (!label) return <>{children}</>;
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <span className="text-xs font-medium min-w-[100px] shrink-0" style={labelColor ? { color: labelColor } : {}}>{label}</span>
      {children}
    </div>
  );
}

function ColWrap({ label, children, labelColor }: { label: string; children: React.ReactNode; labelColor?: string }) {
  if (!label) return <>{children}</>;
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs font-medium text-muted-foreground min-w-[100px]" style={labelColor ? { color: labelColor } : {}}>{label}</span>
      {children}
    </div>
  );
}

// ── text ──────────────────────────────────────────────────
function renderText(v: number, str: string, label: string, labelColor?: string, valueColors?: Record<string, string>) {
  const color = valueColors?.[str] || labelColor;
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

// ── number ────────────────────────────────────────────────
function renderNumber(v: number, str: string, label: string, labelColor?: string, valueColors?: Record<string, string>, rawValue?: string) {
  const color = valueColors?.[str] ?? (rawValue != null ? valueColors?.[rawValue] : undefined) ?? labelColor;
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
        <span className="text-xs font-mono font-semibold text-foreground" style={valStyle}>{str}</span>
      </Row>
    );
  }
  if (v === 4) {
    return (
      <Row label={label} labelColor={labelColor}>
        <span className="text-xs border-l-2 border-primary pl-2 font-mono text-foreground" style={valStyle}>{str}</span>
      </Row>
    );
  }
  if (v === 5) {
    return (
      <Row label={label} labelColor={labelColor}>
        <span className="text-xs font-bold font-mono text-primary" style={valStyle}>{str}</span>
      </Row>
    );
  }
  return (
    <Row label={label} labelColor={labelColor}>
      <span className="text-xs font-mono text-foreground" style={valStyle}>{str}</span>
    </Row>
  );
}

// ── badge ─────────────────────────────────────────────────
function renderBadge(v: number, str: string, label: string, labelColor?: string, valueColors?: Record<string, string>) {
  const color = valueColors?.[str] || labelColor;
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
function renderRating(v: number, val: unknown, label: string, labelColor?: string, opEnabled?: boolean, maxValue = 5) {
  const num = Number(val);
  const stars = isNaN(num) ? 0 : Math.round(Math.min(maxValue, Math.max(0, num)));
  const fraction = !isNaN(num) && opEnabled ? `${num}/${maxValue}` : '';

  if (v === 2) {
    return (
      <Row label={label} labelColor={labelColor}>
        <div className="flex gap-0.5">
          {Array.from({ length: maxValue }).map((_, i) => (
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
          {isNaN(num) ? String(val) : `${num}/${maxValue}`}
        </span>
      </Row>
    );
  }
  if (v === 4) {
    const pct = isNaN(num) ? 0 : Math.min(100, Math.max(0, (num / maxValue) * 100));
    return (
      <Row label={label} labelColor={labelColor}>
        <div className="flex items-center gap-2">
          <div className="w-20 h-2 rounded-full bg-muted overflow-hidden">
            <div className="h-full rounded-full bg-amber-400 transition-all" style={{ width: `${pct}%` }} />
          </div>
          <span className="text-xs font-mono text-muted-foreground">{isNaN(num) ? String(val) : `${num}/${maxValue}`}</span>
        </div>
      </Row>
    );
  }
  if (v === 5) {
    return (
      <ColWrap label={label} labelColor={labelColor}>
        <div className="flex items-baseline gap-0.5">
          <span className="text-3xl font-bold text-amber-400">{isNaN(num) ? '?' : num}</span>
          <span className="text-sm text-muted-foreground">/{maxValue}</span>
        </div>
      </ColWrap>
    );
  }
  return (
    <Row label={label} labelColor={labelColor}>
      <div className="flex gap-0.5 items-center">
        {Array.from({ length: maxValue }).map((_, i) => (
          <Star key={i} className={`h-3.5 w-3.5 ${i < stars ? 'text-yellow-400 fill-yellow-400' : 'text-muted-foreground/30'}`} />
        ))}
        {fraction && <span className="text-[10px] text-muted-foreground ml-1">{fraction}</span>}
        {!fraction && isNaN(num) && <span className="text-xs text-muted-foreground ml-1">{String(val)}</span>}
      </div>
    </Row>
  );
}

// ── progress ──────────────────────────────────────────────
function renderProgress(v: number, val: unknown, label: string, labelColor?: string, _opEnabled?: boolean, maxValue = 100) {
  const num = Number(val);
  const clamped = isNaN(num) ? 0 : Math.min(maxValue, Math.max(0, num));
  const normalizedPct = maxValue > 0 ? (clamped / maxValue) * 100 : 0;
  const displayText = isNaN(num) ? String(val) : maxValue === 100 ? `${Math.round(clamped)}%` : `${num}/${maxValue}`;

  if (v === 2) {
    return (
      <Row label={label} labelColor={labelColor}>
        <div className="flex-1 flex items-center gap-2 max-w-[200px]">
          <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
            <div className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${normalizedPct}%`, backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 3px, rgba(255,255,255,0.15) 3px, rgba(255,255,255,0.15) 6px)' }}
            />
          </div>
          <span className="text-xs font-mono text-muted-foreground">{displayText}</span>
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
              style={{ width: `${normalizedPct}%` }}
            />
          </div>
          <span className="text-xs font-mono text-muted-foreground">{displayText}</span>
        </div>
      </Row>
    );
  }
  if (v === 4) {
    const segments = 5;
    const filled = Math.round((normalizedPct / 100) * segments);
    return (
      <Row label={label} labelColor={labelColor}>
        <div className="flex gap-0.5 items-center">
          {Array.from({ length: segments }).map((_, i) => (
            <div key={i} className={`h-4 w-3 rounded-sm transition-colors ${i < filled ? 'bg-primary' : 'bg-muted'}`} />
          ))}
          <span className="text-xs font-mono text-muted-foreground ml-1">{displayText}</span>
        </div>
      </Row>
    );
  }
  if (v === 5) {
    const r = 14;
    const circumference = 2 * Math.PI * r;
    const offset = circumference - (normalizedPct / 100) * circumference;
    return (
      <Row label={label} labelColor={labelColor}>
        <div className="relative h-10 w-10">
          <svg className="h-10 w-10 -rotate-90" viewBox="0 0 32 32">
            <circle cx="16" cy="16" r={r} fill="none" stroke="hsl(var(--muted))" strokeWidth="3" />
            <circle cx="16" cy="16" r={r} fill="none" stroke="hsl(var(--primary))" strokeWidth="3"
              strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center text-[9px] font-bold text-foreground">
            {isNaN(num) ? '?' : displayText}
          </span>
        </div>
      </Row>
    );
  }
  return (
    <Row label={label} labelColor={labelColor}>
      <div className="flex-1 flex items-center gap-2">
        <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden max-w-[200px]">
          <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${normalizedPct}%` }} />
        </div>
        <span className="text-xs font-mono text-muted-foreground">{displayText}</span>
      </div>
    </Row>
  );
}

// ── tags ──────────────────────────────────────────────────
function renderTags(v: number, val: unknown, label: string, labelColor?: string) {
  const arr: string[] = [];
  if (Array.isArray(val)) {
    arr.push(...val.map(String));
  } else if (typeof val === 'string') {
    const trimmed = val.trim();
    if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
      try { const parsed = JSON.parse(trimmed); if (Array.isArray(parsed)) arr.push(...parsed.map(String)); } catch { /* invalid JSON */ }
    }
    if (arr.length === 0) arr.push(...trimmed.split(',').map(s => s.trim().replace(/^\[|\]$|^"|"$|^'|'$/g, '')).filter(Boolean));
  }
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
function renderMultiSelect(v: number, val: unknown, label: string, labelColor?: string, valueColors?: Record<string, string>, allowedValues?: AllowedValue[]) {
  const arr = Array.isArray(val) ? val : typeof val === 'string' ? (() => { try { return JSON.parse(val); } catch { return [val]; } })() : [];
  if (!Array.isArray(arr)) return null;

  const renderTag = (t: string, i: number, baseClass: string, extraStyle?: React.CSSProperties) => {
    const av = findAllowed(allowedValues, t);
    const displayLabel = av?.label || t;
    const color = av?.color || valueColors?.[t];
    const icon = av?.icon;
    const style: React.CSSProperties = color ? { color, ...extraStyle } : (extraStyle || {});
    return (
      <span key={i} className={baseClass} style={style}>
        {icon && <IconRenderer icon={icon} size={'sm'} />}
        {displayLabel}
      </span>
    );
  };

  if (v === 2) {
    return (
      <Row label={label} labelColor={labelColor} className="items-start">
        <div className="flex flex-wrap gap-1">
          {arr.map((t: string, i: number) => renderTag(t, i,
            'inline-flex items-center gap-0.5 rounded-full px-2.5 py-0.5 text-xs font-medium bg-primary/15 text-primary',
            valueColors?.[t] ? {} : undefined,
          ))}
        </div>
      </Row>
    );
  }
  if (v === 3) {
    return (
      <Row label={label} labelColor={labelColor} className="items-start">
        <div className="flex flex-wrap gap-1">
          {arr.map((t: string, i: number) => renderTag(t, i,
            'inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs bg-muted/30 text-foreground',
            valueColors?.[t] ? {} : undefined,
          ))}
        </div>
      </Row>
    );
  }
  if (v === 4) {
    return (
      <Row label={label} labelColor={labelColor}>
        <div className="flex -space-x-1.5">
          {arr.slice(0, 4).map((t: string, i: number) => renderTag(t, i,
            'inline-flex items-center gap-0.5 rounded-full border bg-muted/50 px-2 py-0.5 text-[10px] font-medium text-muted-foreground',
            valueColors?.[t] ? {} : undefined,
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
        {arr.map((t: string, i: number) => renderTag(t, i,
          'inline-flex items-center gap-0.5 rounded-md bg-secondary px-2 py-0.5 text-xs font-medium',
          valueColors?.[t] ? {} : undefined,
        ))}
      </div>
    </Row>
  );
}

// ── select (single value with allowedValues) ──────────────
function renderSelect(v: number, str: string, label: string, labelColor?: string, allowedValues?: AllowedValue[], valueColors?: Record<string, string>) {
  const av = findAllowed(allowedValues, str);
  const displayLabel = av?.label || str;
  const color = av?.color || valueColors?.[str];
  const icon = av?.icon;

  if (v === 2) {
    return (
      <Row label={label} labelColor={labelColor}>
        <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium border bg-muted/30 text-foreground"
          style={color ? { borderColor: color + '60', color } : {}}
        >
          {icon && <IconRenderer icon={icon} size={'sm'} />}
          {displayLabel}
        </span>
      </Row>
    );
  }
  if (v === 3) {
    return (
      <Row label={label} labelColor={labelColor}>
        <span className="inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-medium bg-card text-foreground"
          style={color ? { borderLeft: `3px solid ${color}` } : {}}
        >
          {icon && <IconRenderer icon={icon} size={'sm'} />}
          {displayLabel}
        </span>
      </Row>
    );
  }
  if (v === 4) {
    return (
      <Row label={label} labelColor={labelColor}>
        <span className="inline-flex items-center gap-1 text-xs font-semibold"
          style={color ? { color } : {}}
        >
          {icon && <IconRenderer icon={icon} size={'sm'} />}
          {displayLabel}
        </span>
      </Row>
    );
  }
  if (v === 5) {
    return (
      <Row label={label} labelColor={labelColor}>
        <div className="flex items-center gap-1 rounded-lg border-2 px-3 py-1 text-xs font-semibold"
          style={color ? { borderColor: color, color, backgroundColor: color + '15' } : {}}
        >
          {icon && <IconRenderer icon={icon} size={'sm'} />}
          {displayLabel}
        </div>
      </Row>
    );
  }
  return (
    <Row label={label} labelColor={labelColor}>
      <span className="inline-flex items-center gap-1 rounded-md bg-secondary/60 px-2 py-0.5 text-xs font-medium"
        style={color ? { backgroundColor: color + '20' } : {}}
      >
        {icon && <IconRenderer icon={icon} size={'sm'} />}
        {displayLabel}
      </span>
    </Row>
  );
}

// ── toggle-group ──────────────────────────────────────────
function renderToggleGroup(v: number, str: string, label: string, labelColor?: string, allowedValues?: AllowedValue[], valueColors?: Record<string, string>) {
  const av = findAllowed(allowedValues, str);
  const displayLabel = av?.label || str;
  const color = av?.color || valueColors?.[str];
  const icon = av?.icon;

  if (v === 2) {
    return (
      <Row label={label} labelColor={labelColor}>
        <span className="inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-medium text-primary bg-primary/10 border-primary/30"
          style={color ? { color, borderColor: color + '50', backgroundColor: color + '15' } : {}}
        >
          {icon && <IconRenderer icon={icon} size={'sm'} />}
          {displayLabel}
        </span>
      </Row>
    );
  }
  if (v === 3) {
    return (
      <Row label={label} labelColor={labelColor}>
        <span className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold bg-foreground/10 text-foreground"
          style={color ? { backgroundColor: color + '20', color } : {}}
        >
          {icon && <IconRenderer icon={icon} size={'sm'} />}
          {displayLabel}
        </span>
      </Row>
    );
  }
  if (v === 4) {
    return (
      <Row label={label} labelColor={labelColor}>
        <span className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wider"
          style={color ? { color } : {}}
        >
          {icon && <IconRenderer icon={icon} size={'sm'} />}
          {displayLabel}
        </span>
      </Row>
    );
  }
  if (v === 5) {
    return (
      <Row label={label} labelColor={labelColor}>
        <span className="inline-flex items-center gap-1 rounded-lg border-2 px-3 py-1 text-xs font-bold shadow-[0_0_10px]"
          style={color ? { borderColor: color, color, boxShadow: `0 0 10px ${color}40` } : {}}
        >
          {icon && <IconRenderer icon={icon} size={'sm'} />}
          {displayLabel}
        </span>
      </Row>
    );
  }
  return (
    <Row label={label} labelColor={labelColor}>
      <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium bg-secondary/40 text-secondary-foreground"
        style={color ? { backgroundColor: color + '20' } : {}}
      >
        {icon && <IconRenderer icon={icon} size={'sm'} />}
        {displayLabel}
      </span>
    </Row>
  );
}

// ── popover ────────────────────────────────────────────────
function RenderPopover({ v, title, content, labelColor, triggerMode, position, triggerText }: {
  v: number;
  title: string;
  content: string;
  labelColor?: string;
  triggerMode?: 'hover' | 'click';
  position?: 'top' | 'bottom' | 'left' | 'right';
  triggerText?: string;
}) {
  const triggerSizes = ['text-xs', 'text-sm', 'text-base', 'text-lg', 'text-xl font-semibold'];
  const triggerStyles = [
    'underline decoration-dotted underline-offset-4',
    'rounded-md bg-secondary/50 px-2 py-0.5 border border-border/30',
    'rounded-full bg-primary/10 px-3 py-1 border border-primary/20 text-primary',
    'rounded-lg bg-card border shadow-sm px-3 py-1.5 hover:shadow-md transition-shadow',
    'rounded-xl bg-gradient-to-br from-primary/10 to-secondary/20 px-4 py-2 border shadow-sm hover:shadow-lg transition-all',
  ];
  const icons = [Info, Info, Info, Info, Info];
  const Icon = icons[Math.min(v - 1, 4)];
  const [open, setOpen] = useState(false);
  const showEvent = triggerMode === 'click'
    ? { onClick: () => setOpen(!open) }
    : { onMouseEnter: () => setOpen(true), onMouseLeave: () => setOpen(false) };
  const side = position === 'bottom' ? 'bottom' : position === 'left' ? 'left' : position === 'right' ? 'right' : 'top';
  const sideOffset = position === 'top' ? 6 : position === 'bottom' ? -6 : position === 'left' ? 6 : position === 'right' ? -6 : 6;

  return (
    <Popover open={triggerMode === 'click' ? open : undefined} onOpenChange={triggerMode === 'click' ? setOpen : undefined}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={`inline-flex items-center gap-1.5 cursor-pointer transition-all ${triggerSizes[Math.min(v - 1, 4)]} ${triggerStyles[Math.min(v - 1, 4)]}`}
          style={labelColor ? { color: labelColor } : {}}
          {...showEvent}
        >
          <Icon className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate max-w-[200px]">{triggerText || title || content}</span>
        </button>
      </PopoverTrigger>
      <AnimatePresence>
        {(triggerMode !== 'click' || open) && (
          <PopoverContent
            className="w-80 p-0 overflow-hidden rounded-xl border bg-popover shadow-xl backdrop-blur-sm"
            side={side as 'top' | 'bottom' | 'left' | 'right'}
            sideOffset={sideOffset}
            align="start"
            forceMount
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: position === 'top' ? 4 : position === 'bottom' ? -4 : 0 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: position === 'top' ? 4 : position === 'bottom' ? -4 : 0 }}
              transition={{ duration: 0.15, ease: [0.22, 1, 0.36, 1] }}
            >
              {title && (
                <div className="px-3 pt-3 pb-1.5 border-b border-border/40">
                  <p className="text-sm font-semibold text-foreground">{title}</p>
                </div>
              )}
              <div className="px-3 py-2.5 text-sm text-foreground/90 leading-relaxed whitespace-pre-wrap break-words max-h-60 overflow-y-auto">
                {content || '—'}
              </div>
            </motion.div>
          </PopoverContent>
        )}
      </AnimatePresence>
    </Popover>
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
  if (hasBaseMaxShape(v)) return `${v.base} → ${v.max}`;
  return String(v);
}

/** Format a single mini-card value node, respecting suffix/scientific notation and OP symbols. */
function renderMiniCardValueNode(val: unknown, useSuffix?: boolean, opEnabled?: boolean): React.ReactNode {
  if (typeof val === 'number') {
    return <span className="font-mono">{formatNumber(val, !!useSuffix)}</span>;
  }
  if (typeof val === 'string') {
    if (opEnabled) {
      const op = parseOperatorPrefix(val);
      if (op) {
        const n = Number(op.number);
        const displayNum = useSuffix && isFinite(n) ? formatNumber(n, true) : op.number;
        return (
          <span className="font-mono">
            <span className="font-bold text-primary">{op.symbol}</span>
            {displayNum}
          </span>
        );
      }
    }
    return <span>{humanizeLabel(val)}</span>;
  }
  if (hasBaseMaxShape(val)) {
    return <ScaledValue base={val.base} max={val.max} />;
  }
  return <span>{fmtComplexVal(val, useSuffix)}</span>;
}

/** Body of a mini card: one row per key with color, suffix and OP support. */
function miniCardBody(obj: Record<string, unknown>, jsonbKeyColors?: Record<string, string>, useSuffix?: boolean, opEnabled?: boolean): React.ReactNode {
  const entries = Object.entries(obj);
  return (
    <div className={`flex ${opEnabled ? 'flex-row flex-wrap gap-x-3 gap-y-0.5' : 'flex-col'} gap-1`}>
      {entries.map(([k, val]) => {
        const color = jsonbKeyColors?.[k];
        const labelEl = (
          <span
            className="text-[10px] font-semibold uppercase tracking-wider"
            style={{ color: color || 'hsl(var(--muted-foreground))' }}
          >
            {humanizeLabel(k)}
          </span>
        );
        const valueEl = (
          <span className="text-sm font-medium text-foreground">
            {renderMiniCardValueNode(val, useSuffix, opEnabled)}
          </span>
        );
        if (opEnabled) {
          return (
            <span key={k} className="inline-flex items-center gap-1">
              {labelEl}
              {valueEl}
            </span>
          );
        }
        return (
          <div key={k} className="flex flex-col gap-0.5">
            {labelEl}
            {valueEl}
          </div>
        );
      })}
    </div>
  );
}

/** Primary accent color for a card built from its first colored key. */
function firstKeyColor(obj: Record<string, unknown>, jsonbKeyColors?: Record<string, string>): string | undefined {
  for (const k of Object.keys(obj)) {
    if (jsonbKeyColors?.[k]) return jsonbKeyColors[k];
  }
  return undefined;
}

function renderMiniCards(value: unknown, label: string, useSuffix?: boolean, jsonbKeyColors?: Record<string, string>, opEnabled?: boolean, onCompareClick?: (subKey?: string) => void, column?: string, labelColor?: string, labelNode?: React.ReactNode): React.ReactNode {
  ensureDetectorsRegistered();

  // Builds the full stat key for a jsonb sub-path, matching CompareInfo keys
  // produced by discoverJsonbSubFields (e.g. `stats.damage`, `stats[].damage`).
  const subKeyFor = (key: string): string | undefined => {
    if (!onCompareClick || !column) return undefined;
    return `${column}.${key}`;
  };

  const header = label && labelNode !== undefined
    ? <div className="text-xs font-medium text-muted-foreground mb-1">{labelNode}</div>
    : label
    ? <div className="text-xs font-medium text-muted-foreground mb-1" style={labelColor ? { color: labelColor } : {}}>{label}</div>
    : null;

  const wrapperClass = 'flex flex-wrap gap-2';

  // Array → one independent mini card per element (object or scalar).
  if (Array.isArray(value)) {
    if (opEnabled && detectOpArray(value)) {
      return <>{header}{renderOpMiniCards(value, jsonbKeyColors, useSuffix, onCompareClick, column)}</>;
    }
    return (
      <div>
        {header}
        <div className={wrapperClass} style={{ perspective: '1000px', transformStyle: 'preserve-3d' }}>
          {value.map((el: unknown, i: number) => {
            if (typeof el === 'object' && el !== null) {
              const obj = el as Record<string, unknown>;
              // Array-of-objects: compare the key of the first element across items.
              const singleKey = Object.keys(obj)[0];
              const sub = column && singleKey !== undefined ? `${column}[].${singleKey}` : undefined;
              return (
                <MiniCard3D
                  key={i}
                  color={firstKeyColor(obj, jsonbKeyColors)}
                  value={miniCardBody(obj, jsonbKeyColors, useSuffix, opEnabled)}
                  onClick={sub ? () => onCompareClick?.(sub) : onCompareClick}
                  className="min-w-[110px] flex-1"
                />
              );
            }
            return (
              <MiniCard3D
                key={i}
                color={labelColor}
                value={<span className="text-sm font-medium text-foreground">{renderMiniCardValueNode(el, useSuffix, opEnabled)}</span>}
                onClick={onCompareClick}
                className="min-w-[90px] flex-1"
              />
            );
          })}
        </div>
      </div>
    );
  }

  // Object → one independent mini card per key.
  if (typeof value === 'object' && value !== null) {
    const obj = value as Record<string, unknown>;
    if (opEnabled) {
      return (
        <div>
          {header}
          <div className="flex flex-wrap gap-x-4 gap-y-1">
            {Object.entries(obj).map(([k, val]) => {
              const color = jsonbKeyColors?.[k] || labelColor;
              return (
                <span
                  key={k}
                  onClick={subKeyFor(k) ? () => onCompareClick?.(subKeyFor(k)) : onCompareClick ? () => onCompareClick() : undefined}
                  role={onCompareClick ? 'button' : undefined}
                  tabIndex={onCompareClick ? 0 : undefined}
                  className={`inline-flex items-center gap-1.5 text-xs ${onCompareClick ? 'cursor-pointer hover:text-primary transition-colors' : ''}`}
                >
                  <span className="font-semibold uppercase tracking-wider" style={{ color: color || 'hsl(var(--muted-foreground))' }}>
                    {humanizeLabel(k)}
                  </span>
                  <span className="font-medium text-foreground">
                    {renderMiniCardValueNode(val, useSuffix, opEnabled)}
                  </span>
                </span>
              );
            })}
          </div>
        </div>
      );
    }
    return (
      <div>
        {header}
        <div className={wrapperClass} style={{ perspective: '1000px', transformStyle: 'preserve-3d' }}>
          {Object.entries(obj).map(([k, val]) => (
            <MiniCard3D
              key={k}
              label={humanizeLabel(k)}
              color={jsonbKeyColors?.[k] || labelColor}
              value={<span className="text-sm font-medium text-foreground">{renderMiniCardValueNode(val, useSuffix, opEnabled)}</span>}
              onClick={subKeyFor(k) ? () => onCompareClick?.(subKeyFor(k)) : onCompareClick}
              className="min-w-[100px] flex-1"
            />
          ))}
        </div>
      </div>
    );
  }

  // Scalar jsonb value → one mini card (kept, as requested: jsonb keeps its
  // per-item mini cards).
  return (
    <div>
      {header}
      <MiniCard3D
        value={<span className="text-sm font-medium text-foreground">{renderMiniCardValueNode(value, useSuffix, opEnabled)}</span>}
        onClick={onCompareClick}
      />
    </div>
  );
}

function complexEntries(value: unknown): [string, unknown][] {
  if (Array.isArray(value)) {
    return value.flatMap((item, i) =>
      typeof item === 'object' && item !== null
        ? Object.entries(item as Record<string, unknown>).map(([k, v]) => [`${k} ${i + 1}`, v] as [string, unknown])
        : [[`Item ${i + 1}`, item] as [string, unknown]],
    );
  }
  if (typeof value === 'object' && value !== null) return Object.entries(value as Record<string, unknown>);
  return [['Valor', value]];
}

function ComplexRow3D({ k, val, color, useSuffix, depth = 0 }: { k: string; val: unknown; color?: string; useSuffix?: boolean; depth?: number }) {
  return (
    <div
      className="flex items-center justify-between gap-2 rounded-lg border border-border/30 bg-card/60 px-2.5 py-1.5 backdrop-blur-sm"
      style={{ transform: `translateZ(${8 + depth}px)`, borderColor: color ? `${color}55` : undefined }}
    >
      <span className="text-[10px] font-semibold uppercase tracking-wider capitalize" style={{ color: color || 'hsl(var(--muted-foreground))' }}>
        {k.replace(/_/g, ' ')}
      </span>
      <span className="text-xs font-medium text-foreground truncate">{fmtComplexVal(val, useSuffix)}</span>
    </div>
  );
}

// ── v2: Holographic glass panels ──────────────────────────
function renderHoloPanels(value: unknown, _label: string, useSuffix?: boolean, jsonbKeyColors?: Record<string, string>): React.ReactNode {
  const entries = complexEntries(value);
  return (
    <div
      className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-1"
      style={{ perspective: '900px', transformStyle: 'preserve-3d' }}
    >
      {entries.map(([k, val], i) => {
        const color = jsonbKeyColors?.[k.replace(/\s\d+$/, '')];
        return (
          <div
            key={k}
            className="relative rounded-xl border border-border/40 bg-gradient-to-br from-card/80 via-card/60 to-card/40 p-2.5 backdrop-blur-md shadow-md transition-all duration-300 hover:shadow-lg"
            style={{
              transform: `rotateX(${i % 2 === 0 ? 3 : -3}deg) rotateY(${i % 2 === 0 ? -4 : 4}deg) translateZ(${10 + (i % 3) * 6}px)`,
              transformStyle: 'preserve-3d',
              boxShadow: `0 8px 24px -12px ${color || 'hsl(var(--primary))'}66, inset 0 1px 0 rgba(255,255,255,0.06)`,
              borderColor: color ? `${color}55` : undefined,
            }}
          >
            <div className="pointer-events-none absolute inset-0 rounded-xl opacity-60"
              style={{ background: `radial-gradient(circle at 30% 20%, ${color || 'hsl(var(--primary))'}22, transparent 70%)` }} />
            <ComplexRow3D k={k} val={val} color={color} useSuffix={useSuffix} depth={4} />
          </div>
        );
      })}
    </div>
  );
}

// ── v3: Neon depth grid ───────────────────────────────────
function renderNeonGrid(value: unknown, _label: string, useSuffix?: boolean, jsonbKeyColors?: Record<string, string>): React.ReactNode {
  const entries = complexEntries(value);
  return (
    <div className="p-1" style={{ perspective: '1000px', transformStyle: 'preserve-3d' }}>
      <div
        className="grid gap-2"
        style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', transform: 'rotateX(12deg)', transformStyle: 'preserve-3d' }}
      >
        {entries.map(([k, val], i) => {
          const color = jsonbKeyColors?.[k.replace(/\s\d+$/, '')];
          const accent = color || 'hsl(var(--primary))';
          return (
            <div
              key={k}
              className="relative overflow-hidden rounded-xl border bg-background/70 p-3 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1"
              style={{
                borderColor: `${accent}55`,
                transform: `translateZ(${(i % 4) * 14}px)`,
                boxShadow: `0 0 18px -6px ${accent}88, 0 10px 22px -14px #000`,
              }}
            >
              <span className="absolute -top-6 -right-6 h-16 w-16 rounded-full blur-2xl" style={{ background: `${accent}40` }} />
              <span className="relative block text-[10px] font-bold uppercase tracking-widest" style={{ color: accent }}>
                {k.replace(/_/g, ' ')}
              </span>
              <span className="relative mt-1 block text-sm font-bold text-foreground">{fmtComplexVal(val, useSuffix)}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── v4: Orbital 3D carousel ───────────────────────────────
function renderOrbitalCarousel(value: unknown, _label: string, useSuffix?: boolean, jsonbKeyColors?: Record<string, string>): React.ReactNode {
  const entries = complexEntries(value);
  const mid = (entries.length - 1) / 2;
  return (
    <div
      className="relative flex flex-nowrap gap-3 overflow-x-auto pb-3 pt-2 snap-x snap-mandatory scrollbar-thin"
      style={{ perspective: '800px', transformStyle: 'preserve-3d' }}
    >
      {entries.map(([k, val], i) => {
        const color = jsonbKeyColors?.[k.replace(/\s\d+$/, '')];
        const accent = color || 'hsl(var(--primary))';
        const offset = i - mid;
        return (
          <div
            key={k}
            className="snap-center shrink-0 w-[150px] rounded-2xl border bg-gradient-to-br from-card via-card/90 to-card/70 p-3 backdrop-blur-md shadow-xl transition-all duration-500 hover:shadow-2xl"
            style={{
              transform: `rotateY(${offset * 14}deg) translateZ(${Math.max(0, 60 - Math.abs(offset) * 22)}px) translateY(${Math.abs(offset) * 8}px)`,
              transformStyle: 'preserve-3d',
              borderColor: `${accent}66`,
              boxShadow: `0 18px 40px -20px ${accent}aa`,
            }}
          >
            <div className="mb-2 flex items-center gap-1.5" style={{ transform: 'translateZ(24px)' }}>
              <span className="h-2 w-2 rounded-full" style={{ background: accent, boxShadow: `0 0 8px ${accent}` }} />
              <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: accent }}>{k.replace(/_/g, ' ')}</span>
            </div>
            <span className="block text-base font-bold text-foreground" style={{ transform: 'translateZ(14px)' }}>{fmtComplexVal(val, useSuffix)}</span>
          </div>
        );
      })}
    </div>
  );
}

// ── v5: Layered 3D depth stack ────────────────────────────
function renderDepthStack(value: unknown, _label: string, useSuffix?: boolean, jsonbKeyColors?: Record<string, string>): React.ReactNode {
  const entries = complexEntries(value);
  return (
    <div className="relative space-y-1 py-1" style={{ perspective: '1200px', transformStyle: 'preserve-3d' }}>
      {entries.map(([k, val], i) => {
        const color = jsonbKeyColors?.[k.replace(/\s\d+$/, '')];
        const accent = color || 'hsl(var(--primary))';
        const isTop = i === 0;
        return (
          <div
            key={k}
            className={`relative rounded-xl border backdrop-blur-md transition-all duration-500 ${isTop ? 'shadow-2xl' : 'shadow-md'}`}
            style={{
              transform: `translateZ(${-i * 16}px) rotateX(${isTop ? 0 : 6}deg)`,
              transformStyle: 'preserve-3d',
              marginTop: i > 0 ? '-14px' : undefined,
              marginLeft: `${i * 6}px`,
              marginRight: `${i * 6}px`,
              zIndex: entries.length - i,
              backgroundImage: `linear-gradient(135deg, hsl(var(--card) / ${1 - i * 0.05}), hsl(var(--card) / ${0.85 - i * 0.05}))`,
              borderColor: `${accent}${isTop ? '99' : '44'}`,
              boxShadow: isTop ? `0 20px 50px -20px ${accent}cc, inset 0 1px 0 rgba(255,255,255,0.07)` : `0 10px 24px -16px #000`,
            }}
          >
            <div className="flex items-center justify-between gap-2 px-3 py-2.5" style={{ transform: 'translateZ(20px)' }}>
              <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide" style={{ color: accent }}>
                <span className="text-[10px] font-mono opacity-60">{String(i + 1).padStart(2, '0')}</span>
                {k.replace(/_/g, ' ')}
              </span>
              <span className="text-sm font-bold text-foreground">{fmtComplexVal(val, useSuffix)}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function renderComplexValue(v: number, value: unknown, label: string, useSuffix?: boolean, jsonbKeyColors?: Record<string, string>, opEnabled?: boolean, onCompareClick?: (subKey?: string) => void, column?: string, labelColor?: string, labelNode?: React.ReactNode): React.ReactNode {
  if (v === 1) return renderMiniCards(value, label, useSuffix, jsonbKeyColors, opEnabled, onCompareClick, column, labelColor, labelNode);
  if (v === 2) return renderHoloPanels(value, label, useSuffix, jsonbKeyColors);
  if (v === 3) return renderNeonGrid(value, label, useSuffix, jsonbKeyColors);
  if (v === 4) return renderOrbitalCarousel(value, label, useSuffix, jsonbKeyColors);
  return renderDepthStack(value, label, useSuffix, jsonbKeyColors);
}

// ── Variant 1: every scalar render type becomes a mini card ──
function renderScalarMiniContent(format: string, value: unknown, str: string, label: string, labelColor: string | undefined, valueColors: Record<string, string> | undefined, allowedValues: AllowedValue[] | undefined, maxValue: number | undefined, useSuffix?: boolean, opEnabled?: boolean): React.ReactNode {
  const color = valueColors?.[str] || labelColor;
  const valStyle: React.CSSProperties = color ? { color } : {};
  const opNode = opEnabled ? (() => {
    const op = parseOperatorPrefix(str);
    if (!op) return null;
    const n = Number(op.number);
    const displayNum = useSuffix && isFinite(n) ? formatNumber(n, true) : op.number;
    return (
      <span className="text-sm font-bold font-mono" style={valStyle}>
        <span className="text-primary">{op.symbol}</span>{displayNum}
      </span>
    );
  })() : null;
  switch (format) {
    case 'badge': {
      const av = findAllowed(allowedValues, str);
      return (
        <span className="inline-flex items-center gap-1 text-xs font-semibold" style={{ ...valStyle, color: color || 'hsl(var(--primary))' }}>
          {av?.icon && <IconRenderer icon={av.icon} size={'sm'} />}
          {av?.label || str}
        </span>
      );
    }
    case 'number': {
      if (opNode) return opNode;
      const num = typeof value === 'number' ? formatNumber(value, !!useSuffix) : str;
      return <span className="text-sm font-bold font-mono" style={valStyle}>{num}</span>;
    }
    case 'color':
      return (
        <span className="flex items-center gap-1.5">
          <span className="h-3.5 w-3.5 rounded-full border" style={{ backgroundColor: str }} />
          <span className="text-xs font-mono text-muted-foreground">{str}</span>
        </span>
      );
    case 'icon':
      return <IconRenderer icon={str} size="md" />;
    case 'link': {
      const isValid = str.startsWith('http://') || str.startsWith('https://');
      return isValid ? (
        <a href={str} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline truncate max-w-full">{str.replace(/^https?:\/\//, '').slice(0, 28)}</a>
      ) : <span className="text-xs text-muted-foreground truncate max-w-full">{str}</span>;
    }
    case 'image': {
      const isValid = str.startsWith('http') || str.startsWith('data:');
      return isValid ? (
        <span className="relative block h-10 w-full rounded-md overflow-hidden border">
          <Image src={str} alt={label} fill className="object-cover" />
        </span>
      ) : <span className="text-xs text-muted-foreground">{str}</span>;
    }
    case 'rating': {
      const num = Number(value);
      const stars = isNaN(num) ? 0 : Math.round(Math.min(maxValue ?? 5, Math.max(0, num)));
      return (
        <span className="flex items-center gap-0.5">
          {Array.from({ length: maxValue ?? 5 }).map((_, i) => (
            <Star key={i} className={`h-3 w-3 ${i < stars ? 'text-yellow-400 fill-yellow-400' : 'text-muted-foreground/30'}`} />
          ))}
        </span>
      );
    }
    case 'progress': {
      const num = Number(value);
      const pct = isNaN(num) ? 0 : Math.min(100, Math.max(0, num));
      return (
        <span className="flex w-full items-center gap-1.5">
          <span className="h-1.5 flex-1 rounded-full bg-muted overflow-hidden">
            <span className="block h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
          </span>
          <span className="text-[10px] font-mono text-muted-foreground">{isNaN(num) ? String(value) : `${Math.round(num)}%`}</span>
        </span>
      );
    }
    case 'tags':
    case 'multi-select': {
      const arr = Array.isArray(value) ? value.map(String) : String(value).split(',').map(s => s.trim()).filter(Boolean);
      return (
        <span className="flex flex-wrap gap-1">
          {arr.slice(0, 3).map((t: string, i: number) => {
            const av = findAllowed(allowedValues, t);
            return <span key={i} className="rounded-full bg-primary/15 px-1.5 py-0.5 text-[10px] font-medium text-primary">{av?.label || t}</span>;
          })}
          {arr.length > 3 && <span className="text-[10px] text-muted-foreground">+{arr.length - 3}</span>}
        </span>
      );
    }
    case 'boolean': {
      const truthy = value === true || value === 'true' || value === 1 || value === '1';
      return <span className={`text-sm ${truthy ? 'text-emerald-400' : 'text-red-400'}`}>{truthy ? '✓' : '✗'}</span>;
    }
    case 'date': {
      const d = new Date(str);
      const valid = !isNaN(d.getTime());
      return <span className="text-xs text-foreground">{valid ? d.toLocaleDateString('pt-BR') : str}</span>;
    }
    case 'duration':
      return <span className="text-xs text-foreground">{String(value ?? '')}</span>;
    case 'file': {
      const isValid = str.startsWith('http');
      return isValid ? (
        <span className="inline-flex items-center gap-1 text-xs text-primary"><Download className="h-3 w-3" />{str.split('/').pop()}</span>
      ) : <span className="text-xs text-muted-foreground">{str}</span>;
    }
    case 'video':
      return <span className="inline-flex items-center gap-1 text-xs text-primary"><Play className="h-3 w-3" />Vídeo</span>;
    case 'audio':
      return <span className="inline-flex items-center gap-1 text-xs text-primary"><Music className="h-3 w-3" />Áudio</span>;
    case 'emoji':
      return <span className="text-xl leading-none">{str}</span>;
    case 'icon-set':
    case 'color-palette': {
      const arr = Array.isArray(value) ? value : [];
      if (format === 'color-palette') {
        return (
          <span className="flex gap-1">
            {arr.slice(0, 6).map((c: string, i: number) => <span key={i} className="h-3.5 w-3.5 rounded-full border" style={{ backgroundColor: String(c) }} />)}
          </span>
        );
      }
      return (
        <span className="flex gap-1">
          {arr.slice(0, 4).map((ic: string, i: number) => <span key={i} className="flex items-center justify-center h-5 w-5 rounded bg-muted/40"><IconRenderer icon={String(ic)} size={12} /></span>)}
        </span>
      );
    }
    case 'select':
    case 'toggle-group': {
      const av = findAllowed(allowedValues, str);
      const c = av?.color || color;
      return (
        <span className="inline-flex items-center gap-1 text-xs font-semibold" style={c ? { color: c } : {}}>
          {av?.icon && <IconRenderer icon={av.icon} size={'sm'} />}
          {av?.label || str}
        </span>
      );
    }
    case 'popover':
      return <span className="text-xs text-muted-foreground truncate max-w-full">{str}</span>;
    default:
      return opNode ?? <span className="text-xs text-foreground" style={valStyle}>{str}</span>;
  }
}

// ── Main component ────────────────────────────────────────
export default function FormatVariantRenderer({ format, variant, value, label, useSuffix, opEnabled, labelColor, valueColors, jsonbKeyColors, maxValue, allowedValues, onCompareClick, column, plain, icon, labelNode, animTrigger }: Props) {
  const n = v(variant);

  // For complex values (objects/arrays of objects), use variant-aware rendering.
  // Popover, jsonb and jsonb-structured have their own dedicated format handlers.
  if (isComplexValue(value) && format !== 'popover' && format !== 'jsonb' && format !== 'jsonb-structured') {
    const normalized = normalizeValue(value, useSuffix, opEnabled);
    return renderComplexValue(n, normalized, label, useSuffix, jsonbKeyColors, opEnabled, onCompareClick, column, labelColor, labelNode);
  }

  const str = opEnabled ? normalizeOperatorText(String(value ?? ''), useSuffix) : String(value ?? '');

  if (n === 1 && format !== 'badge' && format !== 'popover' && format !== 'jsonb' && format !== 'jsonb-structured' && !plain) {
    const rawContent = format === 'icon' && icon
      ? null
      : renderScalarMiniContent(format, value, str, label, labelColor, valueColors, allowedValues, maxValue, useSuffix, opEnabled);
    const animatedContent = animTrigger && rawContent !== null
      ? (
        <VariantAnimatedValue value={value} renderType={format} trigger={animTrigger} useSuffix={useSuffix}>
          {rawContent}
        </VariantAnimatedValue>
      )
      : rawContent;
    const accent = labelColor || valueColors?.[str] || 'hsl(var(--primary))';
    return (
      <MiniCard3D label={labelNode ?? label} color={accent} icon={icon} value={animatedContent} onClick={column && onCompareClick ? () => onCompareClick(column) : onCompareClick} className="group" />
    );
  }

  const rendered = (() => {
    switch (format) {
      case 'text':     return renderText(n, str, label, labelColor, valueColors);
      case 'badge':    return renderBadge(n, str, label, labelColor, valueColors);
      case 'number':
        if (typeof value === 'number') return renderNumber(n, formatNumber(value, !!useSuffix), label, labelColor, valueColors, String(value));
        return renderNumber(n, str, label, labelColor, valueColors);
      case 'color':    return renderColor(n, str, label, labelColor);
      case 'icon':     return renderIcon(n, str, label, labelColor);
      case 'link':     return renderLink(n, str, label, labelColor);
      case 'image':    return renderImage(n, str, label, labelColor);
      case 'rating':   return renderRating(n, value, label, labelColor, opEnabled, maxValue);
      case 'progress': return renderProgress(n, value, label, labelColor, opEnabled, maxValue);
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
      case 'select': return renderSelect(n, str, label, labelColor, allowedValues, valueColors);
      case 'multi-select': return renderMultiSelect(n, value, label, labelColor, valueColors, allowedValues);
      case 'toggle-group': return renderToggleGroup(n, str, label, labelColor, allowedValues, valueColors);
      case 'popover': {
        let popoverTitle = '';
        let popoverContent = str;
        let popoverTriggerMode: 'hover' | 'click' = 'hover';
        let popoverPosition: 'top' | 'bottom' | 'left' | 'right' = 'top';
        let popoverTriggerText = '';
        if (typeof value === 'string') {
          try {
            const parsed = JSON.parse(value);
            if (parsed && typeof parsed === 'object') {
              popoverTitle = parsed.title || '';
              popoverContent = parsed.content || str;
              popoverTriggerMode = parsed.trigger === 'click' ? 'click' : 'hover';
              popoverPosition = parsed.position || 'top';
              popoverTriggerText = parsed.triggerText || '';
            }
          } catch { /* not JSON, use raw string */ }
        }
        return <RenderPopover v={n} title={popoverTitle} content={popoverContent} labelColor={labelColor} triggerMode={popoverTriggerMode} position={popoverPosition} triggerText={popoverTriggerText} />;
      }
      case 'jsonb':
      case 'jsonb-structured': {
        const detectValue = typeof value === 'string' ? (() => { try { return JSON.parse(value); } catch { return value; } })() : value;
        if (typeof detectValue === 'object' && detectValue !== null) {
          ensureDetectorsRegistered();
          const normalizedForOp = opEnabled ? normalizeValue(detectValue, useSuffix, opEnabled) : detectValue;
          if (n > 1 && n <= 5) {
            return renderComplexValue(n, normalizedForOp, label, useSuffix, jsonbKeyColors, opEnabled, onCompareClick, column, labelColor, labelNode);
          }
          if (Array.isArray(normalizedForOp)) {
            return renderMiniCards(normalizedForOp, label, useSuffix, jsonbKeyColors, opEnabled, onCompareClick, column, labelColor, labelNode);
          }
          if (!plain) {
            const detector = findBestDetector(detectValue);
            if (detector) return detector.render({ value: detectValue, useSuffix }, n);
          }
          return renderMiniCards(normalizedForOp, label, useSuffix, jsonbKeyColors, opEnabled, onCompareClick, column, labelColor, labelNode);
        }
        return renderText(n, String(detectValue ?? ''), label, labelColor, valueColors);
      }
      default:         return renderText(n, str, label, labelColor, valueColors);
    }
  })();

  if (rendered === null) return null;
  if (!animTrigger) return rendered;

  const animRenderType = format === 'jsonb' || format === 'jsonb-structured' ? 'jsonb' : format;
  return (
    <VariantAnimatedValue value={value} renderType={animRenderType} trigger={animTrigger} useSuffix={useSuffix}>
      {rendered}
    </VariantAnimatedValue>
  );
}
