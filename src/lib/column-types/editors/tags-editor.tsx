'use client';

import { useState, useRef, type KeyboardEvent } from 'react';
import { X } from 'lucide-react';

interface TagsEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function TagsEditor({ value, onChange, placeholder = 'Digite e pressione Enter' }: TagsEditorProps) {
  const tags: string[] = (() => {
    try { const p = JSON.parse(value || '[]'); return Array.isArray(p) ? p : []; }
    catch { return value ? [value] : []; }
  })();
  const [input, setInput] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const addTag = (tag: string) => {
    const t = tag.trim();
    if (!t || tags.includes(t)) return;
    onChange(JSON.stringify([...tags, t]));
    setInput('');
  };

  const removeTag = (tag: string) => {
    onChange(JSON.stringify(tags.filter((t) => t !== tag)));
  };

  const handleKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') { e.preventDefault(); addTag(input); }
    if (e.key === 'Backspace' && !input && tags.length > 0) removeTag(tags[tags.length - 1]);
  };

  return (
    <div
      className="flex flex-wrap items-center gap-1.5 min-h-8 rounded-lg border bg-background px-2 py-1.5 cursor-text focus-within:ring-2 focus-within:ring-primary/50"
      onClick={() => inputRef.current?.focus()}
    >
      {tags.map((tag) => (
        <span key={tag} className="inline-flex items-center gap-1 rounded-md bg-secondary px-2 py-0.5 text-xs font-medium">
          {tag}
          <button type="button" onClick={() => removeTag(tag)} className="hover:text-destructive transition-colors">
            <X className="h-3 w-3" />
          </button>
        </span>
      ))}
      <input
        ref={inputRef}
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKey}
        onBlur={() => { if (input.trim()) addTag(input); }}
        placeholder={tags.length === 0 ? placeholder : ''}
        className="flex-1 min-w-[80px] bg-transparent text-sm outline-none placeholder:text-muted-foreground/50"
      />
    </div>
  );
}
