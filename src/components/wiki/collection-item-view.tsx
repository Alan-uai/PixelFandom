'use client';

import Image from 'next/image';
import React, { useState, useEffect, useRef } from 'react';
import {
  ChevronDown, ChevronRight, Star, Sword, Shield, Zap,
  Skull, Globe, Gem,
  ScrollText, MessageCircle, Crosshair,
  Coins, Pickaxe, Sparkles, Crown,
} from 'lucide-react';
import { IconRenderer } from '@/components/ui/icon-renderer';
import { ChipCarousel } from '@/components/ui/chip-carousel';
import ComparePopup from '@/components/wiki/compare-popup';
import VariantSelector from '@/components/wiki/variant-selector';
import type { ColumnInfo } from '@/lib/game-schema';
import { ColumnDisplay, type AllowedValue } from '@/lib/column-types/display-factory';
import { getTypeDef } from '@/lib/column-types/registry';
import FormatVariantRenderer from '@/components/wiki/format-variant-renderer';
import type { DisplayFormat } from '@/lib/column-types/format-compatibility';
import {
  RARITY_COLORS, RARITY_GRAD, TIER_LABEL, TIER_COL,
  elementClass, elIcon, COLL_ICON,
} from '@/lib/game-ui';
import { ScalingContext, type ScalingInfo } from '@/lib/scaling-context';
import { ElasticSlider3D } from '@/components/ui/elastic-slider-3d';

// 3D transition keyframes (beam + reflection) for variant switches in this view.
let civ3dKfInjected = false;
function ensureCivVariant3dKeyframes() {
  if (typeof document === 'undefined' || civ3dKfInjected) return;
  civ3dKfInjected = true;
  if (document.getElementById('variant-3d-kf-civ')) return;
  const el = document.createElement('style');
  el.id = 'variant-3d-kf-civ';
  el.textContent = `
@keyframes variant-beam-ltr {
  0% { left: -35%; opacity: 0; }
  12% { opacity: 1; }
  100% { left: 110%; opacity: 0; }
}
@keyframes variant-beam-rtl {
  0% { left: 110%; opacity: 0; }
  12% { opacity: 1; }
  100% { left: -35%; opacity: 0; }
}
.variant-beam-ltr { animation: variant-beam-ltr 0.7s ease-in-out; }
.variant-beam-rtl { animation: variant-beam-rtl 0.7s ease-in-out; }
@keyframes variant-reflection {
  0% { transform: translateX(-60%) skewX(-18deg); opacity: 0; }
  30% { opacity: 0.7; }
  100% { transform: translateX(160%) skewX(-18deg); opacity: 0; }
}
.variant-3d-transition::after {
  content: '';
  position: absolute;
  inset: 0;
  pointer-events: none;
  background: linear-gradient(
    105deg,
    transparent 25%,
    rgba(255,255,255,0.18) 45%,
    rgba(255,215,0,0.12) 50%,
    rgba(255,255,255,0.22) 55%,
    transparent 75%
  );
  animation: variant-reflection 0.9s ease-out 0.3s both;
  z-index: 5;
}
@keyframes variant-3d-flip-in {
  0% { opacity: 0; transform: rotateX(-12deg) scale(0.96); }
  100% { opacity: 1; transform: rotateX(0deg) scale(1); }
}
.variant-3d-flip-in {
  animation: variant-3d-flip-in 0.45s ease-out;
  transform-style: preserve-3d;
}
@keyframes variant-content-expand {
  0% { opacity: 0; transform: translateY(-8px) scaleY(0.96); }
  100% { opacity: 1; transform: translateY(0) scaleY(1); }
}
.variant-content-expand {
  animation: variant-content-expand 0.35s ease-out 0.05s both;
  transform-origin: top;
}
@media (prefers-reduced-motion: reduce) {
  .variant-beam-ltr, .variant-beam-rtl, .variant-3d-transition::after, .variant-3d-flip-in, .variant-content-expand { animation: none !important; }
}
@media (prefers-reduced-motion: no-preference) {
  .variant-beam-ltr, .variant-beam-rtl { will-change: left, opacity; }
}
`;
  document.head.appendChild(el);
}

