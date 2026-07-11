'use client';

import { useState, useEffect, useCallback, useRef, createElement } from 'react';
import { Search, X } from 'lucide-react';
import { supabase } from '@/supabase';
import { GAME_TABLE_META } from '@/lib/game-table-labels';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ICON_MAP } from '@/lib/game-icons';
import { Select3D } from '@/components/ui/select3d';

interface GameItemSelectorProps {
  open: boolean;
  onClose: () => void;
  onSelect: (table: string, itemId: string, itemName: string) => void;
  tenantId: string;
}

interface SearchResult {
  id: string;
  name: string;
  description?: string | null;
}

const TABLE_KEYS = Object.keys(GAME_TABLE_META);

function getSearchColumns(table: string): string[] {
  switch (table) {
    case 'codes':
      return ['code'];
    case 'worlds':
      return ['world_name'];
    default:
      return ['name'];
  }
}

function getDisplayName(item: SearchResult, table: string): string {
  if (table === 'codes') return item.name || 'N/A';
  if (table === 'worlds') return item.name || 'N/A';
  return item.name;
}

function getDescriptionField(table: string): string[] {
  switch (table) {
    case 'weapons':
      return ['obtain_method', 'weapon_type'];
    case 'armors':
      return ['obtain_method', 'passive_ability'];
    case 'rings':
      return ['description', 'obtain_method'];
    case 'enemies':
      return ['description', 'enemy_type'];
    case 'bosses':
      return ['description', 'boss_type'];
    case 'potions':
      return ['effects'];
    case 'upgrades':
      return ['description', 'category'];
    case 'worlds':
      return ['description', 'environment'];
    case 'codes':
      return ['reward_type'];
    case 'crafting_recipes':
      return ['description'];
    case 'resources':
      return ['description'];
    case 'build_presets':
      return ['description'];
    default:
      return ['description'];
  }
}

export function GameItemSelector({ open, onClose, onSelect, tenantId: _tenantId }: GameItemSelectorProps) {
  const [selectedTable, setSelectedTable] = useState<string>(TABLE_KEYS[0]);
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const fetchResults = useCallback(async (table: string, query: string) => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    setLoading(true);
    try {
      const searchCols = getSearchColumns(table);
      const orConditions = searchCols.map((col) => `${col}.ilike.%${query}%`).join(',');

      const selectCols = ['id', ...searchCols, ...getDescriptionField(table)];
      const dedupedCols = [...new Set(selectCols)];

      const { data, error } = await supabase
        .from(table)
        .select(dedupedCols.join(','))
        .or(orConditions)
        .limit(30);

      if (error) {
        console.error('Search error:', error);
        setResults([]);
        return;
      }

      const mapped: SearchResult[] = ((data as unknown as Record<string, unknown>[]) || []).map((item) => ({
        id: item.id as string,
        name: (item.name || item.world_name || item.code || '') as string,
        description: (getDescriptionField(table)
          .map((f) => item[f])
          .filter(Boolean)
          .slice(0, 2)
          .join(' • ') || null) as string | null,
      }));

      setResults(mapped);
    } catch (err) {
      console.error('Search error:', err);
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchResults(selectedTable, searchQuery), 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [searchQuery, selectedTable, fetchResults]);

  useEffect(() => {
    if (!open) {
      setSearchQuery('');
      setResults([]);
    }
  }, [open]);

  const handleSelect = (item: SearchResult) => {
    onSelect(selectedTable, item.id, getDisplayName(item, selectedTable));
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <Card className="w-full max-w-lg mx-4 max-h-[80vh] flex flex-col border-border/50 shadow-2xl">
        <CardHeader className="flex flex-row items-center justify-between pb-3 shrink-0">
          <CardTitle className="text-lg font-semibold">Selecionar Item</CardTitle>
          <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>

        <CardContent className="flex flex-col gap-3 pb-4 overflow-hidden">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input
                placeholder="Buscar item..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
                autoFocus
              />
            </div>
            <Select3D value={selectedTable} options={TABLE_KEYS.map((key) => ({value: key, label: GAME_TABLE_META[key].label}))} onChange={(v) => { setSelectedTable(v); setSearchQuery(''); setResults([]); }} className="w-40" />
          </div>

          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            {createElement(ICON_MAP[GAME_TABLE_META[selectedTable].icon], { className: 'h-4 w-4' })}
            <span>{GAME_TABLE_META[selectedTable].label}</span>
          </div>

          <ScrollArea className="flex-1 -mx-6 px-6 max-h-[50vh]">
            {loading && (
              <div className="flex items-center justify-center py-12">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              </div>
            )}

            {!loading && results.length === 0 && searchQuery.trim() && (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <Search className="h-8 w-8 mb-2 opacity-40" />
                <p className="text-sm">Nenhum resultado encontrado</p>
              </div>
            )}

            {!loading && !searchQuery.trim() && (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <Search className="h-8 w-8 mb-2 opacity-40" />
                <p className="text-sm">Digite para buscar itens</p>
              </div>
            )}

            {!loading && results.length > 0 && (
              <div className="space-y-1">
                {results.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleSelect(item)}
                    className={cn(
                      'w-full text-left px-3 py-2.5 rounded-md transition-colors',
                      'hover:bg-accent hover:text-accent-foreground',
                      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
                    )}
                  >
                    <div className="font-medium text-sm">{getDisplayName(item, selectedTable)}</div>
                    {item.description && (
                      <div className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                        {item.description}
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
