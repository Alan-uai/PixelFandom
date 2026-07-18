'use client';

import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { inferPrimaryColumns } from '@/lib/game-schema';
import { supabase } from '@/supabase';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { FloatingLabelInput } from '@/components/ui/floating-label-input';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { ImageUpload } from '@/components/ui/image-upload';
import { ImagePicker } from '@/components/ui/image-picker';
import { CollapsibleSection } from '@/components/ui/collapsible-section';
import { IconPicker, IconPickerTrigger } from '@/components/ui/icon-picker';
import { IconRenderer } from '@/components/ui/icon-renderer';
import { LabelIconBox, LabelColorCircle, ValueColorLine, InputGlow } from '@/components/ui/column-icon-color';
import { getDefaultColumnColor } from '@/lib/column-types/registry';
import { cacheSubscribe, notifyItemsChange } from '@/lib/data-access';
import { Switch } from '@/components/ui/switch';
import { DateTimePicker3D } from '@/components/ui/date-time-picker-3d';

import {
  Loader2,
  Plus,
  Edit,
  Trash2,
  Save,
  Search,
  X,
  Minus,
  Check,
  PlusCircle,
  ImageIcon,
  Link2,
  Layers,
  Unlink,
} from 'lucide-react';
import { FieldTypeSelect3D } from '@/components/ui/field-type-select-3d';
import { VerticalTypeCarousel } from '@/components/ui/vertical-type-carousel';
import { parseViewerConfig } from '@/lib/viewer-config';
import { translateGameTerm } from '@/lib/translate';
import { suggestJsonFormat } from '@/lib/json-format-suggestion';
import { sanitizeUrl } from '@/lib/content-utils';
import { slugifyItemName, generateUniqueItemSlug } from '@/lib/item-slug';

function slugifyName(text: string): string {
  return slugifyItemName(text);
}
import { FIELD_TYPE_NAMES, getTypeDef, getCategoryForType, getDbType } from '@/lib/column-types/registry';
import { ColumnEditor } from '@/lib/column-types/editor-factory';
import { validateColumnValue, sanitizeColumnValue } from '@/lib/column-types/schemas';
import { updateViewerConfigField } from '@/lib/viewer-config-utils';
import FormatVariantRenderer from '@/components/wiki/format-variant-renderer';
import { getDefaultFormat } from '@/lib/column-types/format-compatibility';
import { useItemVariants } from '@/hooks/use-item-variants';

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

async function persistColumnForAll(
  columnName: string,
  dataType: string,
  slug: string,
  table: string,
  tenantId: string,
): Promise<boolean> {
  const imageLike = ['image', 'icon', 'cover', 'logo', 'banner', 'photo', 'img', 'avatar', 'thumbnail'];
  const isImage = imageLike.some((kw) => columnName.includes(kw));
  const renderType = isImage ? 'image' : dataType === 'boolean' ? 'text' : 'text';

  const result = await updateViewerConfigField({ tenantId, table, slug }, (config) => {
    const next = { ...config };
    const uploadCols = next.uploadColumns || [];
    if (isImage && !uploadCols.includes(columnName)) {
      next.uploadColumns = [...uploadCols, columnName];
    }
    const existingTypes = next.columnTypes || {};
    if (!existingTypes[columnName]) {
      existingTypes[columnName] = renderType;
      next.columnTypes = existingTypes;
    }
    return next;
  });
  return result !== null;
}

import { SYSTEM_COLS } from '@/lib/categorizable-columns';

const systemColumns = [...SYSTEM_COLS];
const newFormDefaultFields = ['name'];
const imageColumnNames = ['image_url', 'image', 'cover_url', 'logo_url'];
const iconColumnNames = ['icon_url', 'icon_id', 'icon'];
const newFieldTypes = FIELD_TYPE_NAMES;
const dateColumnNames = ['verified_date', 'expired_date', 'release_date', 'event_date'];
const systemDateColumns = ['created_at', 'updated_at'];

interface Row {
  [key: string]: unknown;
  id: string;
}

interface ColumnConfigEntry {
  maxValue?: number;
  displayName?: string;
  labelIcon?: string;
  labelColor?: string;
  jsonbKeyTypes?: Record<string, { type: string; suffix?: string }>;
  valueColors?: Record<string, string>;
  allowedValues?: Array<Record<string, unknown>>;
  maxSelect?: number;
  restrictToValues?: boolean;
  dependentField?: string;
}

