'use client';

import { useTableCatalog } from '@/hooks/use-data-access';
import { ChannelSelect } from './channel-select';
import { Database, Trash2 } from 'lucide-react';
import type { IngestConfig } from './types';

interface IngestEntryProps {
  slug: string;
  entry: IngestConfig;
  onChange: (entry: IngestConfig) => void;
  onRemove: () => void;
}

export function IngestEntry({ slug, entry, onChange, onRemove }: IngestEntryProps) {
  const { data: catalog, loading } = useTableCatalog(slug, false);

  return (
    <div className="space-y-3 rounded-lg border p-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">Auto-Ingest</p>
        <button type="button" onClick={onRemove} className="text-destructive hover:text-destructive/80">
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      <ChannelSelect
        label="Canal de Origem"
        description="Canal que o bot vai escutar para ingerir dados."
        channelId={entry.source_channel_id}
        channelName={entry.source_channel_name}
        onChange={(id, name) => onChange({ ...entry, source_channel_id: id, source_channel_name: name })}
      />

      <div className="space-y-2">
        <label className="text-sm font-medium">Tabela de Destino</label>
        {loading ? (
          <p className="text-xs text-muted-foreground">Carregando tabelas...</p>
        ) : (
          <div className="relative">
            <Database className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <select
              value={entry.target_table}
              onChange={(e) => {
                const selected = catalog?.find((t) => t.table_name === e.target.value);
                onChange({ ...entry, target_table: e.target.value, target_label: selected?.display_label ?? e.target.value });
              }}
              className="w-full rounded-lg border bg-background pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 appearance-none"
            >
              <option value="">Selecione uma tabela...</option>
              {catalog?.map((t) => (
                <option key={t.table_name} value={t.table_name}>
                  {t.display_label} ({t.table_name})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Tipo de Gatilho</label>
        <select
          value={entry.trigger_type}
          onChange={(e) => onChange({ ...entry, trigger_type: e.target.value as 'all' | 'command' })}
          className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
        >
          <option value="all">Ouvir todas as mensagens</option>
          <option value="command">Apenas com comando (+ prefixo)</option>
        </select>
        {entry.trigger_type === 'command' && (
          <input
            type="text"
            value={entry.command_prefix}
            onChange={(e) => onChange({ ...entry, command_prefix: e.target.value })}
            placeholder="!ingest"
            className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        )}
      </div>

      <div className="flex items-center justify-between">
        <span className="text-sm">Ativo</span>
        <input
          type="checkbox"
          checked={entry.enabled}
          onChange={(e) => onChange({ ...entry, enabled: e.target.checked })}
          className="h-5 w-5 rounded border-gray-300"
        />
      </div>
    </div>
  );
}
