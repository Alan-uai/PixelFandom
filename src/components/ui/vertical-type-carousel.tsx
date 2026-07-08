'use client';

import { useRef } from 'react';
import { motion } from 'framer-motion';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CarouselOption {
  label: string;
  value: string;
  defaultColumn: string;
}

interface VerticalTypeCarouselProps {
  options: CarouselOption[];
  value: string;
  onChange: (opt: CarouselOption) => void;
}

export function VerticalTypeCarousel({ options, value, onChange }: VerticalTypeCarouselProps) {
  const listRef = useRef<HTMLDivElement>(null);
  const selectedIndex = options.findIndex((o) => o.value === value);

  const scrollTo = (index: number) => {
    const el = listRef.current;
    if (!el) return;
    const child = el.children[index] as HTMLElement;
    if (child) {
      child.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const handleSelect = (index: number) => {
    if (index < 0 || index >= options.length) return;
    onChange(options[index]);
    scrollTo(index);
  };

  const handleWheel = (e: React.WheelEvent) => {
    const dir = e.deltaY > 0 ? 1 : -1;
    handleSelect(selectedIndex + dir);
  };

  return (
    <div className="relative flex items-center gap-1">
      <button
        type="button"
        onClick={() => handleSelect(selectedIndex - 1)}
        disabled={selectedIndex <= 0}
        className="shrink-0 rounded-md p-0.5 text-muted-foreground hover:text-foreground transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
      >
        <ChevronUp className="h-3 w-3" />
      </button>

      <div
        ref={listRef}
        onWheel={handleWheel}
        className="flex-1 flex flex-col items-center gap-1 py-0.5 max-h-[132px] overflow-hidden"
      >
        {options.map((opt, i) => {
          const isSelected = opt.value === value;
          const isAdjacent = Math.abs(i - selectedIndex) <= 1;
          return (
            <motion.button
              key={opt.value}
              type="button"
              onClick={() => handleSelect(i)}
              animate={{
                height: isSelected ? 32 : isAdjacent ? 28 : 0,
                opacity: isAdjacent ? 1 : 0,
                scale: isSelected ? 1 : 0.92,
              }}
              transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
              className={cn(
                'w-full rounded-md px-2.5 text-xs font-medium transition-colors flex items-center justify-center shrink-0',
                isSelected
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground/70 hover:text-foreground hover:bg-muted/50',
              )}
            >
              {opt.label}
            </motion.button>
          );
        })}
      </div>

      <button
        type="button"
        onClick={() => handleSelect(selectedIndex + 1)}
        disabled={selectedIndex >= options.length - 1}
        className="shrink-0 rounded-md p-0.5 text-muted-foreground hover:text-foreground transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
      >
        <ChevronDown className="h-3 w-3" />
      </button>
    </div>
  );
}
