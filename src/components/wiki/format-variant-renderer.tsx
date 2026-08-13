'use client';

import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import {
  Star, Heart, ExternalLink, Clock, Download, Play, Info,
  FileIcon, Video, Music, CalendarIcon,
} from 'lucide-react';
import { IconRenderer } from '@/components/ui/icon-renderer';
import { BentoGrid } from '@/components/wiki/bento-grid';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import type { DisplayFormat } from '@/lib/column-types/format-compatibility';
import { ensureDetectorsRegistered } from '@/lib/jsonb-detectors';
import { normalizeOperatorText, normalizeValue, humanizeLabel, detectOpArray, renderOpMiniCards, parseOperatorPrefix, displayOpNum } from '@/lib/operator-symbols';
import { formatNumber } from '@/lib/format-number';
import { MiniCard3D } from '@/components/wiki/mini-card-3d';
import { VariantAnimatedValue } from '@/components/wiki/variant-animated-value';
import { Variant3D } from '@/components/wiki/variant-3d';
import { ElasticSlider3D } from '@/components/ui/elastic-slider-3d';
import { normalizeBaseMax } from '@/lib/scaling-engine';

import { BaseMaxValueNode } from '@/lib/scaling-context';
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
  opFlipped?: boolean;
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
  /** Previous (pre-variant-switch) value for this column — lets counters
   *  count from the old number and stars/progress animate from the old state. */
  prevValue?: unknown;
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
function renderText(v: number, str: string, label: string, labelColor?: string, valueColors?: Record<string, string>, trigger?: string) {
  const color = valueColors?.[str] || labelColor;
  const valStyle: React.CSSProperties = color ? { color } : {};
  if (v === 2) {
    return (
      <Row label={label} labelColor={labelColor}>
        <motion.code
          key={trigger}
          className="text-xs bg-muted rounded px-1.5 py-0.5 font-mono text-foreground"
          style={valStyle}
          initial={{ opacity: 0, scale: 0.85, rotateY: 15 }}
          animate={{ opacity: 1, scale: 1, rotateY: 0 }}
          transition={{ type: 'spring', stiffness: 200, damping: 16 }}
        >{str}</motion.code>
      </Row>
    );
  }
  if (v === 3) {
    return (
      <Row label={label} labelColor={labelColor}>
        <motion.span
          key={trigger}
          className="text-xs bg-muted/70 rounded px-1.5 py-0.5 text-foreground"
          style={valStyle}
          initial={{ opacity: 0, x: -8, skewX: -2 }}
          animate={{ opacity: 1, x: 0, skewX: 0 }}
          transition={{ type: 'spring', stiffness: 180, damping: 16 }}
        >{str}</motion.span>
      </Row>
    );
  }
  if (v === 4) {
    return (
      <Row label={label} labelColor={labelColor}>
        <motion.span
          key={trigger}
          className="text-xs border-l-2 border-primary pl-2 text-foreground"
          style={valStyle}
          initial={{ opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ type: 'spring', stiffness: 160, damping: 16 }}
        >{str}</motion.span>
      </Row>
    );
  }
  if (v === 5) {
    return (
      <Row label={label} labelColor={labelColor}>
        <motion.span
          key={trigger}
          className="text-xs font-semibold text-foreground"
          style={valStyle}
          initial={{ opacity: 0, scale: 0.9, y: -6 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 220, damping: 16 }}
        >{str}</motion.span>
      </Row>
    );
  }
  return (
    <Row label={label} labelColor={labelColor}>
      <motion.span
        key={trigger}
        className="text-xs text-foreground"
        style={valStyle}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >{str}</motion.span>
    </Row>
  );
}

// ── number ────────────────────────────────────────────────
function renderNumber(v: number, str: string, label: string, labelColor?: string, valueColors?: Record<string, string>, rawValue?: string, trigger?: string) {
  const color = valueColors?.[str] ?? (rawValue != null ? valueColors?.[rawValue] : undefined) ?? labelColor;
  const valStyle: React.CSSProperties = color ? { color } : {};
  const accent = color || 'hsl(var(--primary))';
  if (v === 2) {
    return (
      <Row label={label} labelColor={labelColor}>
        <motion.div
          key={trigger}
          className="relative font-mono text-xs font-bold text-foreground px-2 py-1 rounded-md"
          style={{
            ...valStyle,
            background: `linear-gradient(135deg, hsl(var(--card)), hsl(var(--muted)/0.4))`,
            boxShadow: `0 2px 8px -4px ${accent}44, inset 0 1px 0 rgba(255,255,255,0.06)`,
            perspective: '400px',
            transformStyle: 'preserve-3d',
          }}
          initial={{ opacity: 0, y: 8, rotateX: -5, scale: 0.92 }}
          animate={{ opacity: 1, y: 0, rotateX: 0, scale: 1 }}
          whileHover={{ rotateX: 8, rotateY: -6, translateZ: 12, scale: 1.04 }}
          transition={{ type: 'spring', stiffness: 200, damping: 14 }}
        >
          <span className="relative z-10">{str}</span>
          <span className="absolute inset-0 rounded-md bg-gradient-to-br from-transparent via-white/[0.02] to-transparent pointer-events-none" />
        </motion.div>
      </Row>
    );
  }
  if (v === 3) {
    return (
      <Row label={label} labelColor={labelColor}>
        <motion.span
          key={trigger}
          className="relative inline-block font-mono text-sm font-extrabold px-3 py-1 rounded-lg backdrop-blur-sm"
          style={{
            ...valStyle,
            color: accent,
            textShadow: `0 0 12px ${accent}88, 0 0 30px ${accent}44`,
            background: `linear-gradient(135deg, ${accent}15, ${accent}05)`,
            border: `1px solid ${accent}30`,
            boxShadow: `0 0 20px -4px ${accent}44, inset 0 0 20px -8px ${accent}22`,
          }}
          initial={{ opacity: 0, scale: 0.88, rotateY: 12 }}
          animate={{ opacity: 1, scale: 1, rotateY: 0 }}
          whileHover={{ scale: 1.06 }}
          transition={{ type: 'spring', stiffness: 200, damping: 14 }}
        >
          {str}
        </motion.span>
      </Row>
    );
  }
  if (v === 4) {
    const num = parseFloat(rawValue || str.replace(/[^0-9.,]/g, '').replace(',', '.'));
    const isValid = isFinite(num);
    const r = 30;
    const circumference = 2 * Math.PI * r;
    const fraction = isValid ? Math.min(1, num / 100) : 0;
    const dashOffset = circumference * (1 - fraction);
    return (
      <Row label={label} labelColor={labelColor}>
        <motion.div
          key={trigger}
          className="relative inline-flex items-center justify-center w-16 h-16"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', stiffness: 180, damping: 16 }}
        >
          <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 72 72">
            <circle cx="36" cy="36" r={r} fill="none" stroke="hsl(var(--muted))" strokeWidth="4" opacity="0.3" />
            {isValid && (
              <motion.circle
                cx="36" cy="36" r={r} fill="none"
                stroke={accent} strokeWidth="4" strokeLinecap="round"
                strokeDasharray={circumference}
                initial={{ strokeDashoffset: circumference }}
                animate={{ strokeDashoffset: dashOffset }}
                transition={{ duration: 1, ease: 'easeOut' }}
              />
            )}
          </svg>
          <motion.span
            className="relative z-10 font-mono text-xs font-bold"
            style={{ color: accent }}
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, duration: 0.4, ease: 'backOut' }}
          >
            {str}
          </motion.span>
        </motion.div>
      </Row>
    );
  }
  if (v === 5) {
    return (
      <Row label={label} labelColor={labelColor}>
        <motion.div
          key={trigger}
          className="relative font-mono text-xs font-extrabold px-3 py-1.5 rounded-xl"
          style={{
            ...valStyle,
            color: accent,
            background: `linear-gradient(135deg, ${accent}18, hsl(var(--card)), ${accent}10)`,
            border: `1px solid ${accent}30`,
            boxShadow: `0 4px 16px -6px ${accent}66, 0 0 30px -8px ${accent}33, inset 0 1px 0 rgba(255,255,255,0.08)`,
            perspective: '500px',
            transformStyle: 'preserve-3d',
          }}
          initial={{ opacity: 0, y: -10, rotateX: 5, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, rotateX: 0, scale: 1 }}
          whileHover={{ rotateX: 6, rotateY: 10, scale: 1.05, translateZ: 16 }}
          transition={{ type: 'spring', stiffness: 200, damping: 14 }}
        >
          <span className="relative z-10 bg-gradient-to-r from-current via-current to-current/70 bg-clip-text">{str}</span>
          <span className="absolute inset-0 rounded-xl bg-gradient-to-br from-white/[0.04] via-transparent to-black/[0.04] pointer-events-none" />
        </motion.div>
      </Row>
    );
  }
  return (
    <Row label={label} labelColor={labelColor}>
      <motion.span
        key={trigger}
        className="text-xs font-mono text-foreground"
        style={valStyle}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >{str}</motion.span>
    </Row>
  );
}

