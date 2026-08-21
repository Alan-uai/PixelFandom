'use client';

import Image from 'next/image';
import { useEffect, useState, useRef, useMemo } from 'react';
import { X, Loader2, ArrowUpDown, Type, Image as ImageIcon, Link as LinkIcon, Video, Music, Star, Palette, Smile, Hash, Tag, Layers } from 'lucide-react';
import { supabase } from '@/supabase';
import { formatNumber } from '@/lib/format-number';
import { getTableSchema, type ColumnInfo } from '@/lib/game-schema';
import { computeBaseXmaxStatus, resolveBaseXmaxParam } from '@/lib/scaling-context';
import { axisValueToRatio, interpolate } from '@/lib/scaling-engine';
import { ChipCarousel } from '@/components/ui/chip-carousel';
import { IconRenderer } from '@/components/ui/icon-renderer';
import { ColumnDisplay } from '@/lib/column-types/display-factory';
import { SYSTEM_COLS } from '@/lib/categorizable-columns';
import { parseViewerConfig } from '@/lib/viewer-config';

type ColumnConfigEntry = {
  maxValue?: number;
  jsonbKeyTypes?: Record<string, { type: string; suffix?: string }>;
  jsonbKeyColors?: Record<string, string>;
  valueColors?: Record<string, string>;
};

type CompareColumnConfig = {
  columnOpEnabled: Record<string, boolean>;
  columnOpFlipped: Record<string, boolean>;
  columnConfig: Record<string, ColumnConfigEntry>;
  useSuffix: boolean;
};

type CompareFormat = 'number' | 'range' | 'percent' | 'jsonb' | 'text' | 'boolean' | 'date' | 'duration'
  | 'image' | 'icon' | 'link' | 'video' | 'audio' | 'rating' | 'color' | 'emoji'
  | 'icon-set' | 'color-palette' | 'select' | 'multi-select' | 'tags' | 'toggle-group'
  | 'progress' | 'file' | 'badge' | 'popover' | 'baseXmax';

type CompareInfo = {
  key: string;
  label: string;
  format: CompareFormat;
  // For jsonb sub-fields: the parent jsonb column and the path to reach the value.
  parentKey?: string;
  // Path segments inside the parent jsonb value (object keys / array indices).
  jsonbPath?: (string | number)[];
};

type ComparePopupBxInfo = {
  active: boolean;
  mode: 'division' | 'axis';
  paramColumn?: string;
  base?: number;
  maximum?: number;
  step: number;
  axisLabel: string;
  axisMin: number;
  axisMax: number;
  defaultValue?: number;
};

const NUMERIC_TYPES = new Set([
  'integer', 'bigint', 'smallint', 'numeric', 'real', 'double precision',
  'double', 'float', 'decimal',
]);

const JSONB_TYPES = new Set([
  'jsonb', 'json',
]);

const BOOL_TYPES = new Set([
  'boolean', 'bool',
]);

const DATE_TYPES = new Set([
  'date', 'timestamp', 'timestamptz', 'timestamp with time zone', 'timestamp without time zone',
  'time', 'timetz',
]);

const STAT_LABELS: Record<string, string> = {
  damage: 'Dano',
  crit_chance: 'Crítico',
  knockback: 'Repulsão',
  health_bonus: 'HP',
  speed_bonus: 'Velocidade',
  energy_bonus: 'Energia',
  shop_price: 'Preço',
  craft_cost: 'Custo de Craft',
  gold_cost: 'Custo em Ouro',
  max_uses_per_run: 'Usos por Run',
  unlock_level: 'Nível Mínimo',
  max_ranks: 'Ranks Máximos',
  priority_order: 'Prioridade',
  drop_rate_percentage: 'Taxa de Drop',
  drop_rate_multiplier: 'Mult. Drop',
  attack_speed: 'Vel. Ataque',
  health_level: 'Nível de HP',
  speed_level: 'Nível de Vel.',
  strength_level: 'Nível de Força',
  coin_drop: 'Moedas',
  xp_drop: 'XP',
};

function formatIcon(fmt: CompareFormat): React.ReactNode {
  switch (fmt) {
    case 'image': return <ImageIcon className="h-3 w-3" />;
    case 'icon': return <Hash className="h-3 w-3" />;
    case 'link': return <LinkIcon className="h-3 w-3" />;
    case 'video': return <Video className="h-3 w-3" />;
    case 'audio': return <Music className="h-3 w-3" />;
    case 'rating': return <Star className="h-3 w-3" />;
    case 'color': return <Palette className="h-3 w-3" />;
    case 'emoji': return <Smile className="h-3 w-3" />;
    case 'tags': case 'multi-select': return <Tag className="h-3 w-3" />;
    case 'icon-set': case 'color-palette': return <Layers className="h-3 w-3" />;
    case 'number': case 'range': case 'percent': case 'progress': return null;
    default: return <Type className="h-3 w-3" />;
  }
}

