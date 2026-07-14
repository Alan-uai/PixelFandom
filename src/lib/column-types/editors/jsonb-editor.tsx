'use client';
import { useState, useCallback, useMemo } from 'react';
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
}: {
  value: string;
  onChange: (v: string) => void;
  columnConfig?: { maxValue?: number; jsonbKeyTypes?: Record<string, JsonbKeyEntry> };
  onColumnConfigChange?: (cfg: { jsonbKeyTypes?: Record<string, JsonbKeyEntry> }) => void;
}) {
  const [rawMode, setRawMode] = useState(false);

  const parsed = useMemo(() => {
    if (!value) return { type: 'empty' as const, data: null };
    try {
      const p = JSON.parse(value);
      if (Array.isArray(p)) return { type: 'array' as const, data: p as Record<string, string>[] };
      if (typeof p === 'object' && p !== null) return { type: 'object' as const, data: p as Record<string, string> };
      return { type: 'scalar' as const, data: String(p) };
    } catch {
      return { type: 'invalid' as const, data: value };
    }
  }, [value]);

  const keyTypes: Record<string, JsonbKeyEntry> = columnConfig?.jsonbKeyTypes || {};

  const handleKeyTypesChange = useCallback((types: Record<string, JsonbKeyEntry>) => {
    if (onColumnConfigChange) onColumnConfigChange({ jsonbKeyTypes: types });
  }, [onColumnConfigChange]);

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
        <p className="text-xs text-muted-foreground italic">Vazio — adicione campos abaixo</p>
        <SimpleObjectEditor
          entries={[]}
          onEntriesChange={(e) => onChange(JSON.stringify(Object.fromEntries(e)))}
          keyTypes={keyTypes}
          onKeyTypesChange={handleKeyTypesChange}
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

  if (parsed.type === 'array') {
    return (
      <div className="space-y-2">
        <ArrayOfObjectsEditor
          value={value}
          onChange={onChange}
          keyTypes={keyTypes}
          onKeyTypesChange={handleKeyTypesChange}
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
      <SimpleObjectEditor
        entries={Object.entries(parsed.data as Record<string, string>)}
        onEntriesChange={(e) => onChange(JSON.stringify(Object.fromEntries(e)))}
        keyTypes={keyTypes}
        onKeyTypesChange={handleKeyTypesChange}
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