// ── badge ─────────────────────────────────────────────────
function renderBadge(v: number, str: string, label: string, labelColor?: string, valueColors?: Record<string, string>, trigger?: string) {
  const color = valueColors?.[str] || labelColor;
  const valStyle: React.CSSProperties = color ? { color, borderColor: color, backgroundColor: `${color}1a` } : {};
  if (v === 2) {
    return (
      <Row label={label} labelColor={labelColor}>
        <motion.span
          key={trigger}
          className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium bg-primary/20 text-primary"
          style={valStyle}
          initial={{ opacity: 0, scale: 0.7, rotateY: 10 }}
          animate={{ opacity: 1, scale: 1, rotateY: 0 }}
          transition={{ type: 'spring', stiffness: 220, damping: 16 }}
        >{str}</motion.span>
      </Row>
    );
  }
  if (v === 3) {
    return (
      <Row label={label} labelColor={labelColor}>
        <motion.span
          key={trigger}
          className="inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-medium bg-muted/30 border-border text-foreground"
          style={valStyle}
          initial={{ opacity: 0, x: -6, scaleX: 0.8 }}
          animate={{ opacity: 1, x: 0, scaleX: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 16 }}
        >{str}</motion.span>
      </Row>
    );
  }
  if (v === 4) {
    return (
      <Row label={label} labelColor={labelColor}>
        <motion.span
          key={trigger}
          className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium border border-primary/40 text-primary shadow-[0_0_8px] shadow-primary/30"
          style={valStyle}
          initial={{ opacity: 0, scale: 0.85, rotateX: -10 }}
          animate={{ opacity: 1, scale: 1, rotateX: 0 }}
          transition={{ type: 'spring', stiffness: 200, damping: 16 }}
        >{str}</motion.span>
      </Row>
    );
  }
  if (v === 5) {
    return (
      <Row label={label} labelColor={labelColor}>
        <motion.span
          key={trigger}
          className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium bg-primary/10 border border-primary/30 text-primary"
          style={valStyle}
          initial={{ opacity: 0, scale: 0.8, y: 4 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 220, damping: 16 }}
        >
          <span className="text-[10px]">✦</span>
          {str}
        </motion.span>
      </Row>
    );
  }
  return (
    <Row label={label} labelColor={labelColor}>
      <motion.span
        key={trigger}
        className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium bg-primary/10 border-primary/30 text-primary"
        style={valStyle}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >{str}</motion.span>
    </Row>
  );
}

// ── color ─────────────────────────────────────────────────
function renderColor(v: number, str: string, label: string, labelColor?: string, trigger?: string) {
  const isColor = str.startsWith('#') || str.startsWith('hsl') || str.startsWith('rgb');
  if (v === 2) {
    return (
      <Row label={label} labelColor={labelColor}>
        <motion.div
          key={trigger}
          className="h-5 w-5 rounded-md border"
          style={{ backgroundColor: str }}
          initial={{ opacity: 0, scale: 0.5, rotateY: 15 }}
          animate={{ opacity: 1, scale: 1, rotateY: 0 }}
          transition={{ type: 'spring', stiffness: 220, damping: 14 }}
        />
        {isColor && <span className="text-xs font-mono text-muted-foreground">{str}</span>}
      </Row>
    );
  }
  if (v === 3) {
    return (
      <Row label={label} labelColor={labelColor}>
        <motion.div
          key={trigger}
          className="flex-1 h-5 rounded border max-w-[120px]"
          style={{ backgroundColor: str }}
          initial={{ opacity: 0, scaleX: 0.6 }}
          animate={{ opacity: 1, scaleX: 1 }}
          transition={{ type: 'spring', stiffness: 180, damping: 16 }}
        />
        {isColor && <span className="text-xs font-mono text-muted-foreground">{str}</span>}
      </Row>
    );
  }
  if (v === 4) {
    return (
      <Row label={label} labelColor={labelColor}>
        <motion.div
          key={trigger}
          className="h-2.5 w-2.5 rounded-full border"
          style={{ backgroundColor: str }}
          initial={{ opacity: 0, scale: 0.3 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 14 }}
        />
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
          <motion.div
            key={trigger}
            className="h-5 w-24 rounded border"
            style={{ background: gradient }}
            initial={{ opacity: 0, scaleX: 0.5 }}
            animate={{ opacity: 1, scaleX: 1 }}
            transition={{ type: 'spring', stiffness: 160, damping: 16 }}
          />
          <span className="text-[10px] font-mono text-muted-foreground">{colors.length} cores</span>
        </Row>
      );
    }
  }
  return (
    <Row label={label} labelColor={labelColor}>
      <motion.div
        key={trigger}
        className="h-5 w-5 rounded-full border"
        style={{ backgroundColor: str }}
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
      />
      {isColor && <span className="text-xs font-mono text-muted-foreground">{str}</span>}
    </Row>
  );
}

// ── icon ──────────────────────────────────────────────────
function renderIcon(v: number, str: string, label: string, labelColor?: string, trigger?: string) {
  if (v === 2) {
    return (
      <Row label={label} labelColor={labelColor}>
        <motion.div
          key={trigger}
          className="flex items-center justify-center h-7 w-7 rounded-full bg-muted/50"
          initial={{ opacity: 0, scale: 0.5, rotateZ: -15 }}
          animate={{ opacity: 1, scale: 1, rotateZ: 0 }}
          transition={{ type: 'spring', stiffness: 260, damping: 14 }}
        >
          <IconRenderer icon={str} size="sm" />
        </motion.div>
      </Row>
    );
  }
  if (v === 3) {
    return (
      <Row label={label} labelColor={labelColor}>
        <motion.div
          key={trigger}
          initial={{ opacity: 0, scale: 0.7, rotateY: -20 }}
          animate={{ opacity: 1, scale: 1, rotateY: 0 }}
          transition={{ type: 'spring', stiffness: 220, damping: 16 }}
        >
          <IconRenderer icon={str} size="lg" />
        </motion.div>
      </Row>
    );
  }
  if (v === 4) {
    return (
      <Row label={label} labelColor={labelColor}>
        <motion.div
          key={trigger}
          initial={{ opacity: 0, x: -6 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ type: 'spring', stiffness: 200, damping: 16 }}
        >
          <IconRenderer icon={str} size="sm" />
        </motion.div>
        <span className="text-xs text-muted-foreground">{str}</span>
      </Row>
    );
  }
  if (v === 5) {
    return (
      <Row label={label} labelColor={labelColor}>
        <motion.div
          key={trigger}
          className="flex items-center justify-center h-8 w-8 rounded-lg border bg-muted/20"
          initial={{ opacity: 0, scale: 0.6, rotateY: -25 }}
          animate={{ opacity: 1, scale: 1, rotateY: 0 }}
          transition={{ type: 'spring', stiffness: 240, damping: 16 }}
        >
          <IconRenderer icon={str} size="md" />
        </motion.div>
      </Row>
    );
  }
  return (
    <Row label={label} labelColor={labelColor}>
      <motion.div
        key={trigger}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <IconRenderer icon={str} size="md" />
      </motion.div>
    </Row>
  );
}

// ── link ──────────────────────────────────────────────────
function renderLink(v: number, str: string, label: string, labelColor?: string, trigger?: string) {
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
          <motion.a
            key={trigger}
            href={str}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-medium text-primary border-primary/30 hover:bg-primary/5 transition-colors"
            initial={{ opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ type: 'spring', stiffness: 200, damping: 16 }}
          >
            {str.replace(/^https?:\/\//, '').replace(/\/$/, '').slice(0, 40)}
          </motion.a>
        ) : content}
      </Row>
    );
  }
  if (v === 3) {
    return (
      <Row label={label} labelColor={labelColor}>
        {isValid ? (
          <motion.a
            key={trigger}
            href={str}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-primary hover:underline inline-flex items-center gap-1 truncate max-w-[300px]"
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ type: 'spring', stiffness: 180, damping: 16 }}
          >
            {str}
            <ExternalLink className="h-3 w-3 shrink-0" />
          </motion.a>
        ) : content}
      </Row>
    );
  }
  if (v === 4) {
    return (
      <Row label={label} labelColor={labelColor}>
        {isValid ? (
          <motion.div
            key={trigger}
            className="rounded-md border bg-muted/20 px-3 py-1.5 max-w-[300px]"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 180, damping: 16 }}
          >
            <p className="text-[10px] text-muted-foreground truncate">{str.replace(/^https?:\/\//, '').replace(/\/$/, '')}</p>
            <a href={str} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline">Abrir link</a>
          </motion.div>
        ) : content}
      </Row>
    );
  }
  if (v === 5) {
    return (
      <Row label={label} labelColor={labelColor}>
        {isValid ? (
          <motion.a
            key={trigger}
            href={str}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-primary no-underline hover:text-primary/80 transition-colors truncate max-w-[300px]"
            initial={{ opacity: 0, x: -4 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ type: 'spring', stiffness: 200, damping: 16 }}
          >{str}</motion.a>
        ) : content}
      </Row>
    );
  }
  return (
    <Row label={label} labelColor={labelColor}>
      {isValid ? (
        <motion.a
          key={trigger}
          href={str}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-primary hover:underline truncate max-w-[300px]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >{str}</motion.a>
      ) : (
        <span className="text-xs text-muted-foreground">{str}</span>
      )}
    </Row>
  );
}

