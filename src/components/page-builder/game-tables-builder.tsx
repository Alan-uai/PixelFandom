'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/supabase';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { ElasticSlider3D } from '@/components/ui/elastic-slider-3d';
import { Label } from '@/components/ui/label';
import { SelectCard } from '@/components/ui/select-card';
import { useToast } from '@/hooks/use-toast';
import { useSiteCache } from '@/lib/site-cache';
import { TableIconDisplay } from '@/lib/table-icons';
import {
  Loader2, Save, Check, Database, LayoutGrid, List, Layers,
  ChevronRight,
} from 'lucide-react';

interface TenantTable {
  table_name: string;
  display_label: string;
  icon?: string | null;
  display_format?: string | null;
  columns_count?: number | null;
}

interface GameTablesBuilderProps {
  tenantId: string;
  slug: string;
}

export function GameTablesBuilder({ tenantId, slug }: GameTablesBuilderProps) {
  const router = useRouter();
  const { toast } = useToast();

  const [tables, setTables] = useState<TenantTable[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Game Cards config
  const [displayFormat, setDisplayFormat] = useState('grid');
  const [columnsCount, setColumnsCount] = useState(4);
  const [tabsEnabled, setTabsEnabled] = useState(false);
  const [tabsSubFormat, setTabsSubFormat] = useState('list');

  useEffect(() => {
    if (!tenantId) return;
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from('tenant_game_tables')
        .select('table_name, display_label, icon, display_format, columns_count')
        .eq('tenant_id', tenantId)
        .order('created_at');
      if (data) setTables(data as TenantTable[]);

      // Load saved game cards config from tenant theme
      const { data: tenant } = await supabase
        .from('tenants')
        .select('theme')
        .eq('id', tenantId)
        .single();
      if (tenant?.theme) {
        const theme = tenant.theme as Record<string, any>;
        const gtDisplay = (theme.game_tables_display as Record<string, any>) || {};
        setDisplayFormat(gtDisplay.default_format || 'grid');
        setColumnsCount(gtDisplay.default_columns || 4);
        setTabsEnabled(gtDisplay.tabs_enabled || false);
        setTabsSubFormat(gtDisplay.tabs_sub_format || 'list');
      }
      setLoading(false);
    })();
  }, [tenantId]);

  const handleSave = async () => {
    if (!tenantId) return;
    setSaving(true);
    setSaved(false);

    // First fetch current theme
    const { data: tenant } = await supabase
      .from('tenants')
      .select('theme')
      .eq('id', tenantId)
      .single();

    const theme = (tenant?.theme as Record<string, any>) || {};

    const { error } = await supabase
      .from('tenants')
      .update({
        theme: {
          ...theme,
          game_tables_display: {
            default_format: displayFormat,
            default_columns: columnsCount,
            tabs_enabled: tabsEnabled,
            tabs_sub_format: tabsSubFormat,
          },
        },
      })
      .eq('id', tenantId);

    if (error) {
      toast({ variant: 'destructive', title: 'Erro', description: error.message });
    } else {
      useSiteCache.getState().invalidate(`tenant:${slug}`);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
      toast({ title: 'Configuração salva!' });
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="max-w-2xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">Configuração Geral das Game Cards</h2>
            <p className="text-sm text-muted-foreground">
              Personalize a exibição padrão dos cards de tabelas na página inicial da wiki.
            </p>
          </div>
          <Button onClick={handleSave} disabled={saving} size="sm">
            {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : saved ? <Check className="h-4 w-4 mr-1" /> : <Save className="h-4 w-4 mr-1" />}
            {saving ? 'Salvando...' : saved ? 'Salvo!' : 'Salvar'}
          </Button>
        </div>

        <div className="rounded-lg border bg-card p-4 space-y-4">
          <div className="flex items-center gap-2 border-b pb-2 mb-2">
            <LayoutGrid className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-medium">Game Cards</h3>
          </div>

          <div className="space-y-2">
            <Label>Formato de Exibição</Label>
            <SelectCard
              options={[
                { value: 'grid', label: 'Grid', icon: <LayoutGrid /> },
                { value: 'list', label: 'Lista', icon: <List /> },
                { value: 'carousel', label: 'Carrossel', icon: <Layers /> },
                { value: 'carousel_infinite', label: 'Carrossel Infinito', icon: <Layers /> },
              ]}
              value={displayFormat}
              onChange={(v) => setDisplayFormat(v as string)}
              layout="grid"
              columns={4}
              size="sm"
            />
          </div>

          <ElasticSlider3D
            label="Colunas"
            defaultValue={columnsCount}
            startingValue={2}
            maxValue={5}
            showValue
            onValueChange={setColumnsCount}
          />

          <div className="flex items-center gap-3">
            <Label htmlFor="tabsEnabled" className="shrink-0">Modo Abas (Tabs)</Label>
            <Switch id="tabsEnabled" checked={tabsEnabled} onCheckedChange={setTabsEnabled} />
          </div>

          {tabsEnabled && (
            <div className="space-y-2 pl-4 border-l-2 border-primary/20">
              <Label>Sub-formato das Abas</Label>
              <div className="flex gap-2">
                {[
                  { v: 'list', l: 'Lista' },
                  { v: 'carousel', l: 'Carrossel' },
                  { v: 'grid', l: 'Grid' },
                ].map((opt) => (
                  <button
                    key={opt.v}
                    type="button"
                    onClick={() => setTabsSubFormat(opt.v)}
                    className={`flex-1 rounded-lg border px-3 py-1.5 text-xs transition-colors ${
                      tabsSubFormat === opt.v ? 'border-primary bg-primary/10 text-primary' : 'border-border hover:bg-accent'
                    }`}
                  >
                    {opt.l}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="border-t pt-6">
          <h3 className="text-sm font-medium mb-4 flex items-center gap-2">
            <Database className="h-4 w-4 text-primary" />
            Tabelas da Wiki
          </h3>
          <p className="text-xs text-muted-foreground mb-4">
            Clique em uma tabela para personalizar sua exibição individualmente.
          </p>

          {tables.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center rounded-lg border border-dashed">
              <Database className="h-10 w-10 text-muted-foreground mb-3" />
              <p className="text-sm font-medium">Nenhuma tabela encontrada</p>
              <p className="text-xs text-muted-foreground mt-1">Crie tabelas no editor de conteúdo primeiro.</p>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {tables.map((t) => (
                <button
                  key={t.table_name}
                  onClick={() => router.push(`/dashboard/${slug}/editor?tab=${t.table_name}`)}
                  className="flex items-center gap-3 rounded-lg border p-4 text-left hover:bg-accent hover:border-primary/30 transition-all group"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 text-primary shrink-0">
                    <TableIconDisplay icon={t.icon || t.table_name} className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{t.display_label}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {t.display_format || 'grid'} · {t.columns_count || 4} colunas
                    </p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors shrink-0" />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