function parseMaybeJson(v: unknown): unknown {
  if (typeof v === 'string') {
    try { return JSON.parse(v); } catch { return v; }
  }
  return v;
}

function resolvePath(root: unknown, path: (string | number)[]): unknown {
  let cur: unknown = root;
  for (const seg of path) {
    if (cur === null || cur === undefined) return undefined;
    if (typeof cur !== 'object') return undefined;
    cur = (cur as Record<string | number, unknown>)[seg];
  }
  return cur;
}

// Resolves the raw value for a compare field, following jsonb paths when present.
function getCompareValue(item: Record<string, any>, stat: CompareInfo): unknown {
  if (stat.parentKey && stat.jsonbPath) {
    const root = parseMaybeJson(item[stat.parentKey]);
    return resolvePath(root, stat.jsonbPath);
  }
  return item[stat.key];
}

function renderCompareValue(item: Record<string, any>, stat: CompareInfo, cfg: CompareColumnConfig, opts: {
  bxInfo: ComparePopupBxInfo | null;
  computeBxValue: (item: Record<string, any>, base: number, max: number) => number;
  useSuffix: boolean;
}): React.ReactNode {
  const val = stat.parentKey && stat.jsonbPath ? getCompareValue(item, stat) : item[stat.key];

  if (stat.format === 'range') {
    const min = item[`${stat.key}_min`] ?? val;
    const max = item[`${stat.key}_max`];
    return <span className="font-semibold tabular-nums">{max !== undefined ? `${min}–${max}` : String(min ?? '—')}</span>;
  }

  // Base → Max columns: show a single "x → y" line. `x` is the value scaled by
  // the baseXmax slider; when the slider is disabled, x = the static base.
  if (stat.format === 'baseXmax') {
    const obj = (stat.parentKey && stat.jsonbPath ? getCompareValue(item, stat) : item[stat.key]) as { base?: number; max?: number } | undefined;
    const base = Number(obj?.base);
    const max = Number(obj?.max);
    if (isNaN(base) || isNaN(max)) return <span className="text-xs text-muted-foreground">—</span>;
    const x = opts.bxInfo?.active ? opts.computeBxValue(item, base, max) : base;
    const fmt = (n: number) => formatNumber(Math.round(n), !!opts.useSuffix);
    return (
      <span className="font-semibold tabular-nums">
        {fmt(x)} <span className="text-muted-foreground font-normal">→</span> {fmt(max)}
      </span>
    );
  }

  if (stat.format === 'percent') {
    return <span className="font-semibold tabular-nums">{val !== undefined ? `${val}%` : '—'}</span>;
  }

  if (stat.format === 'number' || stat.format === 'progress') {
    return <span className="font-semibold tabular-nums">{val !== undefined ? String(val) : '—'}</span>;
  }

  if (stat.format === 'boolean') {
    return (
      <span className={val ? 'text-emerald-500 font-semibold' : 'text-red-400 font-semibold'}>
        {val ? 'Sim' : 'Não'}
      </span>
    );
  }

  if (stat.format === 'date') {
    const d = new Date(val);
    const valid = !isNaN(d.getTime());
    return <span className="text-xs tabular-nums">{valid ? d.toLocaleDateString('pt-BR') : String(val ?? '—')}</span>;
  }

  if (stat.format === 'duration') {
    return <span className="font-mono text-xs tabular-nums">{String(val ?? '—')}</span>;
  }

  if (stat.format === 'image') {
    if (!val) return <span className="text-xs text-muted-foreground">—</span>;
    return (
      <div className="flex items-center gap-2">
        <ImageIcon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
        <Image src={String(val)} alt="" width={24} height={24} className="h-6 w-6 rounded object-cover shrink-0" />
      </div>
    );
  }

  if (stat.format === 'icon') {
    if (!val) return <span className="text-xs text-muted-foreground">—</span>;
    const str = String(val);
    if (str.includes(':')) {
      return <IconRenderer icon={str} size="sm" />;
    }
    return <span className="text-sm">{str}</span>;
  }

  if (stat.format === 'link') {
    if (!val) return <span className="text-xs text-muted-foreground">—</span>;
    const str = String(val);
    return (
      <a href={str} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-primary hover:underline truncate max-w-[150px]">
        <LinkIcon className="h-3 w-3 shrink-0" />
        {str.replace(/^https?:\/\//, '').slice(0, 30)}
      </a>
    );
  }

  if (stat.format === 'video') {
    if (!val) return <span className="text-xs text-muted-foreground">—</span>;
    return (
      <div className="flex items-center gap-1.5">
        <Video className="h-3.5 w-3.5 text-muted-foreground" />
        <span className="text-xs truncate max-w-[120px]">{String(val)}</span>
      </div>
    );
  }

  if (stat.format === 'audio') {
    if (!val) return <span className="text-xs text-muted-foreground">—</span>;
    return (
      <div className="flex items-center gap-1.5">
        <Music className="h-3.5 w-3.5 text-muted-foreground" />
        <span className="text-xs truncate max-w-[120px]">{String(val)}</span>
      </div>
    );
  }

  if (stat.format === 'rating') {
    const num = typeof val === 'number' ? val : parseFloat(String(val));
    if (isNaN(num)) return <span className="text-xs text-muted-foreground">—</span>;
    return (
      <div className="flex items-center gap-0.5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star key={i} className={`h-3 w-3 ${i < num ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground/30'}`} />
        ))}
        <span className="text-xs font-semibold ml-1 tabular-nums">{num}</span>
      </div>
    );
  }

  if (stat.format === 'color') {
    if (!val) return <span className="text-xs text-muted-foreground">—</span>;
    return (
      <div className="flex items-center gap-2">
        <div className="h-4 w-4 rounded-full border shrink-0" style={{ backgroundColor: String(val) }} />
        <span className="text-xs font-mono">{String(val)}</span>
      </div>
    );
  }

  if (stat.format === 'emoji') {
    return <span className="text-base">{val ? String(val) : '—'}</span>;
  }

  if (stat.format === 'icon-set') {
    const parsed = parseMaybeJson(val);
    if (!Array.isArray(parsed) || parsed.length === 0) return <span className="text-xs text-muted-foreground">—</span>;
    return (
      <div className="flex items-center gap-0.5">
        {parsed.slice(0, 5).map((ic: any, i: number) => (
          <span key={i} className="text-xs">{typeof ic === 'string' ? ic : String(ic)}</span>
        ))}
        {parsed.length > 5 && <span className="text-[10px] text-muted-foreground">+{parsed.length - 5}</span>}
      </div>
    );
  }

  if (stat.format === 'color-palette') {
    const parsed = parseMaybeJson(val);
    if (!Array.isArray(parsed) || parsed.length === 0) return <span className="text-xs text-muted-foreground">—</span>;
    return (
      <div className="flex items-center gap-0.5">
        {parsed.slice(0, 6).map((c: any, i: number) => (
          <div key={i} className="h-3.5 w-3.5 rounded-full border shrink-0" style={{ backgroundColor: String(c) }} />
        ))}
      </div>
    );
  }

  if (stat.format === 'select' || stat.format === 'toggle-group') {
    return <span className="text-xs font-medium">{val != null ? String(val) : '—'}</span>;
  }

  if (stat.format === 'multi-select' || stat.format === 'tags') {
    const parsed = parseMaybeJson(val);
    const items: string[] = Array.isArray(parsed) ? parsed.map(String) : (val ? [String(val)] : []);
    if (items.length === 0) return <span className="text-xs text-muted-foreground">—</span>;
    return (
      <div className="flex flex-wrap gap-1">
        {items.slice(0, 4).map((t, i) => (
          <span key={i} className="inline-flex items-center gap-0.5 rounded-full bg-muted px-1.5 py-0.5 text-[10px]">
            <Tag className="h-2.5 w-2.5" />
            {t}
          </span>
        ))}
        {items.length > 4 && <span className="text-[10px] text-muted-foreground">+{items.length - 4}</span>}
      </div>
    );
  }

  if (stat.format === 'file') {
    if (!val) return <span className="text-xs text-muted-foreground">—</span>;
    const str = String(val);
    return (
      <a href={str} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-primary hover:underline truncate max-w-[150px]">
        <Layers className="h-3 w-3 shrink-0" />
        {str.split('/').pop()?.slice(0, 25) || str}
      </a>
    );
  }

  if (stat.format === 'popover') {
    return <span className="text-xs text-foreground">{String(val ?? '—')}</span>;
  }

  if (stat.format === 'jsonb') {
    const parsed = parseMaybeJson(val);
    if (parsed === null || parsed === undefined) return <span className="text-xs text-muted-foreground">—</span>;
    if (typeof parsed !== 'object') {
      return <span className="font-semibold tabular-nums">{String(parsed)}</span>;
    }
    const cfgKey = stat.parentKey ?? stat.key;
    return (
      <ColumnDisplay
        value={parsed}
        column={cfgKey}
        renderType="jsonb"
        useSuffix={cfg.useSuffix}
        opEnabled={cfg.columnOpEnabled[cfgKey] !== false}
        opFlipped={cfg.columnOpFlipped[cfgKey] === true}
        columnConfig={cfg.columnConfig[cfgKey]}
      />
    );
  }

  // text fallback
  return <span className="text-xs text-foreground">{String(val ?? '—')}</span>;
}

