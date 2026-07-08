'use client';

import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

const QUICK_COLORS = [
  '#ff0000', '#ff6600', '#ffcc00', '#00cc66', '#0066ff', '#6600ff', '#ff00cc',
  '#cc0000', '#cc3300', '#cc9900', '#00994d', '#0044cc', '#4400cc', '#990099',
  '#666666', '#999999', '#ffffff', '#000000',
];

interface ColorPaletteEditorProps {
  value: string;
  onChange: (value: string) => void;
}

export function ColorPaletteEditor({ value, onChange }: ColorPaletteEditorProps) {
  const colors: string[] = (() => {
    try { const p = JSON.parse(value || '[]'); return Array.isArray(p) ? p : []; }
    catch { return []; }
  })();

  const addColor = (color: string) => {
    if (colors.length >= 12) return;
    onChange(JSON.stringify([...colors, color]));
  };

  const removeColor = (index: number) => {
    onChange(JSON.stringify(colors.filter((_, i) => i !== index)));
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1.5 min-h-8">
        {colors.map((color, i) => (
          <div key={`${color}-${i}`} className="relative group">
            <div
              className="h-7 w-7 rounded-md border-2 border-border"
              style={{ backgroundColor: color }}
            />
            <button
              type="button"
              onClick={() => removeColor(i)}
              className="absolute -top-1.5 -right-1.5 h-4 w-4 rounded-full bg-background border shadow-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X className="h-2.5 w-2.5 text-destructive" />
            </button>
          </div>
        ))}
      </div>
      {colors.length < 12 && (
        <div className="flex flex-wrap gap-1">
          {QUICK_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => addColor(c)}
              disabled={colors.includes(c)}
              className={cn(
                'h-5 w-5 rounded border border-border hover:scale-110 transition-transform',
                colors.includes(c) && 'opacity-30 cursor-not-allowed',
              )}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
