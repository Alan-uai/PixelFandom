'use client';

import { useState, useRef, useEffect } from 'react';
import { FloatingLabelInput } from '@/components/ui/floating-label-input';
import { cn } from '@/lib/utils';

const PRESET_COLORS = [
  'hsl(0 100% 50%)', 'hsl(15 100% 50%)', 'hsl(30 100% 50%)', 'hsl(45 100% 50%)',
  'hsl(60 100% 50%)', 'hsl(90 100% 50%)', 'hsl(120 100% 50%)', 'hsl(150 100% 50%)',
  'hsl(180 100% 50%)', 'hsl(200 100% 50%)', 'hsl(210 100% 50%)', 'hsl(240 100% 50%)',
  'hsl(270 100% 50%)', 'hsl(300 100% 50%)', 'hsl(330 100% 50%)', 'hsl(0 0% 50%)',
  '#ff6600', '#ffcc00', '#00cc66', '#3399ff', '#9933ff', '#ff3399',
];

interface ColorEditorProps {
  value: string;
  onChange: (value: string) => void;
}

export function ColorEditor({ value, onChange }: ColorEditorProps) {
  const [custom, setCustom] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (custom) inputRef.current?.focus();
  }, [custom]);

  const isHsl = value.startsWith('hsl');
  const displayColor = value || 'transparent';

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1.5">
        {PRESET_COLORS.map((color) => (
          <button
            key={color}
            type="button"
            onClick={() => { onChange(color); setCustom(false); }}
            className={cn(
              'h-6 w-6 rounded-full border-2 transition-all hover:scale-110',
              value === color ? 'border-primary scale-110 ring-2 ring-primary/30' : 'border-border',
            )}
            style={{ backgroundColor: color }}
            title={color}
          />
        ))}
        <button
          type="button"
          onClick={() => setCustom(!custom)}
          className={cn(
            'h-6 w-6 rounded-full border-2 border-dashed border-muted-foreground/40 flex items-center justify-center text-xs text-muted-foreground hover:border-foreground transition-colors',
            custom && 'border-primary',
          )}
          title="Personalizado"
        >
          +
        </button>
      </div>
      {custom && (
        <div className="flex items-center gap-2">
          <input
            ref={inputRef}
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="hsl(200 50% 50%) ou #ff6600"
            className="flex-1 h-8 rounded-lg border bg-background px-2.5 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
          <div
            className="h-6 w-6 rounded border shrink-0"
            style={{ backgroundColor: value.startsWith('hsl') ? `hsl(${value.slice(4, -1)})` : value }}
          />
        </div>
      )}
    </div>
  );
}
