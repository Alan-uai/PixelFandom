'use client';

import { useMemo } from 'react';
import { Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { IconRenderer } from '@/components/ui/icon-renderer';
import { OptionConfigRow, type AllowedValue } from './option-config-row';
import { useInlineOptions } from './use-inline-options';

interface ToggleGroupEditorProps {
  value: string;
  onChange: (value: string) => void;
  options?: string[];
  allowedValues?: AllowedValue[];
  onColumnConfigChange?: (cfg: Record<string, unknown>) => void;
  dependentField?: string;
}

export function ToggleGroupEditor({
  value,
  onChange,
  options,
  allowedValues,
  onColumnConfigChange,
  dependentField,
}: ToggleGroupEditorProps) {
  if (onColumnConfigChange) {
    return (
      <ToggleGroupManaged
        value={value}
        onChange={onChange}
        allowedValues={allowedValues || []}
        onColumnConfigChange={onColumnConfigChange}
        dependentField={dependentField}
      />
    );
  }

  return <ToggleGroupDisplay value={value} onChange={onChange} options={options} allowedValues={allowedValues} />;
}

function ToggleGroupManaged({
  value,
  onChange,
  allowedValues,
  onColumnConfigChange,
  dependentField,
}: {
  value: string;
  onChange: (v: string) => void;
  allowedValues: AllowedValue[];
  onColumnConfigChange: (cfg: Record<string, unknown>) => void;
  dependentField?: string;
}) {
  const { options, expandedValue, toggleExpand, addOption, updateOption, removeOption } =
    useInlineOptions({
      allowedValues,
      onColumnConfigChange,
      onCreated: (v) => onChange(v),
    });

  return (
    <div className="space-y-1.5">
      <div className="flex flex-wrap items-center gap-1.5">
        {options.map((opt) => (
          <div key={opt.value} className="flex flex-col">
            <OptionConfigRow
              variant="toggle"
              option={opt}
              selected={value === opt.value}
              expanded={expandedValue === opt.value}
              onSelect={() => onChange(value === opt.value ? '' : opt.value)}
              onToggleExpand={() => toggleExpand(opt.value)}
              onChange={(patch) => updateOption(opt.value, patch)}
              onRemove={() => {
                if (value === opt.value) onChange('');
                removeOption(opt.value);
              }}
              dependentField={dependentField}
            />
          </div>
        ))}
        <button
          type="button"
          onClick={addOption}
          className="flex h-8 items-center gap-1 rounded-lg border border-dashed border-border/60 px-2.5 text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
        >
          <Plus className="h-3.5 w-3.5" /> Opção
        </button>
      </div>
    </div>
  );
}

interface DisplayItem {
  key: string;
  label: string;
  color?: string;
  icon?: string;
}

function ToggleGroupDisplay({ value, onChange, options, allowedValues }: ToggleGroupEditorProps) {
  const items = useMemo(() => {
    if (allowedValues?.length) {
      return allowedValues.map((av) => ({
        key: av.value,
        label: av.label || av.value,
        color: av.color,
        icon: av.icon,
      } as DisplayItem));
    }
    const base = options?.length ? options : ['Baixo', 'Médio', 'Alto'];
    return base.map((item) => ({ key: item, label: item } as DisplayItem));
  }, [allowedValues, options]);

  return (
    <div className="flex gap-1">
      {items.map((item) => (
        <button
          key={item.key}
          type="button"
          onClick={() => onChange(value === item.key ? '' : item.key)}
          className={cn(
            'flex-1 h-8 rounded-lg border text-sm font-medium transition-all flex items-center justify-center gap-1',
            value === item.key
              ? 'bg-primary text-primary-foreground border-primary shadow-sm'
              : 'bg-background text-muted-foreground border-input hover:border-muted-foreground/30 hover:text-foreground',
          )}
          style={value === item.key && item.color ? { backgroundColor: item.color, borderColor: item.color } : undefined}
        >
          {item.icon && <IconRenderer icon={item.icon} size={"sm"} />}
          {item.label}
        </button>
      ))}
    </div>
  );
}
