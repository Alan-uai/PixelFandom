'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import {
  ChevronDown, ChevronRight, Star, Sword, Shield, Zap,
  Flame, Snowflake, Skull, Ghost, Globe, Droplets, Gem,
  ScrollText, Lightbulb, MessageCircle, Eye, Crosshair,
  Coins, Pickaxe, Sparkles, Loader2, ArrowLeft, X,
} from 'lucide-react';
import { supabase } from '@/supabase';
import { IconRenderer } from '@/components/ui/icon-renderer';
import type { ColumnInfo } from '@/lib/game-schema';

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
};

function detectType(data: Record<string, unknown>): string {
  if (data.damage_min !== undefined || data.weapon_type) return 'weapons';
  if (data.health_bonus !== undefined) return 'armors';
  if (data.key_buffs || data.synergy) return 'rings';
  if (data.shop_price !== undefined) return 'potions';
  if (data.max_ranks !== undefined) return 'upgrades';
  if (data.enemy_type) return 'enemies';
  if (data.boss_type) return 'bosses';
  if (data.code !== undefined) return 'codes';
  if (data.item_name) return 'crafting-recipes';
  if (data.world_name) return 'worlds';
  return 'generic';
}

const RARITY_COLORS: Record<string, string> = {
  common: 'text-gray-400 bg-gray-500/10 border-gray-500/30',
  rare: 'text-blue-400 bg-blue-500/10 border-blue-500/30',
  epic: 'text-purple-400 bg-purple-500/10 border-purple-500/30',
  legendary: 'text-orange-400 bg-orange-500/10 border-orange-500/30',
  vaulted: 'text-red-400 bg-red-500/10 border-red-500/30',
};
const RARITY_GRAD: Record<string, string> = {
  common: 'from-gray-600 to-gray-500',
  rare: 'from-blue-600 to-blue-500',
  epic: 'from-purple-600 to-purple-500',
  legendary: 'from-orange-600 to-orange-500',
  vaulted: 'from-red-600 to-red-500',
};
const TIER_LABEL: Record<string, string> = { s_plus: 'S+', s: 'S', a: 'A', b: 'B', c: 'C', d: 'D' };
const TIER_COL: Record<string, string> = {
  s_plus: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30',
  s: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30',
  a: 'text-green-400 bg-green-500/10 border-green-500/30',
  b: 'text-blue-400 bg-blue-500/10 border-blue-500/30',
  c: 'text-purple-400 bg-purple-500/10 border-purple-500/30',
  d: 'text-gray-400 bg-gray-500/10 border-gray-500/30',
};

function elementClass(v: string): string {
  const m: Record<string, string> = {
    fire: 'text-orange-400 bg-orange-500/10 border-orange-500/30',
    flame: 'text-orange-400 bg-orange-500/10 border-orange-500/30',
    frost: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30',
    ice: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30',
    poison: 'text-lime-400 bg-lime-500/10 border-lime-500/30',
    dark: 'text-purple-400 bg-purple-500/10 border-purple-500/30',
    ghost: 'text-purple-400 bg-purple-500/10 border-purple-500/30',
    void: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/30',
    earth: 'text-amber-500 bg-amber-500/10 border-amber-500/30',
    lightning: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30',
    thunder: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30',
  };
  const vv = v.toLowerCase().trim();
  for (const [k, c] of Object.entries(m)) if (vv.includes(k)) return c;
  return 'text-muted-foreground bg-muted/50 border-border';
}

function effectColor(v: string): string {
  const s = v.toLowerCase();
  if (['buff', 'boost', 'bonus', 'heal', 'shield', 'recovery', 'haste', 'strength', 'regeneration'].some((w) => s.includes(w))) return 'text-emerald-500';
  if (['debuff', 'curse', 'stun', 'slow', 'bleed', 'weaken', 'cursed', 'vulnerable'].some((w) => s.includes(w))) return 'text-red-500';
  if (['fire', 'flame', 'burn', 'inferno', 'molten'].some((w) => s.includes(w))) return 'text-orange-500';
  if (['frost', 'ice', 'freeze', 'cold', 'chill'].some((w) => s.includes(w))) return 'text-cyan-500';
  if (['poison', 'venom', 'toxic', 'acid'].some((w) => s.includes(w))) return 'text-lime-500';
  if (['lightning', 'thunder', 'shock', 'electr', 'spark', 'static'].some((w) => s.includes(w))) return 'text-yellow-500';
  if (['dark', 'shadow', 'ghost', 'void', 'soul', 'necro'].some((w) => s.includes(w))) return 'text-purple-500';
  if (['earth', 'rock', 'stone', 'crystal'].some((w) => s.includes(w))) return 'text-amber-600';
  return '';
}

function ColoredText({ text }: { text: string }) {
  const c = effectColor(text);
  return c ? <span className={c}>{text}</span> : <>{text}</>;
}

