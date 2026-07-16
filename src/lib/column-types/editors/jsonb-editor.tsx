'use client';
import { useState, useCallback, useMemo, useEffect } from 'react';
import { Code2 } from 'lucide-react';
import { SimpleObjectEditor } from './simple-object-editor';
import { ArrayOfObjectsEditor } from './array-of-objects-editor';

interface JsonbKeyEntry {
  type: 'number' | 'text' | 'boolean';
  suffix?: string;
}

export function JsonbEditor({
  value,
  onChange,
  columnConfig,
  onColumnConfigChange,
  table,
  slug,
  tenantId,
  columnName,
}: {
  value: string;
  onChange: (v: string) => void;
  columnConfig?: { maxValue?: number; jsonbKeyTypes?: Record<string, JsonbKeyEntry>; jsonbKeyColors?: Record<string, string> };
  onColumnConfigChange?: (cfg: { jsonbKeyTypes?: Record<string, JsonbKeyEntry>; jsonbKeyColors?: Record<string, string> }) => void;
  table?: string;
  slug?: string;
  tenantId?: string;
  columnName?: string;
}) {
  const [rawMode, setRawMode] = useState(false);
  const [listMode, setListMode] = useState(false);

  const parsed = useMemo(() => {
    if (!value) return { type: 'empty' as const, data: null };
    try {
      const p = JSON.parse(value);
      if (Array.isArray(p)) return { type: 'array' as const, data: p as Record<string, unknown>[] };
      if (typeof p === 'object' && p !== null) return { type: 'object' as const, data: p as Record<string, unknown> };
      return { type: 'scalar' as const, data: String(p) };
    } catch {
      return { type: 'invalid' as const, data: value };
    }
  }, [value]);

  const keyTypes = useMemo(() => columnConfig?.jsonbKeyTypes || {} as Record<string, JsonbKeyEntry>, [columnConfig?.jsonbKeyTypes]);
  const keyColors = useMemo(() => columnConfig?.jsonbKeyColors || {} as Record<string, string>, [columnConfig?.jsonbKeyColors]);

  const hasKeyTypes = Object.keys(keyTypes).length > 0;

  const handleKeyTypesChange = useCallback((types: Record<string, JsonbKeyEntry>) => {
    if (onColumnConfigChange) onColumnConfigChange({ jsonbKeyTypes: types, jsonbKeyColors: keyColors });
  }, [onColumnConfigChange, keyColors]);

  const handleKeyColorsChange = useCallback((colors: Record<string, string>) => {
    if (onColumnConfigChange) onColumnConfigChange({ jsonbKeyTypes: keyTypes, jsonbKeyColors: colors });
  }, [onColumnConfigChange, keyTypes]);

  /* Auto-detect keyTypes for old columns without persisted keyTypes */
  useEffect(() => {
    if (hasKeyTypes || !table || !columnName || !slug || !tenantId) return;
    let cancelled = false;
    (async () => {
      const { supabase } = await import('@/supabase/client');
      const { data: rows } = await supabase
        .from(table)
        .select(columnName);
      if (cancelled || !rows) return;
      const typeCounts: Record<string, { number: number; text: number; boolean: number }> = {};
      for (const row of rows) {
        const raw = (row as unknown as Record<string, unknown>)[columnName];
        if (!raw) continue;
        try {
          const obj = typeof raw === 'string' ? JSON.parse(raw) : raw;
          const entries = typeof obj === 'object' && obj !== null && !Array.isArray(obj) ? Object.entries(obj) : [];
          for (const [k, v] of entries) {
            if (!typeCounts[k]) typeCounts[k] = { number: 0, text: 0, boolean: 0 };
            if (typeof v === 'number') typeCounts[k].number++;
            else if (typeof v === 'boolean') typeCounts[k].boolean++;
            else typeCounts[k].text++;
          }
        } catch { /* skip unparseable */ }
      }
      if (cancelled) return;
      const detected: Record<string, JsonbKeyEntry> = {};
      for (const [k, counts] of Object.entries(typeCounts)) {
        const max = Math.max(counts.number, counts.text, counts.boolean);
        const type = max === counts.number ? 'number' : max === counts.boolean ? 'boolean' : 'text';
        detected[k] = { type: type as 'number' | 'text' | 'boolean' };
      }
      if (Object.keys(detected).length > 0 && onColumnConfigChange) {
        onColumnConfigChange({ jsonbKeyTypes: detected, jsonbKeyColors: keyColors });
      }
    })();
    return () => { cancelled = true; };
  }, [hasKeyTypes, table, columnName, slug, tenantId, onColumnConfigChange, keyColors]);

  const convertObjectToArray = useCallback(() => {
    try {
      const p = JSON.parse(value);
      if (typeof p === 'object' && p !== null && !Array.isArray(p)) {
        onChange(JSON.stringify([p]));
      }
    } catch { /* ignore */ }
  }, [value, onChange]);

  if (rawMode) {
    return (
      <div className="space-y-1.5">
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={4}
          className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 font-mono text-xs"
        />
        <button
          type="button"
          onClick={() => setRawMode(false)}
          className="text-xs text-primary hover:text-primary/80 transition-colors"
        >
          Voltar ao editor visual
        </button>
      </div>
    );
  }

  if (parsed.type === 'invalid') {
    return (
      <div className="space-y-1.5">
        <p className="text-xs text-red-400">JSON inválido</p>
        <textarea
          value={parsed.data as string}
          onChange={(e) => onChange(e.target.value)}
          rows={4}
          className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 font-mono text-xs"
        />
        <button
          type="button"
          onClick={() => setRawMode(true)}
          className="text-xs text-primary hover:text-primary/80 transition-colors"
        >
          Editar como JSON
        </button>
      </div>
    );
  }

  if (parsed.type === 'empty') {
    return (
      <div className="space-y-2">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setListMode(false)}
            className={`flex-1 text-xs py-1.5 px-3 rounded-lg border transition-colors ${!listMode ? 'bg-primary/10 border-primary/30 text-primary' : 'bg-card border-border/50 text-muted-foreground hover:border-primary/30'}`}
          >
            Objeto
          </button>
          <button
            type="button"
            onClick={() => setListMode(true)}
            className={`flex-1 text-xs py-1.5 px-3 rounded-lg border transition-colors ${listMode ? 'bg-primary/10 border-primary/30 text-primary' : 'bg-card border-border/50 text-muted-foreground hover:border-primary/30'}`}
          >
            Lista
          </button>
        </div>
        {listMode ? (
          <ArrayOfObjectsEditor
            value="[]"
            onChange={onChange}
            keyTypes={keyTypes}
            onKeyTypesChange={handleKeyTypesChange}
            jsonbKeyColors={keyColors}
            onKeyColorsChange={handleKeyColorsChange}
          />
        ) : (
          <SimpleObjectEditor
            entries={[]}
            onEntriesChange={(e) => {
              const obj: Record<string, unknown> = Object.fromEntries(e);
              for (const [k, v] of Object.entries(obj)) {
                if (keyTypes[k]?.type === 'number') obj[k] = Number(v);
              }
              onChange(JSON.stringify(obj));
            }}
            keyTypes={keyTypes}
            onKeyTypesChange={handleKeyTypesChange}
            jsonbKeyColors={keyColors}
            onKeyColorsChange={handleKeyColorsChange}
          />
        )}
        <button
          type="button"
          onClick={() => setRawMode(true)}
          className="text-xs text-muted-foreground hover:text-primary transition-colors flex items-center gap-1"
        >
          <Code2 className="h-3 w-3" /> Editar como JSON
        </button>
      </div>
    );
  }

  if (parsed.type === 'array') {
    return (
      <div className="space-y-2">
        <ArrayOfObjectsEditor
          value={value}
          onChange={onChange}
          keyTypes={keyTypes}
          onKeyTypesChange={handleKeyTypesChange}
          jsonbKeyColors={keyColors}
          onKeyColorsChange={handleKeyColorsChange}
        />
        <button
          type="button"
          onClick={() => setRawMode(true)}
          className="text-xs text-muted-foreground hover:text-primary transition-colors flex items-center gap-1"
        >
          <Code2 className="h-3 w-3" /> Editar como JSON
        </button>
      </div>
    );
  }

  if (parsed.type === 'scalar') {
    return (
      <div className="space-y-1.5">
        <input
          value={parsed.data as string}
          onChange={(e) => onChange(JSON.stringify(e.target.value))}
          className="h-8 w-full rounded-lg border bg-background px-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
        />
        <button
          type="button"
          onClick={() => setRawMode(true)}
          className="text-xs text-muted-foreground hover:text-primary transition-colors flex items-center gap-1"
        >
          <Code2 className="h-3 w-3" /> Editar como JSON
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {parsed.type === 'object' && (
        <button
          type="button"
          onClick={convertObjectToArray}
          className="text-xs text-muted-foreground hover:text-primary transition-colors"
        >
          Converter para Lista
        </button>
      )}
      <SimpleObjectEditor
        entries={parsed.type === 'object' ? Object.entries(parsed.data as Record<string, string>) : []}
        onEntriesChange={(e) => {
          const obj: Record<string, unknown> = Object.fromEntries(e);
          for (const [k, v] of Object.entries(obj)) {
            if (keyTypes[k]?.type === 'number') obj[k] = Number(v);
          }
          onChange(JSON.stringify(obj));
        }}
        keyTypes={keyTypes}
        onKeyTypesChange={handleKeyTypesChange}
        jsonbKeyColors={keyColors}
        onKeyColorsChange={handleKeyColorsChange}
      />
      <button
        type="button"
        onClick={() => setRawMode(true)}
        className="text-xs text-muted-foreground hover:text-primary transition-colors flex items-center gap-1"
      >
        <Code2 className="h-3 w-3" /> Editar como JSON
      </button>
    </div>
  );
}
