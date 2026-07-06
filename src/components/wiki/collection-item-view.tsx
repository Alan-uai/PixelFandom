'use client';

import Image from 'next/image';
import { useState } from 'react';
import {
  ChevronDown, ChevronRight, Star, Sword, Shield, Zap,
  Skull, Globe, Gem,
  ScrollText, Lightbulb, MessageCircle, Eye, Crosshair,
  Coins, Pickaxe, Sparkles, Crown,
} from 'lucide-react';
import { IconRenderer } from '@/components/ui/icon-renderer';
import { abbreviateNumber } from '@/lib/format-number';
import { ChipCarousel } from '@/components/ui/chip-carousel';
import ComparePopup from '@/components/wiki/compare-popup';
import type { ColumnInfo } from '@/lib/game-schema';
import {
  RARITY_COLORS, RARITY_GRAD, TIER_LABEL, TIER_COL,
  elementClass, elIcon, effectColor, COLL_ICON,
} from '@/lib/game-ui';

function ColoredText({ text }: { text: string }) {
  const c = effectColor(text);
  return c ? <span className={c}>{text}</span> : <>{text}</>;
}

function Tag({ children, className = '', icon, title }: { children: React.ReactNode; className?: string; icon?: React.ReactNode; title?: string }) {
  return (
    <span title={title} className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium max-w-[220px] truncate shrink-0 ${className}`}>
      {icon}{children}
    </span>
  );
}

function StatCard({ label, value, icon, color, onClick, title }: { label: string; value: string; icon?: React.ReactNode; color?: string; onClick?: () => void; title?: string }) {
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



function fmt(v: unknown, scientificNotation?: boolean): string {
  if (v === null || v === undefined) return '—';
  if (typeof v === 'boolean') return v ? 'Sim' : 'Não';
  if (typeof v === 'object') {
    if (Array.isArray(v)) return v.map((i) => (typeof i === 'object' ? JSON.stringify(i) : String(i))).join(', ');
    return JSON.stringify(v);
  }
  if (scientificNotation && typeof v === 'number') {
    return abbreviateNumber(v);
  }
  return String(v);
}

function isArrStr(v: unknown): v is string[] {
  return Array.isArray(v) && v.every((i) => typeof i === 'string');
}

function toList(v: unknown): string[] | null {
  if (Array.isArray(v)) return v.map((i) => String(i));
  if (typeof v === 'string') return v.split(',').map((s) => s.trim());
  return null;
}

type FieldMeta = {
  label: string;
  icon?: React.ReactNode;
  color?: string;
};

const FIELD_LABELS: Record<string, FieldMeta> = {
  damage_min: { label: 'Dano Mín', icon: <Sword className="h-4 w-4" /> },
  damage_max: { label: 'Dano Máx', icon: <Sword className="h-4 w-4" /> },
  crit_chance_min: { label: 'Chance Crítica', icon: <Crosshair className="h-4 w-4" />, color: 'text-yellow-400' },
  crit_chance_max: { label: 'Crit Máx', icon: <Crosshair className="h-4 w-4" />, color: 'text-yellow-400' },
  knockback: { label: 'Repulsão', icon: <Zap className="h-4 w-4" /> },
  health_bonus: { label: 'Bônus HP', icon: <Shield className="h-4 w-4" />, color: 'text-emerald-400' },
  speed_bonus: { label: 'Bônus Velocidade', icon: <Zap className="h-4 w-4" />, color: 'text-cyan-400' },
  energy_bonus: { label: 'Bônus Energia', icon: <Zap className="h-4 w-4" />, color: 'text-purple-400' },
  shop_price: { label: 'Preço', icon: <Coins className="h-4 w-4" /> },
  craft_cost: { label: 'Custo Craft', icon: <Pickaxe className="h-4 w-4" /> },
  gold_cost: { label: 'Custo (Ouro)', icon: <Pickaxe className="h-4 w-4" /> },
  max_uses_per_run: { label: 'Usos / Run', icon: <Zap className="h-4 w-4" /> },
  unlock_level: { label: 'Nível Mín', icon: <Star className="h-4 w-4" /> },
  max_ranks: { label: 'Ranks Máx', icon: <Gem className="h-4 w-4" /> },
  priority_order: { label: 'Prioridade', icon: <Crosshair className="h-4 w-4" /> },
  drop_rate_percentage: { label: 'Drop Rate', icon: <Star className="h-4 w-4" />, color: 'text-yellow-400' },
  drop_rate_multiplier: { label: 'Mult. Drop', icon: <Star className="h-4 w-4" />, color: 'text-yellow-400' },
  obtain_method: { label: 'Como Obter', icon: <Crosshair className="h-4 w-4" /> },
  world_name: { label: 'Mundo', icon: <Globe className="h-4 w-4" /> },
  chapter: { label: 'Capítulo', icon: <Gem className="h-4 w-4" /> },
  starting_banner: { label: 'Banner Inicial', icon: <Star className="h-4 w-4" /> },
  drop_wave_requirement: { label: 'Wave Mín', icon: <Zap className="h-4 w-4" />, color: 'text-orange-400' },
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

function isShortText(v: unknown): boolean {
  if (typeof v !== 'string') return false;
  return v.length <= 60 && !v.includes('\n');
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

function renderSpecials(
  data: Record<string, any>,
  rendered: Set<string>,
  tenantId: string | undefined,
  tenantSlug: string | undefined,
  table: string,
  comparisonMode: 'modal' | 'page',
  handleStatClick: (key: string) => void,
  copiedCode: boolean,
  setCopiedCode: (v: boolean) => void,
  chipWrap?: boolean,
): React.ReactNode[] {
  const nodes: React.ReactNode[] = [];

  // Code block
  const code = data.code || data.name;
  if (data.code != null || data.code_type != null) {
    rendered.add('code'); rendered.add('code_type'); rendered.add('rewards'); rendered.add('reward_type');
    rendered.add('verified_date'); rendered.add('verified_by'); rendered.add('expired_date');
    nodes.push(
      <div key="code-block" className="mb-6">
        <div className="flex items-center gap-2 rounded-xl border bg-muted/50 p-4">
          <ScrollText className="h-5 w-5 text-primary shrink-0" />
          <code className="flex-1 font-mono text-lg font-bold tracking-wider">{String(code)}</code>
          <button onClick={() => { navigator.clipboard.writeText(String(code)); setCopiedCode(true); setTimeout(() => setCopiedCode(false), 2000); }} className="text-xs text-primary hover:text-primary/80 font-medium shrink-0">{copiedCode ? 'Copiado!' : 'Copiar'}</button>
        </div>
        {data.rewards && <p className="text-sm text-muted-foreground mt-2">Recompensa: <span className="text-foreground">{isArrStr(data.rewards) ? data.rewards.join(', ') : String(data.rewards)}</span></p>}
        {data.code_type && <p className="text-xs text-muted-foreground mt-1">Tipo: <span className="font-medium text-foreground">{String(data.code_type)}</span>{data.verified_date && <> · Verificado: {data.verified_date}</>}</p>}
      </div>,
    );
  }

  // Ability card
  if (data.ability && typeof data.ability === 'object') {
    rendered.add('ability');
    const a = data.ability as Record<string, any>;
    nodes.push(
      <div key="ability" className="rounded-xl border bg-card p-5 mb-6">
        <div className="flex items-center gap-2 mb-3"><Sparkles className="h-4 w-4 text-yellow-400" /><h3 className="font-semibold text-sm">Habilidade: {String(a.name || '')}</h3></div>
        {a.description && <p className="text-sm text-muted-foreground mb-3"><ColoredText text={String(a.description)} /></p>}
        <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
          {a.energy_cost !== undefined && <span className="inline-flex items-center gap-1"><Zap className="h-3 w-3 text-purple-400" /> Custo: {String(a.energy_cost)}</span>}
          {a.cooldown !== undefined && <span className="inline-flex items-center gap-1">⏱ Cooldown: {String(a.cooldown)}s</span>}
          {a.effect && <span className="inline-flex items-center gap-1"><Sparkles className="h-3 w-3 text-yellow-400" /><ColoredText text={String(a.effect)} /></span>}
        </div>
      </div>,
    );
  }

  // Passive ability
  if (hasValue(data.passive_ability)) {
    rendered.add('passive_ability'); rendered.add('passive_ability_level');
    nodes.push(
      <div key="passive" className="rounded-xl border border-purple-500/20 bg-purple-500/5 p-4 mb-6">
        <div className="flex items-center gap-2 mb-1"><Star className="h-4 w-4 text-purple-400" /><h3 className="text-sm font-semibold text-purple-400">Habilidade Passiva</h3></div>
        <p className="text-sm text-muted-foreground">{String(data.passive_ability)}</p>
        {hasValue(data.passive_ability_level) && <p className="text-xs text-muted-foreground mt-1">Nível: {String(data.passive_ability_level)}</p>}
      </div>,
    );
  }

  // Set bonus
  if (hasValue(data.set_bonus)) {
    rendered.add('set_bonus');
    nodes.push(
      <div key="set-bonus" className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 mb-6">
        <div className="flex items-center gap-2 mb-1"><Sparkles className="h-4 w-4 text-emerald-400" /><h3 className="text-sm font-semibold text-emerald-400">Bônus de Set</h3></div>
        <p className="text-sm text-muted-foreground">{String(data.set_bonus)}</p>
      </div>,
    );
  }

  // Phase mechanics
  if (hasValue(data.phase_mechanics)) {
    rendered.add('phase_mechanics');
    nodes.push(
      <div key="phase-mechanics" className="rounded-xl border border-yellow-500/20 bg-yellow-500/5 p-4 mb-6">
        <div className="flex items-center gap-2 mb-1"><Eye className="h-4 w-4 text-yellow-400" /><h3 className="text-sm font-semibold text-yellow-400">Mecânica de Fase</h3></div>
        <p className="text-sm text-muted-foreground">{String(data.phase_mechanics)}</p>
      </div>,
    );
  }

  // Key buffs
  if (isArrStr(data.key_buffs)) {
    rendered.add('key_buffs');
    nodes.push(
      <div key="key-buffs" className="mb-6">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Bônus Principais</h3>
        <ChipCarousel wrap={chipWrap}>
          {data.key_buffs.map((b: string) => {
            const c = effectColor(b) || 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10';
            return <Tag key={b} className={`${c} border-current/30 bg-current/10`} icon={<Sparkles className="h-3 w-3" />}>{b}</Tag>;
          })}
        </ChipCarousel>
      </div>,
    );
  }

  // Possible stats
  if (isArrStr(data.possible_stats)) {
    rendered.add('possible_stats');
    nodes.push(
      <div key="possible-stats" className="mb-6">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Stats Possíveis</h3>
        <ChipCarousel wrap={chipWrap}>{data.possible_stats.map((s: string) => <Tag key={s} className="border-purple-500/30 text-purple-400 bg-purple-500/10">{s}</Tag>)}</ChipCarousel>
      </div>,
    );
  }

  // Synergy
  if (hasValue(data.synergy)) {
    rendered.add('synergy');
    nodes.push(
      <div key="synergy" className="mb-6">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Sinergia</h3>
        <p className="text-sm text-muted-foreground">{String(data.synergy)}</p>
      </div>,
    );
  }

  // Per-rank effect
  if (hasValue(data.per_rank_effect)) {
    rendered.add('per_rank_effect');
    nodes.push(
      <div key="per-rank" className="mb-6">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Efeito por Rank</h3>
        <p className="text-sm"><ColoredText text={String(data.per_rank_effect)} /></p>
      </div>,
    );
  }

  // Damage per spirit
  if (data.damage_per_spirit && typeof data.damage_per_spirit === 'object') {
    rendered.add('damage_per_spirit');
    const d = data.damage_per_spirit as Record<string, unknown>;
    nodes.push(
      <div key="dmg-spirit" className="mb-6">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Dano por Espírito</h3>
        <div className="grid grid-cols-2 gap-3">
          {d.normal !== undefined && <div className="rounded-lg border bg-card p-3"><span className="text-xs text-muted-foreground">Normal</span><p className="text-sm font-medium">{String(d.normal)}</p></div>}
          {d.boss !== undefined && <div className="rounded-lg border bg-card p-3"><span className="text-xs text-muted-foreground">Boss</span><p className="text-sm font-medium">{String(d.boss)}</p></div>}
        </div>
      </div>,
    );
  }

  // Weakness
  if (hasValue(data.weakness)) {
    rendered.add('weakness');
    const els = toList(data.weakness);
    if (els) {
      nodes.push(
        <div key="weakness" className="mb-6">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Fraquezas</h3>
          <ChipCarousel wrap={chipWrap}>{els.map((el: string) => <Tag key={el} className={`${elementClass(el)}`} icon={elIcon(el)}>{el}</Tag>)}</ChipCarousel>
        </div>,
      );
    }
  }

  // Effects
  if (hasValue(data.effects)) {
    rendered.add('effects');
    const list = toList(data.effects);
    if (list) {
      nodes.push(
        <div key="effects" className="mb-6">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Efeitos</h3>
          <ul className="space-y-1">{list.map((e: string, i: number) => <li key={i} className="text-sm flex items-start gap-2"><span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-muted-foreground shrink-0" /><ColoredText text={e} /></li>)}</ul>
        </div>,
      );
    }
  }

  // Attacks
  if (hasValue(data.attacks)) {
    rendered.add('attacks');
    const list = toList(data.attacks);
    if (list) {
      nodes.push(
        <div key="attacks" className="mb-6">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Ataques</h3>
          <ChipCarousel wrap={chipWrap}>{list.map((a: string, i: number) => <Tag key={i} icon={<Crosshair className="h-3 w-3" />} className="border-red-500/30 text-red-400 bg-red-500/10">{a}</Tag>)}</ChipCarousel>
        </div>,
      );
    }
  }

  // Drops
  const drops = data.items_dropped || data.notable_loot;
  if (drops) {
    rendered.add('items_dropped'); rendered.add('notable_loot');
    const list = toList(drops);
    if (list) {
      nodes.push(
        <div key="drops" className="mb-6">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Itens Dropados</h3>
          <ChipCarousel wrap={chipWrap}>{list.map((item: string, i: number) => <Tag key={i} icon={<Gem className="h-3 w-3" />} className="border-primary/30 text-primary bg-primary/10">{item}</Tag>)}</ChipCarousel>
        </div>,
      );
    }
  }

  // Strategy
  if (hasValue(data.strategy)) {
    rendered.add('strategy');
    nodes.push(
      <div key="strategy" className="mb-6">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Estratégia</h3>
        <p className="text-sm text-muted-foreground leading-relaxed">{String(data.strategy)}</p>
      </div>,
    );
  }

  // Materials
  const mats = data.craft_materials || data.crafting_materials || data.materials;
  if (mats) {
    rendered.add('craft_materials'); rendered.add('crafting_materials'); rendered.add('materials');
    let list: string[];
    if (isArrStr(mats)) list = mats;
    else if (Array.isArray(mats)) list = mats.map((m: any) => typeof m === 'object' ? `${m.name || m.item || ''}: ${m.quantity || m.amount || ''}` : String(m));
    else list = [];
    if (list.length > 0) {
      nodes.push(
        <div key="materials" className="mb-6">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Materiais</h3>
          <ChipCarousel wrap={chipWrap}>{list.map((mat: string, i: number) => <Tag key={i} icon={<Pickaxe className="h-3 w-3" />} className="border-amber-500/30 text-amber-400 bg-amber-500/10">{mat}</Tag>)}</ChipCarousel>
        </div>,
      );
    }
  }

  // Environment / chapters / warning (world info)
  if (hasValue(data.environment) || hasValue(data.chapters) || hasValue(data.warning)) {
    rendered.add('environment'); rendered.add('chapters'); rendered.add('warning');
    nodes.push(
      <div key="world-info" className="rounded-xl border bg-card p-5 mb-6">
        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2"><Globe className="h-4 w-4 text-cyan-400" /> Sobre o Mundo</h3>
        <div className="space-y-3">
          {hasValue(data.environment) && <div><div className="text-xs text-muted-foreground mb-0.5">Ambiente</div><p className="text-sm">{String(data.environment)}</p></div>}
          {hasValue(data.chapters) && <div><div className="text-xs text-muted-foreground mb-0.5">Capítulos</div><p className="text-sm">{isArrStr(data.chapters) ? (data.chapters as string[]).join(', ') : String(data.chapters)}</p></div>}
          {hasValue(data.warning) && <div className="rounded-lg bg-yellow-500/10 border border-yellow-500/20 p-3"><div className="text-xs text-yellow-400 mb-0.5">⚠ Atenção</div><p className="text-sm text-yellow-300">{String(data.warning)}</p></div>}
        </div>
      </div>,
    );
  }

  // Accordions (tips, notes)
  const tips = data.tips || data.important_notes;
  if (hasValue(tips)) {
    rendered.add('tips'); rendered.add('important_notes');
    nodes.push(
      <div key="tips" className="mb-3">
        <Accordion title="Dicas" icon={<Lightbulb className="h-4 w-4 text-yellow-400" />} defaultOpen>
          <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">{String(tips)}</p>
        </Accordion>
      </div>,
    );
  }

  if (hasValue(data.notes) && data.notes !== tips) {
    rendered.add('notes');
    nodes.push(
      <div key="notes" className="mb-3">
        <Accordion title="Observações" icon={<MessageCircle className="h-4 w-4 text-cyan-400" />}>
          <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">{String(data.notes)}</p>
        </Accordion>
      </div>,
    );
  }

  return nodes;
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

function renderDynamicSections(
  data: Record<string, any>,
  schema: ColumnInfo[] | undefined,
  tenantId: string | undefined,
  tenantSlug: string | undefined,
  table: string,
  comparisonMode_: 'modal' | 'page',
  onStatClick: ((statKey: string) => void) | undefined,
  rendered: Set<string>,
  scientificNotation?: boolean,
  chipWrap?: boolean,
) {
  const sections: React.ReactNode[] = [];
  const cols = schema ?? inferSchema(data);

  // Filter out system fields, special-handled fields, and null values
  const activeCols = cols.filter(
    (c) => !SYSTEM_FIELDS.has(c.column_name) && !rendered.has(c.column_name) && hasValue(data[c.column_name]),
  );

  // 1. Numeric stat cards (skip 0)
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
              value={fmt(data[c.column_name], scientificNotation)}
              icon={meta?.icon || fieldIcon(c.column_name)}
              color={meta?.color || fieldColor(c.column_name)}
              onClick={tenantId ? () => {
                if (comparisonMode_ === 'page') {
                  window.location.href = `/w/${tenantSlug || ''}/compare/${table}?stat=${c.column_name}`;
                } else if (onStatClick) {
                  onStatClick(c.column_name);
                }
              } : undefined}
              title={comparisonMode_ === 'modal' && tenantId ? 'Clique para comparar' : undefined}
            />
          );
        })}
      </div>,
    );
  }

  // 2. Booleans → tags
  const boolCols = activeCols.filter((c) => c.data_type === 'boolean');
  if (boolCols.length > 0) {
    boolCols.forEach((c) => rendered.add(c.column_name));
    sections.push(
      <div key="dyn-bools" className="mb-6">
        <ChipCarousel wrap={chipWrap}>
          {boolCols.map((c) => (
            <Tag key={c.column_name}
              className={data[c.column_name]
                ? 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10'
                : 'border-muted-foreground/30 text-muted-foreground bg-muted/10'
              }
            >
              {fieldLabel(c.column_name)}: {data[c.column_name] ? 'Sim' : 'Não'}
            </Tag>
          ))}
        </ChipCarousel>
      </div>,
    );
  }

  // 3. Short text → tags
  const textCols = activeCols.filter(
    (c) =>
      (c.data_type === 'text' || c.data_type?.startsWith('character varying') || c.data_type === 'varchar') &&
      isShortText(data[c.column_name]),
  );
  if (textCols.length > 0) {
    textCols.forEach((c) => rendered.add(c.column_name));
    sections.push(
      <div key="dyn-tags" className="mb-6">
        <ChipCarousel wrap={chipWrap}>
          {textCols.map((c) => (
            <Tag key={c.column_name} className="border-primary/30 text-primary bg-primary/10">
              {metaLabel(c, data)}: {String(data[c.column_name])}
            </Tag>
          ))}
        </ChipCarousel>
      </div>,
    );
  }

  // 4. Long text → labeled sections
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
        <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">{String(data[c.column_name])}</p>
      </div>,
    );
  }

  // 5. JSON arrays → tag lists
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
        <ChipCarousel wrap={chipWrap}>
          {data[c.column_name].map((item: unknown, i: number) => (
            <Tag key={i} className="border-purple-500/30 text-purple-400 bg-purple-500/10">
              {typeof item === 'object' ? JSON.stringify(item) : String(item)}
            </Tag>
          ))}
        </ChipCarousel>
      </div>,
    );
  }

  // 6. JSON objects → sub-sections
  const objCols = activeCols.filter(
    (c) =>
      (c.data_type === 'jsonb' || c.data_type === 'json') &&
      typeof data[c.column_name] === 'object' &&
      data[c.column_name] !== null &&
      !Array.isArray(data[c.column_name]),
  );
  for (const c of objCols) {
    rendered.add(c.column_name);
    const obj = data[c.column_name] as Record<string, unknown>;
    sections.push(
      <div key={c.column_name} className="rounded-xl border bg-card p-5 mb-6">
        <h3 className="text-sm font-semibold mb-3">{fieldLabel(c.column_name)}</h3>
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

function metaLabel(col: ColumnInfo, _data: Record<string, any>): string {
  const known = FIELD_LABELS[col.column_name];
  if (known) return known.label;
  return col.column_name.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
}

function renderFallbackFields(data: Record<string, any>, rendered: Set<string>, scientificNotation?: boolean) {
  const extra = Object.entries(data).filter(
    ([k, v]) => !SYSTEM_FIELDS.has(k) && !rendered.has(k) && hasValue(v),
  );
  if (extra.length === 0) return null;
  return (
    <div className="mb-3">
      <Accordion title="Informações Adicionais" icon={<ScrollText className="h-4 w-4 text-primary" />}>
        <div>
          {extra.map(([k, v]) => (
            <div key={k} className="flex items-start gap-3 py-2 border-b border-border/50 last:border-0">
              <span className="text-xs font-medium text-muted-foreground min-w-[120px] pt-0.5 shrink-0">
                {fieldLabel(k)}
              </span>
              <div className="text-sm flex-1">
                {typeof v === 'object' && v !== null ? (
                  isArrStr(v) ? (
                    <div className="flex flex-wrap gap-1">
                      {v.map((x, i) => <span key={i} className="text-xs rounded-md bg-muted px-2 py-0.5">{x}</span>)}
                    </div>
                  ) : (
                    <code className="text-xs bg-muted rounded px-1.5 py-0.5">{JSON.stringify(v)}</code>
                  )
                ) : (
                  <ColoredText text={fmt(v, scientificNotation)} />
                )}
              </div>
            </div>
          ))}
        </div>
      </Accordion>
    </div>
  );
}

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
  scientificNotation?: boolean;
  chipWrap?: boolean;
};

const TAG_FIELDS: Record<string, (v: any) => { icon?: React.ReactNode; className: string; label: string } | null> = {
  weapon_type: (v) => ({ icon: <Sword className="h-3 w-3" />, className: 'border-blue-500/30 text-blue-400 bg-blue-500/10', label: String(v) }),
  attack_speed: (v) => {
    const c = v === 'fast' ? 'text-emerald-400' : v === 'slow' ? 'text-red-400' : 'text-yellow-400';
    return { icon: <Zap className="h-3 w-3" />, className: `shrink-0 border-current/30 ${c} bg-current/10`, label: String(v) };
  },
  enemy_type: (v) => ({ className: 'border-red-500/30 text-red-400 bg-red-500/10', label: String(v) }),
  difficulty: (v) => ({
    className: `shrink-0 ${String(v).toLowerCase().includes('hard') ? 'border-red-500/30 text-red-400 bg-red-500/10' : 'border-yellow-500/30 text-yellow-400 bg-yellow-500/10'}`,
    label: String(v),
  }),
  boss_type: (v) => ({ className: 'border-purple-500/30 text-purple-400 bg-purple-500/10', label: String(v) }),
  category: (v) => ({ className: 'border-cyan-500/30 text-cyan-400 bg-cyan-500/10', label: String(v) }),
  health_level: (v) => {
    const c = String(v).toLowerCase() === 'high' ? 'text-red-400' : String(v).toLowerCase() === 'medium' ? 'text-yellow-400' : 'text-emerald-400';
    return { className: `shrink-0 border-current/30 ${c} bg-current/10`, label: `HP: ${String(v)}` };
  },
};

export default function CollectionItemView({ data, collectionType, updatedAt, createdAt, tenantId, tenantSlug, sourceTable, comparisonMode = 'modal', schema, hideHeader, onCompareStatClick, scientificNotation, chipWrap }: Props) {
  const table = sourceTable || 'generic';
  const name = (data.name || data.title || data.item_name || data.code || '') as string;
  const description = data.description as string | undefined;
  const rarity = data.rarity != null ? String(data.rarity) : undefined;
  const tier = data.tier != null ? String(data.tier) : undefined;
  const element = data.element != null ? String(data.element) : undefined;
  const imageUrl = (data.image_url || data.image) as string | undefined;

  const [showCompare, setShowCompare] = useState<{ stat?: string } | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);

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

      {!hideHeader && (
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

      {/* Data-driven tags */}
      <div className="mb-6">
        <ChipCarousel wrap={chipWrap}>
          {Object.entries(TAG_FIELDS).map(([key, renderFn]) => {
            const v = data[key];
            if (!hasValue(v)) return null;
            rendered.add(key);
            const result = renderFn(v);
            if (!result) return null;
            return <Tag key={key} className={result.className} icon={result.icon}>{result.label}</Tag>;
          })}
          {data.is_must_pick === true && (() => { rendered.add('is_must_pick'); return <Tag key="must-pick" icon={<Star className="h-3 w-3" />} className="border-yellow-500/30 text-yellow-400 bg-yellow-500/10">Must Pick</Tag>; })()}
          {(data.is_worth_crafting === true || data.is_worth_crafting === 'YES') && (() => { rendered.add('is_worth_crafting'); return <Tag key="worth-craft" icon={<Sparkles className="h-3 w-3" />} className="border-emerald-500/30 text-emerald-400 bg-emerald-500/10">Vale a pena craftar</Tag>; })()}
          {data.is_active === true && (() => { rendered.add('is_active'); return <Tag key="active" className="border-emerald-500/30 text-emerald-400 bg-emerald-500/10">Ativo</Tag>; })()}
          {data.is_expired === true && (() => { rendered.add('is_expired'); return <Tag key="expired" className="border-red-500/30 text-red-400 bg-red-500/10">Expirado</Tag>; })()}
          {data.is_craftable === true && (() => { rendered.add('is_craftable'); return <Tag key="craftable" icon={<Pickaxe className="h-3 w-3" />} className="border-amber-500/30 text-amber-400 bg-amber-500/10">Craftável</Tag>; })()}
        </ChipCarousel>
      </div>

      {/* Special field renderers (data-gated, no type detection) */}
      {renderSpecials(data, rendered, tenantId, tenantSlug, table, comparisonMode, handleStatClick, copiedCode, setCopiedCode, chipWrap)}

      {/* Dynamic schema-driven sections */}
      {renderDynamicSections(data, schema, tenantId, tenantSlug, table, comparisonMode, handleStatClick, rendered, scientificNotation, chipWrap)}

      {/* Fallback: any remaining unrendered fields */}
      {renderFallbackFields(data, rendered, scientificNotation)}

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