function Tag({ children, className = '', icon, title }: { children: React.ReactNode; className?: string; icon?: React.ReactNode; title?: string }) {
  return (
    <span title={title} className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium max-w-[220px] truncate shrink-0 ${className}`}>
      {icon}{children}
    </span>
  );
}

function StatCard({ label, value, icon, color, onClick, title }: { label: string; value: React.ReactNode; icon?: React.ReactNode; color?: string; onClick?: () => void; title?: string }) {
  const Comp = onClick ? 'button' : 'div';
  return (
    <Comp
      onClick={onClick}
      title={title}
      className={`flex flex-col items-center justify-center rounded-xl border bg-card p-4 min-w-[100px] ${onClick ? 'cursor-pointer hover:border-primary/40 hover:bg-primary/5 transition-all' : ''}`}
    >
      {icon && <div className="mb-1 text-muted-foreground">{icon}</div>}
      <span className={`text-xl font-bold ${color || 'text-foreground'}`}>{value}</span>
      <span className="text-xs text-muted-foreground mt-0.5">{label}</span>
    </Comp>
  );
}

function Accordion({ title, icon, defaultOpen, children }: { title: string; icon?: React.ReactNode; defaultOpen?: boolean; children: React.ReactNode }) {
  const [o, setO] = useState(defaultOpen ?? false);
  return (
    <div className="border border-border rounded-xl overflow-hidden">
      <button onClick={() => setO(!o)} className="flex items-center justify-between w-full px-4 py-3 text-sm font-medium bg-muted/30 hover:bg-muted/50 transition-colors">
        <span className="flex items-center gap-2">{icon}{title}</span>
        {o ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
      </button>
      {o && <div className="px-4 py-3">{children}</div>}
    </div>
  );
}

type FieldMeta = {
  label: string;
  icon?: React.ReactNode;
  color?: string;
};

const FIELD_LABELS: Record<string, FieldMeta> = {
  damage_min: { label: 'Dano Mín', icon: <Sword className="h-4 w-4" /> },
  damage_max: { label: 'Dano Máx', icon: <Sword className="h-4 w-4" /> },
  crit_chance_min: { label: 'Chance Crítica', icon: <Crosshair className="h-4 w-4" />, color: 'text-primary' },
  crit_chance_max: { label: 'Crit Máx', icon: <Crosshair className="h-4 w-4" />, color: 'text-primary' },
  knockback: { label: 'Repulsão', icon: <Zap className="h-4 w-4" /> },
  health_bonus: { label: 'Bônus HP', icon: <Shield className="h-4 w-4" />, color: 'text-primary' },
  speed_bonus: { label: 'Bônus Velocidade', icon: <Zap className="h-4 w-4" />, color: 'text-primary' },
  energy_bonus: { label: 'Bônus Energia', icon: <Zap className="h-4 w-4" />, color: 'text-primary' },
  shop_price: { label: 'Preço', icon: <Coins className="h-4 w-4" /> },
  craft_cost: { label: 'Custo Craft', icon: <Pickaxe className="h-4 w-4" /> },
  gold_cost: { label: 'Custo (Ouro)', icon: <Pickaxe className="h-4 w-4" /> },
  max_uses_per_run: { label: 'Usos / Run', icon: <Zap className="h-4 w-4" /> },
  unlock_level: { label: 'Nível Mín', icon: <Star className="h-4 w-4" /> },
  max_ranks: { label: 'Ranks Máx', icon: <Gem className="h-4 w-4" /> },
  priority_order: { label: 'Prioridade', icon: <Crosshair className="h-4 w-4" /> },
  drop_rate_percentage: { label: 'Drop Rate', icon: <Star className="h-4 w-4" />, color: 'text-primary' },
  drop_rate_multiplier: { label: 'Mult. Drop', icon: <Star className="h-4 w-4" />, color: 'text-primary' },
  obtain_method: { label: 'Como Obter', icon: <Crosshair className="h-4 w-4" /> },
  world_name: { label: 'Mundo', icon: <Globe className="h-4 w-4" /> },
  chapter: { label: 'Capítulo', icon: <Gem className="h-4 w-4" /> },
  starting_banner: { label: 'Banner Inicial', icon: <Star className="h-4 w-4" /> },
  drop_wave_requirement: { label: 'Wave Mín', icon: <Zap className="h-4 w-4" />, color: 'text-primary' },
  environment: { label: 'Ambiente', icon: <Globe className="h-4 w-4" /> },
  warning: { label: 'Atenção', icon: <Sparkles className="h-4 w-4" /> },
  weapon_type: { label: 'Tipo de Arma', icon: <Sword className="h-4 w-4" /> },
  attack_speed: { label: 'Velocidade', icon: <Zap className="h-4 w-4" /> },
  enemy_type: { label: 'Tipo de Inimigo', icon: <Skull className="h-4 w-4" /> },
  difficulty: { label: 'Dificuldade', icon: <Crosshair className="h-4 w-4" /> },
  boss_type: { label: 'Tipo de Chefe', icon: <Crown className="h-4 w-4" /> },
  category: { label: 'Categoria', icon: <Gem className="h-4 w-4" /> },
  health_level: { label: 'Nível HP', icon: <Shield className="h-4 w-4" /> },
  speed_level: { label: 'Nível Velocidade', icon: <Zap className="h-4 w-4" /> },
  strength_level: { label: 'Nível Força', icon: <Crosshair className="h-4 w-4" /> },
  passive_ability_level: { label: 'Nível Passiva', icon: <Star className="h-4 w-4" /> },
  xp_drop: { label: 'XP Dropado', icon: <Star className="h-4 w-4" /> },
  coin_drop: { label: 'Moedas Dropadas', icon: <Coins className="h-4 w-4" /> },
  item_name: { label: 'Item', icon: <Gem className="h-4 w-4" /> },
  code_type: { label: 'Tipo de Código', icon: <ScrollText className="h-4 w-4" /> },
  reward_type: { label: 'Tipo de Recompensa', icon: <Sparkles className="h-4 w-4" /> },
  worth_notes: { label: 'Vale Anotar', icon: <MessageCircle className="h-4 w-4" /> },
  savings_percentage: { label: 'Economia (%)', icon: <Coins className="h-4 w-4" /> },
  second_slot_unlock_level: { label: '2º Slot (Nível)', icon: <Star className="h-4 w-4" /> },
  verified_date: { label: 'Verificado em', icon: <Star className="h-4 w-4" /> },
  verified_by: { label: 'Verificado por', icon: <MessageCircle className="h-4 w-4" /> },
  expired_date: { label: 'Expira em', icon: <Star className="h-4 w-4" /> },
  crafting_cost: { label: 'Custo Craft', icon: <Pickaxe className="h-4 w-4" /> },
};

const NUMERIC_TYPES = new Set([
  'integer', 'bigint', 'smallint', 'numeric', 'real', 'double precision',
  'double', 'float', 'decimal',
]);

function isNumericType(t: string): boolean {
  return NUMERIC_TYPES.has(t);
}

function isLongText(v: unknown): boolean {
  if (typeof v !== 'string') return false;
  return v.length > 60 || v.includes('\n');
}

function fieldLabel(key: string): string {
  const known = FIELD_LABELS[key];
  if (known) return known.label;
  return key.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
}

const SYSTEM_FIELDS = new Set([
  'id', 'tenant_id', 'created_at', 'updated_at',
  'name', 'title', 'description', 'summary',
  'slug',
  'rarity', 'tier', 'element',
  'image', 'image_url', 'icon', 'icon_url',
  '_source_table', 'embedding',
]);

function hasValue(v: unknown): boolean {
  return v != null && v !== '' && v !== 0 && v !== 'none';
}



function inferSchema(data: Record<string, any>): ColumnInfo[] {
  return Object.entries(data)
    .filter(([k]) => !SYSTEM_FIELDS.has(k))
    .map(([k, v]) => {
      let data_type = 'text';
      if (typeof v === 'number') data_type = 'numeric';
      else if (typeof v === 'boolean') data_type = 'boolean';
      else if (Array.isArray(v)) data_type = 'jsonb';
      else if (typeof v === 'object' && v !== null) data_type = 'jsonb';
      return { column_name: k, data_type, is_nullable: true, column_default: null, is_system: false };
    });
}

function sortByColumnOrder<T extends { column_name: string }>(cols: T[], columnOrder?: string[]): T[] {
  if (!columnOrder || columnOrder.length === 0) return cols;
  const orderMap = new Map(columnOrder.map((col, i) => [col, i]));
  return [...cols].sort((a, b) => {
    const ai = orderMap.get(a.column_name);
    const bi = orderMap.get(b.column_name);
    if (ai != null && bi != null) return ai - bi;
    if (ai != null) return -1;
    if (bi != null) return 1;
    return 0;
  });
}



function RenderTypeFields({
  data, columnTypes, columnFormats, formatVariants, columnOpEnabled, columnOpFlipped, rendered, visibleColumnsSet,
  schema, tenantId, tenantSlug, table, comparisonMode, onStatClick, chipWrap, columnOrder, useSuffix, columnConfig,
  variantTrigger,
}: {
  data: Record<string, any>;
  columnTypes: Record<string, string>;
  columnFormats?: Record<string, string>;
  formatVariants?: Record<string, number>;
  columnOpEnabled?: Record<string, boolean>;
  columnOpFlipped?: Record<string, boolean>;
  rendered: Set<string>;
  visibleColumnsSet?: Set<string> | null;
  schema?: ColumnInfo[];
  tenantId?: string;
  tenantSlug?: string;
  table?: string;
  comparisonMode?: 'modal' | 'page';
  onStatClick?: (statKey: string) => void;
  chipWrap?: boolean;
  columnOrder?: string[];
  useSuffix?: boolean;
  columnConfig?: Record<string, { maxValue?: number; displayName?: string; labelIcon?: string; labelColor?: string; jsonbKeyTypes?: Record<string, { type: string; suffix?: string }>; jsonbKeyColors?: Record<string, string>; valueColors?: Record<string, string>; allowedValues?: AllowedValue[] }>;
  variantTrigger?: number;
}) {
  const sections: React.ReactNode[] = [];

  // Per-column label metadata that merges the user-defined columnConfig
  // (labelIcon / labelColor / displayName) with the built-in FIELD_LABELS fallback.
  const colLabel = (key: string): string => {
    const cc = columnConfig?.[key];
    if (cc?.displayName) return cc.displayName;
    return fieldLabel(key);
  };
  const colIcon = (key: string): React.ReactNode | undefined => {
    const cc = columnConfig?.[key];
    if (cc?.labelIcon) return <IconRenderer icon={cc.labelIcon} size="sm" />;
    return FIELD_LABELS[key]?.icon;
  };
  const colColor = (key: string): string | undefined => {
    const cc = columnConfig?.[key];
    if (cc?.labelColor) return cc.labelColor;
    return FIELD_LABELS[key]?.color;
  };

  const activeMode = comparisonMode || 'modal';

  // 1. Custom format overrides from card detail config
  if (columnFormats) {
    const formatEntries = Object.entries(columnFormats).filter(
      ([col, _fmt]) => {
        if (rendered.has(col)) return false;
        if (SYSTEM_FIELDS.has(col)) return false;
        if (visibleColumnsSet && !visibleColumnsSet.has(col)) return false;
        if (!hasValue(data[col])) return false;
        return true;
      },
    );
    if (formatEntries.length > 0) {
      sections.push(
        <div key="custom-formats" className="space-y-3 mb-6">
            {formatEntries.map(([col, fmt]) => {
            rendered.add(col);
            const cc = columnConfig?.[col];
            const lblIcon = colIcon(col);
            return (
              <FormatVariantRenderer
                key={col}
                format={fmt as DisplayFormat}
                variant={formatVariants?.[col] || 1}
                value={data[col]}
                label={colLabel(col)}
                labelNode={lblIcon ? (
                  <span className="flex items-center gap-1">
                    {lblIcon}
                    {colLabel(col)}
                  </span>
                ) : undefined}
                useSuffix={useSuffix}
                opEnabled={columnOpEnabled?.[col] !== false}
                opFlipped={columnOpFlipped?.[col] === true}
                labelColor={cc?.labelColor}
                valueColors={cc?.valueColors}
                jsonbKeyColors={cc?.jsonbKeyColors}
                maxValue={cc?.maxValue}
                allowedValues={cc?.allowedValues}
                column={col}
                onCompareClick={onStatClick ? (subKey) => onStatClick(subKey ?? col) : undefined}
                animTrigger={variantTrigger}
              />
            );
          })}
        </div>,
      );
    }
  }

  // 2. Columns with explicit render types from table schema
  const entries = Object.entries(columnTypes).filter(
    ([col]) => !rendered.has(col)
      && !SYSTEM_FIELDS.has(col)
      && (!visibleColumnsSet || visibleColumnsSet.has(col))
      && hasValue(data[col]),
  );
  if (entries.length > 0) {
    const typeSections = entries.map(([col, renderType]) => {
      const def = getTypeDef(renderType);
      if (!def) return null;
      rendered.add(col);
      return (
        <div key={`rt-${col}`} className="mb-4">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
            {colIcon(col)}
            {colLabel(col)}
          </h3>
          <ColumnDisplay value={data[col]} column={col} renderType={renderType} useSuffix={useSuffix} opEnabled={columnOpEnabled?.[col] !== false} opFlipped={columnOpFlipped?.[col] === true} hideLabel columnConfig={columnConfig?.[col]} animTrigger={variantTrigger} />
        </div>
      );
    }).filter(Boolean);
    sections.push(<>{typeSections}</>);
  }

  // 3. Auto-classified sections (schema-driven)
  const cols = schema ?? inferSchema(data);
  const activeCols = sortByColumnOrder(cols.filter(
    (c) => !SYSTEM_FIELDS.has(c.column_name) && !rendered.has(c.column_name) && hasValue(data[c.column_name])
      && (!visibleColumnsSet || visibleColumnsSet.has(c.column_name))
      && (!columnTypes || !columnTypes[c.column_name]),
  ), columnOrder);

  // 3a. Numeric → StatCards grid
  const numCols = activeCols.filter(
    (c) => isNumericType(c.data_type) && data[c.column_name] !== 0,
  );
  if (numCols.length > 0) {
    numCols.forEach((c) => rendered.add(c.column_name));
    sections.push(
      <div key="dyn-stats" className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mb-6">
        {numCols.map((c) => {
          return (
            <StatCard
              key={c.column_name}
              label={colLabel(c.column_name)}
               value={<ColumnDisplay value={data[c.column_name]} column={c.column_name} renderType="auto" useSuffix={useSuffix} opEnabled={columnOpEnabled?.[c.column_name] !== false} opFlipped={columnOpFlipped?.[c.column_name] === true} hideLabel columnConfig={columnConfig?.[c.column_name]} animTrigger={variantTrigger} />}
              icon={colIcon(c.column_name)}
              color={colColor(c.column_name)}
              onClick={tenantId ? () => {
                if (activeMode === 'page') {
                  window.location.href = `/w/${tenantSlug || ''}/compare/${table}?stat=${c.column_name}`;
                } else if (onStatClick) {
                  onStatClick(c.column_name);
                }
              } : undefined}
              title={activeMode === 'modal' && tenantId ? 'Clique para comparar' : undefined}
            />
          );
        })}
      </div>,
    );
  }

  // 3b. Booleans → ChipCarousel tags
  const boolCols = activeCols.filter((c) => c.data_type === 'boolean');
  if (boolCols.length > 0) {
    boolCols.forEach((c) => rendered.add(c.column_name));
    sections.push(
      <div key="dyn-bools" className="mb-6">
        <ChipCarousel wrap={chipWrap}>
          {boolCols.map((c) => (
            <Tag key={c.column_name}
              className={data[c.column_name]
                ? 'border-primary/30 text-primary bg-primary/10'
                : 'border-muted-foreground/30 text-muted-foreground bg-muted/10'
              }
            >
              {colLabel(c.column_name)}: <ColumnDisplay value={data[c.column_name]} column={c.column_name} renderType="auto" useSuffix={useSuffix} opEnabled={columnOpEnabled?.[c.column_name] !== false} opFlipped={columnOpFlipped?.[c.column_name] === true} hideLabel columnConfig={columnConfig?.[c.column_name]} animTrigger={variantTrigger} />
            </Tag>
          ))}
        </ChipCarousel>
      </div>,
    );
  }

  // 3c. Short text → ChipCarousel tags
  const textCols = activeCols.filter(
    (c) =>
      (c.data_type === 'text' || c.data_type?.startsWith('character varying') || c.data_type === 'varchar') &&
      !isLongText(data[c.column_name]),
  );
  if (textCols.length > 0) {
    textCols.forEach((c) => rendered.add(c.column_name));
    sections.push(
      <div key="dyn-tags" className="mb-6">
        <ChipCarousel wrap={chipWrap}>
          {textCols.map((c) => {
            const val = data[c.column_name];
            const cc = columnConfig?.[c.column_name];
            const color = cc?.valueColors?.[String(val)];
            return (
              <Tag key={c.column_name} className="border-primary/30 text-primary bg-primary/10">
                {colLabel(c.column_name)}: <span style={color ? { color } : {}}><ColumnDisplay value={val} column={c.column_name} renderType="auto" useSuffix={useSuffix} opEnabled={columnOpEnabled?.[c.column_name] !== false} opFlipped={columnOpFlipped?.[c.column_name] === true} hideLabel columnConfig={cc} animTrigger={variantTrigger} /></span>
              </Tag>
            );
          })}
        </ChipCarousel>
      </div>,
    );
  }

  // 3d. Long text → labeled sections
  const longCols = activeCols.filter(
    (c) =>
      (c.data_type === 'text' || c.data_type?.startsWith('character varying') || c.data_type === 'varchar') &&
      isLongText(data[c.column_name]),
  );
  for (const c of longCols) {
    rendered.add(c.column_name);
    sections.push(
      <div key={c.column_name} className="mb-6">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">{colIcon(c.column_name)}<span style={colColor(c.column_name) ? { color: colColor(c.column_name) } : undefined}>{colLabel(c.column_name)}</span></h3>
        <ColumnDisplay value={data[c.column_name]} column={c.column_name} renderType="auto" useSuffix={useSuffix} opEnabled={columnOpEnabled?.[c.column_name] !== false} opFlipped={columnOpFlipped?.[c.column_name] === true} hideLabel columnConfig={columnConfig?.[c.column_name]} animTrigger={variantTrigger} />
      </div>,
    );
  }

  // 3e. JSON arrays (from jsonb/json columns)
  const arrCols = activeCols.filter(
    (c) =>
      (c.data_type === 'jsonb' || c.data_type === 'json') &&
      Array.isArray(data[c.column_name]) &&
      data[c.column_name].length > 0,
  );
  for (const c of arrCols) {
    rendered.add(c.column_name);
    sections.push(
      <div key={c.column_name} className="mb-6">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">{colIcon(c.column_name)}<span style={colColor(c.column_name) ? { color: colColor(c.column_name) } : undefined}>{colLabel(c.column_name)}</span></h3>
        <ColumnDisplay value={data[c.column_name]} column={c.column_name} renderType="auto" useSuffix={useSuffix} opEnabled={columnOpEnabled?.[c.column_name] !== false} opFlipped={columnOpFlipped?.[c.column_name] === true} hideLabel columnConfig={columnConfig?.[c.column_name]} animTrigger={variantTrigger} onCompareClick={onStatClick ? (subKey) => onStatClick(subKey ?? c.column_name) : undefined} />
      </div>,
    );
  }

  // 3f. JSON objects → border cards
  const objCols = activeCols.filter(
    (c) =>
      (c.data_type === 'jsonb' || c.data_type === 'json') &&
      typeof data[c.column_name] === 'object' &&
      data[c.column_name] !== null &&
      !Array.isArray(data[c.column_name]),
  );
  for (const c of objCols) {
    rendered.add(c.column_name);
    sections.push(
      <div key={c.column_name} className="rounded-xl border bg-card p-5 mb-6">
        <h3 className="text-sm font-semibold mb-3 flex items-center gap-1.5">{colIcon(c.column_name)}<span style={colColor(c.column_name) ? { color: colColor(c.column_name) } : undefined}>{colLabel(c.column_name)}</span></h3>
        <ColumnDisplay value={data[c.column_name]} column={c.column_name} renderType="auto" useSuffix={useSuffix} opEnabled={columnOpEnabled?.[c.column_name] !== false} opFlipped={columnOpFlipped?.[c.column_name] === true} hideLabel columnConfig={columnConfig?.[c.column_name]} animTrigger={variantTrigger} onCompareClick={onStatClick ? (subKey) => onStatClick(subKey ?? c.column_name) : undefined} />
      </div>,
    );
  }

  // 3g. Catch-all: remaining fields accordion
  const remainingCols = activeCols.filter((c) => !rendered.has(c.column_name));
  if (remainingCols.length > 0) {
    remainingCols.forEach((c) => rendered.add(c.column_name));
    sections.push(
      <div key="dyn-remaining" className="mb-3">
        <Accordion title="Informações Adicionais" icon={<ScrollText className="h-4 w-4 text-primary" />}>
          <div>
            {remainingCols.map((c) => (
              <div key={c.column_name} className="flex items-start gap-3 py-2 border-b border-border/50 last:border-0">
                <span className="text-xs font-medium text-muted-foreground min-w-[120px] pt-0.5 shrink-0 flex items-center gap-1.5">
                  {colIcon(c.column_name)}
                  <span style={colColor(c.column_name) ? { color: colColor(c.column_name) } : undefined}>{colLabel(c.column_name)}</span>
                </span>
                <div className="text-sm flex-1">
                  <ColumnDisplay value={data[c.column_name]} column={c.column_name} renderType="auto" useSuffix={useSuffix} opEnabled={columnOpEnabled?.[c.column_name] !== false} opFlipped={columnOpFlipped?.[c.column_name] === true} hideLabel columnConfig={columnConfig?.[c.column_name]} animTrigger={variantTrigger} />
                </div>
              </div>
            ))}
          </div>
        </Accordion>
      </div>,
    );
  }

  if (sections.length === 0) return null;
  return <>{sections}</>;
}

type DetailConfig = {
  visibleColumns?: string[];
  columnOrder?: string[];
  columnFormats?: Record<string, string>;
  columnFormatVariants?: Record<string, number>;
  columnOpEnabled?: Record<string, boolean>;
  columnOpFlipped?: Record<string, boolean>;
  showComparison?: boolean;
  showHeader?: boolean;
  labelColor?: string;
  columnConfig?: Record<string, { maxValue?: number; displayName?: string; labelIcon?: string; labelColor?: string; jsonbKeyColors?: Record<string, string>; valueColors?: Record<string, string>; jsonbKeyTypes?: Record<string, unknown>; allowedValues?: AllowedValue[] }>;
};

type Props = {
  data: Record<string, any>;
  collectionType?: string;
  updatedAt?: string;
  createdAt?: string;
  tenantId?: string;
  tenantSlug?: string;
  sourceTable?: string;
  comparisonMode?: 'modal' | 'page';
  schema?: ColumnInfo[];
  hideHeader?: boolean;
  onCompareStatClick?: (statKey: string) => void;
  useSuffix?: boolean;
  chipWrap?: boolean;
  columnTypes?: Record<string, string>;
  detailConfig?: DetailConfig;
};

export default function CollectionItemView({ data, collectionType, updatedAt, createdAt, tenantId, tenantSlug, sourceTable, comparisonMode = 'modal', schema, hideHeader, onCompareStatClick, useSuffix, chipWrap, columnTypes, detailConfig }: Props) {
  const table = sourceTable || 'generic';

  ensureCivVariant3dKeyframes();

  // ── Variantes: troca in-place dos dados do card ──
  const [activeData, setActiveData] = useState<Record<string, any>>(data);
  const [activeVariantSlug, setActiveVariantSlug] = useState<string | null>(null);
  const [loadingVariant, setLoadingVariant] = useState(false);
  const [transitioning, setTransitioning] = useState(false);
  const [beamDir, setBeamDir] = useState<'ltr' | 'rtl'>('ltr');
  const [variantTrigger, setVariantTrigger] = useState(0);
  const transitionTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const baseItemId = data.id as string;
  const baseItemSlug = data.slug as string;

  // Track the base item id so we only reset when the BASE item changes,
  // never when the user is merely viewing one of its variants.
  const baseIdRef = useRef<string | undefined>(data.id as string | undefined);
  useEffect(() => {
    if (baseIdRef.current !== data.id) {
      baseIdRef.current = data.id as string | undefined;
      setActiveData(data);
      setActiveVariantSlug(null);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.id]);

  const prefersReduced = () =>
    typeof window !== 'undefined' &&
    window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true;

  const triggerTransition = (dir?: 'ltr' | 'rtl') => {
    if (dir) setBeamDir(dir);
    setVariantTrigger((p) => p + 1);
    setTransitioning(true);
    if (transitionTimer.current) clearTimeout(transitionTimer.current);
    transitionTimer.current = setTimeout(() => setTransitioning(false), 1000);
  };

  const handleSelectVariant = async (
    variant: { item_id: string; item_slug?: string | null; fullRow?: Record<string, any> } | null,
    meta?: { direction: 'ltr' | 'rtl'; index: number; total: number },
  ) => {
    if (variant === null) {
      setActiveVariantSlug(null);
      setActiveData(data);
      triggerTransition(meta?.direction ?? 'ltr');
      return;
    }
    if (!tenantId || !tenantSlug) return;

    // O VariantSelector já passou o fullRow sincronamente no callback (pre-cache
    // completou antes dos chips ficarem visíveis). Usamos diretamente — sem fetch.
    if (variant.fullRow) {
      setActiveVariantSlug(variant.item_slug ?? null);
      setActiveData({ ...variant.fullRow, _source_table: sourceTable });
      triggerTransition(meta?.direction ?? 'ltr');
      return;
    }

    // Fallback raro: se fullRow não veio (pre-cache falhou), busca async.
    setLoadingVariant(true);
    const dir = meta?.direction ?? 'ltr';
    try {
      let fetched: Record<string, any> | null = null;

      const { getCachedVariantRow } = await import('@/components/wiki/variant-selector');
      const cacheKey = variant.item_slug ?? variant.item_id;
      const cached = getCachedVariantRow(tenantId, table, cacheKey);
      if (cached) fetched = cached;

      if (!fetched) {
        const { getTableItem } = await import('@/lib/data-access');
        if (variant.item_slug) {
          fetched = await getTableItem(tenantSlug, table, variant.item_slug);
        }
      }

      if (!fetched) {
        const { supabase } = await import('@/supabase');
        const { data: row } = await supabase
          .from(table as any)
          .select('*')
          .eq('tenant_id', tenantId)
          .eq('id', variant.item_id)
          .maybeSingle();
        fetched = (row as Record<string, any>) ?? null;
        if (fetched?.id) {
          const { setCachedVariantRow } = await import('@/components/wiki/variant-selector');
          setCachedVariantRow(tenantId, table, fetched.id as string, fetched);
          if (fetched.slug) setCachedVariantRow(tenantId, table, fetched.slug as string, fetched);
        }
      }

      if (fetched) {
        setActiveVariantSlug(variant.item_slug ?? null);
        setActiveData({ ...fetched, _source_table: sourceTable });
        triggerTransition(dir);
      }
    } catch {
      // keep current data on failure
    } finally {
      setLoadingVariant(false);
    }
  };

  const effectiveHideHeader = hideHeader && detailConfig?.showHeader !== true;
  const effectiveVisibleColumns = detailConfig?.visibleColumns || [];
  const visibleColumnsSet = effectiveVisibleColumns.length > 0 ? new Set(effectiveVisibleColumns) : null;
  const columnFormats = detailConfig?.columnFormats || {};
  const formatVariants: Record<string, number> = detailConfig?.columnFormatVariants || {};
  const columnOpEnabled = detailConfig?.columnOpEnabled || {};
  const columnOpFlipped = detailConfig?.columnOpFlipped || {};
  const columnConfigRaw = (detailConfig?.columnConfig || {}) as Record<string, { maxValue?: number; jsonbKeyTypes?: Record<string, { type: string; suffix?: string }>; jsonbKeyColors?: Record<string, string>; valueColors?: Record<string, string>; allowedValues?: AllowedValue[] }>;
  const badgeColors: Record<string, string> = ((detailConfig as any)?.badgeColors as Record<string, string>) || {};
  const columnConfig: Record<string, { maxValue?: number; jsonbKeyTypes?: Record<string, { type: string; suffix?: string }>; jsonbKeyColors?: Record<string, string>; valueColors?: Record<string, string>; allowedValues?: AllowedValue[] }> = {};
  for (const [k, v] of Object.entries(columnConfigRaw)) {
    columnConfig[k] = v ? { ...v, valueColors: { ...badgeColors, ...v.valueColors } } : undefined as any;
  }
  const showComparisonEnabled = detailConfig?.showComparison !== false;
  const [showCompare, setShowCompare] = useState<{ stat?: string } | null>(null);

  const scalingRaw = (detailConfig as any)?.scaling;
  const scalingEnabled = scalingRaw?.enabled === true;
  const maxCopies = scalingRaw?.maxCopies ?? 10000;
  const scalingFormula = scalingRaw?.formula ?? 'linear';
  const [copies, setCopies] = useState(0);
  const scalingInfo: ScalingInfo = {
    enabled: scalingEnabled,
    copies,
    maxCopies,
    formula: scalingFormula,
  };

  const handleStatClick = (statKey: string) => {
    if (!showComparisonEnabled) return;
    if (onCompareStatClick) {
      onCompareStatClick(statKey);
    } else if (comparisonMode === 'page' && tenantId) {
      window.location.href = `/w/${tenantSlug || ''}/compare/${table}?stat=${statKey}`;
    } else {
      setShowCompare({ stat: statKey });
    }
  };

  const rendered = new Set<string>();

  const activeName = (activeData.name || activeData.title || activeData.item_name || activeData.code || '') as string;
  const activeDescription = activeData.description as string | undefined;
  const activeImageUrl = (activeData.image_url || activeData.image) as string | undefined;
  const activeRarity = activeData.rarity != null ? String(activeData.rarity) : undefined;
  const activeTier = activeData.tier != null ? String(activeData.tier) : undefined;
  const activeElement = activeData.element != null ? String(activeData.element) : undefined;
  const activeGrad = activeRarity ? (RARITY_GRAD[activeRarity.toLowerCase()] || 'from-black/60 to-black/40') : 'from-black/60 to-black/40';
  const activeIcon = activeData.icon_url ? (
    <Image src={activeData.icon_url} alt="" fill className="object-contain" />
  ) : activeData.icon && activeData.icon.includes(':') ? (
    <IconRenderer icon={activeData.icon} size="lg" />
  ) : activeData.icon && activeData.icon.startsWith('http') ? (
    <Image src={activeData.icon} alt="" fill className="object-contain" />
  ) : activeData.icon ? (
    <span className="text-lg">{activeData.icon}</span>
  ) : (
    COLL_ICON[collectionType || ''] || <Sword className="h-5 w-5" />
  );

  return (
      <ScalingContext.Provider value={scalingInfo}>
      <div className="max-w-3xl mx-auto">
        {tenantId && tenantSlug && (
          <VariantSelector
            tenantSlug={tenantSlug as string}
            tableName={table}
            currentItemId={baseItemId}
            currentItemSlug={baseItemSlug}
            tenantId={tenantId}
            activeVariantSlug={activeVariantSlug}
            baseItemLabel={data.name || data.title || data.item_name || data.code || ''}
            onSelectVariant={handleSelectVariant}
            loadingVariant={loadingVariant}
          />
        )}

        {showCompare && tenantId && showComparisonEnabled && (
         <ComparePopup
          table={table}
          tenantId={tenantId}
          tenantSlug={tenantSlug}
          currentItemId={activeData.id as string}
          initialStat={showCompare.stat}
          useSuffix={useSuffix}
          onClose={() => setShowCompare(null)}
        />
       )}

        <div
          style={{ perspective: transitioning ? 900 : undefined }}
          className={`relative overflow-hidden ${!prefersReduced() && transitioning ? 'variant-3d-transition variant-3d-flip-in' : ''}`}
          data-beam={transitioning ? beamDir : undefined}
        >
      {!effectiveHideHeader && (
      <div className="rounded-xl mb-6 relative overflow-hidden"
        style={activeImageUrl ? {
          backgroundImage: `url(${activeImageUrl})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        } : undefined}
      >
        <div className={`absolute inset-0 ${activeImageUrl ? 'bg-gradient-to-br from-black/80 via-black/60 to-black/80' : `bg-gradient-to-br ${activeGrad}`}`} />
        {!activeImageUrl && <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.1),transparent)]" />}
        {/* Feixe dourado 3D diagonal varre o heading durante troca de variante */}
        {transitioning && !prefersReduced() && (
          <span
            aria-hidden
            className={`pointer-events-none absolute inset-y-0 z-10 w-[40%] ${
              beamDir === 'rtl' ? 'variant-beam-rtl right-0' : 'variant-beam-ltr left-0'
            }`}
            style={{
              transform: 'rotate(16deg) scaleY(1.6)',
              background: 'linear-gradient(90deg, transparent 0%, hsl(45 100% 60% / 0.9) 40%, hsl(45 100% 70% / 0.95) 50%, hsl(45 100% 60% / 0.9) 60%, transparent 100%)',
              filter: 'blur(3px) brightness(1.3)',
              boxShadow: '0 0 30px hsl(45 100% 50% / 0.5), 0 0 60px hsl(45 100% 50% / 0.25)',
            }}
          />
        )}
        <div className="relative p-6 flex items-start gap-4 flex-wrap">
          <div className="relative h-14 w-14 rounded-xl bg-background/20 backdrop-blur-sm flex items-center justify-center shrink-0 overflow-hidden">
            {activeIcon}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold text-white leading-tight">{activeName}</h1>
            {activeDescription && <p className="text-sm text-white/80 mt-1.5 leading-relaxed">{activeDescription}</p>}
          </div>
          <div className="max-w-[200px]">
            <ChipCarousel>
              {activeRarity && (
                <Tag className={`${RARITY_COLORS[activeRarity.toLowerCase()] || RARITY_COLORS.common} bg-background/80 backdrop-blur-sm uppercase`} icon={<Star className="h-3 w-3" />}>
                  {activeRarity}
                </Tag>
              )}
              {activeTier && (
                <Tag className={`${TIER_COL[activeTier.toLowerCase()] || TIER_COL.d} bg-background/80 backdrop-blur-sm font-bold`}>
                  {TIER_LABEL[activeTier.toLowerCase()] || activeTier}
                </Tag>
              )}
              {activeElement && activeElement !== 'none' && (
                <Tag className={`${elementClass(activeElement)} bg-background/80 backdrop-blur-sm`} icon={elIcon(activeElement)}>
                  {activeElement}
                </Tag>
              )}
            </ChipCarousel>
          </div>
        </div>
      </div>
      )}

      {/* Conteúdo animado: expand/colapse suave 3D entre variantes */}
      <div className={`${!prefersReduced() && transitioning ? 'variant-content-expand' : ''}`}
        style={{ perspective: 600 }}
      >
        <RenderTypeFields
          data={activeData}
          columnTypes={columnTypes || {}}
          columnFormats={columnFormats}
          formatVariants={formatVariants}
          columnOpEnabled={columnOpEnabled}
          columnOpFlipped={columnOpFlipped}
          rendered={rendered}
          visibleColumnsSet={visibleColumnsSet}
          schema={schema}
          tenantId={tenantId}
          tenantSlug={tenantSlug}
          table={table}
          comparisonMode={comparisonMode}
          onStatClick={handleStatClick}
          chipWrap={chipWrap}
          columnOrder={detailConfig?.columnOrder}
          useSuffix={useSuffix}
          columnConfig={columnConfig}
          variantTrigger={variantTrigger}
        />

        {/* Footer */}
        <div className="mt-8 pt-4 border-t border-border space-y-3">
          {(updatedAt || createdAt) && (
            <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs text-muted-foreground">
              {updatedAt && <span>Atualizado em {new Date(updatedAt).toLocaleDateString('pt-BR')}</span>}
              {createdAt && <span>Criado em {new Date(createdAt).toLocaleDateString('pt-BR')}</span>}
            </div>
          )}
          {scalingEnabled && (
            <div className="bg-card/50 rounded-xl border p-4">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Cópias Possuídas
                </span>
                <span className="text-sm font-mono text-primary font-bold">
                  {copies.toLocaleString()} / {maxCopies.toLocaleString()}
                </span>
              </div>
              <ElasticSlider3D
                maxValue={maxCopies}
                defaultValue={copies}
                onValueChange={setCopies}
                isStepped
                stepSize={1}
                showValue={false}
              />
              {copies > 0 && (
                <p className="text-xs text-muted-foreground mt-2">
                  Efeitos calculados para <strong className="text-foreground">{copies.toLocaleString()}</strong> de {maxCopies.toLocaleString()} cópias
                </p>
              )}
            </div>
          )}
        </div>
      </div>
        </div>
    </div>
      </ScalingContext.Provider>
   );
}
