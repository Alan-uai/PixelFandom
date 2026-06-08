'use client';

import { useState, useEffect } from 'react';
import {
  ChevronDown, ChevronRight, Star, Sword, Shield, Zap,
  Flame, Snowflake, Skull, Ghost, Globe, Droplets, Gem,
  ScrollText, Lightbulb, MessageCircle, Eye, Crosshair,
  Coins, Pickaxe, Sparkles,
} from 'lucide-react';
import { IconRenderer } from '@/components/ui/icon-renderer';
import { ChipCarousel } from '@/components/ui/chip-carousel';
import ComparePopup from '@/components/wiki/compare-popup';
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

const SKIP = new Set(['name', 'title', 'description', 'summary', 'id', 'image', 'image_url', 'rarity', 'tier', 'element', 'updated_at', 'created_at', 'world_name', 'item_name', 'embedding']);

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
  'slug', 'code',
  'rarity', 'tier', 'element',
  'image', 'image_url', 'icon', 'icon_url',
  'world_name',
  '_source_table',
  'embedding',
]);

function inferSchema(data: Record<string, any>): ColumnInfo[] {
  return Object.entries(data)
    .filter(([k]) => !DYNAMIC_SKIP.has(k))
    .map(([k, v]) => {
      let data_type = 'text';
      if (typeof v === 'number') data_type = 'numeric';
      else if (typeof v === 'boolean') data_type = 'boolean';
      else if (Array.isArray(v)) data_type = 'jsonb';
      else if (typeof v === 'object' && v !== null) data_type = 'jsonb';
      return { column_name: k, data_type, is_nullable: true, column_default: null, is_system: false };
    });
}