function safeStringCompare(a: unknown, b: unknown): number {
  const sa = String(a ?? '');
  const sb = String(b ?? '');
  return sa.localeCompare(sb);
}

export default function ComparePopup({
  table, tenantId, tenantSlug: _tenantSlug, currentItemId, initialStat, onClose, useSuffix = true,
}: {
  table: string;
  tenantId: string;
  tenantSlug?: string;
  currentItemId?: string;
  initialStat?: string;
  onClose: () => void;
  useSuffix?: boolean;
}) {
  const [items, setItems] = useState<Record<string, any>[]>([]);
  const [loading, setLoading] = useState(true);
  const [schema, setSchema] = useState<ColumnInfo[]>([]);
  const [viewerCfg, setViewerCfg] = useState<{ columnOpEnabled: Record<string, boolean>; columnOpFlipped: Record<string, boolean>; columnConfig: Record<string, ColumnConfigEntry> }>({ columnOpEnabled: {}, columnOpFlipped: {}, columnConfig: {} });
  const itemsCache = useRef<Record<string, any>[] | null>(null);
  const configCache = useRef<{ columnOpEnabled: Record<string, boolean>; columnOpFlipped: Record<string, boolean>; columnConfig: Record<string, ColumnConfigEntry>; columnTypes: Record<string, string> } | null>(null);

  const colConfig = useMemo<CompareColumnConfig>(
    () => ({ ...viewerCfg, useSuffix }),
    [viewerCfg, useSuffix],
  );

  const [compareStat, setCompareStat] = useState<CompareInfo | null>(null);
  const [compareFilter, setCompareFilter] = useState<string | null>(null);
  const [sortAsc, setSortAsc] = useState(false);

  // Base → Max (baseXmax) slider state for the compare popup.
  const [bxInfo, setBxInfo] = useState<ComparePopupBxInfo | null>(null);
  const [bxValue, setBxValue] = useState(0);
  const [bxColumnTypes, setBxColumnTypes] = useState<Record<string, string>>({});

  useEffect(() => {
    getTableSchema(table).then(setSchema);
  }, [table]);

  useEffect(() => {
    if (!tenantId || !table) return;
    if (configCache.current) {
      setViewerCfg(configCache.current);
      setBxColumnTypes(configCache.current.columnTypes || {});
      return;
    }
    supabase
      .from('tenant_game_tables')
      .select('viewer_config')
      .eq('tenant_id', tenantId)
      .eq('table_name', table)
      .maybeSingle()
      .then(({ data }) => {
        const vc = parseViewerConfig(data?.viewer_config);
        const cfg = {
          columnOpEnabled: (vc.card?.columnOpEnabled || {}) as Record<string, boolean>,
          columnOpFlipped: (vc.card?.columnOpFlipped || {}) as Record<string, boolean>,
          columnConfig: ((vc.columnConfig || (vc.card as any)?.columnConfig || {}) as Record<string, ColumnConfigEntry>),
        };
        configCache.current = { ...cfg, columnTypes: (vc.columnTypes || {}) as Record<string, string> };
        setViewerCfg(cfg);
        setBxColumnTypes((vc.columnTypes || {}) as Record<string, string>);
        const cardLayer = (vc as any)?.card ?? vc;
        const sliderRaw = (cardLayer as any)?.baseXmax; // config #2 (slider)
        const scalarRaw = (vc as any)?.baseXmax; // config #1 (scalar range)
        const sliderEnabled = (sliderRaw?.mode || 'off') !== 'off';
        const scalarMode = scalarRaw?.mode || 'off';
        const scalarEnabled = scalarRaw?.enabled === true;
        const bxActive = sliderEnabled || scalarMode !== 'off' || scalarEnabled || sliderRaw?.enabled === true;
        if (!bxActive) {
          setBxInfo(null);
          return;
        }
        const paramColumn = (sliderRaw?.paramColumn as string | undefined) ?? (scalarRaw?.paramColumn as string | undefined);
        const base = sliderRaw?.base != null ? Number(sliderRaw.base) : (scalarRaw?.base != null ? Number(scalarRaw.base) : undefined);
        const maximum = sliderRaw?.max != null ? Number(sliderRaw.max) : (scalarRaw?.max != null ? Number(scalarRaw.max) : undefined);
        const step = sliderRaw?.step ?? scalarRaw?.step ?? 1;
        const axisLabel = sliderRaw?.axisLabel ?? scalarRaw?.axisLabel ?? 'Cópias';
        const axisMin = Number(sliderRaw?.axisMin ?? scalarRaw?.axisMin) || 1;
        const axisMax = Number(sliderRaw?.axisMax ?? scalarRaw?.axisMax) || 100;
        setBxInfo({
          active: true,
          mode: paramColumn ? 'division' : 'axis',
          paramColumn,
          base,
          maximum,
          step,
          axisLabel,
          axisMin,
          axisMax,
          defaultValue: sliderRaw?.defaultValue ?? scalarRaw?.defaultValue,
        });
      });
  }, [tenantId, table]);

  // Reset the baseXmax slider to its base position whenever the config changes.
  useEffect(() => {
    if (!bxInfo) { setBxValue(0); return; }
    const start = bxInfo.mode === 'axis'
      ? (bxInfo.defaultValue != null ? bxInfo.defaultValue : bxInfo.axisMin)
      : (bxInfo.defaultValue != null ? bxInfo.defaultValue : 0);
    setBxValue(start);
  }, [bxInfo]);

  // Max division parameter across items (the numerator ceiling for the slider).
  const bxSliderMax = useMemo(() => {
    if (!bxInfo || bxInfo.mode !== 'division' || !bxInfo.paramColumn) return bxInfo?.axisMax ?? 100;
    let m = 0;
    for (const it of items) {
      const v = resolveBaseXmaxParam(it, bxInfo.paramColumn);
      if (v && v > m) m = v;
    }
    return m > 0 ? m : (bxInfo.axisMax || 100);
  }, [bxInfo, items]);

  // Per-item scaled base value for a baseXmax range. When baseXmax is disabled,
  // returns the static base. Otherwise interpolates using the active slider.
  function computeBxValue(item: Record<string, any>, base: number, max: number): number {
    if (!bxInfo?.active) return base;
    if (bxInfo.mode === 'division') {
      const b = bxInfo.base ?? base;
      const m = bxInfo.maximum ?? max;
      const paramValue = bxInfo.paramColumn ? resolveBaseXmaxParam(item, bxInfo.paramColumn) : undefined;
      return computeBaseXmaxStatus(bxValue, paramValue, b, m, bxInfo.step);
    }
    const ratio = axisValueToRatio(bxValue, bxInfo.axisMin, bxInfo.axisMax);
    return interpolate(base, max, ratio, 'linear');
  }

  const allStats = useMemo(() => buildAllCompareInfo(schema, items, bxColumnTypes), [schema, items, bxColumnTypes]);

  useEffect(() => {
    if (allStats.length === 0) return;
    if (initialStat) {
      setCompareStat(
        allStats.find(s => s.key === initialStat)
          ?? allStats.find(s => s.parentKey === initialStat)
          ?? allStats[0],
      );
    } else {
      setCompareStat(allStats[0]);
    }
  }, [allStats, initialStat]);

  useEffect(() => {
    if (!tenantId || !table) return;
    if (itemsCache.current) {
      setItems(itemsCache.current);
      setLoading(false);
      return;
    }
    supabase
      .from(table)
      .select('*')
      .eq('tenant_id', tenantId)
      .order('updated_at', { ascending: false })
      .then(({ data }) => {
        if (data) {
          itemsCache.current = data as Record<string, any>[];
          setItems(data as Record<string, any>[]);
        }
        setLoading(false);
      });
  }, [tenantId, table]);

  const subCategoryKey = useMemo(() => {
    const sample = items[0];
    if (!sample) return null;
    if (sample.weapon_type) return 'weapon_type';
    if (sample.enemy_type) return 'enemy_type';
    if (sample.boss_type) return 'boss_type';
    if (sample.category) return 'category';
    return null;
  }, [items]);

  const subCategoryValues = useMemo(() => {
    if (!subCategoryKey) return [];
    return [...new Set(items.map(item => String(item[subCategoryKey] ?? '')).filter(Boolean))];
  }, [items, subCategoryKey]);

  const filteredItems = compareFilter
    ? items.filter(item => String(item[subCategoryKey ?? '']) === compareFilter)
    : items;

  const sorted = useMemo(() => {
    if (!compareStat) return [];
    const stat = compareStat;
    const numericFormats = new Set(['number', 'range', 'percent', 'progress', 'rating']);
    return [...filteredItems]
      .filter(item => getCompareValue(item, stat) != null)
      .sort((a, b) => {
        const rawA = getCompareValue(a, stat);
        const rawB = getCompareValue(b, stat);
        if (numericFormats.has(stat.format)) {
          const va = parseFloat(rawA as string);
          const vb = parseFloat(rawB as string);
          if (isNaN(va) && isNaN(vb)) return 0;
          if (isNaN(va)) return 1;
          if (isNaN(vb)) return -1;
          return sortAsc ? va - vb : vb - va;
        }
        if (stat.format === 'boolean') {
          const ba = Boolean(rawA);
          const bb = Boolean(rawB);
          return sortAsc ? (ba === bb ? 0 : ba ? 1 : -1) : (ba === bb ? 0 : ba ? -1 : 1);
        }
        if (stat.format === 'date') {
          const da = new Date(rawA as string).getTime();
          const db = new Date(rawB as string).getTime();
          if (isNaN(da) && isNaN(db)) return 0;
          if (isNaN(da)) return 1;
          if (isNaN(db)) return -1;
          return sortAsc ? da - db : db - da;
        }
        if (stat.format === 'jsonb') {
          // Numeric-aware sort for scalar jsonb sub-values, string fallback otherwise.
          const na = parseFloat(rawA as string);
          const nb = parseFloat(rawB as string);
          if (!isNaN(na) && !isNaN(nb)) return sortAsc ? na - nb : nb - na;
          return sortAsc ? safeStringCompare(rawA, rawB) : safeStringCompare(rawB, rawA);
        }
        return sortAsc ? safeStringCompare(rawA, rawB) : safeStringCompare(rawB, rawA);
      });
  }, [filteredItems, compareStat, sortAsc]);

  function isCurrentItem(item: Record<string, any>): boolean {
    return currentItemId ? item.id === currentItemId : false;
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-start justify-center pt-12 pb-8 px-4 overflow-auto" onClick={onClose}>
      <div className="w-full max-w-2xl bg-card rounded-xl border shadow-xl max-h-[85vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-3 border-b shrink-0">
          <h2 className="text-lg font-bold capitalize">
            Comparação: {table.replace(/_/g, ' ')}
          </h2>
          <button onClick={onClose} className="p-1 rounded-md hover:bg-muted transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        {compareStat && allStats.length > 0 && (
          <div className="px-5 py-2.5 border-b shrink-0">
            <ChipCarousel>
              {allStats.map(s => (
                <button
                  key={s.key}
                  onClick={() => { setCompareStat(s); setCompareFilter(null); }}
                  className={`rounded-full px-3 py-1 text-xs font-medium whitespace-nowrap transition-colors shrink-0 flex items-center gap-1 ${
                    s.key === compareStat.key
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  }`}
                >
                  {formatIcon(s.format)}
                  {s.label}
                </button>
              ))}
            </ChipCarousel>
          </div>
        )}

        {subCategoryValues.length > 1 && (
          <div className="px-5 py-2.5 border-b shrink-0">
            <ChipCarousel>
              <button
                onClick={() => setCompareFilter(null)}
                className={`rounded-full px-3 py-1 text-xs font-medium whitespace-nowrap transition-colors shrink-0 ${
                  !compareFilter
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
              >
                Todos
              </button>
              {subCategoryValues.map(val => (
                <button
                  key={val}
                  onClick={() => setCompareFilter(val)}
                  className={`rounded-full px-3 py-1 text-xs font-medium whitespace-nowrap transition-colors shrink-0 ${
                    compareFilter === val
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  }`}
                >
                  {val}
                </button>
              ))}
            </ChipCarousel>
          </div>
        )}

        {bxInfo?.active && (
          <div className="px-5 py-2.5 border-b shrink-0">
            <div className="flex items-center gap-3">
              <span className="text-xs text-muted-foreground whitespace-nowrap">{bxInfo.axisLabel}</span>
              <input
                type="range"
                className="flex-1 accent-primary cursor-pointer"
                min={bxInfo.mode === 'division' ? 0 : bxInfo.axisMin}
                max={bxInfo.mode === 'division' ? bxSliderMax : bxInfo.axisMax}
                step={bxInfo.mode === 'division' ? 1 : (bxInfo.step || 1)}
                value={bxValue}
                onChange={(e) => setBxValue(Number(e.target.value))}
              />
              <span className="text-xs font-mono tabular-nums w-14 text-right">
                {formatNumber(Math.round(bxValue), useSuffix)}
              </span>
            </div>
          </div>
        )}

        <div className="flex-1 overflow-auto">
          {loading ? (
            <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
          ) : compareStat ? (
            <>
              <div className="flex items-center justify-between px-5 py-2 text-xs text-muted-foreground border-b">
                <span>{sorted.length} ite{sorted.length === 1 ? 'm' : 'ns'}</span>
                <button
                  onClick={() => setSortAsc(!sortAsc)}
                  className="flex items-center gap-1 hover:text-foreground transition-colors"
                >
                  <ArrowUpDown className="h-3 w-3" />
                  {sortAsc ? 'Menor primeiro' : 'Maior primeiro'}
                </button>
              </div>

              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-card">
                  <tr className="border-b text-xs text-muted-foreground">
                    <th className="text-left px-5 py-2.5 font-medium w-8">#</th>
                    <th className="text-left px-5 py-2.5 font-medium">Item</th>
                    <th className="text-left px-5 py-2.5 font-medium w-40">{compareStat.label}</th>
                  </tr>
                </thead>
                <tbody>
                  {sorted.map((item, idx) => {
                    const isCurrent = isCurrentItem(item);
                    return (
                      <tr
                        key={item.id}
                        className={`border-b last:border-0 transition-colors ${
                          isCurrent ? 'bg-primary/5' : 'hover:bg-muted/50'
                        }`}
                      >
                        <td className="px-5 py-2.5 text-xs text-muted-foreground">{idx + 1}</td>
                        <td className="px-5 py-2.5">
                          <div className="flex items-center gap-2.5">
                            {item.icon_url ? (
                              <Image src={item.icon_url} alt="" width={24} height={24} className="rounded object-contain shrink-0" />
                            ) : item.icon && typeof item.icon === 'string' && item.icon.includes(':') ? (
                              <IconRenderer icon={item.icon} size="sm" />
                            ) : null}
                            <span className={`font-medium ${isCurrent ? 'text-primary' : ''}`}>
                              {item.name || item.title || item.item_name || item.code || '—'}
                            </span>
                            {isCurrent && (
                              <span className="text-[10px] text-primary font-medium bg-primary/10 rounded-full px-2 py-0.5">
                                Atual
                              </span>
                            )}
                          </div>
                        </td>
                        <td className={`px-5 py-2.5 ${isCurrent ? 'text-primary' : ''}`}>
                          {renderCompareValue(item, compareStat, colConfig, { bxInfo, computeBxValue, useSuffix })}
                        </td>
                      </tr>
                    );
                  })}
                  {sorted.length === 0 && (
                    <tr>
                      <td colSpan={3} className="px-5 py-8 text-center text-sm text-muted-foreground">
                        Nenhum item encontrado com este valor.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </>
          ) : (
            <div className="flex justify-center py-12 text-sm text-muted-foreground">
              Nenhum campo disponível para esta tabela.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function buildAllCompareInfo(schema: ColumnInfo[], items: Record<string, any>[], renderTypes: Record<string, string> = {}): CompareInfo[] {
  const result: CompareInfo[] = [];
  const seen = new Set<string>();
  const push = (info: CompareInfo) => {
    if (seen.has(info.key)) return;
    seen.add(info.key);
    result.push(info);
  };

  // Column universe: prefer schema; fall back to keys discovered across items.
  const columnTypes = new Map<string, string | undefined>();
  for (const c of schema) if (!isSystem(c.column_name)) columnTypes.set(c.column_name, c.data_type);
  for (const item of items) {
    for (const name of Object.keys(item)) {
      if (isSystem(name) || columnTypes.has(name)) continue;
      columnTypes.set(name, undefined);
    }
  }

  // Runtime type inference from data (used when schema type is missing/unknown).
  const inferFormat = (name: string): CompareFormat => {
    // Name-based detection first (covers text columns storing structured data)
    const nf = classifyByName(name);
    if (nf) return nf;

    for (const item of items) {
      const v = item[name];
      if (v === null || v === undefined || v === '') continue;
      const parsed = parseMaybeJson(v);
      if (typeof parsed === 'object' && parsed !== null) return 'jsonb';
      if (typeof parsed === 'boolean') return 'boolean';
      if (typeof parsed === 'number' || (typeof parsed === 'string' && parsed.trim() !== '' && !isNaN(Number(parsed)))) {
        return name.includes('percent') || name.includes('rate') || name.includes('chance') ? 'percent' : 'number';
      }
      return 'text';
    }
    return 'text';
  };

  const classify = (name: string): CompareFormat => {
    // Name-based detection first (image_url → image, etc.)
    const nf = classifyByName(name);
    if (nf) return nf;

    const dt = columnTypes.get(name);
    if (dt === undefined) return inferFormat(name);
    if (JSONB_TYPES.has(dt)) return 'jsonb';
    if (BOOL_TYPES.has(dt)) return 'boolean';
    if (DATE_TYPES.has(dt)) return 'date';
    if (NUMERIC_TYPES.has(dt)) {
      return name.includes('percent') || name.includes('rate') || name.includes('chance') ? 'percent' : 'number';
    }
    return 'text';
  };

  // Detect format from column name patterns (for text columns storing specific data)
  function classifyByName(name: string): CompareFormat | null {
    const n = name.toLowerCase();
    if (n.endsWith('_url') || n === 'url' || n === 'link' || n === 'href') return 'link';
    if (n.includes('image') || n === 'icon_url' || n === 'thumbnail' || n === 'cover' || n === 'banner' || n === 'avatar' || n === 'photo') return 'image';
    if (n.includes('icon') && !n.includes('icon_url')) return 'icon';
    if (n.includes('video') || n.endsWith('.mp4') || n.endsWith('.webm')) return 'video';
    if (n.includes('audio') || n.endsWith('.mp3') || n.endsWith('.ogg') || n.endsWith('.wav')) return 'audio';
    if (n.includes('color') || n.endsWith('_color') || n === 'colour') return 'color';
    if (n.includes('rating') || n.includes('stars') || n.includes('score')) return 'rating';
    if (n.includes('emoji')) return 'emoji';
    if (n.includes('tags') || n.includes('labels')) return 'tags';
    if (n.includes('progress') || n.includes('percentage') || n.includes('completion')) return 'progress';
    if (n.includes('file') || n.includes('document') || n.includes('attachment')) return 'file';
    return null;
  }

  // Range pairs (only meaningful for schema-known numeric columns).
  const numericSchema = schema.filter(c => NUMERIC_TYPES.has(c.data_type) && !isSystem(c.column_name));
  const pairs = findRangePairs(numericSchema);
  const paired = new Set(pairs.flatMap(k => [`${k}_min`, `${k}_max`, k]));
  for (const base of pairs) {
    push({ key: base, label: STAT_LABELS[base] ?? labelFromKey(base), format: 'range' });
  }

  for (const name of columnTypes.keys()) {
    if (paired.has(name)) continue;
    const format = classify(name);
    if (format === 'jsonb') {
      const isBx = renderTypes[name] === 'baseXmax';
      const subFields = discoverJsonbSubFields(name, items);
      if (subFields.length > 0) {
        for (const sub of subFields) push({ ...sub, format: isBx ? 'baseXmax' : 'jsonb' });
      } else {
        // Fall back to whole-column jsonb comparison if no sub-keys found.
        push({ key: name, label: labelFromKey(name), format: isBx ? 'baseXmax' : 'jsonb' });
      }
      continue;
    }
    push({ key: name, label: STAT_LABELS[name] ?? labelFromKey(name), format });
  }

  return result;
}

// Expands a jsonb column into one comparable entry per discovered sub-key,
// mirroring how mini cards break objects/arrays into independent cards.
function discoverJsonbSubFields(column: string, items: Record<string, any>[]): CompareInfo[] {
  const objectKeys = new Set<string>();
  let sawArrayOfObjects = false;
  const arrayObjectKeys = new Set<string>();

  for (const item of items) {
    const parsed = parseMaybeJson(item[column]);
    if (parsed === null || parsed === undefined) continue;
    if (Array.isArray(parsed)) {
      for (const el of parsed) {
        if (el && typeof el === 'object' && !Array.isArray(el)) {
          sawArrayOfObjects = true;
          for (const k of Object.keys(el as Record<string, unknown>)) arrayObjectKeys.add(k);
        }
      }
    } else if (typeof parsed === 'object') {
      for (const k of Object.keys(parsed as Record<string, unknown>)) objectKeys.add(k);
    }
  }

  // Object shape → compare each object key across items.
  if (objectKeys.size > 0) {
    return [...objectKeys].map(k => ({
      key: `${column}.${k}`,
      label: `${labelFromKey(column)} · ${labelFromKey(k)}`,
      format: 'jsonb' as CompareFormat,
      parentKey: column,
      jsonbPath: [k],
    }));
  }

  // Array-of-objects → compare each key of the first array element across items.
  if (sawArrayOfObjects && arrayObjectKeys.size > 0) {
    return [...arrayObjectKeys].map(k => ({
      key: `${column}[].${k}`,
      label: `${labelFromKey(column)} · ${labelFromKey(k)}`,
      format: 'jsonb' as CompareFormat,
      parentKey: column,
      jsonbPath: [0, k],
    }));
  }

  return [];
}

function findRangePairs(columns: ColumnInfo[]): string[] {
  const names = new Set(columns.map(c => c.column_name));
  const pairs: string[] = [];
  for (const col of columns) {
    if (col.column_name.endsWith('_min')) {
      const base = col.column_name.slice(0, -4);
      if (names.has(`${base}_max`)) pairs.push(base);
    }
  }
  return pairs;
}

function isSystem(name: string): boolean {
  return SYSTEM_COLS.has(name) || name === 'rank';
}

function labelFromKey(key: string): string {
  return key
    .replace(/_min$/, '')
    .replace(/_max$/, '')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, l => l.toUpperCase());
}
