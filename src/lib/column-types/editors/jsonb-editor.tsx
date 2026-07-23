'use client';
import { useState, useCallback, useMemo, useEffect } from 'react';
import { Code2 } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { TreeEditor, jsonToTreeEntries, treeEntriesToJson } from './tree-editor';
import type { TreeEntry } from './tree-editor';

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

  const parsed = useMemo(() => {
    if (!value) return { kind: 'empty' as const, data: null };
    try {
      const p = JSON.parse(value);
      if (Array.isArray(p)) return { kind: 'array' as const, data: p as unknown };
      if (typeof p === 'object' && p !== null) return { kind: 'object' as const, data: p as Record<string, unknown> };
      return { kind: 'scalar' as const, data: String(p) };
    } catch {
      return { kind: 'invalid' as const, data: value };
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

  const handleTreeChange = useCallback(
    (entries: TreeEntry[], rootKind: 'object' | 'array') => {
      onChange(JSON.stringify(treeEntriesToJson(entries, rootKind)));
    },
    [onChange],
  );

  const treeData = parsed.kind === 'empty'
    ? { rootKind: 'object' as const, entries: [] as TreeEntry[] }
    : jsonToTreeEntries(parsed.data);

  const isFallback = parsed.kind === 'invalid' || parsed.kind === 'scalar';

  const springTransition = { type: 'spring' as const, stiffness: 350, damping: 28 };

  return (
    <motion.div layout className="space-y-2 overflow-hidden" transition={springTransition} style={{ transformStyle: 'preserve-3d', perspective: '600px' }}>
      <AnimatePresence mode="popLayout">
        {rawMode ? (
          <motion.div
            key="raw"
            layout
            initial={{ opacity: 0, rotateX: -15, scale: 0.95 }}
            animate={{ opacity: 1, rotateX: 0, scale: 1 }}
            exit={{ opacity: 0, rotateX: 15, scale: 0.95 }}
            transition={springTransition}
            style={{ transformStyle: 'preserve-3d', perspective: '600px', transformOrigin: 'top center' }}
          >
            <textarea
              value={value}
              onChange={(e) => onChange(e.target.value)}
              rows={4}
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 font-mono text-xs"
            />
            <button
              type="button"
              onClick={() => setRawMode(false)}
              className="mt-1.5 text-xs text-primary hover:text-primary/80 transition-colors"
            >
              Voltar ao editor visual
            </button>
          </motion.div>
        ) : isFallback ? (
          <motion.div
            key="fallback"
            layout
            initial={{ opacity: 0, rotateX: -15, scale: 0.95 }}
            animate={{ opacity: 1, rotateX: 0, scale: 1 }}
            exit={{ opacity: 0, rotateX: 15, scale: 0.95 }}
            transition={springTransition}
            style={{ transformStyle: 'preserve-3d', perspective: '600px', transformOrigin: 'top center' }}
          >
            {parsed.kind === 'invalid' && (
              <p className="text-xs text-red-400 mb-1">JSON inválido</p>
            )}
            <textarea
              value={parsed.kind === 'scalar' ? JSON.stringify(parsed.data) : (parsed.data as string)}
              onChange={(e) => {
                try {
                  onChange(JSON.stringify(e.target.value));
                } catch { onChange(e.target.value); }
              }}
              rows={3}
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 font-mono text-xs"
            />
            <button
              type="button"
              onClick={() => setRawMode(true)}
              className="mt-1.5 text-xs text-muted-foreground hover:text-primary transition-colors flex items-center gap-1"
            >
              <Code2 className="h-3 w-3" /> Editar como JSON
            </button>
          </motion.div>
        ) : (
          <motion.div
            key="tree"
            layout
            initial={{ opacity: 0, rotateX: -15, scale: 0.95 }}
            animate={{ opacity: 1, rotateX: 0, scale: 1 }}
            exit={{ opacity: 0, rotateX: 15, scale: 0.95 }}
            transition={springTransition}
            style={{ transformStyle: 'preserve-3d', perspective: '600px', transformOrigin: 'top center' }}
          >
            <TreeEditor
              entries={treeData.entries}
              onEntriesChange={(entries) => handleTreeChange(entries, treeData.rootKind)}
              keyTypes={keyTypes}
              onKeyTypesChange={handleKeyTypesChange}
              jsonbKeyColors={keyColors}
              onKeyColorsChange={handleKeyColorsChange}
              depth={0}
            />
            <button
              type="button"
              onClick={() => setRawMode(true)}
              className="mt-2 text-xs text-muted-foreground hover:text-primary transition-colors flex items-center gap-1"
            >
              <Code2 className="h-3 w-3" /> Editar como JSON
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
