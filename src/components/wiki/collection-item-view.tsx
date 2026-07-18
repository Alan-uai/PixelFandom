'use client';

import Image from 'next/image';
import React, { useState } from 'react';
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
import { ColumnDisplay } from '@/lib/column-types/display-factory';
import { getTypeDef } from '@/lib/column-types/registry';
import FormatVariantRenderer from '@/components/wiki/format-variant-renderer';
import type { DisplayFormat } from '@/lib/column-types/format-compatibility';
import {
  RARITY_COLORS, RARITY_GRAD, TIER_LABEL, TIER_COL,
  elementClass, elIcon, COLL_ICON,
} from '@/lib/game-ui';

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

function fieldIcon(key: string): React.ReactNode | undefined {
  return FIELD_LABELS[key]?.icon;
}

function fieldColor(key: string): string | undefined {
  return FIELD_LABELS[key]?.color;
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
  data, columnTypes, columnFormats, formatVariants, columnOpEnabled, rendered, visibleColumnsSet,
  schema, tenantId, tenantSlug, table, comparisonMode, onStatClick, chipWrap, columnOrder, useSuffix, columnConfig,
}: {
  data: Record<string, any>;
  columnTypes: Record<string, string>;
  columnFormats?: Record<string, string>;
  formatVariants?: Record<string, number>;
  columnOpEnabled?: Record<string, boolean>;
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
  columnConfig?: Record<string, { maxValue?: number; jsonbKeyTypes?: Record<string, { type: string; suffix?: string }>; jsonbKeyColors?: Record<string, string>; valueColors?: Record<string, string> }>;
}) {
  const sections: React.ReactNode[] = [];
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
            return (
              <FormatVariantRenderer
                key={col}
                format={fmt as DisplayFormat}
                variant={formatVariants?.[col] || 1}
                value={data[col]}
                label={fieldLabel(col)}
                useSuffix={useSuffix}
                opEnabled={columnOpEnabled?.[col] !== false}
                valueColors={cc?.valueColors}
                jsonbKeyColors={cc?.jsonbKeyColors}
                maxValue={cc?.maxValue}
              />
            );
          })}
        </div>,
      );
    }
  }

  // 2. Columns with explicit render types from table schema
  const entries = Object.entries(columnTypes).filter(
    ([col]) => !rendered.has(col) && hasValue(data[col]),
  );
  if (entries.length > 0) {
    const typeSections = entries.map(([col, renderType]) => {
      const def = getTypeDef(renderType);
      if (!def) return null;
      rendered.add(col);
      return (
        <div key={`rt-${col}`} className="mb-4">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            {col.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
          </h3>
          <ColumnDisplay value={data[col]} column={col} renderType={renderType} useSuffix={useSuffix} opEnabled={columnOpEnabled?.[col] !== false} hideLabel columnConfig={columnConfig?.[col]} />
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
          const meta = FIELD_LABELS[c.column_name];
          return (
            <StatCard
              key={c.column_name}
              label={meta?.label || fieldLabel(c.column_name)}
               value={<ColumnDisplay value={data[c.column_name]} column={c.column_name} renderType="auto" useSuffix={useSuffix} opEnabled={columnOpEnabled?.[c.column_name] !== false} hideLabel columnConfig={columnConfig?.[c.column_name]} />}
              icon={meta?.icon || fieldIcon(c.column_name)}
              color={meta?.color || fieldColor(c.column_name)}
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
              {fieldLabel(c.column_name)}: <ColumnDisplay value={data[c.column_name]} column={c.column_name} renderType="auto" useSuffix={useSuffix} opEnabled={columnOpEnabled?.[c.column_name] !== false} hideLabel columnConfig={columnConfig?.[c.column_name]} />
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
                {fieldLabel(c.column_name)}: <span style={color ? { color } : {}}><ColumnDisplay value={val} column={c.column_name} renderType="auto" useSuffix={useSuffix} opEnabled={columnOpEnabled?.[c.column_name] !== false} hideLabel columnConfig={cc} /></span>
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
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">{fieldLabel(c.column_name)}</h3>
        <ColumnDisplay value={data[c.column_name]} column={c.column_name} renderType="auto" useSuffix={useSuffix} opEnabled={columnOpEnabled?.[c.column_name] !== false} hideLabel columnConfig={columnConfig?.[c.column_name]} />
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
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">{fieldLabel(c.column_name)}</h3>
        <ColumnDisplay value={data[c.column_name]} column={c.column_name} renderType="auto" useSuffix={useSuffix} opEnabled={columnOpEnabled?.[c.column_name] !== false} hideLabel columnConfig={columnConfig?.[c.column_name]} onCompareClick={onStatClick ? () => onStatClick(c.column_name) : undefined} />
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
        <h3 className="text-sm font-semibold mb-3">{fieldLabel(c.column_name)}</h3>
        <ColumnDisplay value={data[c.column_name]} column={c.column_name} renderType="auto" useSuffix={useSuffix} opEnabled={columnOpEnabled?.[c.column_name] !== false} hideLabel columnConfig={columnConfig?.[c.column_name]} onCompareClick={onStatClick ? () => onStatClick(c.column_name) : undefined} />
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
                <span className="text-xs font-medium text-muted-foreground min-w-[120px] pt-0.5 shrink-0">
                  {fieldLabel(c.column_name)}
                </span>
                <div className="text-sm flex-1">
                  <ColumnDisplay value={data[c.column_name]} column={c.column_name} renderType="auto" useSuffix={useSuffix} opEnabled={columnOpEnabled?.[c.column_name] !== false} hideLabel columnConfig={columnConfig?.[c.column_name]} />
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
  showComparison?: boolean;
  showHeader?: boolean;
  labelColor?: string;
  columnConfig?: Record<string, { maxValue?: number; jsonbKeyColors?: Record<string, string>; valueColors?: Record<string, string>; jsonbKeyTypes?: Record<string, unknown> }>;
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
  const name = (data.name || data.title || data.item_name || data.code || '') as string;
  const description = data.description as string | undefined;
  const rarity = data.rarity != null ? String(data.rarity) : undefined;
  const tier = data.tier != null ? String(data.tier) : undefined;
  const element = data.element != null ? String(data.element) : undefined;
  const imageUrl = (data.image_url || data.image) as string | undefined;

  const effectiveHideHeader = hideHeader && detailConfig?.showHeader !== true;
  const effectiveVisibleColumns = detailConfig?.visibleColumns || [];
  const visibleColumnsSet = effectiveVisibleColumns.length > 0 ? new Set(effectiveVisibleColumns) : null;
  const columnFormats = detailConfig?.columnFormats || {};
  const formatVariants: Record<string, number> = detailConfig?.columnFormatVariants || {};
  const columnOpEnabled = detailConfig?.columnOpEnabled || {};
  const columnConfig = (detailConfig?.columnConfig || {}) as Record<string, { maxValue?: number; jsonbKeyTypes?: Record<string, { type: string; suffix?: string }>; jsonbKeyColors?: Record<string, string>; valueColors?: Record<string, string> }>;
  const showComparisonEnabled = detailConfig?.showComparison !== false;
  const [showCompare, setShowCompare] = useState<{ stat?: string } | null>(null);

  const grad = rarity ? (RARITY_GRAD[rarity.toLowerCase()] || 'from-black/60 to-black/40') : 'from-black/60 to-black/40';

  const itemIcon = data.icon_url ? (
    <Image src={data.icon_url} alt="" fill className="object-contain" />
  ) : data.icon && data.icon.includes(':') ? (
    <IconRenderer icon={data.icon} size="lg" />
  ) : data.icon && data.icon.startsWith('http') ? (
    <Image src={data.icon} alt="" fill className="object-contain" />
  ) : data.icon ? (
    <span className="text-lg">{data.icon}</span>
  ) : (
    COLL_ICON[collectionType || ''] || <Sword className="h-5 w-5" />
  );

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

  return (
      <div className="max-w-3xl mx-auto">
        {tenantId && (
          <VariantSelector
            tenantSlug={tenantSlug || ''}
            tableName={table}
            currentItemId={data.id as string}
            currentItemSlug={data.slug as string}
            tenantId={tenantId}
          />
        )}

        {showCompare && tenantId && showComparisonEnabled && (
        <ComparePopup
          table={table}
          tenantId={tenantId}
          tenantSlug={tenantSlug}
          currentItemId={data.id as string}
          initialStat={showCompare.stat}
          onClose={() => setShowCompare(null)}
        />
      )}

      {!effectiveHideHeader && (
      <div className="rounded-xl mb-6 relative overflow-hidden"
        style={imageUrl ? {
          backgroundImage: `url(${imageUrl})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        } : undefined}
      >
        <div className={`absolute inset-0 ${imageUrl ? 'bg-gradient-to-br from-black/80 via-black/60 to-black/80' : `bg-gradient-to-br ${grad}`}`} />
        {!imageUrl && <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.1),transparent)]" />}
        <div className="relative p-6 flex items-start gap-4 flex-wrap">
          <div className="relative h-14 w-14 rounded-xl bg-background/20 backdrop-blur-sm flex items-center justify-center shrink-0 overflow-hidden">
            {itemIcon}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold text-white leading-tight">{name}</h1>
            {description && <p className="text-sm text-white/80 mt-1.5 leading-relaxed">{description}</p>}
          </div>
          <div className="max-w-[200px]">
            <ChipCarousel>
              {rarity && (
                <Tag className={`${RARITY_COLORS[rarity.toLowerCase()] || RARITY_COLORS.common} bg-background/80 backdrop-blur-sm uppercase`} icon={<Star className="h-3 w-3" />}>
                  {rarity}
                </Tag>
              )}
              {tier && (
                <Tag className={`${TIER_COL[tier.toLowerCase()] || TIER_COL.d} bg-background/80 backdrop-blur-sm font-bold`}>
                  {TIER_LABEL[tier.toLowerCase()] || tier}
                </Tag>
              )}
              {element && element !== 'none' && (
                <Tag className={`${elementClass(element)} bg-background/80 backdrop-blur-sm`} icon={elIcon(element)}>
                  {element}
                </Tag>
              )}
            </ChipCarousel>
          </div>
        </div>
      </div>
      )}

      {/* Unified rendering pipeline: formats → types → auto-classified → catch-all */}
      <RenderTypeFields
        data={data}
        columnTypes={columnTypes || {}}
        columnFormats={columnFormats}
        formatVariants={formatVariants}
        columnOpEnabled={columnOpEnabled}
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
      />

      {/* Footer */}
      {(updatedAt || createdAt) && (
        <div className="mt-8 pt-4 border-t border-border flex flex-wrap gap-x-6 gap-y-1 text-xs text-muted-foreground">
          {updatedAt && <span>Atualizado em {new Date(updatedAt).toLocaleDateString('pt-BR')}</span>}
          {createdAt && <span>Criado em {new Date(createdAt).toLocaleDateString('pt-BR')}</span>}
        </div>
      )}
    </div>
  );
}
