'use client';

import { useState, useEffect } from 'react';
import * as SliderPrimitive from '@radix-ui/react-slider';

interface SliderEditorProps {
  value: string;
  onChange: (value: string) => void;
  min?: number;
  max?: number;
  step?: number;
}

export function SliderEditor({ value, onChange, min = 0, max = 100, step = 1 }: SliderEditorProps) {
  const numVal = parseFloat(value) || 0;
  const [local, setLocal] = useState(numVal);

  useEffect(() => { setLocal(numVal); }, [numVal]);

  return (
    <div className="flex items-center gap-3">
      <SliderPrimitive.Root
        value={[local]}
        onValueChange={([v]) => { setLocal(v); onChange(String(v)); }}
        min={min}
        max={max}
        step={step}
        className="relative flex h-5 w-full touch-none items-center"
      >
        <SliderPrimitive.Track className="relative h-1.5 w-full grow rounded-full bg-secondary">
          <SliderPrimitive.Range className="absolute h-full rounded-full bg-primary" />
        </SliderPrimitive.Track>
        <SliderPrimitive.Thumb className="block h-4 w-4 rounded-full border border-primary/50 bg-background shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 hover:border-primary" />
      </SliderPrimitive.Root>
      <span className="text-xs font-mono text-muted-foreground w-10 text-right">{local}</span>
    </div>
  );
}
