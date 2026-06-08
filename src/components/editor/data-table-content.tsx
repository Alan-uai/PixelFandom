'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '@/supabase';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { FloatingLabelInput } from '@/components/ui/floating-label-input';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { ImageUpload } from '@/components/ui/image-upload';
import { IconPickerTrigger } from '@/components/ui/icon-picker';
import { IconRenderer } from '@/components/ui/icon-renderer';
import { invalidateDataCache } from '@/lib/data-access';
import { Switch } from '@/components/ui/switch';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { format, parse } from 'date-fns';
import { ptBR } from 'date-fns/locale';
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
  PlusCircle,
  ImageIcon,
  CalendarIcon,
  Link2,
} from 'lucide-react';
import { translateGameTerm } from '@/lib/translate';

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
const imageColumnNames = ['image_url', 'image', 'cover_url', 'logo_url'];
const iconColumnNames = ['icon_url', 'icon_id', 'icon'];
const newFieldTypes = ['text', 'integer', 'numeric', 'boolean', 'jsonb', 'real', 'bigint', 'double precision'];
const dateColumnNames = ['verified_date', 'expired_date', 'release_date', 'event_date'];
const systemDateColumns = ['created_at', 'updated_at'];

interface Row {
  [key: string]: unknown;
  id: string;
}

