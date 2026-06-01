'use client';

import { useParams, useSearchParams } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { supabase } from '@/supabase';
import { useWikiData } from '@/context/wiki-provider';
import { IconRenderer } from '@/components/ui/icon-renderer';

const GAME_TABLES = ['weapons', 'armors', 'rings', 'enemies', 'bosses', 'potions', 'upgrades', 'worlds', 'codes'] as const;

type CompareInfo = { key: string; label: string; format: 'number' | 'range' | 'percent' | 'text' };

export default function ComparePage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const slug = params.slug as string;
  const table = params.table as string;
  const statKey = searchParams?.get('stat') || 'damage_min';

  const { data: wiki } = useWikiData();
  const tenant = wiki?.tenant;

  const [items, setItems] = useState<Record<string, any>[]>([]);
  const [loading, setLoading] = useState(true);
  const [compareFilter, setCompareFilter] = useState<string | null>(null);
  const itemsCache = useRef<Record<string, any>[] | null>(null);

  const stat = allStats.find((s) => s.key === statKey) || { key: statKey, label: statKey, format: 'number' as const };

  const subCategoryKey = (() => {
    const sample = items[0];
    if (!sample) return null;
    if (sample.weapon_type) return 'weapon_type';
    if (sample.enemy_type) return 'enemy_type';
    if (sample.boss_type) return 'boss_type';
    if (sample.category) return 'category';
    return null;
  })();

  useEffect(() => {
    if (!tenant?.id || !table) return;
    if (!GAME_TABLES.includes(table as any)) return;

    if (itemsCache.current) {
      setItems(itemsCache.current);
      setLoading(false);
      return;
    }

    supabase
      .from(table)
      .select('*')
      .eq('tenant_id', tenant.id)
      .order('updated_at', { ascending: false })
      .then(({ data }) => {
        if (data) {
          itemsCache.current = data as Record<string, any>[];
          setItems(data as Record<string, any>[]);
        }
        setLoading(false);
      });
  }, [tenant?.id, table]);

  const filteredItems = compareFilter
    ? items.filter((item) => String(item[subCategoryKey || '']) === compareFilter)
    : items;

  const subCategoryValues = subCategoryKey
    ? [...new Set(items.map((item) => String(item[subCategoryKey] || '')).filter(Boolean))]
    : [];

  const sorted = [...filteredItems].sort((a, b) => {
    const va = parseFloat(a[stat.key]);
    const vb = parseFloat(b[stat.key]);
    return (isNaN(vb) ? -Infinity : vb) - (isNaN(va) ? -Infinity : va);
  });

  function getVal(item: Record<string, any>): string {
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

  if (!GAME_TABLES.includes(table as any)) {
    return (
      <div className="max-w-3xl mx-auto text-center py-20">
        <h1 className="text-xl font-bold mb-2">Tabela inválida</h1>
        <p className="text-muted-foreground text-sm">A tabela &ldquo;{table}&rdquo; não é válida para comparação.</p>
        <Link href={`/w/${slug}`} className="text-primary hover:underline text-sm mt-4 inline-block">Voltar</Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <Link
        href={`/w/${slug}`}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6 group"
      >
        <ArrowLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
        Voltar para home
      </Link>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold capitalize">{table}</h1>
          <p className="text-sm text-muted-foreground mt-1">Comparação de <strong>{stat.label}</strong></p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {allStats.map((s) => (
            <Link
              key={s.key}
              href={`/w/${slug}/compare/${table}?stat=${s.key}`}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                s.key === statKey ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              {s.label}
            </Link>
          ))}
        </div>
      </div>

      {/* Subcategory filter */}
      {subCategoryValues.length > 1 && (
        <div className="flex flex-wrap gap-1.5 mb-4">
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

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      ) : (
        <div className="rounded-xl border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50 text-xs text-muted-foreground">
                <th className="text-left px-5 py-3 font-medium">#</th>
                <th className="text-left px-5 py-3 font-medium">Item</th>
                <th className="text-right px-5 py-3 font-medium w-28">{stat.label}</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((item, idx) => {
                const val = getVal(item);
                return (
                  <tr key={item.id} className="border-b last:border-0 hover:bg-muted/50 transition-colors">
                    <td className="px-5 py-2.5 text-xs text-muted-foreground">{idx + 1}</td>
                    <td className="px-5 py-2.5">
                      <div className="flex items-center gap-2.5">
                        {item.icon_url ? (
                          <img src={item.icon_url} alt="" className="h-6 w-6 rounded object-contain shrink-0" />
                        ) : item.icon && item.icon.includes(':') ? (
                          <IconRenderer icon={item.icon} size="sm" />
                        ) : null}
                        <span className="font-medium">{item.name || item.title || item.item_name || item.code || '—'}</span>
                      </div>
                    </td>
                    <td className="px-5 py-2.5 text-right font-semibold tabular-nums">{val}</td>
                  </tr>
                );
              })}
              {sorted.length === 0 && (
                <tr><td colSpan={3} className="px-5 py-8 text-center text-sm text-muted-foreground">Nenhum item encontrado.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

const allStats: CompareInfo[] = [
  { key: 'damage_min', label: 'Dano', format: 'range' },
  { key: 'crit_chance_min', label: 'Crit', format: 'percent' },
  { key: 'knockback', label: 'Knockback', format: 'number' },
  { key: 'health_bonus', label: 'HP', format: 'number' },
  { key: 'speed_bonus', label: 'Speed', format: 'number' },
  { key: 'energy_bonus', label: 'Energy', format: 'number' },
  { key: 'shop_price', label: 'Preço', format: 'number' },
  { key: 'craft_cost', label: 'Custo Craft', format: 'number' },
  { key: 'max_uses_per_run', label: 'Usos/run', format: 'number' },
  { key: 'unlock_level', label: 'Nível mín', format: 'number' },
  { key: 'max_ranks', label: 'Ranks máx', format: 'number' },
  { key: 'priority_order', label: 'Prioridade', format: 'number' },
  { key: 'drop_rate_percentage', label: 'Drop Rate', format: 'percent' },
];
