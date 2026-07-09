'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface Select3DOption {
  label: string;
  value: string;
  icon?: React.ReactNode;
}

interface Select3DProps {
  label?: string;
  value: string;
  options: Select3DOption[];
  onChange: (value: string) => void;
  disabled?: boolean;
  className?: string;
  placeholder?: string;
}

export function Select3D({ label, value, options, onChange, disabled, className, placeholder }: Select3DProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const selected = options.find(o => o.value === value);

  return (
    <div ref={ref} className={cn('relative', className)}>
      {label && (
        <label className="block text-[10px] text-muted-foreground mb-1">{label}</label>
      )}
      <motion.button
        type="button"
        onClick={() => !disabled && setOpen(prev => !prev)}
        disabled={disabled}
        whileTap={{ scale: 0.97 }}
        className={cn(
          'relative flex items-center gap-2 h-8 w-full rounded-lg border bg-background px-2.5 text-sm',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50',
          'transition-colors',
          open ? 'border-primary/50 shadow-[0_0_12px_-2px_hsl(var(--primary)/0.3)]' : 'border-input hover:border-muted-foreground/30',
          disabled && 'opacity-50 cursor-not-allowed',
        )}
      >
        {selected?.icon && (
          <span className="text-muted-foreground/70 shrink-0">{selected.icon}</span>
        )}
        <span className={cn('truncate', selected ? 'text-foreground/90 font-medium' : 'text-muted-foreground/60')}>
          {selected?.label || placeholder || 'Selecionar...'}
        </span>
        <motion.div
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="ml-auto"
        >
          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground/60 shrink-0" />
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
              'absolute top-full left-0 right-0 mt-1.5 z-50 min-w-[200px]',
              'rounded-xl border border-border/60',
              'bg-background/85 backdrop-blur-2xl backdrop-saturate-150',
              'shadow-[0_8px_32px_-8px_rgba(0,0,0,0.4),0_0_0_1px_rgba(255,255,255,0.05)_inset]',
              'overflow-hidden',
            )}
          >
            <div className="py-1 max-h-64 overflow-y-auto">
              {options.map((opt, i) => {
                const isSelected = opt.value === value;
                return (
                  <motion.button
                    key={opt.value}
                    type="button"
                    initial={{ opacity: 0, x: -4 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.02, duration: 0.15 }}
                    whileHover={{ scale: 1.01, x: 2 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => { onChange(opt.value); setOpen(false); }}
                    className={cn(
                      'relative w-full flex items-center gap-2.5 px-3 py-1.5 text-sm text-left',
                      'transition-colors',
                      isSelected ? 'text-foreground' : 'text-muted-foreground/80 hover:text-foreground',
                    )}
                  >
                    {isSelected && (
                      <motion.div
                        layoutId="select3d-glow"
                        className="absolute inset-0 rounded-lg mx-1 bg-primary/10 border border-primary/20 shadow-[0_0_16px_-4px_hsl(var(--primary)/0.25)]"
                        transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                      />
                    )}
                    <span className="relative z-10 flex items-center gap-2.5 w-full">
                      {opt.icon && (
                        <span className={cn('shrink-0', isSelected ? 'text-primary' : 'text-muted-foreground/60')}>
                          {opt.icon}
                        </span>
                      )}
                      <span className={cn('font-medium', isSelected && 'text-primary')}>{opt.label}</span>
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