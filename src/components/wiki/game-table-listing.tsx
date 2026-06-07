'use client';

import { useState } from 'react';
import Link from 'next/link';
import { FileText, Database, ArrowLeft, ChevronDown, ChevronRight, Sword, Shield, Zap, Gem, Crosshair, Pickaxe, Sparkles, Star, Skull } from 'lucide-react';
import { useWikiPath } from '@/hooks/use-wiki-path';
import { useTableItems } from '@/hooks/use-data-access';

function hasAnyField(item: Record<string, any>, fields: string[]): boolean {
  return fields.some((f) => item[f] != null && item[f] !== '');
}

function summaryFields(item: Record<string, any>): { icon: React.ReactNode; label: string; value: string }[] {
  const out: { icon: React.ReactNode; label: string; value: string }[] = [];
  if (item.rarity) out.push({ icon: <Star className="h-3 w-3" />, label: 'Raridade', value: item.rarity });
  if (item.tier) out.push({ icon: <Sparkles className="h-3 w-3" />, label: 'Tier', value: item.tier });
  if (item.element && item.element !== 'none') out.push({ icon: <Zap className="h-3 w-3" />, label: 'Elemento', value: item.element });
  if (item.weapon_type) out.push({ icon: <Sword className="h-3 w-3" />, label: 'Tipo', value: item.weapon_type });
  if (item.enemy_type) out.push({ icon: <Skull className="h-3 w-3" />, label: 'Tipo', value: item.enemy_type });
  if (item.boss_type) out.push({ icon: <Skull className="h-3 w-3" />, label: 'Tipo', value: item.boss_type });
  if (item.difficulty) out.push({ icon: <Crosshair className="h-3 w-3" />, label: 'Dificuldade', value: item.difficulty });
  if (item.obtain_method) out.push({ icon: <Pickaxe className="h-3 w-3" />, label: 'Obtenção', value: item.obtain_method });
  if (item.damage_min !== undefined) {
    const dmg = item.damage_max !== undefined ? `${item.damage_min}–${item.damage_max}` : String(item.damage_min);
    out.push({ icon: <Sword className="h-3 w-3" />, label: 'Dano', value: dmg });
  }
  if (item.health_bonus !== undefined) out.push({ icon: <Shield className="h-3 w-3" />, label: 'HP', value: `+${item.health_bonus}` });
  if (item.shop_price !== undefined) out.push({ icon: <Zap className="h-3 w-3" />, label: 'Preço', value: String(item.shop_price) });
  if (item.max_ranks !== undefined) out.push({ icon: <Gem className="h-3 w-3" />, label: 'Ranks', value: String(item.max_ranks) });
  return out.slice(0, 4);
}

function toSlug(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

type Props = {
  tenantSlug: string;
  tableName: string;
  tenantId?: string;
};

export default function GameTableListing({ tenantSlug, tableName }: Props) {
  const { data, loading } = useTableItems(tenantSlug, tableName);
  const items: any[] = data?.items ?? [];
  const labelCol = data?.labelCol ?? 'name';
  const { homePath } = useWikiPath(tenantSlug);

  return (
    <article className="max-w-3xl mx-auto">
      <Link
        href={homePath}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8 group"
      >
        <ArrowLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
        Voltar para home
      </Link>

      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
            <Database className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold capitalize">{tableName.replace(/_/g, ' ')}</h1>
            <p className="text-sm text-muted-foreground">{items.length} ite{items.length === 1 ? 'm' : 'ns'}</p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3 animate-pulse">
          <div className="h-5 w-32 bg-muted rounded mb-6" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-20 rounded-xl bg-muted" />
            ))}
          </div>
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-20 rounded-xl border bg-card">
          <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Nenhum item encontrado</h2>
          <p className="text-muted-foreground">Esta tabela ainda não possui dados.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {items.map((item) => {
            const label = item[labelCol] || item.name || '';
            const itemSlug = toSlug(String(label));
            const image = item.image_url || item.image || item.icon || item.icon_url;
            const subtitle = item.rarity || item.type || item.weapon_type || item.obtain || item.description || '';
            const desc = typeof item.description === 'string' ? item.description : '';
            const fields = summaryFields(item);
            const [expanded, setExpanded] = useState(false);
            const hasExpandable = desc.length > 0 || fields.length > 0 || hasAnyField(item, ['effects', 'weakness', 'tips', 'notes', 'items_dropped']);

            return (
              <div key={item.id} className="rounded-xl border bg-card overflow-hidden">
                <div className="flex items-center gap-3 p-4">
                  <Link
                    href={`${homePath}${tableName}/${itemSlug}`}
                    className="flex items-center gap-3 flex-1 min-w-0 group"
                  >
                    {image ? (
                      <div className="w-12 h-12 rounded-lg overflow-hidden shrink-0 bg-muted">
                        <img src={image} alt="" className="w-full h-full object-cover" />
                      </div>
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 text-primary">
                        <FileText className="h-5 w-5" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-sm font-medium group-hover:text-primary transition-colors truncate">
                        {label}
                      </p>
                      {subtitle && (
                        <p className="text-xs text-muted-foreground truncate mt-0.5">
                          {typeof subtitle === 'string' ? subtitle : ''}
                        </p>
                      )}
                    </div>
                  </Link>
                  {hasExpandable && (
                    <button
                      onClick={() => setExpanded(!expanded)}
                      className="p-1 rounded-md hover:bg-muted transition-colors shrink-0"
                    >
                      {expanded ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                    </button>
                  )}
                </div>
                {expanded && hasExpandable && (
                  <div className="px-4 pb-4 pt-0 border-t border-border/50">
                    {desc && (
                      <p className="text-xs text-muted-foreground leading-relaxed mt-3">{desc}</p>
                    )}
                    {fields.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {fields.map((f, i) => (
                          <span key={i} className="inline-flex items-center gap-1 rounded-md bg-muted/50 px-2 py-0.5 text-xs text-muted-foreground">
                            {f.icon}{f.label}: <span className="font-medium text-foreground">{f.value}</span>
                          </span>
                        ))}
                      </div>
                    )}
                    {(() => {
                      const extras: string[] = [];
                      if (item.effects) extras.push(typeof item.effects === 'string' ? item.effects : Array.isArray(item.effects) ? item.effects.join(', ') : String(item.effects));
                      if (item.weakness) extras.push(typeof item.weakness === 'string' ? item.weakness : Array.isArray(item.weakness) ? item.weakness.join(', ') : String(item.weakness));
                      if (item.items_dropped) extras.push(typeof item.items_dropped === 'string' ? item.items_dropped : Array.isArray(item.items_dropped) ? item.items_dropped.join(', ') : String(item.items_dropped));
                      if (extras.length === 0) return null;
                      return <p className="text-xs text-muted-foreground mt-1.5 truncate">{extras.join(' · ')}</p>;
                    })()}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </article>
  );
}