function Tag({ children, className = '', icon }: { children: React.ReactNode; className?: string; icon?: React.ReactNode }) {
  return <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium ${className}`}>{icon}{children}</span>;
}

function StatCard({ label, value, icon, color, onClick }: { label: string; value: string; icon?: React.ReactNode; color?: string; onClick?: () => void }) {
  const Comp = onClick ? 'button' : 'div';
  return (
    <Comp
      onClick={onClick}
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

function FieldRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 py-2 border-b border-border/50 last:border-0">
      <span className="text-xs font-medium text-muted-foreground min-w-[120px] pt-0.5 shrink-0">{label}</span>
      <div className="text-sm flex-1">{children}</div>
    </div>
  );
}

function elIcon(el: string): React.ReactNode {
  const e = el.toLowerCase();
  if (e.includes('fire') || e.includes('flame')) return <Flame className="h-3 w-3" />;
  if (e.includes('frost') || e.includes('ice')) return <Snowflake className="h-3 w-3" />;
  if (e.includes('poison') || e.includes('venom')) return <Droplets className="h-3 w-3" />;
  if (e.includes('dark') || e.includes('shadow') || e.includes('ghost')) return <Skull className="h-3 w-3" />;
  if (e.includes('void')) return <Ghost className="h-3 w-3" />;
  if (e.includes('earth') || e.includes('rock')) return <Globe className="h-3 w-3" />;
  if (e.includes('lightning') || e.includes('thunder')) return <Zap className="h-3 w-3" />;
  return <Zap className="h-3 w-3" />;
}

const COLL_ICON: Record<string, React.ReactNode> = {
  weapons: <Sword className="h-5 w-5" />,
  armors: <Shield className="h-5 w-5" />,
  rings: <Gem className="h-5 w-5" />,
  potions: <Droplets className="h-5 w-5" />,
  upgrades: <Zap className="h-5 w-5" />,
  enemies: <Skull className="h-5 w-5" />,
  bosses: <Skull className="h-5 w-5" />,
  codes: <ScrollText className="h-5 w-5" />,
  'crafting-recipes': <Pickaxe className="h-5 w-5" />,
  worlds: <Globe className="h-5 w-5" />,
};

function fmt(v: unknown): string {
  if (v === null || v === undefined) return '—';
  if (typeof v === 'boolean') return v ? 'Sim' : 'Não';
  if (typeof v === 'object') {
    if (Array.isArray(v)) return v.map((i) => (typeof i === 'object' ? JSON.stringify(i) : String(i))).join(', ');
    return JSON.stringify(v);
  }
  return String(v);
}

function isArrStr(v: unknown): v is string[] {
  return Array.isArray(v) && v.every((i) => typeof i === 'string');
}

const SKIP = new Set(['name', 'title', 'description', 'summary', 'id', 'image', 'image_url', 'rarity', 'tier', 'element', 'updated_at', 'created_at', 'world_name']);

const EXTRA_FIELDS = new Set([
  'obtain_method', 'chapter', 'chapters', 'starting_banner', 'drop_wave_requirement',
  'code', 'code_type', 'rewards', 'reward_type', 'xp_drop', 'coin_drop',
  'environment', 'warning', 'speed_level', 'strength_level', 'item_name', 'item_type',
  'worth_notes', 'savings_percentage', 'second_slot_unlock_level',
  'verified_date', 'verified_by', 'expired_date',
]);

const ALREADY_RENDERED = new Set([
  'ability', 'key_buffs', 'possible_stats', 'effects', 'attacks', 'weakness',
  'items_dropped', 'notable_loot', 'set_bonus', 'passive_ability', 'passive_ability_level',
  'phase_mechanics', 'strategy', 'tips', 'notes', 'important_notes', 'synergy',
  'per_rank_effect', 'damage_per_spirit', 'craft_materials', 'crafting_materials',
  'materials', 'weapon_type', 'attack_speed', 'enemy_type', 'difficulty', 'boss_type',
  'category', 'health_level', 'is_must_pick', 'is_worth_crafting', 'is_active',
  'is_expired', 'is_craftable', 'damage_min', 'damage_max', 'crit_chance_min',
  'crit_chance_max', 'knockback', 'health_bonus', 'speed_bonus', 'energy_bonus',
  'shop_price', 'craft_cost', 'gold_cost', 'max_uses_per_run', 'unlock_level',
  'max_ranks', 'priority_order', 'drop_rate_percentage', 'drop_rate_multiplier',
  'crafting_cost', 'obtain_method',
]);

// ── Dynamic schema-driven rendering helpers ──

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

function isShortText(v: unknown): boolean {
  if (typeof v !== 'string') return false;
  return v.length <= 60 && !v.includes('\n');
}

const DYNAMIC_SKIP = new Set([
  'id', 'tenant_id', 'created_at', 'updated_at',
  'name', 'title', 'description', 'summary',
  'rarity', 'tier', 'element',
  'image', 'image_url', 'icon', 'icon_url',
  'world_name',
  '_source_table',
]);

function renderDynamicSections(
  data: Record<string, any>,
  schema: ColumnInfo[],
  tenantId: string | undefined,
  tenantSlug: string | undefined,
  table: string,
  comparisonMode_: 'modal' | 'page',
) {
  const rendered = new Set<string>();
  const sections: React.ReactNode[] = [];

  // 1. Numeric stat cards
  const numCols = schema.filter(
    (c) => isNumericType(c.data_type) && !DYNAMIC_SKIP.has(c.column_name) && data[c.column_name] != null,
  );
  if (numCols.length > 0) {
    numCols.forEach((c) => rendered.add(c.column_name));
    sections.push(
      <div key="dyn-stats" className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mb-6">
        {numCols.map((c) => {
          const label = c.column_name.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
          return (
            <StatCard
              key={c.column_name}
              label={label}
              value={fmt(data[c.column_name])}
              onClick={tenantId ? () => {
                if (comparisonMode_ === 'page') {
                  window.location.href = `/w/${tenantSlug || ''}/compare/${table}?stat=${c.column_name}`;
                }
              } : undefined}
            />
          );
        })}
      </div>,
    );
  }

  // 2. Booleans → tags
  const boolCols = schema.filter(
    (c) => c.data_type === 'boolean' && !DYNAMIC_SKIP.has(c.column_name) && data[c.column_name] != null,
  );
  if (boolCols.length > 0) {
    boolCols.forEach((c) => rendered.add(c.column_name));
    sections.push(
      <div key="dyn-bools" className="flex flex-wrap gap-2 mb-6">
        {boolCols.map((c) => (
          <Tag key={c.column_name}
            className={data[c.column_name]
              ? 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10'
              : 'border-muted-foreground/30 text-muted-foreground bg-muted/10'
            }
          >
            {data[c.column_name]
              ? `${c.column_name.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}: Sim`
              : `${c.column_name.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}: Não`}
          </Tag>
        ))}
      </div>,
    );
  }

  // 3. Short text → tags (only text/varchar columns)
  const textCols = schema.filter(
    (c) =>
      (c.data_type === 'text' || c.data_type?.startsWith('character varying') || c.data_type === 'varchar') &&
      !DYNAMIC_SKIP.has(c.column_name) &&
      data[c.column_name] != null &&
      data[c.column_name] !== '' &&
      isShortText(data[c.column_name]),
  );
  if (textCols.length > 0) {
    textCols.forEach((c) => rendered.add(c.column_name));
    sections.push(
      <div key="dyn-tags" className="flex flex-wrap gap-2 mb-6">
        {textCols.map((c) => (
          <Tag key={c.column_name} className="border-primary/30 text-primary bg-primary/10">
            {String(data[c.column_name])}
          </Tag>
        ))}
      </div>,
    );
  }

  // 4. Long text → labeled sections
  const longCols = schema.filter(
    (c) =>
      (c.data_type === 'text' || c.data_type?.startsWith('character varying') || c.data_type === 'varchar') &&
      !DYNAMIC_SKIP.has(c.column_name) &&
      data[c.column_name] != null &&
      data[c.column_name] !== '' &&
      isLongText(data[c.column_name]),
  );
  for (const c of longCols) {
    rendered.add(c.column_name);
    const label = c.column_name.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
    sections.push(
      <div key={c.column_name} className="mb-6">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">{label}</h3>
        <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">{String(data[c.column_name])}</p>
      </div>,
    );
  }

  // 5. JSON arrays → tag lists
  const arrCols = schema.filter(
    (c) =>
      (c.data_type === 'jsonb' || c.data_type === 'json') &&
      !DYNAMIC_SKIP.has(c.column_name) &&
      Array.isArray(data[c.column_name]) &&
      data[c.column_name].length > 0,
  );
  for (const c of arrCols) {
    rendered.add(c.column_name);
    const label = c.column_name.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
    sections.push(
      <div key={c.column_name} className="mb-6">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">{label}</h3>
        <div className="flex flex-wrap gap-2">
          {data[c.column_name].map((item: unknown, i: number) => (
            <Tag key={i} className="border-purple-500/30 text-purple-400 bg-purple-500/10">
              {typeof item === 'object' ? JSON.stringify(item) : String(item)}
            </Tag>
          ))}
        </div>
      </div>,
    );
  }

  // 6. JSON objects → sub-sections
  const objCols = schema.filter(
    (c) =>
      (c.data_type === 'jsonb' || c.data_type === 'json') &&
      !DYNAMIC_SKIP.has(c.column_name) &&
      typeof data[c.column_name] === 'object' &&
      data[c.column_name] !== null &&
      !Array.isArray(data[c.column_name]),
  );
  for (const c of objCols) {
    rendered.add(c.column_name);
    const label = c.column_name.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
    const obj = data[c.column_name] as Record<string, unknown>;
    sections.push(
      <div key={c.column_name} className="rounded-xl border bg-card p-5 mb-6">
        <h3 className="text-sm font-semibold mb-3">{label}</h3>
        <div className="space-y-2">
          {Object.entries(obj).map(([k, v]) => (
            <div key={k} className="flex items-start gap-3 text-sm">
              <span className="text-xs font-medium text-muted-foreground min-w-[100px] shrink-0">
                {k.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
              </span>
              <span className="text-foreground">{typeof v === 'object' ? JSON.stringify(v) : String(v)}</span>
            </div>
          ))}
        </div>
      </div>,
    );
  }

  if (sections.length === 0) return null;
  return <>{sections}</>;
}

// ── Fallback for columns not covered by schema or hardcoded sections ──
function renderFallbackFields(data: Record<string, any>) {
  const extra = Object.entries(data).filter(
    ([k, v]) => !SKIP.has(k) && !EXTRA_FIELDS.has(k) && !ALREADY_RENDERED.has(k) && v != null && v !== '',
  );
  if (extra.length === 0) return null;
  return (
    <div className="mb-3">
      <Accordion title="Informações Adicionais" icon={<ScrollText className="h-4 w-4 text-primary" />}>
        <div>
          {extra.map(([k, v]) => (
            <FieldRow key={k} label={k.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}>
              {typeof v === 'object' && v !== null ? (
                isArrStr(v) ? (
                  <div className="flex flex-wrap gap-1">
                    {v.map((x, i) => <span key={i} className="text-xs rounded-md bg-muted px-2 py-0.5">{x}</span>)}
                  </div>
                ) : (
                  <code className="text-xs bg-muted rounded px-1.5 py-0.5">{JSON.stringify(v)}</code>
                )
              ) : (
                <ColoredText text={fmt(v)} />
              )}
            </FieldRow>
          ))}
        </div>
      </Accordion>
    </div>
  );
}

export default function CollectionItemView({ data, collectionType, updatedAt, createdAt, tenantId, tenantSlug, sourceTable, comparisonMode = 'modal', schema }: Props) {
  const type = collectionType || detectType(data);
  const table = sourceTable || type;
  const name = (data.name || data.title || data.item_name || data.code || '') as string;
  const description = data.description as string | undefined;
  const rarity = data.rarity as string | undefined;
  const tier = data.tier as string | undefined;
  const element = data.element as string | undefined;
  const imageUrl = (data.image_url || data.image) as string | undefined;
  const [fullImg, setFullImg] = useState<string | null>(null);

  const grad = rarity ? (RARITY_GRAD[rarity.toLowerCase()] || 'from-black/60 to-black/40') : 'from-black/60 to-black/40';

  const itemIcon = data.icon_url ? (
    <img src={data.icon_url} alt="" className="w-full h-full object-contain" />
  ) : data.icon && data.icon.includes(':') ? (
    <IconRenderer icon={data.icon} size="lg" />
  ) : data.icon && data.icon.startsWith('http') ? (
    <img src={data.icon} alt="" className="w-full h-full object-contain" />
  ) : data.icon ? (
    <span className="text-lg">{data.icon}</span>
  ) : (
    COLL_ICON[type] || <Sword className="h-5 w-5" />
  );

  // ── Comparison state ──
  type CompareInfo = { key: string; label: string; format: 'number' | 'range' | 'percent' | 'text' };
  const [compareStat, setCompareStat] = useState<CompareInfo | null>(null);
  const [compareItems, setCompareItems] = useState<Record<string, any>[]>([]);
  const [loadingCompare, setLoadingCompare] = useState(false);
  const [compareFilter, setCompareFilter] = useState<string | null>(null);
  const itemsCache = useRef<Record<string, any>[] | null>(null);

  const subCategoryKey = (() => {
    if (data.weapon_type) return 'weapon_type';
    if (data.enemy_type) return 'enemy_type';
    if (data.boss_type) return 'boss_type';
    if (data.category) return 'category';
    return null;
  })();

  const fetchCompare = useCallback(async () => {
    if (!tenantId || !table) return;
    if (itemsCache.current) {
      setCompareItems(itemsCache.current);
      return;
    }
    setLoadingCompare(true);
    const { data: items } = await supabase
      .from(table)
      .select('*')
      .eq('tenant_id', tenantId)
      .order('updated_at', { ascending: false });
    if (items) {
      itemsCache.current = items as Record<string, any>[];
      setCompareItems(items as Record<string, any>[]);
    }
    setLoadingCompare(false);
  }, [tenantId, table]);

  useEffect(() => {
    if (compareStat) fetchCompare();
  }, [compareStat, fetchCompare]);

  const handleStatClick = (info: CompareInfo) => {
    if (comparisonMode === 'page' && tenantId) {
      window.location.href = `/w/${tenantSlug || ''}/compare/${table}?stat=${info.key}`;
    } else {
      setCompareStat(info);
    }
  };

  const filteredCompareItems = compareFilter
    ? compareItems.filter((item) => String(item[subCategoryKey || '']) === compareFilter)
    : compareItems;

  const subCategoryValues = subCategoryKey
    ? [...new Set(compareItems.map((item) => String(item[subCategoryKey] || '')).filter(Boolean))]
    : [];

  function getCompareValue(item: Record<string, any>, stat: CompareInfo): string {
    if (stat.format === 'range') {
      const min = item[`${stat.key}_min`] ?? item[stat.key];
      const max = item[`${stat.key}_max`];
      return max !== undefined ? `${min}-${max}` : String(min ?? '—');
    }
    if (stat.format === 'percent') {
      const val = item[stat.key];
      return val !== undefined ? `${val}%` : '—';
    }
    return String(item[stat.key] ?? '—');
  }

  function getCompareSortValue(item: Record<string, any>, stat: CompareInfo): number {
    const v = parseFloat(item[stat.key]);
    return isNaN(v) ? -Infinity : v;
  }

  function statIsSameItem(item: Record<string, any>): boolean {
    return item.name === data.name || item.id === data.id;
  }

  // ── Compare sidebar ──
  function compareSidebar() {
    if (!compareStat) return null;
    const sorted = [...filteredCompareItems].sort((a, b) => getCompareSortValue(b, compareStat) - getCompareSortValue(a, compareStat));

    return (
      <div className="fixed inset-0 z-50 bg-black/60 flex items-start justify-center pt-12 pb-8 px-4 overflow-auto" onClick={() => setCompareStat(null)}>
        <div className="w-full max-w-2xl bg-card rounded-xl border shadow-xl max-h-[85vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-3 border-b shrink-0">
            <h2 className="text-lg font-bold">Comparação: {compareStat.label}</h2>
            <div className="flex items-center gap-2">
              {comparisonMode === 'modal' && tenantId && (
                <Link
                  href={`/w/${tenantSlug || ''}/compare/${table}?stat=${compareStat.key}`}
                  className="text-xs text-primary hover:text-primary/80 font-medium"
                >
                  Ver página dedicada
                </Link>
              )}
              <button onClick={() => setCompareStat(null)} className="p-1 rounded-md hover:bg-muted transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Filter */}
          {subCategoryValues.length > 1 && (
            <div className="flex flex-wrap gap-1.5 px-5 py-2.5 border-b shrink-0">
              <button
                onClick={() => setCompareFilter(null)}
                className={`rounded-full px-3 py-0.5 text-xs font-medium transition-colors ${!compareFilter ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}
              >
                Todos
              </button>
              {subCategoryValues.map((val) => (
                <button
                  key={val}
                  onClick={() => setCompareFilter(val)}
                  className={`rounded-full px-3 py-0.5 text-xs font-medium transition-colors ${compareFilter === val ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}
                >
                  {val}
                </button>
              ))}
            </div>
          )}

          {/* Table */}
          <div className="flex-1 overflow-auto">
            {loadingCompare ? (
              <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
            ) : (
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-card">
                  <tr className="border-b text-xs text-muted-foreground">
                    <th className="text-left px-5 py-2.5 font-medium">Item</th>
                    <th className="text-right px-5 py-2.5 font-medium w-28">{compareStat.label}</th>
                  </tr>
                </thead>
                <tbody>
                  {sorted.map((item) => {
                    const isCurrent = statIsSameItem(item);
                    const val = getCompareValue(item, compareStat);
                    return (
                      <tr key={item.id} className={`border-b last:border-0 transition-colors ${isCurrent ? 'bg-primary/5' : 'hover:bg-muted/50'}`}>
                        <td className="px-5 py-2.5">
                          <div className="flex items-center gap-2.5">
                            {item.icon_url ? (
                              <img src={item.icon_url} alt="" className="h-6 w-6 rounded object-contain shrink-0" />
                            ) : null}
                            <span className={`font-medium ${isCurrent ? 'text-primary' : ''}`}>
                              {item.name || item.title || item.item_name || item.code || '—'}
                            </span>
                            {isCurrent && <span className="text-[10px] text-primary font-medium bg-primary/10 rounded-full px-2 py-0.5">Atual</span>}
                          </div>
                        </td>
                        <td className={`px-5 py-2.5 text-right font-semibold tabular-nums ${isCurrent ? 'text-primary' : ''}`}>{val}</td>
                      </tr>
                    );
                  })}
                  {sorted.length === 0 && (
                    <tr><td colSpan={2} className="px-5 py-8 text-center text-sm text-muted-foreground">Nenhum item encontrado.</td></tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      {compareSidebar()}

      {/* Header with banner background */}
      <div className={`rounded-xl mb-6 relative overflow-hidden`}
        style={imageUrl ? {
          backgroundImage: `url(${imageUrl})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        } : undefined}
      >
        <div className={`absolute inset-0 ${imageUrl ? 'bg-gradient-to-br from-black/80 via-black/60 to-black/80' : `bg-gradient-to-br ${grad}`}`} />
        {!imageUrl && <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.1),transparent)]" />}
        <div className="relative p-6 flex items-start gap-4 flex-wrap">
          <div className="h-14 w-14 rounded-xl bg-background/20 backdrop-blur-sm flex items-center justify-center shrink-0 overflow-hidden">
            {itemIcon}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold text-white leading-tight">{name}</h1>
            {description && <p className="text-sm text-white/80 mt-1.5 leading-relaxed">{description}</p>}
          </div>
          <div className="flex flex-wrap gap-2">
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
          </div>
        </div>
      </div>

      {/* Tags */}
      <div className="flex flex-wrap gap-2 mb-6">
        {data.weapon_type && <Tag icon={<Sword className="h-3 w-3" />} className="border-blue-500/30 text-blue-400 bg-blue-500/10">{String(data.weapon_type)}</Tag>}
        {data.attack_speed && <Tag icon={<Zap className="h-3 w-3" />} className={`border-current/30 ${data.attack_speed === 'fast' ? 'text-emerald-400' : data.attack_speed === 'slow' ? 'text-red-400' : 'text-yellow-400'} bg-current/10`}>{String(data.attack_speed)}</Tag>}
        {data.enemy_type && <Tag className="border-red-500/30 text-red-400 bg-red-500/10">{String(data.enemy_type)}</Tag>}
        {data.difficulty && <Tag className={String(data.difficulty).toLowerCase().includes('hard') ? 'border-red-500/30 text-red-400 bg-red-500/10' : 'border-yellow-500/30 text-yellow-400 bg-yellow-500/10'}>{String(data.difficulty)}</Tag>}
        {data.boss_type && <Tag className="border-purple-500/30 text-purple-400 bg-purple-500/10">{String(data.boss_type)}</Tag>}
        {data.category && <Tag className="border-cyan-500/30 text-cyan-400 bg-cyan-500/10">{String(data.category)}</Tag>}
        {data.health_level && <Tag className={`border-current/30 ${String(data.health_level).toLowerCase() === 'high' ? 'text-red-400' : String(data.health_level).toLowerCase() === 'medium' ? 'text-yellow-400' : 'text-emerald-400'} bg-current/10`}>HP: {String(data.health_level)}</Tag>}
        {data.is_must_pick === true && <Tag icon={<Star className="h-3 w-3" />} className="border-yellow-500/30 text-yellow-400 bg-yellow-500/10">Must Pick</Tag>}
        {(data.is_worth_crafting === true || data.is_worth_crafting === 'YES') && <Tag icon={<Sparkles className="h-3 w-3" />} className="border-emerald-500/30 text-emerald-400 bg-emerald-500/10">Vale a pena craftar</Tag>}
        {data.is_active === true && <Tag className="border-emerald-500/30 text-emerald-400 bg-emerald-500/10">Ativo</Tag>}
        {data.is_expired === true && <Tag className="border-red-500/30 text-red-400 bg-red-500/10">Expirado</Tag>}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mb-6">
        {data.damage_min !== undefined && (
          <StatCard label="Dano" icon={<Sword className="h-4 w-4" />} value={data.damage_max !== undefined ? `${data.damage_min}-${data.damage_max}` : String(data.damage_min)} onClick={() => handleStatClick({ key: 'damage_min', label: 'Dano', format: 'range' })} />
        )}
        {(data.crit_chance_min !== undefined || data.crit_chance_max !== undefined) && (
          <StatCard label="Crit" icon={<Crosshair className="h-4 w-4" />} color="text-yellow-400" value={data.crit_chance_max !== undefined ? `${data.crit_chance_min}-${data.crit_chance_max}%` : `${data.crit_chance_min ?? data.crit_chance_max}%`} onClick={() => handleStatClick({ key: 'crit_chance_min', label: 'Crit', format: 'percent' })} />
        )}
        {data.knockback !== undefined && <StatCard label="Knockback" icon={<Zap className="h-4 w-4" />} value={String(data.knockback)} onClick={() => handleStatClick({ key: 'knockback', label: 'Knockback', format: 'number' })} />}
        {data.health_bonus !== undefined && <StatCard label="HP" icon={<Shield className="h-4 w-4" />} color="text-emerald-400" value={`+${data.health_bonus}`} onClick={() => handleStatClick({ key: 'health_bonus', label: 'HP', format: 'number' })} />}
        {data.speed_bonus !== undefined && <StatCard label="Speed" icon={<Zap className="h-4 w-4" />} color="text-cyan-400" value={`+${data.speed_bonus}`} onClick={() => handleStatClick({ key: 'speed_bonus', label: 'Speed', format: 'number' })} />}
        {data.energy_bonus !== undefined && <StatCard label="Energy" icon={<Zap className="h-4 w-4" />} color="text-purple-400" value={`+${data.energy_bonus}`} onClick={() => handleStatClick({ key: 'energy_bonus', label: 'Energy', format: 'number' })} />}
        {data.shop_price !== undefined && <StatCard label="Preço" icon={<Coins className="h-4 w-4" />} value={`${data.shop_price}`} onClick={() => handleStatClick({ key: 'shop_price', label: 'Preço', format: 'number' })} />}
        {(data.craft_cost !== undefined || data.gold_cost !== undefined) && <StatCard label="Custo Craft" icon={<Pickaxe className="h-4 w-4" />} value={`${data.craft_cost ?? data.gold_cost} ouro`} onClick={() => handleStatClick({ key: 'craft_cost', label: 'Custo Craft', format: 'number' })} />}
        {data.max_uses_per_run !== undefined && <StatCard label="Usos/run" value={String(data.max_uses_per_run)} onClick={() => handleStatClick({ key: 'max_uses_per_run', label: 'Usos/run', format: 'number' })} />}
        {data.unlock_level !== undefined && <StatCard label="Nível mín" value={String(data.unlock_level)} onClick={() => handleStatClick({ key: 'unlock_level', label: 'Nível mín', format: 'number' })} />}
        {data.max_ranks !== undefined && <StatCard label="Ranks máx" value={String(data.max_ranks)} onClick={() => handleStatClick({ key: 'max_ranks', label: 'Ranks máx', format: 'number' })} />}
        {data.priority_order !== undefined && <StatCard label="Prioridade" value={`#${data.priority_order}`} onClick={() => handleStatClick({ key: 'priority_order', label: 'Prioridade', format: 'number' })} />}
        {data.drop_rate_percentage !== undefined && <StatCard label="Drop Rate" color="text-yellow-400" value={String(data.drop_rate_percentage)} onClick={() => handleStatClick({ key: 'drop_rate_percentage', label: 'Drop Rate', format: 'percent' })} />}
      </div>

      {/* Code Block */}
      {type === 'codes' && (() => {
        const code = (data.code || data.name) as string;
        return (
          <div className="mb-6">
            <div className="flex items-center gap-2 rounded-xl border bg-muted/50 p-4">
              <ScrollText className="h-5 w-5 text-primary shrink-0" />
              <code className="flex-1 font-mono text-lg font-bold tracking-wider">{code}</code>
              <button onClick={() => navigator.clipboard.writeText(code)} className="text-xs text-primary hover:text-primary/80 font-medium shrink-0">Copiar</button>
            </div>
            {data.rewards && <p className="text-sm text-muted-foreground mt-2">Recompensa: <span className="text-foreground">{isArrStr(data.rewards) ? data.rewards.join(', ') : String(data.rewards)}</span></p>}
            {data.code_type && <p className="text-xs text-muted-foreground mt-1">Tipo: <span className="font-medium text-foreground">{String(data.code_type)}</span>{data.verified_date && <> · Verificado: {data.verified_date}</>}</p>}
          </div>
        );
      })()}

      {/* Type-specific sections */}
      {type === 'weapons' && data.ability && (() => {
        const a = data.ability as Record<string, any>;
        return (
          <div className="rounded-xl border bg-card p-5 mb-6">
            <div className="flex items-center gap-2 mb-3"><Sparkles className="h-4 w-4 text-yellow-400" /><h3 className="font-semibold text-sm">Habilidade: {String(a.name || '')}</h3></div>
            {a.description && <p className="text-sm text-muted-foreground mb-3"><ColoredText text={String(a.description)} /></p>}
            <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
              {a.energy_cost !== undefined && <span className="inline-flex items-center gap-1"><Zap className="h-3 w-3 text-purple-400" /> Custo: {String(a.energy_cost)}</span>}
              {a.cooldown !== undefined && <span className="inline-flex items-center gap-1">⏱ Cooldown: {String(a.cooldown)}s</span>}
              {a.effect && <span className="inline-flex items-center gap-1"><Sparkles className="h-3 w-3 text-yellow-400" /><ColoredText text={String(a.effect)} /></span>}
            </div>
          </div>
        );
      })()}

      {type === 'armors' && data.passive_ability && (
        <div className="rounded-xl border border-purple-500/20 bg-purple-500/5 p-4 mb-6">
          <div className="flex items-center gap-2 mb-1"><Star className="h-4 w-4 text-purple-400" /><h3 className="text-sm font-semibold text-purple-400">Habilidade Passiva</h3></div>
          <p className="text-sm text-muted-foreground">{String(data.passive_ability)}</p>
          {data.passive_ability_level !== undefined && <p className="text-xs text-muted-foreground mt-1">Nível: {String(data.passive_ability_level)}</p>}
        </div>
      )}

      {type === 'armors' && data.set_bonus && (
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 mb-6">
          <div className="flex items-center gap-2 mb-1"><Sparkles className="h-4 w-4 text-emerald-400" /><h3 className="text-sm font-semibold text-emerald-400">Bônus de Set</h3></div>
          <p className="text-sm text-muted-foreground">{String(data.set_bonus)}</p>
        </div>
      )}

      {type === 'rings' && isArrStr(data.key_buffs) && (
        <div className="mb-6">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Bônus Principais</h3>
          <div className="flex flex-wrap gap-2">
            {data.key_buffs.map((b: string) => {
              const c = effectColor(b) || 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10';
              return <Tag key={b} className={`${c} border-current/30 bg-current/10`} icon={<Sparkles className="h-3 w-3" />}>{b}</Tag>;
            })}
          </div>
        </div>
      )}

      {type === 'rings' && data.synergy && (
        <div className="mb-6">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Sinergia</h3>
          <p className="text-sm text-muted-foreground">{String(data.synergy)}</p>
        </div>
      )}

      {type === 'rings' && isArrStr(data.possible_stats) && (
        <div className="mb-6">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Stats Possíveis</h3>
          <div className="flex flex-wrap gap-2">{data.possible_stats.map((s: string) => <Tag key={s} className="border-purple-500/30 text-purple-400 bg-purple-500/10">{s}</Tag>)}</div>
        </div>
      )}

      {type === 'upgrades' && data.per_rank_effect && (
        <div className="mb-6">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Efeito por Rank</h3>
          <p className="text-sm"><ColoredText text={String(data.per_rank_effect)} /></p>
        </div>
      )}

      {type === 'upgrades' && data.damage_per_spirit && (() => {
        const d = data.damage_per_spirit as Record<string, unknown>;
        return (
          <div className="mb-6">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Dano por Espírito</h3>
            <div className="grid grid-cols-2 gap-3">
              {d.normal !== undefined && <div className="rounded-lg border bg-card p-3"><span className="text-xs text-muted-foreground">Normal</span><p className="text-sm font-medium">{String(d.normal)}</p></div>}
              {d.boss !== undefined && <div className="rounded-lg border bg-card p-3"><span className="text-xs text-muted-foreground">Boss</span><p className="text-sm font-medium">{String(d.boss)}</p></div>}
            </div>
          </div>
        );
      })()}

      {/* Weakness */}
      {data.weakness && (() => {
        const els = typeof data.weakness === 'string' ? data.weakness.split(',').map((s: string) => s.trim()) : isArrStr(data.weakness) ? data.weakness : null;
        if (!els) return null;
        return (
          <div className="mb-6">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Fraquezas</h3>
            <div className="flex flex-wrap gap-2">{els.map((el: string) => <Tag key={el} className={elementClass(el)} icon={elIcon(el)}>{el}</Tag>)}</div>
          </div>
        );
      })()}

      {/* Effects */}
      {data.effects && (() => {
        const list = isArrStr(data.effects) ? data.effects : typeof data.effects === 'string' ? [data.effects] : null;
        if (!list) return null;
        return (
          <div className="mb-6">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Efeitos</h3>
            <ul className="space-y-1">{list.map((e: string, i: number) => <li key={i} className="text-sm flex items-start gap-2"><span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-muted-foreground shrink-0" /><ColoredText text={e} /></li>)}</ul>
          </div>
        );
      })()}

      {/* Attacks */}
      {data.attacks && (() => {
        const list = isArrStr(data.attacks) ? data.attacks : typeof data.attacks === 'string' ? [data.attacks] : null;
        if (!list) return null;
        return (
          <div className="mb-6">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Ataques</h3>
            <div className="flex flex-wrap gap-2">{list.map((a: string, i: number) => <Tag key={i} icon={<Crosshair className="h-3 w-3" />} className="border-red-500/30 text-red-400 bg-red-500/10">{a}</Tag>)}</div>
          </div>
        );
      })()}

      {/* Drops */}
      {(data.items_dropped || data.notable_loot) && (() => {
        const drops = isArrStr(data.items_dropped || data.notable_loot) ? (data.items_dropped || data.notable_loot) as string[] : null;
        if (!drops) return null;
        return (
          <div className="mb-6">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Itens Dropados</h3>
            <div className="flex flex-wrap gap-2">{drops.map((item: string, i: number) => <Tag key={i} icon={<Gem className="h-3 w-3" />} className="border-primary/30 text-primary bg-primary/10">{item}</Tag>)}</div>
          </div>
        );
      })()}

      {/* Phase Mechanics */}
      {data.phase_mechanics && (
        <div className="rounded-xl border border-yellow-500/20 bg-yellow-500/5 p-4 mb-6">
          <div className="flex items-center gap-2 mb-1"><Eye className="h-4 w-4 text-yellow-400" /><h3 className="text-sm font-semibold text-yellow-400">Mecânica de Fase</h3></div>
          <p className="text-sm text-muted-foreground">{String(data.phase_mechanics)}</p>
        </div>
      )}

      {/* Strategy */}
      {data.strategy && (
        <div className="mb-6">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Estratégia</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">{String(data.strategy)}</p>
        </div>
      )}

      {/* Obtain + Craft */}
      <div className="rounded-xl border bg-card p-4 mb-6">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Obtenção</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {data.obtain_method && (
            <div className="flex items-center gap-2"><Crosshair className="h-4 w-4 text-primary" /><div><p className="text-xs text-muted-foreground">Como Obter</p><p className="text-sm font-medium">{String(data.obtain_method)}</p></div></div>
          )}
          {data.world_name && (
            <div className="flex items-center gap-2"><Globe className="h-4 w-4 text-cyan-400" /><div><p className="text-xs text-muted-foreground">Mundo</p><p className="text-sm font-medium">{String(data.world_name)}</p></div></div>
          )}
          {data.chapter !== undefined && (
            <div className="flex items-center gap-2"><span className="h-4 w-4 flex items-center justify-center text-purple-400">📖</span><div><p className="text-xs text-muted-foreground">Capítulo</p><p className="text-sm font-medium">{String(data.chapter)}</p></div></div>
          )}
          {data.starting_banner && (
            <div className="flex items-center gap-2"><span className="h-4 w-4 flex items-center justify-center text-yellow-400">🚩</span><div><p className="text-xs text-muted-foreground">Banner Inicial</p><p className="text-sm font-medium">{String(data.starting_banner)}</p></div></div>
          )}
          {data.drop_wave_requirement !== undefined && (
            <div className="flex items-center gap-2"><Zap className="h-4 w-4 text-orange-400" /><div><p className="text-xs text-muted-foreground">Wave Mínima</p><p className="text-sm font-medium">Wave {String(data.drop_wave_requirement)}</p></div></div>
          )}
        </div>
      </div>

      {/* Craft Materials */}
      {(data.craft_materials || data.crafting_materials || data.materials) && (() => {
        const mats = data.craft_materials || data.crafting_materials || data.materials;
        let list: string[];
        if (isArrStr(mats)) list = mats;
        else if (Array.isArray(mats)) list = mats.map((m: any) => typeof m === 'object' ? `${m.name || m.item || ''}: ${m.quantity || m.amount || ''}` : String(m));
        else list = [];
        if (list.length === 0) return null;
        return (
          <div className="mb-6">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Materiais</h3>
            <div className="flex flex-wrap gap-2">{list.map((mat: string, i: number) => <Tag key={i} icon={<Pickaxe className="h-3 w-3" />} className="border-amber-500/30 text-amber-400 bg-amber-500/10">{mat}</Tag>)}</div>
          </div>
        );
      })()}

      {/* Accordion: Tips */}
      {(data.tips || data.important_notes) && (() => {
        const content = data.tips || data.important_notes;
        return (
          <div className="mb-3">
            <Accordion title="Dicas" icon={<Lightbulb className="h-4 w-4 text-yellow-400" />} defaultOpen>
              <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">{String(content)}</p>
            </Accordion>
          </div>
        );
      })()}

      {/* Accordion: Observations */}
      {data.notes && data.notes !== data.tips && data.notes !== data.important_notes && (
        <div className="mb-3">
          <Accordion title="Observações" icon={<MessageCircle className="h-4 w-4 text-cyan-400" />}>
            <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">{String(data.notes)}</p>
          </Accordion>
        </div>
      )}

      {/* Dynamic schema-driven sections (when schema is available) */}
      {schema && renderDynamicSections(data, schema, tenantId, tenantSlug, table, comparisonMode)}

      {/* Fallback: accordion for fields not covered by hardcoded sections or schema */}
      {!schema && (() => {
        const extra = Object.entries(data).filter(([k, v]) => !SKIP.has(k) && !EXTRA_FIELDS.has(k) && !ALREADY_RENDERED.has(k) && v != null && v !== '');
        if (extra.length === 0) return null;
        return (
          <div className="mb-3">
            <Accordion title="Informações Adicionais" icon={<ScrollText className="h-4 w-4 text-primary" />}>
              <div>
                {extra.map(([k, v]) => (
                  <FieldRow key={k} label={k.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}>
                    {typeof v === 'object' && v !== null ? (
                      isArrStr(v) ? <div className="flex flex-wrap gap-1">{v.map((x, i) => <span key={i} className="text-xs rounded-md bg-muted px-2 py-0.5">{x}</span>)}</div>
                        : <code className="text-xs bg-muted rounded px-1.5 py-0.5">{JSON.stringify(v)}</code>
                    ) : <ColoredText text={fmt(v)} />}
                  </FieldRow>
                ))}
              </div>
            </Accordion>
          </div>
        );
      })()}

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