// ── image ─────────────────────────────────────────────────
function renderImage(v: number, str: string, label: string, labelColor?: string, trigger?: string) {
  const isValid = str.startsWith('http://') || str.startsWith('https://') || str.startsWith('data:');

  if (v === 2) {
    return (
      <Row label={label} labelColor={labelColor} className="items-start">
        {isValid ? (
          <motion.div
            key={trigger}
            className="relative w-14 h-14 rounded-full overflow-hidden border shrink-0"
            initial={{ opacity: 0, scale: 0.7, rotateY: -10 }}
            animate={{ opacity: 1, scale: 1, rotateY: 0 }}
            transition={{ type: 'spring', stiffness: 200, damping: 16 }}
          >
            <Image src={str} alt={label} fill className="object-cover" />
          </motion.div>
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
          <motion.div
            key={trigger}
            className="relative w-20 h-20 rounded-lg overflow-hidden border shadow-lg"
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', stiffness: 180, damping: 16 }}
          >
            <Image src={str} alt={label} fill className="object-cover" />
          </motion.div>
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
          <motion.div
            key={trigger}
            className="relative w-20 h-20 rounded overflow-hidden border bg-white p-1 shadow-md"
            initial={{ opacity: 0, y: 6, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ type: 'spring', stiffness: 180, damping: 16 }}
          >
            <div className="relative w-full h-full">
              <Image src={str} alt={label} fill className="object-cover" />
            </div>
          </motion.div>
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
          <motion.div
            key={trigger}
            className="relative w-full h-32 rounded-lg overflow-hidden border"
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', stiffness: 160, damping: 16 }}
          >
            <Image src={str} alt={label} fill className="object-cover" />
          </motion.div>
        ) : (
          <span className="text-xs text-muted-foreground">{str}</span>
        )}
      </ColWrap>
    );
  }
  return (
    <Row label={label} labelColor={labelColor} className="items-start">
      {isValid ? (
        <motion.div
          key={trigger}
          className="relative w-20 h-20 rounded-lg overflow-hidden border"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <Image src={str} alt={label} fill className="object-cover" />
        </motion.div>
      ) : (
        <span className="text-xs text-muted-foreground">{str}</span>
      )}
    </Row>
  );
}

// ── rating ────────────────────────────────────────────────
function renderRating(v: number, val: unknown, label: string, labelColor?: string, opEnabled?: boolean, opFlipped?: boolean, maxValue = 5, animatedStars?: number, prevStars?: number, trigger?: string) {
  const num = Number(val);
  const stars = animatedStars ?? (isNaN(num) ? 0 : Math.round(Math.min(maxValue, Math.max(0, num))));
  const prev = prevStars ?? stars;
  const isAnimating = animatedStars !== undefined && prevStars !== undefined && prev !== stars;

  // OP handling for operator-prefixed values
  if (opEnabled && typeof val === 'string') {
    const op = parseOperatorPrefix(val);
    if (op) {
      const displayNum = displayOpNum(op.number, true);
      const opContent = <><span className="text-primary font-bold">{op.symbol}</span>{displayNum}<span className="text-muted-foreground ml-0.5">/{maxValue}</span></>;
      if (v === 1) return <Row label={label} labelColor={labelColor}><span className="text-sm font-bold font-mono">{opContent}</span></Row>;
      return <Row label={label} labelColor={labelColor}><span className="text-xs font-mono">{opContent}</span></Row>;
    }
  }

  const fraction = !isNaN(num) && opEnabled ? `${num}/${maxValue}` : '';

  if (v === 2) {
    return (
      <Row label={label} labelColor={labelColor}>
        <motion.div key={trigger} className="flex gap-0.5" style={{ perspective: '400px' }}>
          {Array.from({ length: maxValue }).map((_, i) => {
            const isFilled = i < stars;
            const wasFilled = i < prev;
            const changed = isFilled !== wasFilled;
            const gained = changed && isFilled;
            const lost = changed && !isFilled;
            return (
              <motion.span
                key={`heart-${trigger}-${i}-${isFilled ? 'on' : 'off'}`}
                initial={isAnimating && gained
                  ? { rotateY: -180, scale: 0.25, opacity: 0 }
                  : isAnimating && lost
                    ? { rotateY: 160, scale: 0.6, opacity: 0.35 }
                    : { rotateY: -90, scale: 0.5, opacity: 0 }}
                animate={{ rotateY: 0, scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20, delay: changed ? i * 0.06 : 0 }}
                style={{ display: 'inline-flex', transformStyle: 'preserve-3d' }}
              >
                <Heart className={`h-3.5 w-3.5 ${isFilled ? 'text-red-400 fill-red-400' : 'text-muted-foreground/30'}`} />
              </motion.span>
            );
          })}
          {fraction && <span className="text-[10px] text-muted-foreground ml-1">{fraction}</span>}
          {!fraction && isNaN(num) && <span className="text-xs text-muted-foreground ml-1">{String(val)}</span>}
        </motion.div>
      </Row>
    );
  }
  if (v === 3) {
    return (
      <Row label={label} labelColor={labelColor}>
        <motion.span
          key={trigger}
          className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium bg-amber-500/10 border-amber-500/30 text-amber-400"
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', stiffness: 220, damping: 16 }}
        >
          {isNaN(num) ? String(val) : `${num}/${maxValue}`}
        </motion.span>
      </Row>
    );
  }
  if (v === 4) {
    const pct = isNaN(num) ? 0 : Math.min(100, Math.max(0, (num / maxValue) * 100));
    return (
      <Row label={label} labelColor={labelColor}>
        <motion.div key={trigger} className="flex items-center gap-2">
          <div className="w-20 h-2 rounded-full bg-muted overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-amber-400"
              initial={{ width: "0%" }}
              animate={{ width: `${pct}%` }}
              transition={{ type: 'spring', stiffness: 90, damping: 20 }}
            />
          </div>
          <span className="text-xs font-mono text-muted-foreground">{isNaN(num) ? String(val) : `${num}/${maxValue}`}</span>
        </motion.div>
      </Row>
    );
  }
  if (v === 5) {
    const displayVal = animatedStars !== undefined ? animatedStars : (isNaN(num) ? '?' : num);
    return (
      <ColWrap label={label} labelColor={labelColor}>
        <div className="flex items-baseline gap-0.5">
          <motion.span
            key={trigger || (animatedStars !== undefined ? animatedStars : num)}
            className="text-3xl font-bold text-amber-400"
            initial={{ opacity: 0, scale: 0.5, rotateY: -90 }}
            animate={{ opacity: 1, scale: 1, rotateY: 0 }}
            transition={{ type: 'spring', stiffness: 250, damping: 18 }}
            style={{ display: 'inline-block', transformStyle: 'preserve-3d' }}
          >
            {displayVal}
          </motion.span>
          <span className="text-sm text-muted-foreground">/{maxValue}</span>
        </div>
      </ColWrap>
    );
  }
  return (
    <Row label={label} labelColor={labelColor}>
      <motion.div key={trigger} className="flex gap-0.5 items-center" style={{ perspective: '400px' }}>
        {Array.from({ length: maxValue }).map((_, i) => {
          const isFilled = i < stars;
          const wasFilled = i < prev;
          const changed = isFilled !== wasFilled;
          const gained = changed && isFilled;
          const lost = changed && !isFilled;
          return (
            <motion.span
              key={`star-${trigger}-${i}-${isFilled ? 'on' : 'off'}`}
              initial={isAnimating && gained
                ? { rotateY: -180, scale: 0.25, opacity: 0 }
                : isAnimating && lost
                  ? { rotateY: 160, scale: 0.6, opacity: 0.35 }
                  : { rotateY: -90, scale: 0.5, opacity: 0 }}
              animate={{ rotateY: 0, scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20, delay: changed ? i * 0.06 : 0 }}
              style={{ display: 'inline-flex', transformStyle: 'preserve-3d' }}
            >
              <Star className={`h-3.5 w-3.5 ${isFilled ? 'text-yellow-400 fill-yellow-400' : 'text-muted-foreground/30'}`} />
            </motion.span>
          );
        })}
        {fraction && <span className="text-[10px] text-muted-foreground ml-1">{fraction}</span>}
        {!fraction && isNaN(num) && <span className="text-xs text-muted-foreground ml-1">{String(val)}</span>}
      </motion.div>
    </Row>
  );
}

