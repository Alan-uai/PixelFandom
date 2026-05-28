'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import type { BlockConfig } from './types';

interface BlockConfigPanelProps {
  block: BlockConfig;
  onUpdate: (config: BlockConfig) => void;
  onClose: () => void;
}

export function BlockConfigPanel({ block, onUpdate, onClose }: BlockConfigPanelProps) {
  const [localConfig, setLocalConfig] = useState({ ...block.config });

  useEffect(() => {
    setLocalConfig({ ...block.config });
  }, [block.id, block.config]);

  const update = (key: string, value: unknown) => {
    const next = { ...localConfig, [key]: value };
    setLocalConfig(next);
    onUpdate({ ...block, config: next });
  };

  const renderField = (key: string, value: unknown) => {
    const label = key.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase());

    if (typeof value === 'boolean') {
      return (
        <div key={key} className="flex items-center gap-2">
          <input type="checkbox" checked={value} onChange={(e) => update(key, e.target.checked)} id={`cfg-${block.id}-${key}`} className="rounded" />
          <label htmlFor={`cfg-${block.id}-${key}`} className="text-xs">{label}</label>
        </div>
      );
    }

    if (typeof value === 'number') {
      return (
        <div key={key} className="space-y-1">
          <label className="text-xs text-muted-foreground">{label}</label>
          <input type="number" value={value} onChange={(e) => update(key, Number(e.target.value))} className="w-full rounded-md border bg-background px-2 py-1 text-xs" />
        </div>
      );
    }

    if (typeof value === 'string') {
      const isUrl = key.toLowerCase().includes('url') || key.toLowerCase().includes('src');
      const isMultiline = key === 'html' || key === 'description';

      return (
        <div key={key} className="space-y-1">
          <label className="text-xs text-muted-foreground">{label}</label>
          {isMultiline ? (
            <textarea value={value} onChange={(e) => update(key, e.target.value)} rows={3} className="w-full rounded-md border bg-background px-2 py-1 text-xs resize-none" />
          ) : (
            <input type={isUrl ? 'url' : 'text'} value={value} onChange={(e) => update(key, e.target.value)} placeholder={label} className="w-full rounded-md border bg-background px-2 py-1 text-xs" />
          )}
        </div>
      );
    }

    if (Array.isArray(value)) {
      return (
        <div key={key} className="space-y-1">
          <label className="text-xs text-muted-foreground">{label}</label>
          <textarea
            value={JSON.stringify(value, null, 2)}
            onChange={(e) => {
              try { update(key, JSON.parse(e.target.value)); } catch {}
            }}
            rows={4}
            className="w-full rounded-md border bg-background px-2 py-1 font-mono text-[10px] resize-none"
          />
        </div>
      );
    }

    return null;
  };

  return (
    <div className="w-72 shrink-0 border-l bg-background p-4 overflow-y-auto">
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm font-medium">Configurações</p>
        <button onClick={onClose} className="rounded-md p-1 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="space-y-3">
        {Object.entries(localConfig).map(([key, value]) => renderField(key, value))}
      </div>
    </div>
  );
}
