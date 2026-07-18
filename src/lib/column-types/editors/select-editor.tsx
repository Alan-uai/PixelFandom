'use client';

import { Plus } from 'lucide-react';
import { OptionConfigRow, type AllowedValue } from './option-config-row';
import { useInlineOptions } from './use-inline-options';

interface SelectEditorProps {
  value: string;
  onChange: (value: string) => void;
  options?: string[];
  allowedValues?: AllowedValue[];
  onEntityLink?: (entitySlug: string) => void;
  onColumnConfigChange?: (cfg: Record<string, unknown>) => void;
  dependentField?: string;
}

export function SelectEditor({
  value,
  onChange,
  allowedValues,
  onColumnConfigChange,
  dependentField,
}: SelectEditorProps) {
  const list = allowedValues || [];
  const { options, expandedValue, toggleExpand, addOption, updateOption, removeOption } =
    useInlineOptions({
      allowedValues: list,
      onColumnConfigChange,
      onCreated: (v) => onChange(v),
    });

  return (
    <div className="space-y-1.5">
      {options.length === 0 && (
        <p className="text-[11px] text-muted-foreground">Nenhuma opção ainda. Adicione a primeira abaixo.</p>
      )}

      {options.map((opt) => (
        <OptionConfigRow
          key={opt.value}
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
      ))}

      <button
        type="button"
        onClick={addOption}
        className="flex w-full items-center justify-center gap-1.5 rounded-md border border-dashed border-border/60 py-1.5 text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
      >
        <Plus className="h-3.5 w-3.5" /> Adicionar opção
      </button>
    </div>
  );
}