// ── progress ──────────────────────────────────────────────
function renderProgress(v: number, val: unknown, label: string, labelColor?: string, opEnabled?: boolean, opFlipped?: boolean, maxValue = 100, animatedPct?: number, prevPct?: number, trigger?: string) {
  const num = Number(val);
  const clamped = isNaN(num) ? 0 : Math.min(maxValue, Math.max(0, num));
  const normalizedPct = maxValue > 0 ? (clamped / maxValue) * 100 : 0;
  const displayPct = animatedPct ?? normalizedPct;
  const prevPctVal = prevPct ?? displayPct;

  // OP handling for operator-prefixed values
  if (opEnabled && typeof val === 'string') {
    const op = parseOperatorPrefix(val);
    if (op) {
      const displayNum = displayOpNum(op.number, true);
      const opContent = <><span className="text-primary font-bold">{op.symbol}</span>{displayNum}{maxValue === 100 ? '%' : `/${maxValue}`}</>;
      if (v === 1) return <Row label={label} labelColor={labelColor}><span className="text-sm font-bold font-mono">{opContent}</span></Row>;
      return <Row label={label} labelColor={labelColor}><span className="text-xs font-mono">{opContent}</span></Row>;
    }
  }

  const displayText = isNaN(num) ? String(val) : maxValue === 100 ? `${Math.round(displayPct)}%` : `${num}/${maxValue}`;

  if (v === 2) {
    return (
      <Row label={label} labelColor={labelColor}>
        <motion.div key={trigger} className="flex-1 flex items-center gap-2 max-w-[200px]">
          <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-primary"
              initial={{ width: "0%" }}
              animate={{ width: `${displayPct}%` }}
              transition={{ type: 'spring', stiffness: 90, damping: 20 }}
              style={{ backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 3px, rgba(255,255,255,0.15) 3px, rgba(255,255,255,0.15) 6px)' }}
            />
          </div>
          <span className="text-xs font-mono text-muted-foreground">{displayText}</span>
        </motion.div>
      </Row>
    );
  }
  if (v === 3) {
    return (
      <Row label={label} labelColor={labelColor}>
        <motion.div key={trigger} className="flex-1 flex items-center gap-2 max-w-[200px]">
          <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-primary to-primary/60"
              initial={{ width: "0%" }}
              animate={{ width: `${displayPct}%` }}
              transition={{ type: 'spring', stiffness: 90, damping: 20 }}
            />
          </div>
          <span className="text-xs font-mono text-muted-foreground">{displayText}</span>
        </motion.div>
      </Row>
    );
  }
  if (v === 4) {
    const segments = 5;
    const filled = Math.round((displayPct / 100) * segments);
    const prevFilled = Math.round((prevPctVal / 100) * segments);
    return (
      <Row label={label} labelColor={labelColor}>
        <motion.div key={trigger} className="flex gap-0.5 items-center">
          {Array.from({ length: segments }).map((_, i) => {
            const changed = (i < filled) !== (i < prevFilled);
            return (
              <motion.div
                key={i}
                className={`h-4 w-3 rounded-sm ${i < filled ? 'bg-primary' : 'bg-muted'}`}
                initial={{ scale: 0.4, opacity: 0.3 }}
                animate={{ scale: 1, opacity: i < filled ? 1 : 0.4 }}
                transition={{ type: 'spring', stiffness: 300, damping: 18, delay: changed ? i * 0.05 : 0 }}
              />
            );
          })}
          <span className="text-xs font-mono text-muted-foreground ml-1">{displayText}</span>
        </motion.div>
      </Row>
    );
  }
  if (v === 5) {
    const r = 14;
    const circumference = 2 * Math.PI * r;
    const offset = circumference - (displayPct / 100) * circumference;
    return (
      <Row label={label} labelColor={labelColor}>
        <motion.div key={trigger} className="relative h-10 w-10">
          <svg className="h-10 w-10 -rotate-90" viewBox="0 0 32 32">
            <circle cx="16" cy="16" r={r} fill="none" stroke="hsl(var(--muted))" strokeWidth="3" />
            <motion.circle
              cx="16" cy="16" r={r} fill="none" stroke="hsl(var(--primary))" strokeWidth="3"
              strokeDasharray={circumference}
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset: offset }}
              transition={{ type: 'spring', stiffness: 80, damping: 20 }}
              strokeLinecap="round"
            />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center text-[9px] font-bold text-foreground">
            {isNaN(num) ? '?' : displayText}
          </span>
        </motion.div>
      </Row>
    );
  }
  return (
    <Row label={label} labelColor={labelColor}>
      <div className="flex-1 flex items-center gap-2">
        <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden max-w-[200px]">
          <motion.div
            className="h-full rounded-full bg-primary"
            initial={{ width: "0%" }}
            animate={{ width: `${displayPct}%` }}
            transition={{ type: 'spring', stiffness: 90, damping: 20 }}
          />
        </div>
        <span className="text-xs font-mono text-muted-foreground">{displayText}</span>
      </div>
    </Row>
  );
}

// ── slider (elastic) ──────────────────────────────────────
function renderSlider(v: number, val: unknown, label: string, labelColor?: string, opEnabled?: boolean, opFlipped?: boolean, maxValue = 100, useSuffix?: boolean, trigger?: string) {
  const num = Number(val);
  const clamped = isNaN(num) ? 0 : Math.min(maxValue, Math.max(0, num));

  // OP handling for operator-prefixed values
  if (opEnabled && typeof val === 'string') {
    const op = parseOperatorPrefix(val);
    if (op) {
      const displayNum = displayOpNum(op.number, !!useSuffix);
      const opContent = <><span className="text-primary font-bold">{op.symbol}</span>{displayNum}{maxValue === 100 && !useSuffix ? '' : `/${maxValue}`}</>;
      if (v === 1) return <Row label={label} labelColor={labelColor}><span className="text-sm font-bold font-mono">{opContent}</span></Row>;
      return <Row label={label} labelColor={labelColor}><span className="text-xs font-mono">{opContent}</span></Row>;
    }
  }

  // The elastic slider is a read-only display here (no persistence); the
  // hover/elastic + variant-entry motion supplies the slider animation.
  return (
    <Row label={label} labelColor={labelColor}>
      <div className="w-full max-w-[220px]">
        <ElasticSlider3D
          key={`slider-${trigger ?? ''}`}
          defaultValue={clamped}
          maxValue={maxValue}
          showValue={true}
          valueSuffix={useSuffix ? '%' : ''}
        />
      </div>
    </Row>
  );
}

