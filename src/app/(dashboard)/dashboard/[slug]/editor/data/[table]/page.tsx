'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import {
  Loader2,
  Plus,
  Edit,
  Trash2,
  Save,
  X,
  ChevronDown,
  ChevronRight,
  Check,
} from 'lucide-react';

const tableLabels: Record<string, string> = {
  weapons: 'Armas',
  armors: 'Armaduras',
  rings: 'Anéis',
  potions: 'Poções',
  upgrades: 'Upgrades',
  enemies: 'Inimigos',
  bosses: 'Bosses',
  codes: 'Códigos',
  crafting_recipes: 'Receitas',
  resources: 'Recursos',
  game_config: 'Config do Jogo',
  worlds: 'Mundos',
  build_presets: 'Presets',
};

const primaryColumns: Record<string, string[]> = {
  weapons: ['name', 'rarity', 'weapon_type', 'tier', 'element', 'damage_min', 'damage_max'],
  armors: ['name', 'rarity', 'tier', 'health_bonus', 'speed_bonus', 'energy_bonus'],
  rings: ['name', 'tier', 'rarity', 'description'],
  potions: ['name', 'effects', 'shop_price'],
  upgrades: ['name', 'category', 'tier', 'description'],
  enemies: ['name', 'enemy_type', 'difficulty', 'world_name'],
  bosses: ['name', 'boss_type', 'difficulty', 'world_name'],
  codes: ['code', 'reward_type', 'is_active'],
  crafting_recipes: ['item_name', 'item_type', 'rarity', 'gold_cost'],
  resources: ['resource_name', 'resource_type', 'source_world'],
  game_config: ['config_key', 'config_value'],
  worlds: ['world_name', 'world_number', 'status'],
  build_presets: [],
};

const systemColumns = ['id', 'tenant_id', 'created_at', 'updated_at', 'embedding', 'slug'];

interface Row {
  [key: string]: unknown;
  id: string;
}

