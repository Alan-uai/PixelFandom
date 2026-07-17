'use client';

import { useMemo } from 'react';
import { cn } from '@/lib/utils';
import { IconRenderer } from '@/components/ui/icon-renderer';

interface AllowedValue {
  value: string;
  label?: string;
  color?: string;
  icon?: string;
}

interface ToggleGroupEditorProps {
  value: string;
  onChange: (value: string) => void;
  options?: string[];
  allowedValues?: AllowedValue[];
}

interface DisplayItem {
  key: string;
  label: string;
  color?: string;
  icon?: string;
}

export function ToggleGroupEditor({ value, onChange, options, allowedValues }: ToggleGroupEditorProps) {
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