// ── tags ──────────────────────────────────────────────────
function renderTags(v: number, val: unknown, label: string, labelColor?: string, trigger?: string) {
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
function renderBoolean(v: number, val: unknown, label: string, labelColor?: string, trigger?: string) {
  const truthy = val === true || val === 'true' || val === 1 || val === '1' || val === 'yes' || val === 'sim';
  const falsy = val === false || val === 'false' || val === 0 || val === '0' || val === 'no' || val === 'não' || val === 'nao';

  if (v === 2) {
    return (
      <Row label={label} labelColor={labelColor}>
        <motion.span
          key={trigger}
          className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium ${truthy
            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
            : falsy
              ? 'bg-red-500/10 border-red-500/30 text-red-400'
              : 'bg-muted/30 border-border text-muted-foreground'
          }`}
          initial={{ opacity: 0, scale: 0.7 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', stiffness: 250, damping: 14 }}
        >
          {truthy ? 'ON' : falsy ? 'OFF' : String(val)}
        </motion.span>
      </Row>
    );
  }
  if (v === 3) {
    return (
      <Row label={label} labelColor={labelColor}>
        <motion.div
          key={trigger}
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', stiffness: 280, damping: 14 }}
        >
          <div className={`h-3 w-3 rounded-full ${truthy ? 'bg-emerald-500' : falsy ? 'bg-red-400' : 'bg-muted'}`} />
        </motion.div>
        <span className={`text-xs ${truthy ? 'text-emerald-500' : falsy ? 'text-red-400' : 'text-muted-foreground'}`}>
          {truthy ? 'Sim' : falsy ? 'Não' : String(val)}
        </span>
      </Row>
    );
  }
  if (v === 4) {
    return (
      <Row label={label} labelColor={labelColor}>
        <motion.div
          key={trigger}
          className={`relative h-4 w-8 rounded-full transition-colors ${truthy ? 'bg-emerald-500' : 'bg-muted'}`}
          initial={{ opacity: 0, scaleX: 0.6 }}
          animate={{ opacity: 1, scaleX: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 16 }}
        >
          <motion.div
            className={`absolute top-0.5 h-3 w-3 rounded-full bg-white shadow-sm transition-transform ${truthy ? 'translate-x-[18px]' : 'translate-x-0.5'}`}
            initial={{ x: truthy ? 2 : 18 }}
            animate={{ x: truthy ? 18 : 2 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          />
        </motion.div>
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
function renderDate(v: number, val: unknown, label: string, labelColor?: string, trigger?: string) {
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
function renderDuration(v: number, val: unknown, label: string, labelColor?: string, trigger?: string) {
  const str = String(val ?? '');
  let display = str;
  if (/^\d{1,4}(:\d{2}){0,3}$/.test(str)) {
    const parts = str.split(':').map(Number);
    let d = 0, h = 0, m = 0, s = 0;
    if (parts.length === 4) { d = parts[0]; h = parts[1]; m = parts[2]; s = parts[3]; }
    else if (parts.length === 3) { h = parts[0]; m = parts[1]; s = parts[2]; }
    else if (parts.length === 2) { m = parts[0]; s = parts[1]; }
    else { s = parts[0]; }
    const partsLabel: string[] = [];
    if (d > 0) partsLabel.push(`${d}d`);
    if (h > 0) partsLabel.push(`${h}h`);
    if (m > 0) partsLabel.push(`${m}m`);
    if (s > 0 || partsLabel.length === 0) partsLabel.push(`${s}s`);
    display = partsLabel.join(' ');
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
function renderFile(v: number, str: string, label: string, labelColor?: string, trigger?: string) {
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
function renderVideo(v: number, str: string, label: string, labelColor?: string, trigger?: string) {
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
function renderAudio(v: number, str: string, label: string, labelColor?: string, trigger?: string) {
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
function renderEmoji(v: number, str: string, label: string, labelColor?: string, trigger?: string) {
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
function renderIconSet(v: number, val: unknown, label: string, labelColor?: string, trigger?: string) {
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
function renderColorPalette(v: number, val: unknown, label: string, labelColor?: string, trigger?: string) {
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
function renderMultiSelect(v: number, val: unknown, label: string, labelColor?: string, valueColors?: Record<string, string>, allowedValues?: AllowedValue[], trigger?: string) {
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
function renderSelect(v: number, str: string, label: string, labelColor?: string, allowedValues?: AllowedValue[], valueColors?: Record<string, string>, trigger?: string) {
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
function renderToggleGroup(v: number, str: string, label: string, labelColor?: string, allowedValues?: AllowedValue[], valueColors?: Record<string, string>, trigger?: string) {
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
function RenderPopover({ v, title, content, label, labelColor, triggerMode, position, triggerText }: {
  v: number;
  title: string;
  content: string;
  label?: string;
  labelColor?: string;
  triggerMode?: 'hover' | 'click';
  position?: 'top' | 'bottom' | 'left' | 'right';
  triggerText?: string;
}) {
  const [open, setOpen] = useState(false);
  const showEvent = triggerMode === 'click'
    ? { onClick: () => setOpen(!open) }
    : { onMouseEnter: () => setOpen(true), onMouseLeave: () => setOpen(false) };
  const side = position === 'bottom' ? 'bottom' : position === 'left' ? 'left' : position === 'right' ? 'right' : 'top';
  const sideOffset = 6;
  const displayLabel = triggerText || label || title || content;

  const renderTrigger = () => {
    if (v === 1) {
      const accent = labelColor || 'hsl(var(--primary))';
      return (
        <motion.button
          type="button"
          className="relative w-full overflow-hidden rounded-xl border bg-card/70 p-2.5 text-xs shadow-sm backdrop-blur-md cursor-pointer"
          style={{ borderColor: `${accent}55`, perspective: '700px', transformStyle: 'preserve-3d' }}
          whileHover={{ scale: 1.02, rotateX: 3, rotateY: -3, boxShadow: `0 12px 24px -12px ${accent}` }}
          whileTap={{ scale: 0.98 }}
          {...showEvent}
        >
          {title && (
            <span className="block text-[10px] font-semibold uppercase tracking-wider truncate" style={{ color: accent }}>
              {title}
            </span>
          )}
          <span className="inline-flex items-center gap-1.5 font-medium text-foreground max-w-full" style={{ transform: 'translateZ(18px)' }}>
            <Info className="h-3.5 w-3.5 shrink-0" style={{ color: accent }} />
            <span className="truncate min-w-0">{content || '—'}</span>
          </span>
        </motion.button>
      );
    }
    if (v === 2) {
      return (
        <motion.button
          type="button"
          className="inline-flex items-center gap-1.5 cursor-pointer rounded-xl bg-gradient-to-br from-card/90 to-card/60 border border-border/40 px-3 py-1.5 text-xs font-medium text-foreground backdrop-blur-sm shadow-md"
          style={labelColor ? { borderColor: labelColor } : {}}
          whileHover={{ scale: 1.03, rotateX: 4, rotateY: -4, boxShadow: '0 12px 28px -8px rgba(0,0,0,0.25)' }}
          whileTap={{ scale: 0.97 }}
          {...showEvent}
        >
          <span className="relative flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-[10px] text-primary shrink-0">
            <Info className="h-3 w-3" />
          </span>
          <span className="truncate max-w-[180px]">{displayLabel}</span>
        </motion.button>
      );
    }
    if (v === 3) {
      return (
        <motion.button
          type="button"
          className="inline-flex items-center gap-1.5 cursor-pointer rounded-full bg-gradient-to-r from-primary/15 via-primary/5 to-primary/15 border border-primary/25 px-4 py-1 text-xs font-semibold text-primary shadow-[0_0_14px_-4px_currentColor] backdrop-blur-sm"
          whileHover={{ scale: 1.06, boxShadow: '0 0 22px -2px currentColor' }}
          whileTap={{ scale: 0.95 }}
          animate={{ boxShadow: ['0 0 10px -4px currentColor', '0 0 18px -4px currentColor', '0 0 10px -4px currentColor'] }}
          transition={{ duration: 3, repeat: Infinity }}
          {...showEvent}
        >
          <Info className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate max-w-[180px]">{displayLabel}</span>
        </motion.button>
      );
    }
    if (v === 4) {
      return (
        <motion.button
          type="button"
          className="inline-flex items-center gap-2 cursor-pointer rounded-2xl bg-card border border-border/40 px-4 py-2 text-sm font-medium text-foreground shadow-lg backdrop-blur-sm"
          style={labelColor ? { borderColor: labelColor } : {}}
          whileHover={{ scale: 1.04, boxShadow: '0 16px 32px -12px rgba(0,0,0,0.3)' }}
          whileTap={{ scale: 0.96 }}
          animate={{ y: [0, -2, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          {...showEvent}
        >
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary/60 text-white text-[10px] shadow-md">
            <Info className="h-3 w-3" />
          </span>
          <span className="truncate max-w-[180px]">{displayLabel}</span>
        </motion.button>
      );
    }
    if (v === 5) {
      return (
        <motion.button
          type="button"
          className="inline-flex items-center gap-2 cursor-pointer rounded-xl bg-gradient-to-br from-primary/20 via-card to-secondary/20 border border-primary/20 px-4 py-2 text-sm font-bold text-foreground shadow-xl backdrop-blur-sm"
          whileHover={{ scale: 1.05, rotateZ: 1, boxShadow: '0 20px 40px -16px rgba(0,0,0,0.35)' }}
          whileTap={{ scale: 0.95 }}
          animate={{ backgroundImage: [
            'linear-gradient(135deg, hsl(var(--primary)/0.2), hsl(var(--card)), hsl(var(--secondary)/0.2))',
            'linear-gradient(135deg, hsl(var(--secondary)/0.2), hsl(var(--card)), hsl(var(--primary)/0.2))',
            'linear-gradient(135deg, hsl(var(--primary)/0.2), hsl(var(--card)), hsl(var(--secondary)/0.2))',
          ]}}
          transition={{ duration: 6, repeat: Infinity }}
          {...showEvent}
        >
          <span className="relative flex h-7 w-7 items-center justify-center rounded-lg bg-primary/15 text-primary shadow-inner">
            <Info className="h-3.5 w-3.5" />
            <span className="absolute inset-0 rounded-lg bg-gradient-to-tr from-transparent via-white/10 to-transparent" />
          </span>
          <span className="truncate max-w-[170px]">{displayLabel}</span>
        </motion.button>
      );
    }
    return (
      <button
        type="button"
        className="inline-flex items-center gap-1.5 cursor-pointer underline decoration-dotted underline-offset-4 text-xs transition-all hover:decoration-primary"
        style={labelColor ? { color: labelColor } : {}}
        {...showEvent}
      >
        <Info className="h-3.5 w-3.5 shrink-0" />
        <span className="truncate max-w-[200px]">{displayLabel}</span>
      </button>
    );
  };

  const renderContent = () => {
    const baseClass = 'w-80 p-0 overflow-hidden rounded-xl border bg-popover shadow-xl';

    if (v === 2) {
      return (
        <PopoverContent
          className={`${baseClass} backdrop-blur-xl`}
          style={{ borderColor: labelColor || undefined, boxShadow: labelColor ? `0 20px 48px -16px ${labelColor}` : undefined }}
          side={side}
          sideOffset={sideOffset}
          align="start"
          forceMount
        >
          <motion.div
            initial={{ opacity: 0, rotateX: -8, scale: 0.92, y: -6 }}
            animate={{ opacity: 1, rotateX: 0, scale: 1, y: 0 }}
            exit={{ opacity: 0, rotateX: -8, scale: 0.92, y: -6 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            style={{ perspective: '600px', transformStyle: 'preserve-3d' }}
          >
            {title && (
              <div className="px-4 pt-4 pb-2 border-b border-border/30">
                <p className="text-sm font-bold text-foreground drop-shadow-sm">{title}</p>
              </div>
            )}
            <div className="px-4 py-3 text-sm text-foreground/85 leading-relaxed whitespace-pre-wrap break-words max-h-60 overflow-y-auto">
              {content || '—'}
            </div>
            <div className="absolute inset-0 rounded-xl bg-gradient-to-b from-transparent via-transparent to-black/[0.02] pointer-events-none" />
          </motion.div>
        </PopoverContent>
      );
    }
    if (v === 3) {
      return (
        <PopoverContent
          className={`${baseClass} border-primary/20 bg-popover/95 backdrop-blur-lg`}
          side={side}
          sideOffset={sideOffset}
          align="start"
          forceMount
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 8 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
          >
            <span className="absolute -top-8 -right-8 h-24 w-24 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
            <span className="absolute -bottom-8 -left-8 h-20 w-20 rounded-full bg-primary/5 blur-3xl pointer-events-none" />
            {title && (
              <div className="relative px-4 pt-4 pb-2 border-b border-primary/10">
                <p className="text-sm font-bold text-primary drop-shadow-[0_0_8px_currentColor]">{title}</p>
              </div>
            )}
            <div className="relative px-4 py-3 text-sm text-foreground/85 leading-relaxed whitespace-pre-wrap break-words max-h-60 overflow-y-auto">
              {content || '—'}
            </div>
          </motion.div>
        </PopoverContent>
      );
    }
    if (v === 4) {
      return (
        <PopoverContent
          className={`${baseClass} bg-card/95 backdrop-blur-xl`}
          side={side}
          sideOffset={sideOffset}
          align="start"
          forceMount
        >
          <motion.div
            initial={{ opacity: 0, rotateY: -12, scale: 0.9 }}
            animate={{ opacity: 1, rotateY: 0, scale: 1 }}
            exit={{ opacity: 0, rotateY: -12, scale: 0.9 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            style={{ perspective: '700px', transformStyle: 'preserve-3d' }}
          >
            <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-primary/[0.03] to-secondary/[0.03] pointer-events-none" />
            {title && (
              <div className="relative px-4 pt-4 pb-2 border-b border-border/30">
                <p className="text-sm font-bold text-foreground">{title}</p>
              </div>
            )}
            <div className="relative px-4 py-3 text-sm text-foreground/85 leading-relaxed whitespace-pre-wrap break-words max-h-60 overflow-y-auto">
              {content || '—'}
            </div>
          </motion.div>
        </PopoverContent>
      );
    }
    if (v === 5) {
      return (
        <PopoverContent
          className={`${baseClass} bg-gradient-to-br from-popover via-popover to-primary/[0.04] border-primary/20 backdrop-blur-xl`}
          side={side}
          sideOffset={sideOffset}
          align="start"
          forceMount
        >
          <motion.div
            initial={{ opacity: 0, rotateX: 10, rotateZ: -2, scale: 0.85, y: 10 }}
            animate={{ opacity: 1, rotateX: 0, rotateZ: 0, scale: 1, y: 0 }}
            exit={{ opacity: 0, rotateX: 10, rotateZ: -2, scale: 0.85, y: 10 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            style={{ perspective: '800px', transformStyle: 'preserve-3d' }}
          >
            <span className="absolute -top-6 -left-6 h-16 w-16 rounded-full bg-primary/8 blur-2xl pointer-events-none" />
            <span className="absolute -bottom-6 -right-6 h-16 w-16 rounded-full bg-secondary/8 blur-2xl pointer-events-none" />
            {title && (
              <div className="relative px-4 pt-4 pb-2 border-b border-primary/10">
                <p className="text-sm font-bold text-foreground bg-gradient-to-r from-primary to-foreground bg-clip-text text-transparent">{title}</p>
              </div>
            )}
            <div className="relative px-4 py-3 text-sm text-foreground/85 leading-relaxed whitespace-pre-wrap break-words max-h-60 overflow-y-auto">
              {content || '—'}
            </div>
          </motion.div>
        </PopoverContent>
      );
    }
    return (
      <PopoverContent
        className="w-80 p-0 overflow-hidden rounded-xl border bg-popover shadow-xl backdrop-blur-sm"
        side={side}
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
    );
  };

  return (
    <Popover open={triggerMode === 'click' ? open : undefined} onOpenChange={triggerMode === 'click' ? setOpen : undefined}>
      <PopoverTrigger asChild>
        {renderTrigger()}
      </PopoverTrigger>
      <AnimatePresence>
        {(triggerMode !== 'click' || open) && renderContent()}
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
  if (normalizeBaseMax(v)) return `${normalizeBaseMax(v)!.base} → ${normalizeBaseMax(v)!.max}`;
  return String(v);
}

/** Format a single mini-card value node, respecting suffix/scientific notation and OP symbols.
 *  `animTrigger` (when provided) wraps each scalar key in a VariantAnimatedValue so the
 *  per-item transition animates the value — numeric keys count up, string keys scramble —
 *  instead of the whole jsonb block animating as one blob. */
function renderMiniCardValueNode(val: unknown, useSuffix?: boolean, opEnabled?: boolean, opFlipped?: boolean, animTrigger?: number): React.ReactNode {
  if (typeof val === 'number') {
    if (animTrigger === undefined) {
      return <span className="font-mono">{formatNumber(val, !!useSuffix)}</span>;
    }
    return (
      <VariantAnimatedValue
        value={val}
        renderType="number"
        trigger={animTrigger}
        useSuffix={useSuffix}
        formatNumber={(n) => formatNumber(n, !!useSuffix)}
      />
    );
  }
  if (typeof val === 'boolean') {
    if (animTrigger === undefined) {
      return <span>{val ? 'Sim' : 'Não'}</span>;
    }
    return <VariantAnimatedValue value={val} renderType="boolean" trigger={animTrigger} />;
  }
  if (typeof val === 'string') {
    if (opEnabled) {
      const op = parseOperatorPrefix(val);
      if (op) {
        const n = Number(op.number);
        const displayNum = useSuffix && isFinite(n) ? formatNumber(n, true) : op.number;
        return (
          <span className="font-mono">
            <span className="font-bold text-primary">{op.symbol}</span>{displayNum}
          </span>
        );
      }
    }
    if (animTrigger === undefined) {
      return <span>{humanizeLabel(val)}</span>;
    }
    return <VariantAnimatedValue value={val} renderType="text" trigger={animTrigger} />;
  }
  const bm = normalizeBaseMax(val);
  if (bm) {
    return <BaseMaxValueNode value={bm} />;
  }
  if (Array.isArray(val)) {
    if (val.length === 0) return <span className="text-muted-foreground text-xs">[]</span>;
    return (
      <div className="flex flex-col gap-0.5">
        {val.map((item, i) => (
          <span key={i}>{renderMiniCardValueNode(item, useSuffix, opEnabled, opFlipped, animTrigger)}</span>
        ))}
      </div>
    );
  }
  if (typeof val === 'object' && val !== null) {
    const obj = val as Record<string, unknown>;
    const entries = Object.entries(obj);
    if (entries.length === 0) return <span className="text-muted-foreground text-xs">{'{}'}</span>;
    return (
      <div className="flex flex-col gap-0.5">
        {entries.map(([k, v]) => {
          const labelSpan = (
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground shrink-0">
              {humanizeLabel(k)}
            </span>
          );
          const valueSpan = (
            <span className="text-sm font-medium text-foreground">
              {renderMiniCardValueNode(v, useSuffix, opEnabled, opFlipped, animTrigger)}
            </span>
          );
          return (
            <div key={k} className="flex items-center gap-1.5">
              {opFlipped ? <>{valueSpan}{labelSpan}</> : <>{labelSpan}{valueSpan}</>}
            </div>
          );
        })}
      </div>
    );
  }
  return <span>{fmtComplexVal(val, useSuffix)}</span>;
}

/** Body of a mini card: one row per key with color, suffix and OP support. */
function miniCardBody(obj: Record<string, unknown>, jsonbKeyColors?: Record<string, string>, useSuffix?: boolean, opEnabled?: boolean, opFlipped?: boolean, animTrigger?: number): React.ReactNode {
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
            {renderMiniCardValueNode(val, useSuffix, opEnabled, opFlipped, animTrigger)}
          </span>
        );
        if (opEnabled) {
          const isComplex = typeof val === 'object' && val !== null;
          if (isComplex) {
            return (
              <span key={k} className="inline-flex items-center gap-1">
                {labelEl}{valueEl}
              </span>
            );
          }
          return (
            <span key={k} className="inline-flex items-center gap-1">
              {opFlipped ? <>{valueEl}{labelEl}</> : <>{labelEl}{valueEl}</>}
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

function renderMiniCards(value: unknown, label: string, useSuffix?: boolean, jsonbKeyColors?: Record<string, string>, opEnabled?: boolean, opFlipped?: boolean, onCompareClick?: (subKey?: string) => void, column?: string, labelColor?: string, labelNode?: React.ReactNode, animTrigger?: number): React.ReactNode {
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

  // Array → one independent mini card per element (object or scalar).
  if (Array.isArray(value)) {
    if (opEnabled && detectOpArray(value)) {
      return <>{header}{renderOpMiniCards(value, jsonbKeyColors, useSuffix, onCompareClick, column, opFlipped)}</>;
    }
    return (
      <div>
        {header}
        <BentoGrid
          mode="masonry"
          columnWidth={180}
          gap={8}
          style={{ perspective: '1000px', transformStyle: 'preserve-3d' }}
        >
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
                  value={miniCardBody(obj, jsonbKeyColors, useSuffix, opEnabled, opFlipped, animTrigger)}
                  onClick={sub ? () => onCompareClick?.(sub) : onCompareClick}
                  className="min-w-[110px] flex-1"
                />
              );
            }
            return (
              <MiniCard3D
                key={i}
                color={labelColor}
                value={<span className="text-sm font-medium text-foreground">{renderMiniCardValueNode(el, useSuffix, opEnabled, opFlipped, animTrigger)}</span>}
                onClick={onCompareClick}
                className="min-w-[90px] flex-1"
              />
            );
          })}
        </BentoGrid>
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
              const isComplex = typeof val === 'object' && val !== null;
              const color = jsonbKeyColors?.[k] || labelColor;
              const labelSpan = (
                <span className="font-semibold uppercase tracking-wider" style={{ color: color || 'hsl(var(--muted-foreground))' }}>
                  {humanizeLabel(k)}
                </span>
              );
              const valueSpan = (
                <span className="font-medium text-foreground">
                  {renderMiniCardValueNode(val, useSuffix, opEnabled, opFlipped, animTrigger)}
                </span>
              );
              return (
                <span
                  key={k}
                  onClick={subKeyFor(k) ? () => onCompareClick?.(subKeyFor(k)) : onCompareClick ? () => onCompareClick() : undefined}
                  role={onCompareClick ? 'button' : undefined}
                  tabIndex={onCompareClick ? 0 : undefined}
                  className={`inline-flex items-center gap-1.5 text-xs ${onCompareClick ? 'cursor-pointer hover:text-primary transition-colors' : ''}`}
                >
                  {isComplex ? <>{labelSpan}{valueSpan}</> : opFlipped ? <>{valueSpan}{labelSpan}</> : <>{labelSpan}{valueSpan}</>}
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
        <BentoGrid
          mode="masonry"
          columnWidth={180}
          gap={8}
          style={{ perspective: '1000px', transformStyle: 'preserve-3d' }}
        >
          {Object.entries(obj).map(([k, val]) => (
            <MiniCard3D
              key={k}
              label={humanizeLabel(k)}
              color={jsonbKeyColors?.[k] || labelColor}
              value={<span className="text-sm font-medium text-foreground">{renderMiniCardValueNode(val, useSuffix, opEnabled, opFlipped, animTrigger)}</span>}
              onClick={subKeyFor(k) ? () => onCompareClick?.(subKeyFor(k)) : onCompareClick}
              className="min-w-[100px] flex-1"
            />
          ))}
        </BentoGrid>
      </div>
    );
  }

  // Scalar jsonb value → one mini card (kept, as requested: jsonb keeps its
  // per-item mini cards).
  return (
    <div>
      {header}
      <MiniCard3D
        value={<span className="text-sm font-medium text-foreground">{renderMiniCardValueNode(value, useSuffix, opEnabled, opFlipped, animTrigger)}</span>}
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

function ComplexRow3D({ k, val, color, useSuffix, depth = 0, opEnabled, opFlipped }: { k: string; val: unknown; color?: string; useSuffix?: boolean; depth?: number; opEnabled?: boolean; opFlipped?: boolean }) {
  const isComplex = typeof val === 'object' && val !== null;
  const labelSpan = (
    <span className="text-[10px] font-semibold uppercase tracking-wider capitalize" style={{ color: color || 'hsl(var(--muted-foreground))' }}>
      {k.replace(/_/g, ' ')}
    </span>
  );
  const valueSpan = (
    <span className="text-xs font-medium text-foreground truncate">{renderMiniCardValueNode(val, useSuffix, opEnabled, isComplex ? opFlipped : undefined)}</span>
  );
  if (!opEnabled) {
    return (
      <div
        className="flex flex-col gap-0.5 rounded-lg border border-border/30 bg-card/60 px-2.5 py-1.5 backdrop-blur-sm"
        style={{ transform: `translateZ(${8 + depth}px)`, borderColor: color ? `${color}55` : undefined }}
      >
        {labelSpan}
        {valueSpan}
      </div>
    );
  }
  return (
    <div
      className="flex items-center justify-between gap-2 rounded-lg border border-border/30 bg-card/60 px-2.5 py-1.5 backdrop-blur-sm"
      style={{ transform: `translateZ(${8 + depth}px)`, borderColor: color ? `${color}55` : undefined }}
    >
      {isComplex ? <>{labelSpan}{valueSpan}</> : opFlipped ? <>{valueSpan}{labelSpan}</> : <>{labelSpan}{valueSpan}</>}
    </div>
  );
}

// ── v2: Holographic glass panels ──────────────────────────
function renderHoloPanels(value: unknown, _label: string, useSuffix?: boolean, jsonbKeyColors?: Record<string, string>, opEnabled?: boolean, opFlipped?: boolean): React.ReactNode {
  const entries = complexEntries(value);
  return (
    <BentoGrid
      mode="masonry"
      columnWidth={200}
      gap={8}
      className="p-1"
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
            <ComplexRow3D k={k} val={val} color={color} useSuffix={useSuffix} depth={4} opEnabled={opEnabled} opFlipped={opFlipped} />
          </div>
        );
      })}
    </BentoGrid>
  );
}

// ── v3: Neon depth grid ───────────────────────────────────
function renderNeonGrid(value: unknown, _label: string, useSuffix?: boolean, jsonbKeyColors?: Record<string, string>, opEnabled?: boolean, opFlipped?: boolean): React.ReactNode {
  const entries = complexEntries(value);
  return (
    <div className="p-1" style={{ perspective: '1000px', transformStyle: 'preserve-3d' }}>
      <BentoGrid
        mode="grid"
        columnWidth={120}
        gap={8}
        style={{ transform: 'rotateX(12deg)', transformStyle: 'preserve-3d' }}
      >
        {entries.map(([k, val], i) => {
          const isComplex = typeof val === 'object' && val !== null;
          const color = jsonbKeyColors?.[k.replace(/\s\d+$/, '')];
          const accent = color || 'hsl(var(--primary))';
          const labelSpan = (
            <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: accent }}>
              {k.replace(/_/g, ' ')}
            </span>
          );
          const valueSpan = (
            <span className="text-sm font-bold text-foreground">{renderMiniCardValueNode(val, useSuffix, opEnabled, isComplex ? opFlipped : undefined)}</span>
          );
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
              {opEnabled ? (
                <div className="flex items-center gap-2">
                  {isComplex ? <>{labelSpan}{valueSpan}</> : opFlipped ? <>{valueSpan}{labelSpan}</> : <>{labelSpan}{valueSpan}</>}
                </div>
              ) : (
                <div className="flex flex-col gap-0.5">
                  {labelSpan}
                  {valueSpan}
                </div>
              )}
            </div>
          );
        })}
      </BentoGrid>
    </div>
  );
}

// ── v4: Orbital 3D carousel ───────────────────────────────
function renderOrbitalCarousel(value: unknown, _label: string, useSuffix?: boolean, jsonbKeyColors?: Record<string, string>, opEnabled?: boolean, opFlipped?: boolean): React.ReactNode {
  const entries = complexEntries(value);
  const mid = (entries.length - 1) / 2;
  return (
    <div
      className="col-span-full w-full relative flex flex-nowrap gap-3 overflow-x-auto pb-3 pt-2 snap-x snap-mandatory scrollbar-thin"
      style={{ perspective: '800px', transformStyle: 'preserve-3d' }}
    >
      {entries.map(([k, val], i) => {
        const isComplex = typeof val === 'object' && val !== null;
        const color = jsonbKeyColors?.[k.replace(/\s\d+$/, '')];
        const accent = color || 'hsl(var(--primary))';
        const offset = i - mid;
        const labelSpan = (
          <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: accent }}>{k.replace(/_/g, ' ')}</span>
        );
        const valueSpan = (
          <span className="text-base font-bold text-foreground" style={{ transform: 'translateZ(14px)' }}>{renderMiniCardValueNode(val, useSuffix, opEnabled, isComplex ? opFlipped : undefined)}</span>
        );
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
            {opEnabled ? (
              <div className="flex items-center gap-1.5" style={{ transform: 'translateZ(24px)' }}>
                {isComplex ? <>{labelSpan}{valueSpan}</> : opFlipped ? <>{valueSpan}{labelSpan}</> : <>{labelSpan}{valueSpan}</>}
              </div>
            ) : (
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-1.5" style={{ transform: 'translateZ(24px)' }}>
                  <span className="h-2 w-2 rounded-full" style={{ background: accent, boxShadow: `0 0 8px ${accent}` }} />
                  {labelSpan}
                </div>
                {valueSpan}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── v5: Layered 3D depth stack ────────────────────────────
function renderDepthStack(value: unknown, _label: string, useSuffix?: boolean, jsonbKeyColors?: Record<string, string>, opEnabled?: boolean, opFlipped?: boolean): React.ReactNode {
  const entries = complexEntries(value);
  return (
    <div className="relative space-y-1 py-1" style={{ perspective: '1200px', transformStyle: 'preserve-3d' }}>
      {entries.map(([k, val], i) => {
        const isComplex = typeof val === 'object' && val !== null;
        const color = jsonbKeyColors?.[k.replace(/\s\d+$/, '')];
        const accent = color || 'hsl(var(--primary))';
        const isTop = i === 0;
        const labelSpan = (
          <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide" style={{ color: accent }}>
            <span className="text-[10px] font-mono opacity-60">{String(i + 1).padStart(2, '0')}</span>
            {k.replace(/_/g, ' ')}
          </span>
        );
        const valueSpan = (
          <span className="text-sm font-bold text-foreground">{renderMiniCardValueNode(val, useSuffix, opEnabled, isComplex ? opFlipped : undefined)}</span>
        );
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
            {opEnabled ? (
              <div className="flex items-center justify-between gap-2 px-3 py-2.5" style={{ transform: 'translateZ(20px)' }}>
                {isComplex ? <>{labelSpan}{valueSpan}</> : opFlipped ? <>{valueSpan}{labelSpan}</> : <>{labelSpan}{valueSpan}</>}
              </div>
            ) : (
              <div className="flex flex-col gap-1 px-3 py-2.5" style={{ transform: 'translateZ(20px)' }}>
                {labelSpan}
                {valueSpan}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function renderComplexValue(v: number, value: unknown, label: string, useSuffix?: boolean, jsonbKeyColors?: Record<string, string>, opEnabled?: boolean, opFlipped?: boolean, onCompareClick?: (subKey?: string) => void, column?: string, labelColor?: string, labelNode?: React.ReactNode): React.ReactNode {
  if (v === 1) return renderMiniCards(value, label, useSuffix, jsonbKeyColors, opEnabled, opFlipped, onCompareClick, column, labelColor, labelNode);
  if (v === 2) return renderHoloPanels(value, label, useSuffix, jsonbKeyColors, opEnabled, opFlipped);
  if (v === 3) return renderNeonGrid(value, label, useSuffix, jsonbKeyColors, opEnabled, opFlipped);
  if (v === 4) return renderOrbitalCarousel(value, label, useSuffix, jsonbKeyColors, opEnabled, opFlipped);
  return renderDepthStack(value, label, useSuffix, jsonbKeyColors, opEnabled, opFlipped);
}

// ── Variant 1: every scalar render type becomes a mini card ──
function renderScalarMiniContent(format: string, value: unknown, str: string, label: string, labelColor: string | undefined, valueColors: Record<string, string> | undefined, allowedValues: AllowedValue[] | undefined, maxValue: number | undefined, useSuffix?: boolean, opEnabled?: boolean, _opFlipped?: boolean): React.ReactNode {
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
export default function FormatVariantRenderer({ format, variant, value, label, useSuffix, opEnabled, opFlipped, labelColor, valueColors, jsonbKeyColors, maxValue, allowedValues, onCompareClick, column, plain, icon, labelNode, animTrigger, prevValue }: Props) {
  const n = v(variant);

  // Track previous values for animated transitions (rating stars, progress bar)
  const prevValueRef = useRef(value);
  const prevNumRef = useRef<number>(0);
  const numVal = typeof value === 'number' ? value : Number(value);
  // prevValue (snapshot from the parent at variant-switch time) takes
  // precedence over the in-component ref — the ref helps live same-mount
  // updates, the snapshot survives the keyed remount of the inner content.
  const prevNumFromProp = prevValue !== undefined && prevValue !== null && prevValue !== '' && !isNaN(Number(prevValue)) ? Number(prevValue) : undefined;
  const prevNum = prevNumFromProp ?? prevNumRef.current;
  // Compute animated stars for rating
  const ratingMax = maxValue ?? 5;
  const currentStars = isNaN(numVal) ? 0 : Math.round(Math.min(ratingMax, Math.max(0, numVal)));
  const prevStarsVal = isNaN(prevNum) ? 0 : Math.round(Math.min(ratingMax, Math.max(0, prevNum)));
  // Compute animated percentage for progress
  const progressMax = maxValue ?? 100;
  const currentPct = progressMax > 0 ? (isNaN(numVal) ? 0 : Math.min(100, Math.max(0, (numVal / progressMax) * 100))) : 0;
  const prevPctVal = progressMax > 0 ? (isNaN(prevNum) ? 0 : Math.min(100, Math.max(0, (prevNum / progressMax) * 100))) : 0;
  // Update refs after render
  prevValueRef.current = value;
  prevNumRef.current = numVal;

  // For complex values (objects/arrays of objects), use variant-aware rendering.
  // Popover, jsonb and jsonb-structured have their own dedicated format handlers.
  if (isComplexValue(value) && format !== 'popover' && format !== 'jsonb' && format !== 'jsonb-structured') {
    const normalized = normalizeValue(value, useSuffix, opEnabled);
    return (
      <Variant3D format={format} variant={n} trigger={animTrigger ?? 0}>
        {renderComplexValue(n, normalized, label, useSuffix, jsonbKeyColors, opEnabled, opFlipped, onCompareClick, column, labelColor, labelNode)}
      </Variant3D>
    );
  }

  const str = opEnabled ? normalizeOperatorText(String(value ?? ''), useSuffix) : String(value ?? '');

  if (n === 1 && format !== 'popover' && format !== 'jsonb' && format !== 'jsonb-structured' && !plain) {
    const rawContent = format === 'icon' && icon
      ? null
      : renderScalarMiniContent(format, value, str, label, labelColor, valueColors, allowedValues, maxValue, useSuffix, opEnabled, opFlipped);
    const animatedContent = rawContent !== null
      ? (
        <VariantAnimatedValue value={value} renderType={format} trigger={animTrigger ?? 0} useSuffix={useSuffix} fromValue={prevValue}>
          {rawContent}
        </VariantAnimatedValue>
      )
      : rawContent;
    const accent = labelColor || valueColors?.[str] || 'hsl(var(--primary))';
    return (
      <Variant3D format={format} variant={n} trigger={animTrigger ?? 0}>
        <MiniCard3D label={labelNode ?? label} color={accent} icon={icon} value={animatedContent} onClick={column && onCompareClick ? () => onCompareClick(column) : onCompareClick} className="group" />
      </Variant3D>
    );
  }

  const rendered = (() => {
    // OP intercept for simple formats — when value has operator prefix
    if (opEnabled && format !== 'jsonb' && format !== 'jsonb-structured' && format !== 'popover') {
      const op = parseOperatorPrefix(str);
      if (op) {
        const displayNum = displayOpNum(op.number, useSuffix);
        const opValue = <span className="font-bold text-primary">{op.symbol}</span>;
        const opNum = <span className={n > 1 ? 'text-sm font-mono' : 'text-xs font-mono'}>{displayNum}</span>;
        const opContent = <span className={`inline-flex items-center gap-1 ${n > 1 ? 'text-sm font-bold' : 'text-xs font-medium'}`}>{opValue}{opNum}</span>;
        if (opFlipped) {
          return (
            <div className="flex items-center gap-2">
              {opContent}
              <span className="text-xs font-medium text-muted-foreground" style={labelColor ? { color: labelColor } : {}}>{label}</span>
            </div>
          );
        }
        return (
          <Row label={label} labelColor={labelColor}>
            {opContent}
          </Row>
        );
      }
    }
  const triggerStr = animTrigger != null ? String(animTrigger) : undefined;
  switch (format) {
    case 'text':     return renderText(n, str, label, labelColor, valueColors, triggerStr);
    case 'badge':    return renderBadge(n, str, label, labelColor, valueColors, triggerStr);
    case 'number':
      if (typeof value === 'number') return renderNumber(n, formatNumber(value, !!useSuffix), label, labelColor, valueColors, String(value), triggerStr);
      return renderNumber(n, str, label, labelColor, valueColors, undefined, triggerStr);
    case 'color':    return renderColor(n, str, label, labelColor, triggerStr);
    case 'icon':     return renderIcon(n, str, label, labelColor, triggerStr);
    case 'link':     return renderLink(n, str, label, labelColor, triggerStr);
    case 'image':    return renderImage(n, str, label, labelColor, triggerStr);
    case 'rating':   return renderRating(n, value, label, labelColor, opEnabled, opFlipped, maxValue, currentStars, prevStarsVal, triggerStr);
    case 'progress': return renderProgress(n, value, label, labelColor, opEnabled, opFlipped, maxValue, currentPct, prevPctVal, triggerStr);
    case 'slider':   return renderSlider(n, value, label, labelColor, opEnabled, opFlipped, maxValue, useSuffix, triggerStr);
    case 'tags':     return renderTags(n, value, label, labelColor, triggerStr);
    case 'boolean':  return renderBoolean(n, value, label, labelColor, triggerStr);
    case 'date':     return renderDate(n, value, label, labelColor, triggerStr);
    case 'duration': return renderDuration(n, value, label, labelColor, triggerStr);
    case 'file':     return renderFile(n, str, label, labelColor, triggerStr);
    case 'video':    return renderVideo(n, str, label, labelColor, triggerStr);
    case 'audio':    return renderAudio(n, str, label, labelColor, triggerStr);
    case 'emoji':    return renderEmoji(n, str, label, labelColor, triggerStr);
    case 'icon-set': return renderIconSet(n, value, label, labelColor, triggerStr);
    case 'color-palette': return renderColorPalette(n, value, label, labelColor, triggerStr);
    case 'select': return renderSelect(n, str, label, labelColor, allowedValues, valueColors, triggerStr);
    case 'multi-select': return renderMultiSelect(n, value, label, labelColor, valueColors, allowedValues, triggerStr);
    case 'toggle-group': return renderToggleGroup(n, str, label, labelColor, allowedValues, valueColors, triggerStr);
      case 'popover': {
        let popoverTitle = '';
        let popoverContent = str;
        let popoverTriggerMode: 'hover' | 'click' = 'hover';
        let popoverPosition: 'top' | 'bottom' | 'left' | 'right' = 'top';
        let popoverTriggerText = '';
        if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
          const p = value as Record<string, string>;
          popoverTitle = p.title || '';
          popoverContent = p.content || str;
          popoverTriggerMode = p.trigger === 'click' ? 'click' : 'hover';
          popoverPosition = (p.position as 'top' | 'bottom' | 'left' | 'right') || 'top';
          popoverTriggerText = p.triggerText || '';
        } else if (typeof value === 'string') {
          try {
            const parsed = JSON.parse(value);
            if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
              popoverTitle = parsed.title || '';
              popoverContent = parsed.content || str;
              popoverTriggerMode = parsed.trigger === 'click' ? 'click' : 'hover';
              popoverPosition = (parsed.position as 'top' | 'bottom' | 'left' | 'right') || 'top';
              popoverTriggerText = parsed.triggerText || '';
            }
          } catch { /* not JSON, use raw string */ }
        }
        return <RenderPopover v={n} title={popoverTitle} content={popoverContent} label={label || column} labelColor={labelColor} triggerMode={popoverTriggerMode} position={popoverPosition} triggerText={popoverTriggerText} />;
      }
      case 'jsonb':
      case 'jsonb-structured':
      case 'baseXmax': {
        const detectValue = typeof value === 'string' ? (() => { try { return JSON.parse(value); } catch { return value; } })() : value;
        if (typeof detectValue === 'object' && detectValue !== null) {
          ensureDetectorsRegistered();
          const normalizedForOp = opEnabled ? normalizeValue(detectValue, useSuffix, opEnabled) : detectValue;
          if (n > 1 && n <= 5) {
            return renderComplexValue(n, normalizedForOp, label, useSuffix, jsonbKeyColors, opEnabled, opFlipped, onCompareClick, column, labelColor, labelNode);
          }
          // Both arrays ([]) and objects ({}) render as mini cards 3D at the
          // default variant — no shape-detector intercept here.
          return renderMiniCards(normalizedForOp, label, useSuffix, jsonbKeyColors, opEnabled, opFlipped, onCompareClick, column, labelColor, labelNode, animTrigger);
        }
        return renderText(n, String(detectValue ?? ''), label, labelColor, valueColors);
      }
      default:         return renderText(n, str, label, labelColor, valueColors);
    }
  })();

  if (rendered === null) return null;

  const animRenderType = format === 'jsonb' || format === 'jsonb-structured' || format === 'baseXmax' ? 'jsonb' : format;
  return (
    <Variant3D format={format} variant={n} trigger={animTrigger ?? 0}>
      <VariantAnimatedValue value={value} renderType={animRenderType} trigger={animTrigger ?? 0} useSuffix={useSuffix} fromValue={prevValue} formatNumber={(num) => formatNumber(num, !!useSuffix)}>
        {rendered}
      </VariantAnimatedValue>
    </Variant3D>
  );
}
