'use client';

import { Plus } from 'lucide-react';
import { OptionConfigRow, type AllowedValue } from './option-config-row';
import { useInlineOptions } from './use-inline-options';

interface MultiSelectEditorProps {
  value: string;
  onChange: (value: string) => void;
  allowedValues?: AllowedValue[];
  onColumnConfigChange?: (cfg: Record<string, unknown>) => void;
  maxSelect?: number;
  dependentField?: string;
}

function parseTags(value: string): string[] {
  try {
    const p = JSON.parse(value || '[]');
    return Array.isArray(p) ? p : [];
  } catch {
    return value ? [value] : [];
  }
}

export function MultiSelectEditor({
  value,
  onChange,
  allowedValues,
  onColumnConfigChange,
  maxSelect,
  dependentField,
}: MultiSelectEditorProps) {
  const tags = parseTags(value);
  const { options, expandedValue, toggleExpand, addOption, updateOption, removeOption } =
    useInlineOptions({
      allowedValues: allowedValues || [],
      onColumnConfigChange,
    });

  const maxReached = !!maxSelect && maxSelect > 0 && tags.length >= maxSelect;

  const toggleTag = (val: string) => {
    if (tags.includes(val)) {
      onChange(JSON.stringify(tags.filter((t) => t !== val)));
    } else {
      if (maxReached) return;
      onChange(JSON.stringify([...tags, val]));
    }
  };

  return (
    <div className="space-y-1.5">
      {options.length === 0 && (
        <p className="text-[11px] text-muted-foreground">Nenhuma opção ainda. Adicione a primeira abaixo.</p>
      )}

      <div className="flex flex-wrap items-start gap-1.5">
        {options.map((opt) => (
          <OptionConfigRow
            key={opt.value}
            variant="chip"
            option={opt}
            selected={tags.includes(opt.value)}
            expanded={expandedValue === opt.value}
            onSelect={() => toggleTag(opt.value)}
            onToggleExpand={() => toggleExpand(opt.value)}
            onChange={(patch) => updateOption(opt.value, patch)}
            onRemove={() => {
              if (tags.includes(opt.value)) toggleTag(opt.value);
              removeOption(opt.value);
            }}
            dependentField={dependentField}
          />
        ))}
        <button
          type="button"
          onClick={addOption}
          className="inline-flex items-center gap-1 rounded-full border border-dashed border-border/60 px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
        >
          <Plus className="h-3 w-3" /> Opção
        </button>
      </div>

      {maxReached && (
        <p className="text-[10px] text-muted-foreground">Máximo de {maxSelect} seleções atingido.</p>
      )}
    </div>
  );
}
