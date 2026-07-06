'use client';

interface DurationEditorProps {
  value: string;
  onChange: (value: string) => void;
}

export function DurationEditor({ value, onChange }: DurationEditorProps) {
  const parts = value.split(':');
  const hh = parts.length === 3 ? parts[0] : '0';
  const mm = parts.length >= 2 ? parts[parts.length - 2] : '0';
  const ss = parts[parts.length - 1] || '0';

  return (
    <div className="flex items-center gap-1">
      <input
        type="number"
        min={0}
        max={9999}
        value={hh}
        onChange={(e) => onChange(`${e.target.value.padStart(1, '0')}:${mm}:${ss}`)}
        className="w-14 h-8 rounded-lg border bg-background px-2 text-sm text-center font-mono focus:outline-none focus:ring-2 focus:ring-primary/50"
        placeholder="00"
      />
      <span className="text-muted-foreground text-sm">:</span>
      <input
        type="number"
        min={0}
        max={59}
        value={mm}
        onChange={(e) => onChange(`${hh}:${e.target.value.padStart(2, '0')}:${ss}`)}
        className="w-14 h-8 rounded-lg border bg-background px-2 text-sm text-center font-mono focus:outline-none focus:ring-2 focus:ring-primary/50"
        placeholder="00"
      />
      <span className="text-muted-foreground text-sm">:</span>
      <input
        type="number"
        min={0}
        max={59}
        value={ss}
        onChange={(e) => onChange(`${hh}:${mm}:${e.target.value.padStart(2, '0')}`)}
        className="w-14 h-8 rounded-lg border bg-background px-2 text-sm text-center font-mono focus:outline-none focus:ring-2 focus:ring-primary/50"
        placeholder="00"
      />
      <span className="text-xs text-muted-foreground ml-1">h:m:s</span>
    </div>
  );
}
