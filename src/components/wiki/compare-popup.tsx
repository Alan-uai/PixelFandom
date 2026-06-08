'use client';

import { useEffect, useState, useRef, useMemo } from 'react';
import { X, Loader2, ArrowUpDown } from 'lucide-react';
import { supabase } from '@/supabase';
import { getTableSchema, type ColumnInfo } from '@/lib/game-schema';
import { ChipCarousel } from '@/components/ui/chip-carousel';
import { IconRenderer } from '@/components/ui/icon-renderer';

type CompareInfo = { key: string; label: string; format: 'number' | 'range' | 'percent' };

const NUMERIC_TYPES = new Set([
  'integer', 'bigint', 'smallint', 'numeric', 'real', 'double precision',
  'double', 'float', 'decimal',
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

export default function ComparePopup({
  table, tenantId, tenantSlug, currentItemId, initialStat, onClose,
}: {
  table: string;
  tenantId: string;
  tenantSlug?: string;
  currentItemId?: string;
  initialStat?: string;
  onClose: () => void;
}) {
  const [items, setItems] = useState<Record<string, any>[]>([]);
  const [loading, setLoading] = useState(true);
  const [schema, setSchema] = useState<ColumnInfo[]>([]);
  const itemsCache = useRef<Record<string, any>[] | null>(null);

  const [compareStat, setCompareStat] = useState<CompareInfo | null>(null);
  const [compareFilter, setCompareFilter] = useState<string | null>(null);
  const [sortAsc, setSortAsc] = useState(false);

  useEffect(() => {
    getTableSchema(table).then(setSchema);
  }, [table]);

  const allStats = useMemo(() => buildCompareInfo(schema), [schema]);

  useEffect(() => {
    if (allStats.length === 0) return;
    if (initialStat) {
      setCompareStat(allStats.find(s => s.key === initialStat) ?? allStats[0]);
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
    return [...filteredItems]
      .filter(item => item[compareStat.key] != null)
      .sort((a, b) => {
        const va = parseFloat(a[compareStat.key]);
        const vb = parseFloat(b[compareStat.key]);
        if (isNaN(va) && isNaN(vb)) return 0;
        if (isNaN(va)) return 1;
        if (isNaN(vb)) return -1;
        return sortAsc ? va - vb : vb - va;
      });
  }, [filteredItems, compareStat, sortAsc]);

  function getVal(item: Record<string, any>, stat: CompareInfo): string {
    if (stat.format === 'range') {
      const min = item[`${stat.key}_min`] ?? item[stat.key];
      const max = item[`${stat.key}_max`];
      return max !== undefined ? `${min}–${max}` : String(min ?? '—');
    }
    if (stat.format === 'percent') {
      const val = item[stat.key];
      return val !== undefined ? `${val}%` : '—';
    }
    return String(item[stat.key] ?? '—');
  }

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
                  className={`rounded-full px-3 py-1 text-xs font-medium whitespace-nowrap transition-colors shrink-0 ${
                    s.key === compareStat.key
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  }`}
                >
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
                    <th className="text-right px-5 py-2.5 font-medium w-28">{compareStat.label}</th>
                  </tr>
                </thead>
                <tbody>
                  {sorted.map((item, idx) => {
                    const isCurrent = isCurrentItem(item);
                    const val = getVal(item, compareStat);
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
                              <img src={item.icon_url} alt="" className="h-6 w-6 rounded object-contain shrink-0" />
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
                        <td className={`px-5 py-2.5 text-right font-semibold tabular-nums ${isCurrent ? 'text-primary' : ''}`}>
                          {val}
                        </td>
                      </tr>
                    );
                  })}
                  {sorted.length === 0 && (
                    <tr>
                      <td colSpan={3} className="px-5 py-8 text-center text-sm text-muted-foreground">
                        Nenhum item encontrado com este stat.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </>
          ) : (
            <div className="flex justify-center py-12 text-sm text-muted-foreground">
              Nenhum stat disponível para esta tabela.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function buildCompareInfo(schema: ColumnInfo[]): CompareInfo[] {
  const numeric = schema.filter(c => NUMERIC_TYPES.has(c.data_type) && !isSystem(c.column_name));
  const pairs = findRangePairs(numeric);

  const result: CompareInfo[] = [];

  for (const base of pairs) {
    result.push({ key: base, label: STAT_LABELS[base] ?? labelFromKey(base), format: 'range' });
  }

  const paired = new Set(pairs.flatMap(k => [`${k}_min`, `${k}_max`, k]));
  for (const col of numeric) {
    if (paired.has(col.column_name)) continue;
    const name = col.column_name;
    const format = name.includes('percent') || name.includes('rate') || name.includes('chance')
      ? 'percent' as const
      : 'number' as const;
    result.push({ key: name, label: STAT_LABELS[name] ?? labelFromKey(name), format });
  }

  return result;
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
  return ['id', 'tenant_id', 'created_at', 'updated_at', 'rank', 'embedding'].includes(name);
}

function labelFromKey(key: string): string {
  return key
    .replace(/_min$/, '')
    .replace(/_max$/, '')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, l => l.toUpperCase());
}
