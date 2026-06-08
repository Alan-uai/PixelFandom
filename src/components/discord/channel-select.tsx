'use client';

import { useGuildData } from './guild-data-context';

interface ChannelSelectProps {
  value: string;
  onChange: (value: string) => void;
  label: string;
  description?: string;
}

export function ChannelSelect({ value, onChange, label, description }: ChannelSelectProps) {
  const { channels, selectedGuild, loading } = useGuildData();
  const textChannels = channels.filter((c) => c.type === 0);

  return (
    <div className="space-y-2">
      <div>
        <label className="text-sm font-medium">{label}</label>
        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
      </div>
      {!selectedGuild ? (
        <p className="text-xs text-muted-foreground">Selecione um servidor primeiro.</p>
      ) : loading ? (
        <p className="text-xs text-muted-foreground">Carregando canais...</p>
      ) : (
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
        >
          <option value="">Nenhum</option>
          {textChannels.map((ch) => (
            <option key={ch.id} value={ch.id}>
              # {ch.name}
            </option>
          ))}
        </select>
      )}
    </div>
  );
}