function renderDynamicSections(
  data: Record<string, any>,
  schema: ColumnInfo[] | undefined,
  tenantId: string | undefined,
  tenantSlug: string | undefined,
  table: string,
  comparisonMode_: 'modal' | 'page',
  onStatClick?: (statKey: string) => void,
) {
  const rendered = new Set<string>();
  const sections: React.ReactNode[] = [];
  const cols = schema ?? inferSchema(data);

  // 1. Numeric stat cards
  const numCols = cols.filter(
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
                } else if (onStatClick) {
                  onStatClick(c.column_name);
                }
              } : undefined}
            />
          );
        })}
      </div>,
    );
  }

  // 2. Booleans → tags
  const boolCols = cols.filter(
    (c) => c.data_type === 'boolean' && !DYNAMIC_SKIP.has(c.column_name) && data[c.column_name] != null,
  );
  if (boolCols.length > 0) {
    boolCols.forEach((c) => rendered.add(c.column_name));
    sections.push(
      <div key="dyn-bools" className="mb-6">
        <ChipCarousel>
          {boolCols.map((c) => (
            <Tag key={c.column_name}
              className={data[c.column_name]
                ? 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10 shrink-0'
                : 'border-muted-foreground/30 text-muted-foreground bg-muted/10 shrink-0'
              }
            >
              {data[c.column_name]
                ? `${c.column_name.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}: Sim`
                : `${c.column_name.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}: Não`}
            </Tag>
          ))}
        </ChipCarousel>
      </div>,
    );
  }

  // 3. Short text → tags (only text/varchar columns)
  const textCols = cols.filter(
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
      <div key="dyn-tags" className="mb-6">
        <ChipCarousel>
          {textCols.map((c) => (
            <Tag key={c.column_name} className="border-primary/30 text-primary bg-primary/10 shrink-0">
              {String(data[c.column_name])}
            </Tag>
          ))}
        </ChipCarousel>
      </div>,
    );
  }

  // 4. Long text → labeled sections
  const longCols = cols.filter(
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
  const arrCols = cols.filter(
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
        <ChipCarousel>
          {data[c.column_name].map((item: unknown, i: number) => (
            <Tag key={i} className="border-purple-500/30 text-purple-400 bg-purple-500/10 shrink-0">
              {typeof item === 'object' ? JSON.stringify(item) : String(item)}
            </Tag>
          ))}
        </ChipCarousel>
      </div>,
    );
  }

  // 6. JSON objects → sub-sections
  const objCols = cols.filter(
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
  const [copiedCode, setCopiedCode] = useState(false);

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
  const [showCompare, setShowCompare] = useState<{ stat?: string } | null>(null);

  const handleStatClick = (statKey: string) => {
    if (comparisonMode === 'page' && tenantId) {
      window.location.href = `/w/${tenantSlug || ''}/compare/${table}?stat=${statKey}`;
    } else {
      setShowCompare({ stat: statKey });
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      {showCompare && tenantId && (
        <ComparePopup
          table={table}
          tenantId={tenantId}
          tenantSlug={tenantSlug}
          currentItemId={data.id as string}
          initialStat={showCompare.stat}
          onClose={() => setShowCompare(null)}
        />
      )}

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
          <div className="max-w-[200px]">
            <ChipCarousel>
              {rarity && (
                <Tag className={`${RARITY_COLORS[rarity.toLowerCase()] || RARITY_COLORS.common} bg-background/80 backdrop-blur-sm uppercase shrink-0`} icon={<Star className="h-3 w-3" />}>
                  {rarity}
                </Tag>
              )}
              {tier && (
                <Tag className={`${TIER_COL[tier.toLowerCase()] || TIER_COL.d} bg-background/80 backdrop-blur-sm font-bold shrink-0`}>
                  {TIER_LABEL[tier.toLowerCase()] || tier}
                </Tag>
              )}
              {element && element !== 'none' && (
                <Tag className={`${elementClass(element)} bg-background/80 backdrop-blur-sm shrink-0`} icon={elIcon(element)}>
                  {element}
                </Tag>
              )}
            </ChipCarousel>
          </div>
        </div>
      </div>

      {/* Tags */}
      <div className="mb-6">
        <ChipCarousel>
          {data.weapon_type && <Tag icon={<Sword className="h-3 w-3" />} className="border-blue-500/30 text-blue-400 bg-blue-500/10 shrink-0">{String(data.weapon_type)}</Tag>}
          {data.attack_speed && <Tag icon={<Zap className="h-3 w-3" />} className={`shrink-0 border-current/30 ${data.attack_speed === 'fast' ? 'text-emerald-400' : data.attack_speed === 'slow' ? 'text-red-400' : 'text-yellow-400'} bg-current/10`}>{String(data.attack_speed)}</Tag>}
          {data.enemy_type && <Tag className="border-red-500/30 text-red-400 bg-red-500/10 shrink-0">{String(data.enemy_type)}</Tag>}
          {data.difficulty && <Tag className={`shrink-0 ${String(data.difficulty).toLowerCase().includes('hard') ? 'border-red-500/30 text-red-400 bg-red-500/10' : 'border-yellow-500/30 text-yellow-400 bg-yellow-500/10'}`}>{String(data.difficulty)}</Tag>}
          {data.boss_type && <Tag className="border-purple-500/30 text-purple-400 bg-purple-500/10 shrink-0">{String(data.boss_type)}</Tag>}
          {data.category && <Tag className="border-cyan-500/30 text-cyan-400 bg-cyan-500/10 shrink-0">{String(data.category)}</Tag>}
          {data.health_level && <Tag className={`shrink-0 border-current/30 ${String(data.health_level).toLowerCase() === 'high' ? 'text-red-400' : String(data.health_level).toLowerCase() === 'medium' ? 'text-yellow-400' : 'text-emerald-400'} bg-current/10`}>HP: {String(data.health_level)}</Tag>}
          {data.is_must_pick === true && <Tag icon={<Star className="h-3 w-3" />} className="border-yellow-500/30 text-yellow-400 bg-yellow-500/10 shrink-0">Must Pick</Tag>}
          {(data.is_worth_crafting === true || data.is_worth_crafting === 'YES') && <Tag icon={<Sparkles className="h-3 w-3" />} className="border-emerald-500/30 text-emerald-400 bg-emerald-500/10 shrink-0">Vale a pena craftar</Tag>}
          {data.is_active === true && <Tag className="border-emerald-500/30 text-emerald-400 bg-emerald-500/10 shrink-0">Ativo</Tag>}
          {data.is_expired === true && <Tag className="border-red-500/30 text-red-400 bg-red-500/10 shrink-0">Expirado</Tag>}
        </ChipCarousel>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mb-6">
        {data.damage_min !== undefined && (
          <StatCard label="Dano" icon={<Sword className="h-4 w-4" />} value={data.damage_max !== undefined ? `${data.damage_min}-${data.damage_max}` : String(data.damage_min)} onClick={() => handleStatClick('damage_min')} />
        )}
        {(data.crit_chance_min !== undefined || data.crit_chance_max !== undefined) && (
          <StatCard label="Crit" icon={<Crosshair className="h-4 w-4" />} color="text-yellow-400" value={data.crit_chance_max !== undefined ? `${data.crit_chance_min}-${data.crit_chance_max}%` : `${data.crit_chance_min ?? data.crit_chance_max}%`} onClick={() => handleStatClick('crit_chance_min')} />
        )}
        {data.knockback !== undefined && <StatCard label="Knockback" icon={<Zap className="h-4 w-4" />} value={String(data.knockback)} onClick={() => handleStatClick('knockback')} />}
        {data.health_bonus !== undefined && <StatCard label="HP" icon={<Shield className="h-4 w-4" />} color="text-emerald-400" value={`+${data.health_bonus}`} onClick={() => handleStatClick('health_bonus')} />}
        {data.speed_bonus !== undefined && <StatCard label="Speed" icon={<Zap className="h-4 w-4" />} color="text-cyan-400" value={`+${data.speed_bonus}`} onClick={() => handleStatClick('speed_bonus')} />}
        {data.energy_bonus !== undefined && <StatCard label="Energy" icon={<Zap className="h-4 w-4" />} color="text-purple-400" value={`+${data.energy_bonus}`} onClick={() => handleStatClick('energy_bonus')} />}
        {data.shop_price !== undefined && <StatCard label="Preço" icon={<Coins className="h-4 w-4" />} value={`${data.shop_price}`} onClick={() => handleStatClick('shop_price')} />}
        {(data.craft_cost !== undefined || data.gold_cost !== undefined) && <StatCard label="Custo Craft" icon={<Pickaxe className="h-4 w-4" />} value={`${data.craft_cost ?? data.gold_cost} ouro`} onClick={() => handleStatClick('craft_cost')} />}
        {data.max_uses_per_run !== undefined && <StatCard label="Usos/run" value={String(data.max_uses_per_run)} onClick={() => handleStatClick('max_uses_per_run')} />}
        {data.unlock_level !== undefined && <StatCard label="Nível mín" value={String(data.unlock_level)} onClick={() => handleStatClick('unlock_level')} />}
        {data.max_ranks !== undefined && <StatCard label="Ranks máx" value={String(data.max_ranks)} onClick={() => handleStatClick('max_ranks')} />}
        {data.priority_order !== undefined && <StatCard label="Prioridade" value={`#${data.priority_order}`} onClick={() => handleStatClick('priority_order')} />}
        {data.drop_rate_percentage !== undefined && <StatCard label="Drop Rate" color="text-yellow-400" value={String(data.drop_rate_percentage)} onClick={() => handleStatClick('drop_rate_percentage')} />}
      </div>

      {/* Code Block */}
      {type === 'codes' && (() => {
        const code = (data.code || data.name) as string;
        return (
          <div className="mb-6">
            <div className="flex items-center gap-2 rounded-xl border bg-muted/50 p-4">
              <ScrollText className="h-5 w-5 text-primary shrink-0" />
              <code className="flex-1 font-mono text-lg font-bold tracking-wider">{code}</code>
              <button onClick={() => { navigator.clipboard.writeText(code); setCopiedCode(true); setTimeout(() => setCopiedCode(false), 2000); }} className="text-xs text-primary hover:text-primary/80 font-medium shrink-0">{copiedCode ? 'Copiado!' : 'Copiar'}</button>
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
          <ChipCarousel>
            {data.key_buffs.map((b: string) => {
              const c = effectColor(b) || 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10';
              return <Tag key={b} className={`${c} border-current/30 bg-current/10 shrink-0`} icon={<Sparkles className="h-3 w-3" />}>{b}</Tag>;
            })}
          </ChipCarousel>
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
          <ChipCarousel>{data.possible_stats.map((s: string) => <Tag key={s} className="border-purple-500/30 text-purple-400 bg-purple-500/10 shrink-0">{s}</Tag>)}</ChipCarousel>
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
            <ChipCarousel>{els.map((el: string) => <Tag key={el} className={`${elementClass(el)} shrink-0`} icon={elIcon(el)}>{el}</Tag>)}</ChipCarousel>
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
            <ChipCarousel>{list.map((a: string, i: number) => <Tag key={i} icon={<Crosshair className="h-3 w-3" />} className="border-red-500/30 text-red-400 bg-red-500/10 shrink-0">{a}</Tag>)}</ChipCarousel>
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
            <ChipCarousel>{drops.map((item: string, i: number) => <Tag key={i} icon={<Gem className="h-3 w-3" />} className="border-primary/30 text-primary bg-primary/10 shrink-0">{item}</Tag>)}</ChipCarousel>
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
            <ChipCarousel>{list.map((mat: string, i: number) => <Tag key={i} icon={<Pickaxe className="h-3 w-3" />} className="border-amber-500/30 text-amber-400 bg-amber-500/10 shrink-0">{mat}</Tag>)}</ChipCarousel>
          </div>
        );
      })()}

      {/* Type-specific expanded info cards */}
      {(type === 'enemies' || type === 'bosses') && (
        <div className="rounded-xl border bg-card p-5 mb-6">
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <Crosshair className="h-4 w-4 text-red-400" />
            Perfil do {type === 'enemies' ? 'Inimigo' : 'Chefe'}
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {data.enemy_type && <div className="rounded-lg bg-muted/50 p-3"><div className="text-xs text-muted-foreground mb-0.5">Tipo</div><div className="text-sm font-medium">{String(data.enemy_type)}</div></div>}
            {data.boss_type && <div className="rounded-lg bg-muted/50 p-3"><div className="text-xs text-muted-foreground mb-0.5">Tipo</div><div className="text-sm font-medium">{String(data.boss_type)}</div></div>}
            {data.difficulty && <div className="rounded-lg bg-muted/50 p-3"><div className="text-xs text-muted-foreground mb-0.5">Dificuldade</div><div className={`text-sm font-medium ${String(data.difficulty).toLowerCase().includes('hard') ? 'text-red-400' : 'text-yellow-400'}`}>{String(data.difficulty)}</div></div>}
            {data.health_level && <div className="rounded-lg bg-muted/50 p-3"><div className="text-xs text-muted-foreground mb-0.5">HP</div><div className="text-sm font-medium">{String(data.health_level)}</div></div>}
            {data.speed_level && <div className="rounded-lg bg-muted/50 p-3"><div className="text-xs text-muted-foreground mb-0.5">Velocidade</div><div className="text-sm font-medium">{String(data.speed_level)}</div></div>}
            {data.strength_level !== undefined && <div className="rounded-lg bg-muted/50 p-3"><div className="text-xs text-muted-foreground mb-0.5">Força</div><div className="text-sm font-medium">{String(data.strength_level)}</div></div>}
          </div>
        </div>
      )}

      {type === 'potions' && (
        <div className="rounded-xl border bg-card p-5 mb-6">
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <Droplets className="h-4 w-4 text-emerald-400" />
            Informações da Poção
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {data.effects && (() => {
              const txt = typeof data.effects === 'string' ? data.effects : Array.isArray(data.effects) ? data.effects.join(', ') : String(data.effects);
              return <div className="rounded-lg bg-muted/50 p-3 col-span-2"><div className="text-xs text-muted-foreground mb-0.5">Efeitos</div><div className="text-sm"><ColoredText text={txt} /></div></div>;
            })()}
            {data.shop_price !== undefined && <div className="rounded-lg bg-muted/50 p-3"><div className="text-xs text-muted-foreground mb-0.5">Preço</div><div className="text-sm font-medium"><Coins className="h-3 w-3 inline -ml-0.5 mr-0.5" />{String(data.shop_price)}</div></div>}
            {data.max_uses_per_run !== undefined && <div className="rounded-lg bg-muted/50 p-3"><div className="text-xs text-muted-foreground mb-0.5">Usos por Run</div><div className="text-sm font-medium">{String(data.max_uses_per_run)}</div></div>}
            {data.craft_cost !== undefined && <div className="rounded-lg bg-muted/50 p-3"><div className="text-xs text-muted-foreground mb-0.5">Custo de Craft</div><div className="text-sm font-medium">{String(data.craft_cost)}</div></div>}
          </div>
        </div>
      )}

      {type === 'worlds' && (
        <div className="rounded-xl border bg-card p-5 mb-6">
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <Globe className="h-4 w-4 text-cyan-400" />
            Sobre o Mundo
          </h3>
          <div className="space-y-3">
            {data.environment && <div><div className="text-xs text-muted-foreground mb-0.5">Ambiente</div><p className="text-sm">{String(data.environment)}</p></div>}
            {data.chapters && <div><div className="text-xs text-muted-foreground mb-0.5">Capítulos</div><p className="text-sm">{isArrStr(data.chapters) ? (data.chapters as string[]).join(', ') : String(data.chapters)}</p></div>}
            {data.warning && <div className="rounded-lg bg-yellow-500/10 border border-yellow-500/20 p-3"><div className="text-xs text-yellow-400 mb-0.5">⚠ Atenção</div><p className="text-sm text-yellow-300">{String(data.warning)}</p></div>}
          </div>
        </div>
      )}

      {type === 'crafting-recipes' && (
        <div className="rounded-xl border bg-card p-5 mb-6">
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <Pickaxe className="h-4 w-4 text-amber-400" />
            Receita
          </h3>
          <div className="space-y-3">
            {data.item_name && <div><div className="text-xs text-muted-foreground mb-0.5">Item Resultante</div><p className="text-sm font-medium">{String(data.item_name)}</p></div>}
            {data.obtain_method && <div><div className="text-xs text-muted-foreground mb-0.5">Onde Obter a Receita</div><p className="text-sm">{String(data.obtain_method)}</p></div>}
          </div>
        </div>
      )}

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

      {/* Dynamic schema-driven sections */}
      {renderDynamicSections(data, schema, tenantId, tenantSlug, table, comparisonMode, handleStatClick)}

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
