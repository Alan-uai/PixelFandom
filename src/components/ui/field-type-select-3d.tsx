'use client';

import { useState, useRef, useEffect, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Type,
  Hash,
  Calculator,
  ToggleLeft,
  Code,
  Variable,
  ArrowUpDown,
  Upload,
  Binary,
  ChevronDown,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const typeIcons: Record<string, ReactNode> = {
  text: <Type className="h-3.5 w-3.5" />,
  integer: <Hash className="h-3.5 w-3.5" />,
  numeric: <Calculator className="h-3.5 w-3.5" />,
  boolean: <ToggleLeft className="h-3.5 w-3.5" />,
  jsonb: <Code className="h-3.5 w-3.5" />,
  real: <Binary className="h-3.5 w-3.5" />,
  bigint: <ArrowUpDown className="h-3.5 w-3.5" />,
  'double precision': <Variable className="h-3.5 w-3.5" />,
  upload: <Upload className="h-3.5 w-3.5" />,
};

const typeLabels: Record<string, string> = {
  text: 'Texto',
  integer: 'Inteiro',
  numeric: 'Numérico',
  boolean: 'Sim/Não',
  jsonb: 'JSON',
  real: 'Real',
  bigint: 'Inteiro Grande',
  'double precision': 'Precisão Dupla',
  upload: 'Upload / URL',
};

interface FieldTypeSelect3DProps {
  value: string;
  onChange: (value: string) => void;
  options: string[];
  disabled?: boolean;
}

export function FieldTypeSelect3D({ value, onChange, options, disabled }: FieldTypeSelect3DProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const selectedIcon = typeIcons[value] || <Type className="h-3.5 w-3.5" />;
  const selectedLabel = typeLabels[value] || value;

  return (
    <div ref={ref} className="relative">
      <motion.button
        type="button"
        onClick={() => !disabled && setOpen((prev) => !prev)}
        disabled={disabled}
        whileTap={{ scale: 0.97 }}
        className={cn(
          'relative flex items-center gap-2 h-8 rounded-lg border bg-background px-2.5 text-sm',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50',
          'transition-colors',
          open ? 'border-primary/50 shadow-[0_0_12px_-2px_hsl(var(--primary)/0.3)]' : 'border-input hover:border-muted-foreground/30',
          disabled && 'opacity-50 cursor-not-allowed',
        )}
      >
        <span className="text-muted-foreground/70">{selectedIcon}</span>
        <span className="text-foreground/90 font-medium">{selectedLabel}</span>
        <motion.div
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="ml-auto"
        >
          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground/60" />
        </motion.div>
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scaleY: 0.85, rotateX: -8, y: -4 }}
            animate={{ opacity: 1, scaleY: 1, rotateX: 0, y: 0 }}
            exit={{ opacity: 0, scaleY: 0.85, rotateX: -8, y: -4 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            style={{ transformOrigin: 'top center', perspective: 800 }}
            className={cn(
              'absolute top-full left-0 right-0 mt-1.5 z-50',
              'rounded-xl border border-border/60',
              'bg-background/85 backdrop-blur-2xl backdrop-saturate-150',
              'shadow-[0_8px_32px_-8px_rgba(0,0,0,0.4),0_0_0_1px_rgba(255,255,255,0.05)_inset]',
              'overflow-hidden',
            )}
          >
            <div className="py-1 max-h-56 overflow-y-auto">
              {options.map((opt, i) => {
                const isSelected = opt === value;
                const icon = typeIcons[opt] || <Type className="h-3.5 w-3.5" />;
                const label = typeLabels[opt] || opt;

                return (
                  <motion.button
                    key={opt}
                    type="button"
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.035, duration: 0.2, ease: 'easeOut' }}
                    whileHover={{ scale: 1.02, rotateX: 1.5 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      onChange(opt);
                      setOpen(false);
                    }}
                    style={{ perspective: 400 }}
                    className={cn(
                      'relative w-full flex items-center gap-2.5 px-3 py-2 text-sm text-left',
                      'transition-colors',
                      isSelected
                        ? 'text-foreground'
                        : 'text-muted-foreground/80 hover:text-foreground',
                    )}
                  >
                    {isSelected && (
                      <motion.div
                        layoutId="field-type-glow"
                        className="absolute inset-0 rounded-lg mx-1 bg-primary/10 border border-primary/20 shadow-[0_0_16px_-4px_hsl(var(--primary)/0.25)]"
                        transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                      />
                    )}
                    <span className={cn(
                      'relative z-10 flex items-center gap-2.5 w-full',
                      'group-hover:translate-x-0.5 transition-transform',
                    )}>
                      <span className={cn(
                        'shrink-0',
                        isSelected ? 'text-primary' : 'text-muted-foreground/60',
                      )}>
                        {icon}
                      </span>
                      <span className={cn(
                        'font-medium',
                        isSelected && 'text-primary',
                      )}>
                        {label}
                      </span>
                      {isSelected && (
                        <motion.span
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="ml-auto relative z-10 w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_6px_hsl(var(--primary)/0.6)]"
                        />
                      )}
                    </span>
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
