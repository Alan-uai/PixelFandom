'use client';

import { useState } from 'react';
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RatingEditorProps {
  value: string;
  onChange: (value: string) => void;
  max?: number;
}

export function RatingEditor({ value, onChange, max = 5 }: RatingEditorProps) {
  const current = parseInt(value) || 0;
  const [hover, setHover] = useState(0);

  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: max }, (_, i) => {
        const starVal = i + 1;
        const filled = starVal <= (hover || current);
        return (
          <button
            key={starVal}
            type="button"
            onMouseEnter={() => setHover(starVal)}
            onMouseLeave={() => setHover(0)}
            onClick={() => onChange(starVal === current ? '' : String(starVal))}
            className="p-0.5 transition-transform hover:scale-110"
          >
            <Star
              className={cn(
                'h-5 w-5 transition-colors',
                filled ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground/30',
              )}
            />
          </button>
        );
      })}
      {current > 0 && (
        <span className="ml-1.5 text-xs text-muted-foreground font-mono">{current}/{max}</span>
      )}
    </div>
  );
}
