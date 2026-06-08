'use client';

import { useGuildData } from './guild-data-context';

interface RoleSelectProps {
  value: string;
  onChange: (value: string) => void;
  label: string;
  description?: string;
}

export function RoleSelect({ value, onChange, label, description }: RoleSelectProps) {
  const { roles, selectedGuild, loading } = useGuildData();

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
        <p className="text-xs text-muted-foreground">Carregando cargos...</p>
      ) : (
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
        >
          <option value="">Nenhum</option>
          {roles.map((r) => (
            <option key={r.id} value={r.id}>
              @ {r.name}
            </option>
          ))}
        </select>
      )}
    </div>
  );
}
