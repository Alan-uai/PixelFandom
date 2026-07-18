'use client';

import { useCallback, useState } from 'react';
import type { AllowedValue } from './option-config-row';

interface UseInlineOptionsArgs {
  allowedValues: AllowedValue[];
  onColumnConfigChange?: (cfg: Record<string, unknown>) => void;
  /** Called after a brand-new option is created, so the caller can select it. */
  onCreated?: (value: string) => void;
}

interface UseInlineOptions {
  options: AllowedValue[];
  expandedValue: string | null;
  setExpandedValue: (v: string | null) => void;
  toggleExpand: (v: string) => void;
  addOption: () => void;
  updateOption: (originalValue: string, patch: Partial<AllowedValue>) => void;
  removeOption: (value: string) => void;
}

function uniqueSlug(base: string, existing: AllowedValue[]): string {
  const taken = new Set(existing.map((o) => o.value));
  if (!taken.has(base)) return base;
  let i = 2;
  while (taken.has(`${base}-${i}`)) i += 1;
  return `${base}-${i}`;
}

export function useInlineOptions({
  allowedValues,
  onColumnConfigChange,
  onCreated,
}: UseInlineOptionsArgs): UseInlineOptions {
  const [expandedValue, setExpandedValue] = useState<string | null>(null);

  const commit = useCallback(
    (next: AllowedValue[]) => {
      onColumnConfigChange?.({ allowedValues: next });
    },
    [onColumnConfigChange],
  );

  const toggleExpand = useCallback((v: string) => {
    setExpandedValue((cur) => (cur === v ? null : v));
  }, []);

  const addOption = useCallback(() => {
    const base = uniqueSlug('opcao', allowedValues);
    const next: AllowedValue[] = [...allowedValues, { value: base, label: '' }];
    commit(next);
    setExpandedValue(base);
    onCreated?.(base);
  }, [allowedValues, commit, onCreated]);

  const updateOption = useCallback(
    (originalValue: string, patch: Partial<AllowedValue>) => {
      let nextValue = originalValue;
      const next = allowedValues.map((o) => {
        if (o.value !== originalValue) return o;
        const merged = { ...o, ...patch };
        if (patch.value !== undefined) {
          nextValue = patch.value;
        }
        return merged;
      });
      commit(next);
      if (expandedValue === originalValue && nextValue !== originalValue) {
        setExpandedValue(nextValue);
      }
    },
    [allowedValues, commit, expandedValue],
  );

  const removeOption = useCallback(
    (value: string) => {
      const next = allowedValues.filter((o) => o.value !== value);
      commit(next);
      if (expandedValue === value) setExpandedValue(null);
    },
    [allowedValues, commit, expandedValue],
  );

  return {
    options: allowedValues,
    expandedValue,
    setExpandedValue,
    toggleExpand,
    addOption,
    updateOption,
    removeOption,
  };
}