export default function DataTablePage() {
  const params = useParams();
  const slug = params.slug as string;
  const table = params.table as string;
  const { toast } = useToast();

  const [tenantId, setTenantId] = useState<string | null>(null);
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Record<string, string>>({});
  const [showNewForm, setShowNewForm] = useState(false);
  const [newForm, setNewForm] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [savedFeedback, setSavedFeedback] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const label = tableLabels[table] || table;
  const primary = primaryColumns[table] || [];

  const getColumns = useCallback(async () => {
    if (!tenantId) return [];
    const { data } = await supabase.rpc('get_columns', { table_name: table });
    if (data) return data as { column_name: string; data_type: string }[];
    return [];
  }, [table, tenantId]);

  const fetchRows = useCallback(async () => {
    if (!tenantId) return;
    setFetchError(null);
    const { data, error } = await supabase
      .from(table)
      .select('*')
      .eq('tenant_id', tenantId)
      .order('updated_at', { ascending: false });
    if (error) {
      console.error(`[data/${table}] fetch error:`, error);
      setFetchError(error.message);
      toast({ variant: 'destructive', title: 'Erro ao carregar', description: error.message });
    } else if (data) {
      setRows(data as Row[]);
    }
    setLoading(false);
  }, [table, tenantId, toast]);

  useEffect(() => {
    (async () => {
      const { data: tenant, error: tenantError } = await supabase
        .from('tenants')
        .select('id')
        .eq('slug', slug)
        .maybeSingle();
      if (tenantError) {
        console.error('[data] tenant lookup error:', tenantError);
        setFetchError(tenantError.message);
        toast({ variant: 'destructive', title: 'Erro ao buscar tenant', description: tenantError.message });
        setLoading(false);
      } else if (tenant) {
        setTenantId(tenant.id);
      } else {
        setFetchError(`Tenant com slug "${slug}" não encontrado.`);
        setLoading(false);
      }
    })();
  }, [slug, toast]);

  useEffect(() => {
    if (tenantId) fetchRows();
  }, [tenantId, fetchRows]);

  const isSystemColumn = (col: string) =>
    systemColumns.includes(col) || col.startsWith('embedding');

  const isEditableColumn = (col: string) => !isSystemColumn(col);

  const getPrimaryValue = (row: Row, col: string) => {
    const val = row[col];
    if (val === null || val === undefined) return '—';
    if (typeof val === 'object') return JSON.stringify(val).slice(0, 60);
    return String(val);
  };

  const getDetailColumns = (allCols: string[]) =>
    allCols.filter((c) => !isSystemColumn(c) && !primary.includes(c));

  const startEdit = (row: Row) => {
    setEditingId(row.id as string);
    const form: Record<string, string> = {};
    Object.entries(row).forEach(([key, val]) => {
      if (!isSystemColumn(key)) {
        form[key] = val !== null && val !== undefined
          ? typeof val === 'object' ? JSON.stringify(val) : String(val)
          : '';
      }
    });
    setEditForm(form);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({});
  };

  const handleEditSave = async (rowId: string) => {
    setSaving(true);
    const payload: Record<string, unknown> = {};
    Object.entries(editForm).forEach(([key, val]) => {
      const original = rows.find((r) => r.id === rowId)?.[key];
      if (original !== null && original !== undefined && typeof original === 'object') {
        try { payload[key] = JSON.parse(val); } catch { payload[key] = val; }
      } else if (typeof original === 'boolean') {
        payload[key] = val === 'true';
      } else if (typeof original === 'number') {
        payload[key] = val === '' ? null : Number(val);
      } else {
        payload[key] = val;
      }
    });

    const { error } = await supabase.from(table).update(payload).eq('id', rowId);
    if (error) {
      toast({ variant: 'destructive', title: 'Erro', description: error.message });
    } else {
      setSavedFeedback(true);
      setTimeout(() => setSavedFeedback(false), 2000);
      setEditingId(null);
      fetchRows();
    }
    setSaving(false);
  };

  const handleDelete = async (rowId: string) => {
    if (!confirm('Tem certeza que deseja excluir este registro?')) return;
    const { error } = await supabase.from(table).delete().eq('id', rowId);
    if (error) {
      toast({ variant: 'destructive', title: 'Erro', description: error.message });
    } else {
      setRows((prev) => prev.filter((r) => r.id !== rowId));
      toast({ title: 'Registro excluído.' });
    }
  };

  const handleNewSave = async () => {
    if (!tenantId) return;
    setSaving(true);
    const payload: Record<string, unknown> = { tenant_id: tenantId };
    Object.entries(newForm).forEach(([key, val]) => {
      payload[key] = val;
    });

    const { error } = await supabase.from(table).insert(payload).select().single();
    if (error) {
      toast({ variant: 'destructive', title: 'Erro', description: error.message });
    } else {
      setShowNewForm(false);
      setNewForm({});
      setSavedFeedback(true);
      setTimeout(() => setSavedFeedback(false), 2000);
      fetchRows();
    }
    setSaving(false);
  };

  const handleNewFormChange = (key: string, value: string) => {
    setNewForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleEditFormChange = (key: string, value: string) => {
    setEditForm((prev) => ({ ...prev, [key]: value }));
  };

  const renderField = (
    col: string,
    value: string,
    onChange: (key: string, val: string) => void,
    isBoolean?: boolean,
  ) => {
    if (col === 'embedding' || col.startsWith('embedding')) return null;

    if (isBoolean) {
      return (
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={value === 'true'}
            onChange={(e) => onChange(col, String(e.target.checked))}
            className="h-4 w-4 rounded border-gray-300"
          />
          <span className="text-xs text-muted-foreground">{value === 'true' ? 'Sim' : 'Não'}</span>
        </div>
      );
    }

    const isLongText = col.includes('description') || col.includes('notes') || col.includes('strategy') || col.includes('tips') || col === 'content' || col.endsWith('_details') || col === 'effect';
    const isJson = ['craft_materials', 'set_bonus', 'key_buffs', 'possible_stats', 'attacks', 'effects', 'items_dropped', 'notable_loot', 'chapters', 'difficulties', 'rewards', 'crafting_materials'].includes(col);

    if (isJson || isLongText) {
      return (
        <textarea
          value={value}
          onChange={(e) => onChange(col, e.target.value)}
          rows={isJson ? 4 : 3}
          className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 font-mono text-xs"
        />
      );
    }

    return (
      <Input
        value={value}
        onChange={(e) => onChange(col, e.target.value)}
        className="h-8 text-sm"
      />
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (fetchError && rows.length === 0) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">{label}</h1>
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
          <p className="font-medium mb-1">Erro ao carregar dados</p>
          <p className="font-mono text-xs opacity-80">{fetchError}</p>
        </div>
      </div>
    );
  }

  // Infer columns from first row or use primary
  const allColumns = rows.length > 0
    ? Object.keys(rows[0]).filter((c) => !isSystemColumn(c) || c === 'id')
    : primary;
  const detailColumns = getDetailColumns(allColumns);
  const editableColumns = allColumns.filter((c) => isEditableColumn(c));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{label}</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Gerencie os registros de {label.toLowerCase()}.
          </p>
        </div>
        <Button onClick={() => setShowNewForm(true)} disabled={showNewForm}>
          <Plus className="h-4 w-4 mr-2" />
          Adicionar
        </Button>
      </div>

      {savedFeedback && (
        <div className="flex items-center gap-2 text-sm text-green-500 font-medium">
          <Check className="h-4 w-4" />
          Alterações salvas!
        </div>
      )}

      {/* New form */}
      {showNewForm && (
        <div className="rounded-lg border p-4 space-y-3 bg-muted/20">
          <p className="text-sm font-medium">Novo Registro</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {editableColumns.map((col) => (
              <div key={col} className="space-y-1">
                <Label className="text-xs text-muted-foreground capitalize">{col.replace(/_/g, ' ')}</Label>
                {renderField(col, newForm[col] || '', handleNewFormChange)}
              </div>
            ))}
          </div>
          <div className="flex items-center gap-2 pt-2">
            <Button size="sm" onClick={handleNewSave} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Save className="h-4 w-4 mr-1" />}
              Salvar
            </Button>
            <Button size="sm" variant="outline" onClick={() => { setShowNewForm(false); setNewForm({}); }}>
              <X className="h-4 w-4 mr-1" />
              Cancelar
            </Button>
          </div>
        </div>
      )}

      {/* Rows */}
      {rows.length === 0 && !showNewForm ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <p className="text-lg font-medium">Nenhum registro encontrado</p>
          <p className="text-sm text-muted-foreground mt-1">
            Adicione o primeiro registro para começar.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {rows.map((row) => {
            const isEditing = editingId === row.id;
            const isExpanded = expandedId === row.id;
            return (
              <div key={row.id} className="rounded-lg border">
                {/* Card header */}
                <div className="flex items-center justify-between p-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                      {primary.map((col) => {
                        if (!(col in row)) return null;
                        const val = getPrimaryValue(row, col);
                        const isFirst = col === primary[0];
                        return (
                          <span
                            key={col}
                            className={isFirst ? 'font-medium text-sm' : 'text-xs text-muted-foreground'}
                          >
                            {isFirst ? val : `${col.replace(/_/g, ' ')}: ${val}`}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0 ml-3">
                    {detailColumns.length > 0 && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setExpandedId(isExpanded ? null : row.id)}
                        title="Ver detalhes"
                      >
                        {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                      </Button>
                    )}
                    <Button variant="ghost" size="icon" onClick={() => startEdit(row)} title="Editar">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(row.id)} title="Excluir">
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>

                {/* Expanded details */}
                {isExpanded && !isEditing && (
                  <div className="border-t px-3 py-3 space-y-2">
                    {detailColumns.map((col) => {
                      const val = row[col];
                      if (val === null || val === undefined) return null;
                      return (
                        <div key={col} className="text-xs">
                          <span className="font-medium text-muted-foreground capitalize">{col.replace(/_/g, ' ')}:</span>
                          <span className="text-foreground ml-1">
                            {typeof val === 'object' ? JSON.stringify(val, null, 2) : String(val)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Edit form */}
                {isEditing && (
                  <div className="border-t p-3 space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {editableColumns.map((col) => {
                        const original = row[col];
                        const isBool = typeof original === 'boolean';
                        return (
                          <div key={col} className="space-y-1">
                            <Label className="text-xs text-muted-foreground capitalize">{col.replace(/_/g, ' ')}</Label>
                            {renderField(col, editForm[col] || '', handleEditFormChange, isBool)}
                          </div>
                        );
                      })}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button size="sm" onClick={() => handleEditSave(row.id)} disabled={saving}>
                        {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Save className="h-4 w-4 mr-1" />}
                        Salvar
                      </Button>
                      <Button size="sm" variant="outline" onClick={cancelEdit}>
                        <X className="h-4 w-4 mr-1" />
                        Cancelar
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