export default function DataTableContent({
  slug,
  table,
  displayLabel,
  parentTable,
  onRename,
  onDelete,
}: {
  slug: string;
  table: string;
  displayLabel?: string;
  parentTable?: string | null;
  onRename?: () => void;
  onDelete?: () => void;
}) {
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
  const [showAddField, setShowAddField] = useState(false);
  const [newFieldName, setNewFieldName] = useState('');
  const [newFieldType, setNewFieldType] = useState('text');
  const [schemaBusy, setSchemaBusy] = useState(false);
  const [tableColumns, setTableColumns] = useState<{ column_name: string; data_type: string; is_nullable: boolean }[] | null>(null);
  const [availableColumns, setAvailableColumns] = useState<{ column_name: string; data_type: string }[]>([]);
  const [showParentDialog, setShowParentDialog] = useState(false);
  const [potentialParents, setPotentialParents] = useState<string[]>([]);
  const [parentLoading, setParentLoading] = useState(false);
  const [displayFormat, setDisplayFormat] = useState('grid');
  const [columnsCount, setColumnsCount] = useState(4);
  const [displaySettingsLoading, setDisplaySettingsLoading] = useState(false);
  const [displaySaving, setDisplaySaving] = useState(false);

  const getParentLabel = (t: string) => tableLabels[t] || t;

  const handleOpenParentDialog = async () => {
    setShowParentDialog(true);
    setParentLoading(true);
    const { data } = await supabase.rpc('list_potential_parents', { p_table: table });
    if (data) setPotentialParents(data as string[]);
    setParentLoading(false);
  };

  const handleSetParent = async (parent: string | null) => {
    if (!tenantId) return;
    setParentLoading(true);
    const { error } = await supabase.rpc('update_table_parent', {
      p_table: table,
      p_parent_table: parent,
      p_tenant_id: tenantId,
    });
    if (error) {
      toast({ variant: 'destructive', title: 'Erro', description: error.message });
    } else {
      toast({ title: parent ? `Vinculado a "${getParentLabel(parent)}"` : 'Vínculo removido.' });
      setShowParentDialog(false);
    }
    setParentLoading(false);
  };

  const rowsCache = useRef<Row[] | null>(null);
  const columnsCache = useRef<{ column_name: string; data_type: string; is_nullable: boolean }[] | null>(null);

  const currentFormKeys = showNewForm ? Object.keys(newForm) : editingId ? Object.keys(editForm) : [];
  const unusedColumns = availableColumns.filter(
    (c) => !currentFormKeys.includes(c.column_name) && !isSystemColumn(c.column_name),
  );

  const label = tableLabels[table] || table;
  const primary = primaryColumns[table] || [];

  const fetchColumns = useCallback(async () => {
    if (!tenantId) return;
    if (columnsCache.current) { setTableColumns(columnsCache.current); return; }
    const { data, error } = await supabase.rpc('get_table_columns', { p_table: table });
    if (!error && data) {
      const result = data as { ok: boolean; columns: { column_name: string; data_type: string; is_nullable: boolean }[] };
      if (result.ok) {
        columnsCache.current = result.columns;
        setTableColumns(result.columns);
      }
    }
  }, [table, tenantId]);

  const fetchDisplaySettings = useCallback(async () => {
    if (!tenantId) return;
    const { data } = await supabase
      .from('tenant_game_tables')
      .select('display_format, columns_count')
      .eq('tenant_id', tenantId)
      .eq('table_name', table)
      .maybeSingle();
    if (data) {
      if (data.display_format) setDisplayFormat(data.display_format);
      if (data.columns_count) setColumnsCount(data.columns_count);
    }
  }, [tenantId, table]);

  const fetchRows = useCallback(async () => {
    if (!tenantId) return;
    if (rowsCache.current) { setRows(rowsCache.current); setLoading(false); return; }
    setFetchError(null);
    const { data, error } = await supabase
      .from(table)
      .select('*')
      .eq('tenant_id', tenantId)
      .order('updated_at', { ascending: false });
    if (error) {
      setFetchError(error.message);
      toast({ variant: 'destructive', title: 'Erro ao carregar', description: error.message });
    } else if (data) {
      rowsCache.current = data as Row[];
      setRows(data as Row[]);
    }
    setLoading(false);
  }, [table, tenantId, toast]);

  useEffect(() => {
    rowsCache.current = null;
    columnsCache.current = null;
    setRows([]);
    setTableColumns(null);
    setLoading(true);
    setFetchError(null);
    setEditingId(null);
    setShowNewForm(false);
    setExpandedId(null);

    supabase
      .from('tenants')
      .select('id')
      .eq('slug', slug)
      .maybeSingle()
      .then(({ data: tenant, error: tenantError }) => {
        if (tenantError) {
          setFetchError(tenantError.message);
          toast({ variant: 'destructive', title: 'Erro ao buscar tenant', description: tenantError.message });
          setLoading(false);
        } else if (tenant) {
          setTenantId(tenant.id);
        } else {
          setFetchError(`Tenant com slug "${slug}" não encontrado.`);
          setLoading(false);
        }
      });
  }, [slug, table, toast]);

  useEffect(() => {
    if (tenantId) {
      fetchRows();
      fetchColumns();
      fetchDisplaySettings();
    }
  }, [tenantId, fetchRows, fetchColumns, fetchDisplaySettings]);

  const isSystemColumn = (col: string) =>
    systemColumns.includes(col) || col.startsWith('embedding');

  const isImageColumn = (col: string) => imageColumnNames.includes(col);
  const isIconColumn = (col: string) => iconColumnNames.includes(col);
  const isEditableColumn = (col: string) => !isSystemColumn(col) && col !== 'id';

  const getColumnDataType = (col: string, columns: { column_name: string; data_type: string }[] | null): string | undefined =>
    columns?.find((c) => c.column_name === col)?.data_type;

  const isDateColumn = (col: string, dataType?: string): boolean => {
    if (systemDateColumns.includes(col)) return false;
    if (dataType === 'date') return true;
    if (dataType?.startsWith('timestamp')) return true;
    if (dateColumnNames.includes(col)) return true;
    if (col.endsWith('_date')) return true;
    return false;
  };

  const isTimeColumn = (col: string, dataType?: string): boolean => {
    if (dataType === 'time without time zone' || dataType === 'time') return true;
    if (col.endsWith('_time') || col === 'time') return true;
    return false;
  };

  const getPrimaryValue = (row: Row, col: string) => {
    const val = row[col];
    if (val === null || val === undefined) return '—';
    if (typeof val === 'object') return JSON.stringify(val).slice(0, 60);
    return String(val);
  };

  const getDetailColumns = (allCols: string[]) =>
    allCols.filter((c) => !isSystemColumn(c) && !primary.includes(c) && !imageColumnNames.includes(c) && !iconColumnNames.includes(c));

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
      } else if (typeof original === 'string' || original === null || original === undefined) {
        payload[key] = val === '' ? null : val;
      } else {
        payload[key] = val;
      }
    });

    const { error } = await supabase.from(table).update(payload).eq('id', rowId);
    if (error) {
      toast({ variant: 'destructive', title: 'Erro', description: error.message });
    } else {
      invalidateDataCache(slug);
      rowsCache.current = null;
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
      invalidateDataCache(slug);
      rowsCache.current = null;
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
      invalidateDataCache(slug);
      rowsCache.current = null;
      setShowNewForm(false);
      setNewForm({});
      setSavedFeedback(true);
      setTimeout(() => setSavedFeedback(false), 2000);
      fetchRows();
    }
    setSaving(false);
  };

  const handleSaveDisplaySettings = async () => {
    if (!tenantId) return;
    setDisplaySaving(true);
    const { error } = await supabase
      .from('tenant_game_tables')
      .update({ display_format: displayFormat, columns_count: columnsCount })
      .eq('tenant_id', tenantId)
      .eq('table_name', table);
    if (error) {
      toast({ variant: 'destructive', title: 'Erro', description: error.message });
    } else {
      toast({ title: 'Configuração de exibição salva!' });
    }
    setDisplaySaving(false);
  };

  const handleClearField = (key: string, formSetter: (fn: (prev: Record<string, string>) => Record<string, string>) => void) => {
    formSetter((prev) => ({ ...prev, [key]: '' }));
  };

  const handleDropColumn = async (col: string) => {
    if (!confirm(`Remover a coluna "${col}" permanentemente?\n\nIsso afeta TODOS os itens desta tabela. Esta ação não pode ser desfeita.`)) return;
    if (!tenantId) return;
    setSchemaBusy(true);
    const { data, error } = await supabase.rpc('drop_game_column', {
      p_table: table,
      p_column: col,
      p_tenant_id: tenantId,
    });
    if (error) {
      toast({ variant: 'destructive', title: 'Erro', description: error.message });
    } else {
      const result = data as { ok: boolean; error?: string };
      if (result.ok) {
        invalidateDataCache(slug);
        toast({ title: `Coluna "${col}" removida.` });
        if (editingId) {
          setEditForm((prev) => {
            const next = { ...prev };
            delete next[col];
            return next;
          });
        }
        columnsCache.current = null;
        fetchRows();
      } else {
        toast({ variant: 'destructive', title: 'Erro', description: result.error || 'Falha ao remover coluna.' });
      }
    }
    setSchemaBusy(false);
  };

  const handleAddColumn = async () => {
    const rawName = newFieldName.trim();
    if (!rawName) {
      toast({ variant: 'destructive', title: 'Erro', description: 'Digite um nome para o campo.' });
      return;
    }
    if (!tenantId) return;
    setSchemaBusy(true);

    const { slug: colSlug } = await translateGameTerm(rawName);

    const existing = availableColumns.find((c) => c.column_name === colSlug);
    if (existing) {
      if (showNewForm) {
        setNewForm((prev) => ({ ...prev, [colSlug]: '' }));
      }
      if (editingId) {
        setEditForm((prev) => ({ ...prev, [colSlug]: '' }));
      }
      toast({ title: `Campo "${colSlug}" adicionado!` });
      setShowAddField(false);
      setNewFieldName('');
      setSchemaBusy(false);
      return;
    }

    const { data, error } = await supabase.rpc('add_game_column', {
      p_table: table,
      p_column: colSlug,
      p_type: newFieldType,
      p_tenant_id: tenantId,
    });
    if (error) {
      toast({ variant: 'destructive', title: 'Erro', description: error.message });
    } else {
      const result = data as { ok: boolean; error?: string };
      if (result.ok) {
        invalidateDataCache(slug);
        toast({ title: `Campo "${colSlug}" adicionado!` });
        columnsCache.current = null;
        setShowAddField(false);
        setNewFieldName('');
        if (showNewForm) {
          setNewForm((prev) => ({ ...prev, [colSlug]: '' }));
        }
        if (editingId) {
          setEditForm((prev) => ({ ...prev, [colSlug]: '' }));
        }
        fetchRows();
      } else {
        toast({ variant: 'destructive', title: 'Erro', description: result.error || 'Falha ao adicionar campo.' });
      }
    }
    setSchemaBusy(false);
  };

  const renderField = (
    col: string,
    value: string,
    onChange: (key: string, val: string) => void,
    isBoolean?: boolean,
    rowId?: string,
  ) => {
    if (col === 'embedding' || col.startsWith('embedding')) return null;

    const dataType = getColumnDataType(col, tableColumns);

    if (isIconColumn(col)) {
      return (
        <div className="space-y-2">
          {value && value.includes(':') ? (
            <div className="flex items-center gap-2 mb-1 text-xs text-muted-foreground">
              <IconRenderer icon={value} size="sm" />
              <span className="font-mono">{value}</span>
            </div>
          ) : value && !value.includes(':') ? (
            <ImageUpload
              bucket="game-items"
              pathPrefix={`${slug}/${table}/${rowId || 'new'}`}
              value={value}
              onChange={(url) => onChange(col, url)}
              previewSize="w-8 h-8"
              label="Ícone"
            />
          ) : null}
          <IconPickerTrigger
            value={value?.includes(':') ? value : ''}
            onChange={(iconId) => onChange(col, iconId)}
          />
        </div>
      );
    }

    if (isImageColumn(col)) {
      return (
        <ImageUpload
          bucket="game-items"
          pathPrefix={`${slug}/${table}/${rowId || 'new'}`}
          value={value}
          onChange={(url) => onChange(col, url)}
          label="Imagem"
        />
      );
    }

    const isBool = isBoolean || dataType === 'boolean';

    if (isBool) {
      return (
        <div className="flex items-center gap-2">
          <Switch
            checked={value === 'true'}
            onCheckedChange={(checked) => onChange(col, String(checked))}
          />
          <span className="text-xs text-muted-foreground">{value === 'true' ? 'Sim' : 'Não'}</span>
        </div>
      );
    }

    if (isDateColumn(col, dataType)) {
      const date = value ? parse(value, 'yyyy-MM-dd', new Date()) : undefined;
      return (
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                'w-full justify-start text-left font-normal h-8 text-sm',
                !date && 'text-muted-foreground'
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {date ? format(date, 'dd/MM/yyyy') : <span>Selecionar data</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={date}
              onSelect={(selectedDate) => {
                onChange(col, selectedDate ? format(selectedDate, 'yyyy-MM-dd') : '');
              }}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      );
    }

    if (isTimeColumn(col, dataType)) {
      return (
        <input
          type="time"
          value={value}
          onChange={(e) => onChange(col, e.target.value)}
          className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 h-8"
        />
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

  const renderFieldItem = (
    col: string,
    value: string,
    form: Record<string, string>,
    formSetter: (fn: (prev: Record<string, string>) => Record<string, string>) => void,
    onChange: (key: string, val: string) => void,
    isBool: boolean,
    rowId?: string,
  ) => (
    <div key={col} className="space-y-1 relative group">
      <div className="flex items-center justify-between">
        <Label className="text-xs text-muted-foreground capitalize flex items-center gap-1">
          {isImageColumn(col) && <ImageIcon className="h-3 w-3" />}
          {col.replace(/_/g, ' ')}
        </Label>
        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          {!isSystemColumn(col) && (
            <button
              type="button"
              onClick={() => handleClearField(col, formSetter)}
              className="text-muted-foreground hover:text-foreground p-0.5 rounded"
              title="Limpar valor"
            >
              <X className="h-3 w-3" />
            </button>
          )}
          {!isSystemColumn(col) && (
            <button
              type="button"
              onClick={() => handleDropColumn(col)}
              className="text-destructive/60 hover:text-destructive p-0.5 rounded"
              title="Remover coluna"
            >
              <Trash2 className="h-3 w-3" />
            </button>
          )}
        </div>
      </div>
      {renderField(col, value, onChange, isBool, rowId)}
    </div>
  );

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

  const allColumns = tableColumns
    ? tableColumns.map((c) => c.column_name).filter((c) => !isSystemColumn(c) || c === 'id')
    : rows.length > 0
      ? Object.keys(rows[0]).filter((c) => !isSystemColumn(c) || c === 'id')
      : primary;
  const detailColumns = getDetailColumns(allColumns);
  const editableColumns = allColumns.filter((c) => isEditableColumn(c));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-xl font-bold">{displayLabel || label}</h1>
            <p className="text-muted-foreground mt-1 text-sm">
              Gerencie os registros de {(displayLabel || label).toLowerCase()}.
            </p>
          </div>
          <div className="flex items-center gap-1 self-start mt-1">
            {onRename && (
              <Button variant="ghost" size="icon" onClick={onRename} title="Renomear tabela">
                <Edit className="h-4 w-4" />
              </Button>
            )}
            {onDelete && (
              <Button variant="ghost" size="icon" onClick={onDelete} title="Excluir tabela">
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            )}
          </div>
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

      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          Exibição:
          <select
            value={displayFormat}
            onChange={(e) => setDisplayFormat(e.target.value)}
            className="h-7 rounded-md border bg-background px-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary/50"
          >
            <option value="grid">Grid</option>
            <option value="list">Lista</option>
            <option value="carousel">Carrossel</option>
            <option value="carousel_infinite">Carrossel Infinito</option>
          </select>
        </span>
        <span className="flex items-center gap-1">
          Colunas:
          <select
            value={columnsCount}
            onChange={(e) => setColumnsCount(Number(e.target.value))}
            className="h-7 rounded-md border bg-background px-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary/50"
          >
            {[2, 3, 4, 5].map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
        </span>
        <Button size="sm" variant="outline" className="h-7 text-xs px-2" onClick={handleSaveDisplaySettings} disabled={displaySaving}>
          {displaySaving ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Save className="h-3 w-3 mr-1" />}
          Salvar
        </Button>
      </div>

      {parentTable !== undefined && (
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Link2 className="h-3 w-3 shrink-0" />
          {parentTable ? (
            <button onClick={handleOpenParentDialog} className="hover:text-foreground transition-colors">
              Vinculado a: <strong>{getParentLabel(parentTable)}</strong>
              <span className="underline ml-1">alterar</span>
            </button>
          ) : (
            <button onClick={handleOpenParentDialog} className="underline hover:text-foreground transition-colors">
              Vincular a uma tabela pai
            </button>
          )}
        </div>
      )}

      {showNewForm && (
        <div className="rounded-lg border p-4 space-y-3 bg-muted/20">
          <p className="text-sm font-medium">Novo Registro</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {editableColumns.map((col) =>
              renderFieldItem(col, newForm[col] || '', newForm, setNewForm, (key, val) => setNewForm((prev) => ({ ...prev, [key]: val })), false, undefined)
            )}
          </div>

          <div className="border-t pt-3 mt-3">
            {showAddField ? (
              <div className="space-y-3">
                {unusedColumns.length > 0 && (
                  <div className="max-h-32 overflow-y-auto border rounded-md p-2">
                    <span className="text-xs font-medium text-muted-foreground mb-1 block">
                      Sugestões ({unusedColumns.length} disponíveis)
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {unusedColumns.map((col) => (
                        <button
                          key={col.column_name}
                          type="button"
                          className="px-2 py-1 rounded text-xs bg-secondary/50 hover:bg-secondary transition-colors font-mono"
                          onClick={() => {
                            setNewForm((prev) => ({ ...prev, [col.column_name]: '' }));
                            setShowAddField(false);
                            setNewFieldName('');
                          }}
                        >
                          {col.column_name}
                          <span className="text-muted-foreground ml-1">{col.data_type}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex items-end gap-2">
                  <div className="flex-1">
                    <FloatingLabelInput
                      label="Nome do campo"
                      value={newFieldName}
                      onChange={(e) => setNewFieldName(e.target.value)}
                      className="text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Tipo</Label>
                    <select
                      value={newFieldType}
                      onChange={(e) => setNewFieldType(e.target.value)}
                      className="h-8 rounded-lg border bg-background px-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                    >
                      {newFieldTypes.map((t) => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>
                  <Button size="sm" onClick={handleAddColumn} disabled={schemaBusy}>
                    {schemaBusy ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Plus className="h-3 w-3 mr-1" />}
                    Criar
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => { setShowAddField(false); setNewFieldName(''); }}>
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ) : (
              <Button variant="outline" size="sm" onClick={async () => {
                setShowAddField(true);
                const colData = await supabase.rpc('list_available_columns', { p_table: table });
                if (!colData.error && colData.data) {
                  setAvailableColumns(colData.data as { column_name: string; data_type: string }[]);
                }
              }}>
                <PlusCircle className="h-3 w-3 mr-1" />
                Adicionar campo
              </Button>
            )}
          </div>

          <div className="flex items-center gap-2 pt-2">
            <Button size="sm" onClick={handleNewSave} disabled={saving || schemaBusy}>
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

                {isEditing && (
                  <div className="border-t p-3 space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {editableColumns.map((col) => {
                        const original = row[col];
                        const isBool = typeof original === 'boolean';
                        return renderFieldItem(
                          col,
                          editForm[col] || '',
                          editForm,
                          setEditForm,
                          (key, val) => setEditForm((prev) => ({ ...prev, [key]: val })),
                          isBool,
                          row.id,
                        );
                      })}
                    </div>

                    <div className="border-t pt-3">
                      {showAddField ? (
                        <div className="space-y-3">
                          {unusedColumns.length > 0 && (
                            <div className="max-h-32 overflow-y-auto border rounded-md p-2">
                              <span className="text-xs font-medium text-muted-foreground mb-1 block">
                                Sugestões ({unusedColumns.length} disponíveis)
                              </span>
                              <div className="flex flex-wrap gap-1">
                                {unusedColumns.map((col) => (
                                  <button
                                    key={col.column_name}
                                    type="button"
                                    className="px-2 py-1 rounded text-xs bg-secondary/50 hover:bg-secondary transition-colors font-mono"
                                    onClick={() => {
                                      setEditForm((prev) => ({ ...prev, [col.column_name]: '' }));
                                      setShowAddField(false);
                                      setNewFieldName('');
                                    }}
                                  >
                                    {col.column_name}
                                    <span className="text-muted-foreground ml-1">{col.data_type}</span>
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}

                          <div className="flex items-end gap-2">
                            <div className="space-y-1 flex-1">
                              <Label className="text-xs text-muted-foreground">Nome do campo</Label>
                              <Input
                                value={newFieldName}
                                onChange={(e) => setNewFieldName(e.target.value)}
                                className="h-8 text-sm"
                              />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs text-muted-foreground">Tipo</Label>
                              <select
                                value={newFieldType}
                                onChange={(e) => setNewFieldType(e.target.value)}
                                className="h-8 rounded-lg border bg-background px-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                              >
                                {newFieldTypes.map((t) => (
                                  <option key={t} value={t}>{t}</option>
                                ))}
                              </select>
                            </div>
                            <Button size="sm" onClick={handleAddColumn} disabled={schemaBusy}>
                              {schemaBusy ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Plus className="h-3 w-3 mr-1" />}
                              Criar
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => { setShowAddField(false); setNewFieldName(''); }}>
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <Button variant="outline" size="sm" onClick={async () => {
                          setShowAddField(true);
                          const colData = await supabase.rpc('list_available_columns', { p_table: table });
                          if (!colData.error && colData.data) {
                            setAvailableColumns(colData.data as { column_name: string; data_type: string }[]);
                          }
                        }}>
                          <PlusCircle className="h-3 w-3 mr-1" />
                          Adicionar campo
                        </Button>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <Button size="sm" onClick={() => handleEditSave(row.id)} disabled={saving || schemaBusy}>
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

      {/* Parent link dialog */}
      <Dialog open={showParentDialog} onOpenChange={setShowParentDialog}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Vincular Tabela Pai</DialogTitle>
            <DialogDescription>
              Escolha uma tabela existente como pai de <strong>{displayLabel || label}</strong>.
              Itens desta tabela serão vinculados aos itens da tabela pai.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-1 max-h-60 overflow-y-auto">
            {parentLoading ? (
              <div className="flex justify-center py-4">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : potentialParents.length === 0 ? (
              <p className="text-sm text-muted-foreground py-2 text-center">
                Nenhuma tabela disponível para vínculo.
              </p>
            ) : (
              potentialParents.map((p) => (
                <button
                  key={p}
                  type="button"
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex items-center gap-2 ${
                    parentTable === p
                      ? 'bg-primary/10 text-primary font-medium'
                      : 'hover:bg-muted'
                  }`}
                  onClick={() => handleSetParent(p)}
                  disabled={parentLoading}
                >
                  {parentTable === p && <Check className="h-3.5 w-3.5 shrink-0" />}
                  <span className={parentTable === p ? '' : 'ml-5'}>{getParentLabel(p)}</span>
                </button>
              ))
            )}
          </div>

          {parentTable && (
            <DialogFooter className="flex items-center justify-between sm:justify-between">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleSetParent(null)}
                disabled={parentLoading}
              >
                <X className="h-3.5 w-3.5 mr-1" />
                Desvincular
              </Button>
              <Button variant="default" size="sm" onClick={() => setShowParentDialog(false)}>
                Fechar
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