export default function DataTableContent({
  slug,
  table,
  displayLabel,
  parentTable,
  onRename,
  onDelete,
  onRecover,
}: {
  slug: string;
  table: string;
  displayLabel?: string;
  parentTable?: string | null;
  onRename?: () => void;
  onDelete?: () => void;
  onRecover?: (newTableName: string) => void;
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
  const [savedFeedback, setSavedFeedback] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [tableNotFoundError, setTableNotFoundError] = useState(false);
  const [availableDbTables, setAvailableDbTables] = useState<{ table_name: string; schema: string }[]>([]);
  const [recovering, setRecovering] = useState(false);
  const [showAddField, setShowAddField] = useState(false);
  const [newFieldName, setNewFieldName] = useState('');
  const [newFieldNameError, setNewFieldNameError] = useState<string | null>(null);
  const [newFieldType, setNewFieldType] = useState('text');
  const [schemaBusy, setSchemaBusy] = useState(false);
  const [tableColumns, setTableColumns] = useState<{ column_name: string; data_type: string; is_nullable: boolean }[] | null>(null);
  const [availableColumns, setAvailableColumns] = useState<{ column_name: string; data_type: string }[]>([]);
  const [uploadColumns, setUploadColumns] = useState<Set<string>>(new Set());
  const [columnRenderTypes, setColumnRenderTypes] = useState<Record<string, string>>({});
  const [columnConfigMap, setColumnConfigMap] = useState<Record<string, ColumnConfigEntry>>({});

  const handleColumnConfigChange = useCallback((col: string, cfg: Record<string, unknown>) => {
    setColumnConfigMap((prev) => ({
      ...prev,
      [col]: { ...(prev[col] || {}), ...cfg },
    }));
  }, []);

  const [editFieldCol, setEditFieldCol] = useState<string | null>(null);
  const [editFieldName, setEditFieldName] = useState('');
  const [editFieldType, setEditFieldType] = useState<string>('text');
  const [editFieldSlug, setEditFieldSlug] = useState<string | null>(null);
  const [editFieldConflict, setEditFieldConflict] = useState<string | null>(null);
  const [editFieldChecking, setEditFieldChecking] = useState(false);
  const editFieldTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!editFieldCol) return;
    if (editFieldTimerRef.current) clearTimeout(editFieldTimerRef.current);
    const raw = editFieldName.trim();
    if (!raw) { setEditFieldSlug(null); setEditFieldConflict(null); setEditFieldChecking(false); return; }
    setEditFieldChecking(true);
    editFieldTimerRef.current = setTimeout(async () => {
      const { slug } = await translateGameTerm(raw);
      setEditFieldSlug(slug);
      if (slug === editFieldCol) {
        setEditFieldConflict(null);
      } else {
        const exists = availableColumns.find((c) => c.column_name === slug);
        if (exists) {
          setEditFieldConflict(`Já existe um campo com o identificador "${slug}".`);
        } else {
          setEditFieldConflict(null);
        }
      }
      setEditFieldChecking(false);
    }, 300);
    return () => { if (editFieldTimerRef.current) clearTimeout(editFieldTimerRef.current); };
  }, [editFieldName, editFieldCol, availableColumns]);

  const handleEditFieldDisplayName = async () => {
    const rawName = editFieldName.trim();
    const col = editFieldCol;
    const newType = editFieldType;
    if (!rawName || !col || !tenantId || editFieldConflict) return;
    setSchemaBusy(true);

    const oldRenderType = columnRenderTypes[col];
    const oldDbType = getDbType(oldRenderType);
    const newDbType = getDbType(newType);

    if (oldDbType !== newDbType) {
      const { data, error } = await supabase.rpc('alter_column_type', {
        p_table: table,
        p_column: col,
        p_type: newDbType,
        p_tenant_id: tenantId,
      });
      if (error || !(data as { ok: boolean })?.ok) {
        const msg = (data as { error?: string })?.error || error?.message || 'Erro ao alterar tipo no banco';
        toast({ variant: 'destructive', title: 'Erro', description: msg });
        setSchemaBusy(false);
        return;
      }
    }

    setColumnConfigMap((prev) => ({
      ...prev,
      [col]: { ...(prev[col] || {}), displayName: rawName },
    }));

    if (newType !== oldRenderType) {
      setColumnRenderTypes((prev) => ({ ...prev, [col]: newType }));
    }

    await updateViewerConfigField({ tenantId, table, slug }, (config) => {
      const next: Record<string, unknown> = { ...config };
      const prevColCfg = ((next.columnConfig as Record<string, unknown>) || {})[col];
      next.columnConfig = { ...((next.columnConfig as Record<string, unknown>) || {}), [col]: { ...(prevColCfg as Record<string, unknown> || {}), displayName: rawName } };
      const existingTypes = (next.columnTypes as Record<string, string>) || {};
      next.columnTypes = { ...existingTypes, [col]: newType };
      return next;
    });

    toast({ title: `Campo "${rawName}" atualizado.` });
    setEditFieldCol(null);
    setEditFieldName('');
    setEditFieldType('text');
    setSchemaBusy(false);
  };

  const handleOpenEditFieldDialog = (col: string) => {
    setEditFieldCol(col);
    setEditFieldName(columnConfigMap[col]?.displayName || col.replace(/_/g, ' '));
    setEditFieldType(columnRenderTypes[col] || getTypeDef(col)?.id || 'text');
    setEditFieldSlug(null);
    setEditFieldConflict(null);
    setEditFieldChecking(false);
  };

  const [newFieldSubType, setNewFieldSubType] = useState('image');
  const [newFieldMaxValue, setNewFieldMaxValue] = useState('100');
  const [showParentDialog, setShowParentDialog] = useState(false);
  const [potentialParents, setPotentialParents] = useState<string[]>([]);
  const [parentLoading, setParentLoading] = useState(false);
  const [removedFields, setRemovedFields] = useState<Set<string>>(new Set());
  const [rowHiddenFields, setRowHiddenFields] = useState<Record<string, string[]>>({});
  const [iconPickerState, setIconPickerState] = useState<{
    col: string;
    value: string;
    onChange: (key: string, val: string) => void;
  } | null>(null);


  const handleRemoveField = (key: string, formSetter: (fn: (prev: Record<string, string>) => Record<string, string>) => void) => {
    formSetter((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
    setRemovedFields((prev) => new Set(prev).add(key));
  };

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

  const label = tableLabels[table] || table;
  const primary = useMemo(() => {
    if (!tableColumns) return [];
    return inferPrimaryColumns(tableColumns);
  }, [tableColumns]);

  const filteredRows = useMemo(() => {
    if (!searchQuery.trim()) return rows;
    const q = searchQuery.toLowerCase();
    return rows.filter((row) =>
      Object.values(row).some(
        (val) => val != null && String(val).toLowerCase().includes(q)
      )
    );
  }, [rows, searchQuery]);

  const fetchColumns = useCallback(async (retries = 3, delay = 500) => {
    if (!tenantId) return;
    for (let attempt = 0; attempt < retries; attempt++) {
      const [colResult, configResult] = await Promise.all([
        supabase.rpc('get_table_columns', { p_table: table }),
        supabase.from('tenant_game_tables').select('viewer_config').eq('tenant_id', tenantId).eq('table_name', table).maybeSingle(),
      ]);

      if (configResult.data?.viewer_config) {
        const parsed = parseViewerConfig(configResult.data.viewer_config);
        if (parsed.uploadColumns?.length) {
          setUploadColumns(new Set(parsed.uploadColumns));
        }
        if (parsed.columnTypes) {
          setColumnRenderTypes(parsed.columnTypes);
        }
        if (parsed.columnConfig) {
          setColumnConfigMap(parsed.columnConfig);
        }
        if (parsed.rowHiddenFields) {
          setRowHiddenFields(parsed.rowHiddenFields);
        }
      }

      if (!colResult.error && colResult.data) {
        const result = colResult.data as { ok: boolean; columns: { column_name: string; data_type: string; is_nullable: boolean }[] };
        if (result.ok) {
          setTableNotFoundError(false);
          setTableColumns(result.columns);
          return;
        }
      }

      // Table not found in PostgREST schema cache — retry with backoff
      if (colResult.error?.message?.includes('Could not find the table')) {
        if (attempt < retries - 1) {
          await new Promise((r) => setTimeout(r, delay * (attempt + 1)));
          continue;
        }
        setTableNotFoundError(true);
        toast({ variant: 'destructive', title: 'Erro', description: `Tabela "${table}" não encontrada no banco.` });
        return;
      }
      break;
    }
  }, [table, tenantId, toast]);

  const fetchAvailableColumns = useCallback(async () => {
    const colData = await supabase.rpc('list_available_columns', { p_table: table });
    if (!colData.error && colData.data) {
      setAvailableColumns(colData.data as { column_name: string; data_type: string }[]);
    }
  }, [table]);

  const fetchRows = useCallback(async (retries = 3, delay = 500) => {
    if (!tenantId) return;
    setFetchError(null);
    for (let attempt = 0; attempt < retries; attempt++) {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .eq('tenant_id', tenantId)
        .order('updated_at', { ascending: false });
      if (!error && data) {
        setRows(data as Row[]);
        setLoading(false);
        return;
      }
      if (error?.message?.includes('Could not find the table')) {
        if (attempt < retries - 1) {
          await new Promise((r) => setTimeout(r, delay * (attempt + 1)));
          continue;
        }
      }
      setFetchError(error?.message ?? 'Erro desconhecido');
      toast({ variant: 'destructive', title: 'Erro ao carregar', description: error?.message });
      break;
    }
    setLoading(false);
  }, [table, tenantId, toast]);

  useEffect(() => {
    setRows([]);
    setTableColumns(null);
    setLoading(true);
    setFetchError(null);
    setEditingId(null);
    setShowNewForm(false);

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
    }
  }, [tenantId, fetchRows, fetchColumns]);

  // Realtime: re-fetch columns when cache notifies a schema change
  useEffect(() => {
    const unsub = cacheSubscribe(`columns:${table}`, () => {
      fetchColumns();
    });
    return unsub;
  }, [table, fetchColumns]);

  // Realtime: listen to DB changes on this table
  useEffect(() => {
    if (!tenantId) return;
    const channel = supabase
      .channel(`public:${table}:changes`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table, filter: `tenant_id=eq.${tenantId}` },
        () => { fetchRows(); },
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [tenantId, table, fetchRows]);

  useEffect(() => {
    if (!newFieldName.trim()) { setNewFieldNameError(null); return; }
    const slug = newFieldName.trim().toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
    const existing = availableColumns.find((c) => c.column_name === slug);
    if (existing || tableColumns?.some((c) => c.column_name === slug)) {
      setNewFieldNameError('Já existe um campo com esse nome.');
    } else {
      setNewFieldNameError(null);
    }
  }, [newFieldName, availableColumns, tableColumns]);

  function isSystemColumn(col: string) {
    return systemColumns.includes(col) || col.startsWith('embedding');
  }
  function isMediaColumn(col: string) {
    return (
      imageColumnNames.includes(col) ||
      iconColumnNames.includes(col) ||
      uploadColumns.has(col) ||
      ['image', 'file', 'video', 'audio', 'icon'].includes(getColumnRenderType(col) || '')
    );
  }

  function isImageColumn(col: string) { return imageColumnNames.includes(col); }
  function isIconColumn(col: string) { return iconColumnNames.includes(col); }
  function isEditableColumn(col: string) { return !isSystemColumn(col) && col !== 'id'; }

  function getColumnRenderType(col: string): string | undefined {
    if (columnRenderTypes[col]) return columnRenderTypes[col];
    if (imageColumnNames.includes(col)) return 'image';
    if (iconColumnNames.includes(col)) return 'icon';
    if (uploadColumns.has(col)) return 'image';
    return undefined;
  }

  function getColumnDataType(col: string, columns: { column_name: string; data_type: string }[] | null): string | undefined {
    return columns?.find((c) => c.column_name === col)?.data_type;
  }

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
    const hiddenForRow = rowHiddenFields[row.id as string] || [];
    Object.entries(row).forEach(([key, val]) => {
      if (!isSystemColumn(key) && val != null && val !== '') {
        form[key] = typeof val === 'object' ? JSON.stringify(val) : String(val);
      }
    });
    if (tableColumns) {
      tableColumns.forEach((col) => {
        if (!isSystemColumn(col.column_name) && !(col.column_name in form) && !hiddenForRow.includes(col.column_name)) {
          form[col.column_name] = '';
        }
      });
    }
    setEditForm(form);
    fetchAvailableColumns();
  };

  const currentFormKeys = showNewForm ? [...newFormDefaultFields, ...Object.keys(newForm)] : editingId ? Object.keys(editForm) : [];
  const unusedColumns = availableColumns.filter(
    (c) => !currentFormKeys.includes(c.column_name) && !isSystemColumn(c.column_name),
  );

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({});
    setRemovedFields(new Set());
  };

  const sanitizeFieldValue = (key: string, val: string): string => {
    const trimmed = val.trim();
    const renderType = getColumnRenderType(key);
    if (renderType) {
      return sanitizeColumnValue(renderType, trimmed);
    }
    if (/url|src|link|href|image|icon/i.test(key)) {
      return sanitizeUrl(trimmed);
    }
    return trimmed;
  };

  const handleEditSave = async (rowId: string) => {
    setSaving(true);
    const payload: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(editForm)) {
      const rt = getColumnRenderType(key);
      if (rt) {
        const validation = validateColumnValue(rt, val);
        if (!validation.ok) {
          toast({ variant: 'destructive', title: `Erro em "${key}"`, description: validation.error });
          setSaving(false);
          return;
        }
      }
    }
    Object.entries(editForm).forEach(([key, val]) => {
      const original = rows.find((r) => r.id === rowId)?.[key];
      if (original !== null && original !== undefined && typeof original === 'object') {
        try { payload[key] = JSON.parse(val); } catch { payload[key] = sanitizeFieldValue(key, val); }
      } else if (typeof original === 'boolean') {
        payload[key] = val === 'true';
      } else if (typeof original === 'number') {
        payload[key] = val === '' ? null : Number(val);
      } else if (typeof original === 'string' || original === null || original === undefined) {
        payload[key] = val === '' ? null : sanitizeFieldValue(key, val);
      } else {
        payload[key] = sanitizeFieldValue(key, val);
      }
    });

    // Set removed fields to null so they clear from DB
    for (const col of removedFields) {
      payload[col] = null;
    }

    if ('name' in payload) {
      const nameVal = (payload['name'] as string | null)?.toString().trim();
      const baseSlug = nameVal ? slugifyName(nameVal) : '';
      payload['slug'] = baseSlug && tenantId ? await generateUniqueItemSlug(table, tenantId, baseSlug, rowId) : (baseSlug || null);
    }

    const { error } = await supabase.from(table).update(payload).eq('id', rowId);
    if (error) {
      toast({ variant: 'destructive', title: 'Erro', description: error.message });
    } else {
      if (tenantId) {
        const localForRow = rowHiddenFields[rowId] || [];
        const finalForRow = [...new Set([...localForRow, ...removedFields])];
        const result = await updateViewerConfigField({ tenantId, table, slug }, (config) => {
          const next: Record<string, unknown> = { ...config };
          if (finalForRow.length > 0) {
            next.rowHiddenFields = { ...((next.rowHiddenFields as Record<string, string[]>) || {}), [rowId]: finalForRow };
          }
          next.columnTypes = { ...((next.columnTypes as Record<string, string>) || {}), ...columnRenderTypes };
          next.columnConfig = { ...((next.columnConfig as Record<string, unknown>) || {}), ...columnConfigMap };
          return next;
        });
        if (result?.rowHiddenFields) {
          setRowHiddenFields(result.rowHiddenFields as Record<string, string[]>);
        }
      }
      setSavedFeedback(true);
      setTimeout(() => setSavedFeedback(false), 2000);
      setEditingId(null);
      setRemovedFields(new Set());
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
      notifyItemsChange(slug, table);
      toast({ title: 'Registro excluído.' });
    }
  };

  const handleCreateVariant = async (row: Row) => {
    if (!tenantId) return;
    const baseName = ((row['name'] as string) || '').replace(/\s+v\d+$/i, '').trim() || 'item';
    const variantPattern = new RegExp(`^${baseName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s+v(\\d+)$`, 'i');
    let maxV = 1;
    for (const r of rows) {
      const m = String(r['name'] ?? '').match(variantPattern);
      if (m) {
        const v = parseInt(m[1], 10);
        if (v > maxV) maxV = v;
      }
    }
    const nextV = maxV + 1;
    const variantName = `${baseName} v${nextV}`;

    setSaving(true);
    const { data: newItem, error: insertError } = await supabase
      .from(table)
      .insert({ name: variantName, slug: await generateUniqueItemSlug(table, tenantId, slugifyName(variantName)), tenant_id: tenantId })
      .select('id')
      .single();
    if (insertError || !newItem) {
      toast({ variant: 'destructive', title: 'Erro', description: insertError?.message || 'Falha ao criar item.' });
      setSaving(false);
      return;
    }
    const { data: linkResult } = await supabase
      .rpc('link_item_variant', {
        p_table: table, p_item_id: row.id,
        p_target_item_id: newItem.id, p_tenant_id: tenantId,
        p_variant_label: variantName,
      });
    const linkOk = (linkResult as { ok?: boolean })?.ok;
    if (linkOk) {
      toast({ title: `Variante "${variantName}" criada!` });
      fetchRows();
    } else {
      const errMsg = (linkResult as { error?: string })?.error || 'Não foi possível vincular a variante.';
      toast({ variant: 'destructive', title: 'Erro', description: errMsg });
    }
    setSaving(false);
  };

  const handleNewSave = async () => {
    if (!tenantId) return;
    const nameVal = newForm['name']?.trim();
    if (!nameVal) {
      toast({ variant: 'destructive', title: 'Erro', description: 'O nome é obrigatório.' });
      return;
    }
    setSaving(true);
    for (const [key, val] of Object.entries(newForm)) {
      const rt = getColumnRenderType(key);
      if (rt) {
        const validation = validateColumnValue(rt, val);
        if (!validation.ok) {
          toast({ variant: 'destructive', title: `Erro em "${key}"`, description: validation.error });
          setSaving(false);
          return;
        }
      }
    }
    const payload: Record<string, unknown> = { tenant_id: tenantId };
    Object.entries(newForm).forEach(([key, val]) => {
      payload[key] = sanitizeFieldValue(key, val);
    });

    const slugVal = await generateUniqueItemSlug(table, tenantId, slugifyName(nameVal));
    if (slugVal) payload['slug'] = slugVal;

    const { error } = await supabase.from(table).insert(payload).select().single();
    if (error) {
      toast({ variant: 'destructive', title: 'Erro', description: error.message });
    } else {
      if (tenantId && Object.keys(columnConfigMap).length > 0) {
        await updateViewerConfigField({ tenantId, table, slug }, (config) => {
          const next: Record<string, unknown> = { ...config };
          next.columnConfig = { ...((next.columnConfig as Record<string, unknown>) || {}), ...columnConfigMap };
          return next;
        });
      }
      setShowNewForm(false);
      setNewForm({});
      setSavedFeedback(true);
      setTimeout(() => setSavedFeedback(false), 2000);
      fetchRows();
    }
    setSaving(false);
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
        toast({ title: `Coluna "${col}" removida.` });
        if (editingId) {
          setEditForm((prev) => {
            const next = { ...prev };
            delete next[col];
            return next;
          });
        }
        fetchColumns();
        fetchRows();
      } else {
        toast({ variant: 'destructive', title: 'Erro', description: result.error || 'Falha ao remover coluna.' });
      }
    }
    setSchemaBusy(false);
  };

  const handleFindTable = async () => {
    if (!tenantId) return;
    setRecovering(true);
    setAvailableDbTables([]);
    const { data, error } = await supabase.rpc('get_tenant_tables', { p_tenant_id: tenantId });
    if (error) {
      toast({ variant: 'destructive', title: 'Erro', description: error.message });
    } else if (data && (data as any).ok) {
      setAvailableDbTables((data as any).tables || []);
    } else {
      // Fallback: list from information_schema
      const { data: infoData } = await supabase
        .from('information_schema.tables' as any)
        .select('table_name' as any)
        .eq('table_schema', 'public')
        .neq('table_name', 'information_schema') as any;
      if (infoData) {
        setAvailableDbTables(infoData.map((r: any) => ({ table_name: r.table_name, schema: 'public' })));
      }
    }
    setRecovering(false);
  };

  const handleRecoverTable = async (newTableName: string) => {
    if (!tenantId || !slug) return;
    setRecovering(true);
    const { error } = await supabase
      .from('tenant_game_tables')
      .update({ table_name: newTableName, slug: newTableName })
      .eq('tenant_id', tenantId)
      .eq('slug', table);
    if (error) {
      toast({ variant: 'destructive', title: 'Erro', description: error.message });
    } else {
      toast({ title: `Tabela recuperada como "${newTableName}".` });
      setTableNotFoundError(false);
      setAvailableDbTables([]);
      // Switch to the new tab
      if (onRecover) onRecover(newTableName);
    }
    setRecovering(false);
  };

  const handleAddColumn = async (applyToAll = false) => {
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

    const renderType = newFieldType;
    const typeDef = getTypeDef(renderType);
    const dbType = typeDef ? typeDef.dbType : 'text';
    const isMedia = getCategoryForType(renderType) === 'media';

    const { data, error } = await supabase.rpc('add_game_column', {
      p_table: table,
      p_column: colSlug,
      p_type: dbType,
      p_tenant_id: tenantId,
    });
    if (error) {
      toast({ variant: 'destructive', title: 'Erro', description: error.message });
    } else {
      const result = data as { ok: boolean; error?: string };
      if (result.ok) {
        setColumnRenderTypes((prev) => ({ ...prev, [colSlug]: renderType }));

        if (isMedia) {
          setUploadColumns((prev) => new Set(prev).add(colSlug));
        }
        const displayName = rawName;
        if (renderType === 'slider' || renderType === 'rating') {
          const defaultMax = renderType === 'slider' ? 100 : 5;
          const maxVal = parseInt(newFieldMaxValue) || defaultMax;
          setColumnConfigMap((prev) => ({ ...prev, [colSlug]: { maxValue: maxVal, displayName } }));
        } else {
          setColumnConfigMap((prev) => ({ ...prev, [colSlug]: { displayName } }));
        }

        await updateViewerConfigField({ tenantId, table, slug }, (config) => {
          const next: Record<string, unknown> = { ...config };
          next.columnTypes = { ...(next.columnTypes as Record<string, string> || {}), [colSlug]: renderType };
          if (isMedia) {
            const uploadCols = (next.uploadColumns as string[]) || [];
            if (!uploadCols.includes(colSlug)) {
              next.uploadColumns = [...uploadCols, colSlug];
            }
          }
          const colCfgBase: Record<string, unknown> = { displayName: rawName };
          if (renderType === 'slider' || renderType === 'rating') {
            const defaultMax = renderType === 'slider' ? 100 : 5;
            colCfgBase.maxValue = parseInt(newFieldMaxValue) || defaultMax;
          }
          next.columnConfig = { ...(next.columnConfig as Record<string, unknown> || {}), [colSlug]: colCfgBase };
          if (applyToAll) {
            const card = (next.card as Record<string, unknown>) || {};
            const visibleCols = (card.visibleColumns as string[]) || [];
            if (!visibleCols.includes(colSlug)) {
              card.visibleColumns = [...visibleCols, colSlug];
            }
            next.card = card;
          }
          return next;
        });
        fetchColumns();
        fetchRows();

        toast({ title: `Campo "${colSlug}" criado!` });
        setShowAddField(false);
        setNewFieldName('');
        if (showNewForm) {
          setNewForm((prev) => ({ ...prev, [colSlug]: '' }));
        }
        if (editingId) {
          setEditForm((prev) => ({ ...prev, [colSlug]: '' }));
        }
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

    const renderType = getColumnRenderType(col);
    const dataType = getColumnDataType(col, tableColumns);
    const colConfig = columnConfigMap[col];

    if (renderType) {
      return (
        <ColumnEditor
          value={value}
          onChange={(v) => onChange(col, v)}
          column={col}
          renderType={renderType}
          tenantId={tenantId ?? undefined}
          slug={slug}
          table={table}
          rowId={rowId}
          maxValue={colConfig?.maxValue}
          columnConfig={colConfig as Record<string, unknown>}
          onColumnConfigChange={(cfg) => handleColumnConfigChange(col, cfg)}
          allColumnConfigs={columnConfigMap as Record<string, Record<string, unknown>>}
          allValues={{}}
          onFieldChange={onChange}
        />
      );
    }

    if (isImageColumn(col)) {
      return (
        <ImagePicker
          bucket="game-items"
          pathPrefix={`${slug}/${table}/${rowId || 'new'}`}
          value={value}
          onChange={(url) => onChange(col, url)}
          label="Imagem"
          previewSize="w-16 h-16"
          tenantId={tenantId ?? undefined}
        />
      );
    }

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
              tenantId={tenantId ?? undefined}
            />
          ) : null}
          <IconPickerTrigger
            value={value?.includes(':') ? value : ''}
            onChange={(iconId) => onChange(col, iconId)}
          />
        </div>
      );
    }

    if (uploadColumns.has(col)) {
      return (
        <ImagePicker
          bucket="game-items"
          pathPrefix={`${slug}/${table}/${rowId || 'new'}`}
          value={value}
          onChange={(url) => onChange(col, url)}
          label="Upload"
          tenantId={tenantId ?? undefined}
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
      return (
        <DateTimePicker3D
          mode="date"
          value={value}
          onChange={(v) => onChange(col, v)}
        />
      );
    }

    if (isTimeColumn(col, dataType)) {
      return (
        <DateTimePicker3D
          mode="time"
          value={value}
          onChange={(v) => onChange(col, v)}
          className="h-8 text-sm"
        />
      );
    }

    const isLongText = col.includes('description') || col.includes('notes') || col.includes('strategy') || col.includes('tips') || col === 'content' || col.endsWith('_details') || col === 'effect';
    const isJson = ['craft_materials', 'set_bonus', 'key_buffs', 'possible_stats', 'attacks', 'effects', 'items_dropped', 'notable_loot', 'chapters', 'difficulties', 'rewards', 'crafting_materials'].includes(col);

    if (isJson || isLongText) {
      const colLabel = columnConfigMap[col]?.displayName || col;
      const jsonHint = isJson ? suggestJsonFormat(colLabel) : null;
      return (
        <textarea
          value={value}
          onChange={(e) => onChange(col, e.target.value)}
          rows={isJson ? 4 : 3}
          placeholder={jsonHint ? jsonHint.example : undefined}
          className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 font-mono text-xs placeholder:text-muted-foreground/40"
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

  const handleOpenIconPicker = (
    col: string,
    currentValue: string,
    onChange: (key: string, val: string) => void,
  ) => {
    setIconPickerState({ col, value: currentValue, onChange });
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
    <div key={col} className="space-y-1 relative">
      <div className="flex items-center justify-between">
        <Label className="text-xs text-muted-foreground capitalize flex items-center gap-1">
          {isImageColumn(col) && <ImageIcon className="h-3 w-3" />}
          {!isSystemColumn(col) && !isMediaColumn(col) && (
            <LabelIconBox
              icon={columnConfigMap[col]?.labelIcon}
              onChange={(iconId) =>
                handleColumnConfigChange(col, { labelIcon: iconId })
              }
              className="h-4 w-4 rounded"
            />
          )}
          <span style={columnConfigMap[col]?.labelColor ? { color: columnConfigMap[col]!.labelColor } : undefined}>
            {columnConfigMap[col]?.displayName || col.replace(/_/g, ' ')}
          </span>
          {!isSystemColumn(col) && !isMediaColumn(col) && (
            <LabelColorCircle
              color={columnConfigMap[col]?.labelColor}
              onChange={(c) => handleColumnConfigChange(col, { labelColor: c })}
            />
          )}
        </Label>
      </div>
      <div className="absolute -top-0.5 -right-0.5 z-20 flex items-center gap-0.5">
        {!isSystemColumn(col) && (
          <>
            {isIconColumn(col) ? (
              <button
                type="button"
                onClick={() => handleOpenIconPicker(col, value, onChange)}
                className="flex items-center justify-center h-5 w-5 rounded-full border-2 bg-background text-muted-foreground hover:text-foreground transition-colors shadow-sm inset-shadow"
                title="Selecionar ícone"
              >
                <ImageIcon className="h-3 w-3" />
              </button>
            ) : null}
            <button
              type="button"
              onClick={() => handleOpenEditFieldDialog(col)}
              className="flex items-center justify-center h-5 w-5 rounded-full border-2 bg-background text-muted-foreground hover:text-foreground transition-colors shadow-sm inset-shadow"
              title="Editar nome do campo"
            >
              <Edit className="h-3 w-3" />
            </button>
            <button
              type="button"
              onClick={() => value ? handleClearField(col, formSetter) : handleRemoveField(col, formSetter)}
              className="flex items-center justify-center h-5 w-5 rounded-full border-2 bg-background text-muted-foreground hover:text-foreground transition-colors shadow-sm inset-shadow"
              title={value ? "Limpar valor" : "Remover campo"}
            >
              {value ? <X className="h-3 w-3" /> : <Minus className="h-3 w-3" />}
            </button>
            <button
              type="button"
              onClick={() => handleDropColumn(col)}
              className="flex items-center justify-center h-5 w-5 rounded-full border-2 bg-background text-destructive/60 hover:text-destructive transition-colors shadow-sm inset-shadow"
              title="Remover coluna"
            >
              <Trash2 className="h-3 w-3" />
            </button>
          </>
        )}
      </div>
      <div className="flex items-start gap-2">
        {!isSystemColumn(col) && !isMediaColumn(col) && (
          <ValueColorLine
            color={
              (columnConfigMap[col]?.valueColors as Record<string, string> | undefined)?.[value] ||
              columnConfigMap[col]?.labelColor ||
              getDefaultColumnColor(getColumnRenderType(col) || editFieldType)
            }
            onChange={(c) => {
              const vc = { ...(columnConfigMap[col]?.valueColors as Record<string, string> | undefined) };
              if (c === undefined) delete vc[value];
              else vc[value] = c;
              handleColumnConfigChange(col, { valueColors: vc });
            }}
          />
        )}
        <InputGlow
          color={
            (columnConfigMap[col]?.valueColors as Record<string, string> | undefined)?.[value] ||
            columnConfigMap[col]?.labelColor ||
            getDefaultColumnColor(getColumnRenderType(col) || editFieldType)
          }
        >
          {renderField(col, value, onChange, isBool, rowId)}
        </InputGlow>
      </div>
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
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-xl font-bold truncate">{displayLabel || label}</h1>
        <div className="flex items-center gap-1 shrink-0">
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
          <Button size="sm" onClick={() => { setShowNewForm(true); fetchAvailableColumns(); }} disabled={showNewForm}>
            <Plus className="h-4 w-4 mr-1" /> Adicionar
          </Button>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <Input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Buscar em todos os campos..."
          className="pl-8 h-9 text-sm"
        />
      </div>

      {tableNotFoundError ? (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 space-y-4">
          <h2 className="text-lg font-semibold text-destructive">Tabela não encontrada</h2>
          <p className="text-sm text-muted-foreground">
            A tabela <strong className="text-foreground">{table}</strong> não existe mais no banco de dados.
            Pode ter sido renomeada ou excluída fora do site.
          </p>
          <div className="space-y-3">
            <Button variant="outline" size="sm" onClick={handleFindTable} disabled={recovering}>
              {recovering ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
              Buscar tabelas disponíveis
            </Button>
            {availableDbTables.length > 0 && (
              <div>
                <p className="text-xs text-muted-foreground mb-2">
                  Tabelas encontradas no banco:
                </p>
                <div className="flex flex-wrap gap-2">
                  {availableDbTables.map((tbl) => (
                    <button
                      key={tbl.table_name}
                      type="button"
                      className="px-3 py-1.5 rounded text-xs bg-secondary/50 hover:bg-secondary transition-colors font-mono cursor-pointer"
                      onClick={() => handleRecoverTable(tbl.table_name)}
                    >
                      {tbl.table_name}
                      <span className="text-muted-foreground ml-1">({tbl.schema})</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      ) : null}

      {savedFeedback && (
        <div className="flex items-center gap-2 text-sm text-green-500 font-medium">
          <Check className="h-4 w-4" />
          Alterações salvas!
        </div>
      )}

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
            {newFormDefaultFields
              .filter((col) => !removedFields.has(col) && tableColumns?.some((c) => c.column_name === col))
              .map((col) =>
                renderFieldItem(col, newForm[col] || '', newForm, setNewForm, (key, val) => setNewForm((prev) => ({ ...prev, [key]: val })), false, undefined)
              )}
            {Object.keys(newForm)
              .filter((col) => !newFormDefaultFields.includes(col) && !removedFields.has(col))
              .map((col) =>
                renderFieldItem(col, newForm[col] || '', newForm, setNewForm, (key, val) => setNewForm((prev) => ({ ...prev, [key]: val })), false, undefined)
              )}
          </div>

          {unusedColumns.length > 0 && (
            <div className="border rounded-md p-2 overflow-hidden">
              <span className="text-xs font-medium text-muted-foreground mb-1 block">
                Sugestões ({unusedColumns.length} disponíveis)
              </span>
              <div className="flex gap-2 overflow-x-auto pb-1 min-w-0">
                {unusedColumns.map((col) => (
                  <button
                    key={col.column_name}
                    type="button"
                    className="flex-shrink-0 px-2 py-1 rounded text-xs bg-secondary/50 hover:bg-secondary transition-colors font-mono cursor-pointer"
                    title="Clique: usar neste item apenas | Duplo clique: adicionar para todos os itens"
                    onClick={() => {
                      setNewForm((prev) => ({ ...prev, [col.column_name]: '' }));
                      setShowAddField(false);
                      setNewFieldName('');
                    }}
                    onDoubleClick={async () => {
                      setNewForm((prev) => ({ ...prev, [col.column_name]: '' }));
                      setShowAddField(false);
                      setNewFieldName('');
                      const ok = await persistColumnForAll(col.column_name, col.data_type, slug, table, tenantId!);
                      if (ok) {
                        toast({ title: `Campo "${col.column_name}" adicionado para todos os itens.` });
                        fetchColumns();
                      }
                    }}
                  >
                    {col.column_name}
                    <span className="text-muted-foreground ml-1">{col.data_type}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="border-t pt-3 mt-3">
            {showAddField ? (
              <div className="space-y-3">
                <div className="flex items-end gap-2">
                  <div className="flex-1 space-y-1">
                    {(() => {
                      const typeDef = getTypeDef(newFieldType);
                      if (typeDef?.nameMode === 'selector' && typeDef.nameOptions) {
                        return (
                          <VerticalTypeCarousel
                            options={typeDef.nameOptions}
                            value={newFieldSubType}
                            onChange={(opt) => {
                              if (!newFieldName.trim()) setNewFieldName(opt.defaultColumn);
                              setNewFieldSubType(opt.value);
                            }}
                          />
                        );
                      }
                      return (
                        <>
                          <FloatingLabelInput
                            label="Nome do campo"
                            value={newFieldName}
                            onChange={(e) => { setNewFieldName(e.target.value); }}
                            className={`text-sm ${newFieldNameError ? 'border-red-500' : ''}`}
                          />
                          {newFieldNameError && (
                            <p className="text-xs text-red-500 mt-1">{newFieldNameError}</p>
                          )}
                          {newFieldType === 'jsonb' && suggestJsonFormat(newFieldName) && (
                            <p className="text-[11px] text-primary/70 mt-1 font-mono whitespace-pre-line">
                              {suggestJsonFormat(newFieldName)!.hint}
                            </p>
                          )}
                        </>
                      );
                    })()}
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Tipo</Label>
                    <FieldTypeSelect3D
                      value={newFieldType}
                      onChange={(t) => {
                        setNewFieldType(t);
                        setNewFieldMaxValue(t === 'rating' ? '5' : '100');
                        const def = getTypeDef(t);
                        if (def?.nameMode === 'selector' && def.nameOptions?.[0]) {
                          if (!newFieldName.trim()) setNewFieldName(def.nameOptions[0].defaultColumn);
                          setNewFieldSubType(def.nameOptions[0].value);
                        } else if (def?.nameMode === 'selector') {
                          setNewFieldSubType('');
                        }
                        // NOTE: never clears newFieldName so the user does not
                        // have to retype the label after choosing the type.
                      }}
                      options={newFieldTypes}
                    />
                  </div>
                  {(newFieldType === 'slider' || newFieldType === 'rating') && (
                    <div className="w-20 space-y-1">
                      <Label className="text-xs text-muted-foreground">Valor máx</Label>
                      <input
                        type="number"
                        min={1}
                        value={newFieldMaxValue}
                        onChange={(e) => setNewFieldMaxValue(e.target.value)}
                        className="h-8 w-full rounded-lg border bg-background px-2 text-xs text-center focus:outline-none focus:ring-2 focus:ring-primary/50"
                      />
                    </div>
                  )}
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleAddColumn(false)}
                      disabled={schemaBusy || !!newFieldNameError}
                      title="Criar campo e usar apenas neste item"
                    >
                      {schemaBusy ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-3 w-3" />}
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleAddColumn(true)}
                      disabled={schemaBusy || !!newFieldNameError}
                      title="Criar campo e mostrar em todos os itens"
                    >
                      {schemaBusy ? <Loader2 className="h-3 w-3 animate-spin" /> : <PlusCircle className="h-3 w-3" />}
                    </Button>
                  </div>
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
            <Button size="sm" variant="outline" disabled title="Salve o item primeiro">
              <Layers className="h-4 w-4 mr-1" />
              +variante
            </Button>
            <Button size="sm" onClick={handleNewSave} disabled={saving || schemaBusy}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Save className="h-4 w-4 mr-1" />}
              Salvar
            </Button>
            <Button size="sm" variant="outline" onClick={() => { setShowNewForm(false); setNewForm({}); setRemovedFields(new Set()); }}>
              <X className="h-4 w-4 mr-1" />
              Cancelar
            </Button>
          </div>
        </div>
      )}

      {filteredRows.length === 0 && !showNewForm ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <p className="text-lg font-medium">{searchQuery ? 'Nenhum resultado encontrado' : 'Nenhum registro encontrado'}</p>
          <p className="text-sm text-muted-foreground mt-1">
            {searchQuery ? 'Tente ajustar sua busca.' : 'Adicione o primeiro registro para começar.'}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredRows.map((row) => {
            const isEditing = editingId === row.id;
            const rowTitle = (row['name'] as string) || primary.map((col) => {
              if (!(col in row)) return '';
              return getPrimaryValue(row, col);
            }).filter(Boolean).join(' ');

            const rowIconUrl = (row['icon_url'] || row['icon_id'] || row['icon'] || '') as string;
            const showIcon = rowIconUrl.includes(':');

            return (
              <CollapsibleSection
                key={row.id}
                id={row.id}
                title={rowTitle}
                titleIcon={showIcon ? <IconRenderer icon={rowIconUrl} size="sm" /> : undefined}
                open={isEditing || undefined}
                corner={
                  <div className="flex items-center gap-0.5">
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); handleCreateVariant(row); }}
                      className="flex items-center justify-center h-5 w-5 rounded-full border-2 bg-background text-muted-foreground hover:text-primary transition-colors shadow-sm inset-shadow text-[10px] font-bold leading-none"
                      title="Criar variante"
                    >
                      +V
                    </button>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); startEdit(row); }}
                      className="flex items-center justify-center h-5 w-5 rounded-full border-2 bg-background text-muted-foreground hover:text-foreground transition-colors shadow-sm inset-shadow"
                      title="Editar"
                    >
                      <Edit className="h-3 w-3" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); handleDelete(row.id); }}
                      className="flex items-center justify-center h-5 w-5 rounded-full border-2 bg-background text-destructive/60 hover:text-destructive transition-colors shadow-sm inset-shadow"
                      title="Excluir"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                }
              >
                {isEditing ? (
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {allColumns.filter((col) => isEditableColumn(col) && col in editForm && !removedFields.has(col)).map((col) => {
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

                    {unusedColumns.length > 0 && (
                      <div className="border rounded-md p-2 overflow-hidden">
                        <span className="text-xs font-medium text-muted-foreground mb-1 block">
                          Sugestões ({unusedColumns.length} disponíveis)
                        </span>
                        <div className="flex gap-2 overflow-x-auto pb-1 min-w-0">
                          {unusedColumns.map((col) => (
                            <button
                              key={col.column_name}
                              type="button"
                              className="flex-shrink-0 px-2 py-1 rounded text-xs bg-secondary/50 hover:bg-secondary transition-colors font-mono cursor-pointer"
                              title="Clique: usar neste item apenas | Duplo clique: adicionar para todos os itens"
                              onClick={() => {
                                setEditForm((prev) => ({ ...prev, [col.column_name]: '' }));
                                setRemovedFields((prev) => { const next = new Set(prev); next.delete(col.column_name); return next; });
                                setRowHiddenFields((prev) => {
                                  const hidden = prev[row.id] || [];
                                  return { ...prev, [row.id]: hidden.filter(f => f !== col.column_name) };
                                });
                                setShowAddField(false);
                                setNewFieldName('');
                              }}
                              onDoubleClick={async () => {
                                setEditForm((prev) => ({ ...prev, [col.column_name]: '' }));
                                setRemovedFields((prev) => { const next = new Set(prev); next.delete(col.column_name); return next; });
                                setRowHiddenFields((prev) => {
                                  const hidden = prev[row.id] || [];
                                  return { ...prev, [row.id]: hidden.filter(f => f !== col.column_name) };
                                });
                                setShowAddField(false);
                                setNewFieldName('');
                                if (tenantId) {
                                  const ok = await persistColumnForAll(col.column_name, col.data_type, slug, table, tenantId);
                                  if (ok) {
                                    toast({ title: `Campo "${col.column_name}" adicionado para todos os itens.` });
                                    fetchColumns();
                                  }
                                }
                              }}
                            >
                              {col.column_name}
                              <span className="text-muted-foreground ml-1">{col.data_type}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="border-t pt-3">
                      {showAddField ? (
                        <div className="space-y-3">
                          <div className="flex items-end gap-2">
                            <div className="space-y-1 flex-1">
                              <Label className="text-xs text-muted-foreground">Nome do campo</Label>
                              {(() => {
                                const typeDef = getTypeDef(newFieldType);
                                if (typeDef?.nameMode === 'selector' && typeDef.nameOptions) {
                                  return (
                                    <VerticalTypeCarousel
                                      options={typeDef.nameOptions}
                                      value={newFieldSubType}
                                      onChange={(opt) => {
                                        setNewFieldName(opt.defaultColumn);
                                        setNewFieldSubType(opt.value);
                                      }}
                                    />
                                  );
                                }
                                return (
                                  <>
                                    <Input
                                      value={newFieldName}
                                      onChange={(e) => setNewFieldName(e.target.value)}
                                      className={`h-8 text-sm ${newFieldNameError ? 'border-red-500' : ''}`}
                                    />
                                    {newFieldType === 'jsonb' && suggestJsonFormat(newFieldName) && (
                                      <p className="text-[11px] text-primary/70 mt-1 font-mono whitespace-pre-line">
                                        {suggestJsonFormat(newFieldName)!.hint}
                                      </p>
                                    )}
                                  </>
                                );
                              })()}
                              {newFieldNameError && (
                                <p className="text-xs text-red-500 mt-1">{newFieldNameError}</p>
                              )}
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs text-muted-foreground">Tipo</Label>
                              <FieldTypeSelect3D
                                value={newFieldType}
                                onChange={(t) => {
                                  setNewFieldType(t);
                                  setNewFieldMaxValue('100');
                                  const def = getTypeDef(t);
                                  if (def?.nameMode === 'selector' && def.nameOptions?.[0]) {
                                    if (!newFieldName.trim()) setNewFieldName(def.nameOptions[0].defaultColumn);
                                    setNewFieldSubType(def.nameOptions[0].value);
                                  } else if (def?.nameMode === 'selector') {
                                    setNewFieldSubType('');
                                  }
                                  // NOTE: never clears newFieldName so the user does not
                                  // have to retype the label after choosing the type.
                                }}
                                options={newFieldTypes}
                              />
                            </div>
                            {(newFieldType === 'slider' || newFieldType === 'rating') && (
                              <div className="w-20 space-y-1">
                                <Label className="text-xs text-muted-foreground">Máx</Label>
                                <input
                                  type="number"
                                  min={1}
                                  value={newFieldMaxValue}
                                  onChange={(e) => setNewFieldMaxValue(e.target.value)}
                                  className="h-8 w-full rounded-lg border bg-background px-2 text-xs text-center focus:outline-none focus:ring-2 focus:ring-primary/50"
                                />
                              </div>
                            )}
                            <div className="flex gap-1">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleAddColumn(false)}
                                disabled={schemaBusy || !!newFieldNameError}
                                title="Criar campo e usar apenas neste item"
                              >
                                {schemaBusy ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-3 w-3" />}
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => handleAddColumn(true)}
                                disabled={schemaBusy || !!newFieldNameError}
                                title="Criar campo e mostrar em todos os itens"
                              >
                                {schemaBusy ? <Loader2 className="h-3 w-3 animate-spin" /> : <PlusCircle className="h-3 w-3" />}
                              </Button>
                            </div>
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
                      <Button size="sm" variant="outline" onClick={async () => {
                        const editingRow = rows.find(r => r.id === editingId);
                        if (editingRow) await handleCreateVariant(editingRow);
                      }} disabled={saving}>
                        {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Layers className="h-4 w-4 mr-1" />}
                        +variante
                      </Button>
                      <Button size="sm" onClick={() => handleEditSave(row.id)} disabled={saving || schemaBusy}>
                        {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Save className="h-4 w-4 mr-1" />}
                        Salvar
                      </Button>
                      <Button size="sm" variant="outline" onClick={cancelEdit}>
                        <X className="h-4 w-4 mr-1" />
                        Cancelar
                      </Button>
                    </div>

                    {tenantId && editingId && (
                      <EditorVariantSection
                        tenantId={tenantId}
                        tableName={table}
                        currentItemId={editingId}
                      />
                    )}
                  </div>
                ) : detailColumns.length > 0 ? (
                  <div className="space-y-2">
                    {detailColumns.map((col) => {
                      const val = row[col];
                      if (val === null || val === undefined) return null;
                      const renderType = getColumnRenderType(col);
                      const fmt = getDefaultFormat(renderType);
                      const colDispName = columnConfigMap[col]?.displayName;
                      return (
                        <div key={col} className="flex items-center gap-2">
                          <span className="text-xs font-medium text-muted-foreground capitalize shrink-0 min-w-[80px] flex items-center gap-1">
                            {!isMediaColumn(col) && columnConfigMap[col]?.labelIcon && (
                              <IconRenderer icon={columnConfigMap[col]!.labelIcon!} size="sm" />
                            )}
                            <span style={!isMediaColumn(col) && columnConfigMap[col]?.labelColor ? { color: columnConfigMap[col]!.labelColor } : undefined}>
                              {colDispName || col.replace(/_/g, ' ')}
                            </span>
                          </span>
                          <FormatVariantRenderer
                            format={fmt}
                            variant={1}
                            value={val}
                            label={colDispName || col}
                            maxValue={columnConfigMap[col]?.maxValue}
                          />
                        </div>
                      );
                    })}
                  </div>
                ) : null}
              </CollapsibleSection>
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

      <Dialog open={editFieldCol !== null} onOpenChange={(open) => { if (!open) { setEditFieldCol(null); setEditFieldName(''); setEditFieldType('text'); setEditFieldSlug(null); setEditFieldConflict(null); setEditFieldChecking(false); } }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Editar campo</DialogTitle>
            <DialogDescription>
              Altere o nome de exibição e/ou o tipo do campo.
            </DialogDescription>
          </DialogHeader>
          <div className="py-2 space-y-3">
            <FloatingLabelInput
              label="Nome do campo"
              value={editFieldName}
              onChange={(e) => setEditFieldName(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !editFieldConflict && !editFieldChecking) handleEditFieldDisplayName(); }}
              error={editFieldConflict || undefined}
              autoFocus
            />
            {editFieldChecking && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Loader2 className="h-3 w-3 animate-spin" />
                Verificando slug...
              </div>
            )}
            {editFieldSlug && !editFieldChecking && !editFieldConflict && editFieldName.trim() && (
              <p className="text-xs text-muted-foreground">
                Slug: <code className="text-primary font-mono">{editFieldSlug}</code>
                {editFieldSlug === editFieldCol ? ' (inalterado)' : ' (será diferente do identificador interno atual)'}
              </p>
            )}
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Tipo</Label>
              <FieldTypeSelect3D
                value={editFieldType}
                onChange={setEditFieldType}
                options={newFieldTypes}
              />
            </div>
          </div>
          <DialogFooter className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => { setEditFieldCol(null); setEditFieldName(''); setEditFieldType('text'); setEditFieldSlug(null); setEditFieldConflict(null); setEditFieldChecking(false); }} disabled={schemaBusy}>
              Cancelar
            </Button>
            <Button size="sm" onClick={handleEditFieldDisplayName} disabled={schemaBusy || !!editFieldConflict || !editFieldName.trim()}>
              {schemaBusy ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {iconPickerState && (
        <IconPicker
          value={iconPickerState.value?.includes(':') ? iconPickerState.value.split(':')[0] : iconPickerState.value}
          onChange={(iconId) => {
            iconPickerState.onChange(iconPickerState.col, iconId);
            setIconPickerState(null);
          }}
          onClose={() => setIconPickerState(null)}
        />
      )}

    </div>
  );
}

function EditorVariantSection({
  tenantId,
  tableName,
  currentItemId,
}: {
  tenantId: string;
  tableName: string;
  currentItemId: string;
}) {
  const { toast } = useToast();
  const { variants, loading, linkVariant, unlinkVariant, detectVariants } = useItemVariants(
    tenantId, tableName, currentItemId,
  );
  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState<{ id: string; name: string }[]>([]);
  const [searching, setSearching] = useState(false);
  const [detecting, setDetecting] = useState(false);


  useEffect(() => {
    if (!search.trim()) { setSearchResults([]); return; }
    setSearching(true);
    const timer = setTimeout(async () => {
      const { data, error } = await supabase
        .from(tableName)
        .select('id, name')
        .eq('tenant_id', tenantId)
        .ilike('name', `%${search}%`)
        .limit(10);
      if (error) {
        console.error('Erro ao buscar variantes:', error);
        setSearchResults([]);
        setSearching(false);
        return;
      }
      setSearchResults((data || []).filter((r: any) => r.id !== currentItemId));
      setSearching(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [search, tableName, tenantId, currentItemId]);

  return (
    <div className="border-t pt-3 mt-3">
      <div className="flex items-center gap-2 mb-2">
        <Layers className="h-3.5 w-3.5 text-primary" />
        <span className="text-xs font-medium">Variantes</span>
        <button
          type="button"
          onClick={async () => {
            setDetecting(true);
            const result = await detectVariants();
            setDetecting(false);
            if (!result || result.ok === false) {
              toast({ variant: 'destructive', title: 'Erro', description: result?.error || 'Não foi possível detectar variantes.' });
            } else if (result.variants_created && result.variants_created > 0) {
              toast({ title: `${result.variants_created} variante(s) detectada(s)!` });
            } else {
              toast({ title: 'Nenhuma variante nova encontrada.' });
            }
          }}
          className="text-[10px] text-primary hover:text-primary/80 underline underline-offset-2 transition-colors ml-auto flex items-center gap-1"
          disabled={detecting}
        >
          {detecting ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
          Detectar automaticamente
        </button>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 py-2">
          <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
          <span className="text-xs text-muted-foreground">Carregando variantes...</span>
        </div>
      ) : variants.length > 0 ? (
        <div className="space-y-1 mb-3">
          {variants.map((v) => (
            <div key={v.id} className="flex items-center gap-2 rounded-md bg-muted/30 px-2 py-1.5 text-xs">
              <span className="flex-1">{v.variant_label}</span>
              {v.auto_detected && (
                <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full">auto</span>
              )}
              <button
                type="button"
                onClick={() => unlinkVariant(v.item_id)}
                className="text-destructive/60 hover:text-destructive transition-colors"
                title="Desvincular"
              >
                <Unlink className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-muted-foreground mb-2">
          Nenhuma variante vinculada.
        </p>
      )}

      <div className="flex items-center gap-2">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar item para vincular..."
          className="flex-1 h-7 rounded-md border bg-background px-2 text-xs outline-none focus:ring-2 focus:ring-primary/50"
        />
        {searching && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />}
      </div>

      {searchResults.length > 0 && (
        <div className="mt-1 rounded-md border bg-popover shadow-lg max-h-32 overflow-y-auto">
          {searchResults.map((r: any) => (
            <button
              key={r.id}
              type="button"
              onClick={async () => {
                const ok = await linkVariant(r.id);
                if (ok) {
                  toast({ title: 'Variante vinculada!' });
                  setSearch('');
                  setSearchResults([]);
                } else {
                  toast({ variant: 'destructive', title: 'Erro', description: 'Não foi possível vincular a variante.' });
                }
              }}
              className="w-full text-left px-2.5 py-1.5 text-xs hover:bg-muted transition-colors flex items-center gap-2"
            >
              <Plus className="h-3 w-3 text-primary shrink-0" />
              <span>{r.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
