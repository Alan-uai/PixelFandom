'use client';

import { useState, useRef, useEffect, useMemo, type KeyboardEvent } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { IconRenderer } from '@/components/ui/icon-renderer';

interface AllowedValue {
  value: string;
  label?: string;
  color?: string;
  icon?: string;
}

interface TagsEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  allowedValues?: AllowedValue[];
  maxSelect?: number;
  restrictToValues?: boolean;
}

export function TagsEditor({
  value,
  onChange,
  placeholder = 'Digite e pressione Enter',
  allowedValues,
  maxSelect,
  restrictToValues,
}: TagsEditorProps) {
  const tags: string[] = (() => {
    try { const p = JSON.parse(value || '[]'); return Array.isArray(p) ? p : []; }
    catch { return value ? [value] : []; }
  })();
  const [input, setInput] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (suggestRef.current && !suggestRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const maxReached = maxSelect && maxSelect > 0 && tags.length >= maxSelect;

  const suggestions = useMemo(() => {
    if (!allowedValues?.length || !input.trim()) return [];
    const q = input.toLowerCase();
    return allowedValues
      .filter((av) => {
        if (tags.includes(av.value)) return false;
        return av.value.toLowerCase().includes(q) || (av.label || '').toLowerCase().includes(q);
      })
      .slice(0, 10);
  }, [allowedValues, input, tags]);

  const addTag = (tag: string) => {
    const t = tag.trim();
    if (!t || tags.includes(t) || maxReached) return;
    onChange(JSON.stringify([...tags, t]));
    setInput('');
    setShowSuggestions(false);
  };

  const removeTag = (tag: string) => {
    onChange(JSON.stringify(tags.filter((t) => t !== tag)));
  };

  const handleKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (input.trim()) {
        if (restrictToValues) {
          const match = allowedValues?.find(
            (av) => av.value.toLowerCase() === input.trim().toLowerCase(),
          );
          if (match) addTag(match.value);
        } else {
          addTag(input);
        }
      }
    }
    if (e.key === 'Backspace' && !input && tags.length > 0) removeTag(tags[tags.length - 1]);
    if (e.key === 'Escape') setShowSuggestions(false);
  };

  const getLabel = (val: string) => {
    const av = allowedValues?.find((a) => a.value === val);
    return av?.label || val;
  };

  const getColor = (val: string) => allowedValues?.find((a) => a.value === val)?.color;

  const getIcon = (val: string) => allowedValues?.find((a) => a.value === val)?.icon;

  return (
    <div className="relative">
      <div
        className={cn(
          'flex flex-wrap items-center gap-1.5 min-h-8 rounded-lg border bg-background px-2 py-1.5 cursor-text focus-within:ring-2 focus-within:ring-primary/50',
          maxReached && 'opacity-60',
        )}
        onClick={() => !maxReached && inputRef.current?.focus()}
      >
        {tags.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 rounded-md bg-secondary px-2 py-0.5 text-xs font-medium"
            style={getColor(tag) ? { backgroundColor: getColor(tag) + '20', borderLeft: `3px solid ${getColor(tag)}` } : undefined}
          >
            {getIcon(tag) && <IconRenderer icon={getIcon(tag)!} size={"sm"} />}
            {getLabel(tag)}
            <button type="button" onClick={() => removeTag(tag)} className="hover:text-destructive transition-colors">
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
        {!maxReached && (
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              if (e.target.value.trim() && allowedValues?.length) setShowSuggestions(true);
            }}
            onKeyDown={handleKey}
            onFocus={() => { if (input.trim() && allowedValues?.length) setShowSuggestions(true); }}
            onBlur={() => {
              if (input.trim() && !restrictToValues) addTag(input);
            }}
            placeholder={tags.length === 0 ? placeholder : maxReached ? `Máx. ${maxSelect}` : ''}
            className="flex-1 min-w-[80px] bg-transparent text-sm outline-none placeholder:text-muted-foreground/50"
          />
        )}
      </div>

      {showSuggestions && suggestions.length > 0 && (
        <div
          ref={suggestRef}
          className="absolute z-50 mt-1 rounded-lg border bg-popover shadow-lg overflow-hidden max-h-48 overflow-y-auto min-w-[200px]"
        >
          {suggestions.map((s) => (
            <button
              key={s.value}
              type="button"
              onMouseDown={(e) => { e.preventDefault(); addTag(s.value); }}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-muted transition-colors"
            >
              {getIcon(s.value) && <IconRenderer icon={getIcon(s.value)!} size={"sm"} />}
              {s.color && <span className="inline-block h-3 w-3 rounded-full shrink-0" style={{ backgroundColor: s.color }} />}
              <span>{s.label || s.value}</span>
              <span className="text-muted-foreground text-[10px] ml-auto">{s.value}</span>
            </button>
          ))}
        </div>
      )}

      {maxReached && (
        <p className="text-[10px] text-muted-foreground mt-0.5">Máximo de {maxSelect} seleções atingido.</p>
      )}
    </div>
  );
}
