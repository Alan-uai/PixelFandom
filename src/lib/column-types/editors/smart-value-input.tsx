'use client';
import { useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Info } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

function detectTypeFromValue(value: string): 'number' | 'text' | 'boolean' | null {
  if (value === '' || value === null || value === undefined) return null;
  const lower = value.toLowerCase().trim();
  if (['true', 'false', 'yes', 'no', 'sim', 'não', 'nao', 'on', 'off', '0', '1'].includes(lower)) return 'boolean';
  const num = Number(value);
  if (!isNaN(num) && value.trim() !== '') return 'number';
  return 'text';
}

function parseNumberWithSuffix(input: string): { num: number; suffix: string } {
  const m = input.match(/^(-?[\d.]+)\s*(.*)$/);
  if (m) {
    const num = parseFloat(m[1]);
    const suffix = m[2].trim();
    return { num: isNaN(num) ? 0 : num, suffix };
  }
  return { num: 0, suffix: '' };
}

export function SmartValueInput({
  value,
  onChange,
  persistedType,
  persistedSuffix,
  onTypeChange,
  onSuffixChange,
}: {
  value: string;
  onChange: (v: string) => void;
  persistedType?: string;
  persistedSuffix?: string;
  onTypeChange?: (type: 'number' | 'text' | 'boolean') => void;
  onSuffixChange?: (suffix: string) => void;
}) {
  const effectiveType = (persistedType || detectTypeFromValue(value) || 'unknown') as 'number' | 'text' | 'boolean' | 'unknown';

  const handleNumberChange = useCallback((raw: string) => {
    const { num, suffix } = parseNumberWithSuffix(raw);
    onChange(String(num));
    if (suffix && onSuffixChange) onSuffixChange(suffix);
    if (persistedType !== 'number' && onTypeChange) onTypeChange('number');
  }, [onChange, onSuffixChange, onTypeChange, persistedType]);

  if (effectiveType === 'boolean') {
    const checked = value.toLowerCase().trim() === 'true' || value === '1' || ['sim', 'yes', 'on'].includes(value.toLowerCase().trim());
    return (
      <Switch
        checked={checked}
        onCheckedChange={(c) => {
          onChange(String(c));
          if (persistedType !== 'boolean' && onTypeChange) onTypeChange('boolean');
        }}
      />
    );
  }

  if (effectiveType === 'number') {
    const displayVal = persistedSuffix ? `${value} ${persistedSuffix}` : value;
    return (
      <input
        type="text"
        inputMode="numeric"
        value={displayVal}
        onChange={(e) => handleNumberChange(e.target.value)}
        className="h-8 w-full rounded-lg border bg-background px-2 text-xs font-mono text-right focus:outline-none focus:ring-2 focus:ring-primary/50"
      />
    );
  }

  if (effectiveType === 'unknown') {
    return (
      <div className="flex items-center gap-1">
        <Input
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            const detected = detectTypeFromValue(e.target.value);
            if (detected && onTypeChange) onTypeChange(detected);
          }}
          className="h-8 text-sm flex-1"
          placeholder="Valor"
        />
        <Popover>
          <PopoverTrigger asChild>
            <button type="button" className="shrink-0 text-red-400 hover:text-red-300 transition-colors">
              <Info className="h-4 w-4" />
            </button>
          </PopoverTrigger>
          <PopoverContent side="top" align="end" className="w-44 p-2 space-y-1">
            <p className="text-[11px] text-muted-foreground mb-1.5">Tipo não detectado. Selecione:</p>
            {(['text', 'number', 'boolean'] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => { if (onTypeChange) onTypeChange(t); }}
                className="block w-full text-left text-xs px-2 py-1 rounded hover:bg-accent transition-colors capitalize"
              >
                {t === 'number' ? 'Número' : t === 'boolean' ? 'Sim/Não' : 'Texto'}
              </button>
            ))}
          </PopoverContent>
        </Popover>
      </div>
    );
  }

  return (
    <Input
      value={value}
      onChange={(e) => {
        onChange(e.target.value);
        const detected = detectTypeFromValue(e.target.value);
        if (detected && onTypeChange) onTypeChange(detected);
      }}
      className="h-8 text-sm"
      placeholder="Valor"
    />
  );
}
