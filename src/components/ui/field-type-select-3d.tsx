'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  CATEGORIES,
  getTypesByCategory,
  getTypeDef,
  type CategoryId,
} from '@/lib/column-types/registry';

interface FieldTypeSelect3DProps {
  value: string;
  onChange: (value: string) => void;
  options?: string[];
  disabled?: boolean;
}

export function FieldTypeSelect3D({ value, onChange, options, disabled }: FieldTypeSelect3DProps) {
  const [open, setOpen] = useState(false);
  const [expandedCategory, setExpandedCategory] = useState<CategoryId | null>(null);
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

  const currentDef = getTypeDef(value);
  const selectedIcon = currentDef?.icon;
  const selectedLabel = currentDef?.label || value;
  const selectedCategory = currentDef?.category;

  const filteredCategories = CATEGORIES.map((cat) => ({
    ...cat,
    types: getTypesByCategory(cat.id).filter(
      (t) => !options || options.length === 0 || options.includes(t.id),
    ),
  })).filter((cat) => cat.types.length > 0);

  useEffect(() => {
    if (open && selectedCategory && !expandedCategory) {
      setExpandedCategory(selectedCategory);
    }
  }, [open, selectedCategory, expandedCategory]);

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
        <span className="text-muted-foreground/70 shrink-0">{selectedIcon}</span>
        <span className="text-foreground/90 font-medium truncate">{selectedLabel}</span>
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
              'absolute top-full left-0 right-0 mt-1.5 z-50 min-w-[220px]',
              'rounded-xl border border-border/60',
              'bg-background/85 backdrop-blur-2xl backdrop-saturate-150',
              'shadow-[0_8px_32px_-8px_rgba(0,0,0,0.4),0_0_0_1px_rgba(255,255,255,0.05)_inset]',
              'overflow-hidden',
            )}
          >
            <div className="py-1 max-h-72 overflow-y-auto">
              {filteredCategories.map((cat) => {
                const isExpanded = expandedCategory === cat.id;
                return (
                  <div key={cat.id}>
                    <button
                      type="button"
                      onClick={() => setExpandedCategory(isExpanded ? null : cat.id)}
                      className="w-full flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider hover:text-foreground transition-colors"
                    >
                      <span className="opacity-60">{isExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}</span>
                      <span className="opacity-60">{cat.icon}</span>
                      {cat.label}
                    </button>
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          {cat.types.map((typeDef, i) => {
                            const isSelected = typeDef.id === value;
                            return (
                              <motion.button
                                key={typeDef.id}
                                type="button"
                                initial={{ opacity: 0, x: -4 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.02, duration: 0.15 }}
                                whileHover={{ scale: 1.01, x: 2 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => {
                                  onChange(typeDef.id);
                                  setOpen(false);
                                }}
                                className={cn(
                                  'relative w-full flex items-center gap-2.5 px-3 py-1.5 text-sm text-left',
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
                                <span className="relative z-10 flex items-center gap-2.5 w-full">
                                  <span className={cn('shrink-0', isSelected ? 'text-primary' : 'text-muted-foreground/60')}>
                                    {typeDef.icon}
                                  </span>
                                  <span className={cn('font-medium', isSelected && 'text-primary')}>
                                    {typeDef.label}
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
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
