'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import dynamic from 'next/dynamic';
import { cn } from '@/lib/utils';
import { hexToHsl } from '@/lib/color';

const ColorPickerScene = dynamic(
  () => import('./color-select-3d-scene').then(mod => ({ default: mod.ColorPickerScene })),
  { ssr: false }
);

interface ColorSelect3DProps {
  label?: string;
  value?: string;
  onChange: (color: string) => void;
  disabled?: boolean;
  className?: string;
  placeholder?: string;
  presets?: string[];
}

const DEFAULT_PRESETS = [
  '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6',
  '#EC4899', '#EF4444', '#14B8A6', '#6366F1',
  '#F97316', '#84CC16', '#06B6D4', '#D946EF',
];

export function ColorSelect3D({
  label,
  value,
  onChange,
  disabled,
  className,
  placeholder,
  presets = DEFAULT_PRESETS,
}: ColorSelect3DProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleSceneChange = useCallback((color: string) => {
    onChange(color);
  }, [onChange]);

  const handlePresetClick = useCallback((hex: string) => {
    onChange(hex);
    setOpen(false);
  }, [onChange]);

  const currentColor = value && /^#[0-9a-fA-F]{6}$/.test(value) ? value : undefined;
  const hsl = currentColor ? hexToHsl(currentColor) : null;

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
        <span
          className="h-4 w-4 shrink-0 rounded-full border border-border/50 shadow-sm"
          style={{ backgroundColor: currentColor || 'transparent' }}
        />
        <span className={cn('truncate', currentColor ? 'text-foreground/90 font-medium' : 'text-muted-foreground/60')}>
          {currentColor ? currentColor.toUpperCase() : (placeholder || 'Selecionar cor...')}
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
              'absolute top-full left-0 right-0 mt-1.5 z-50 min-w-[260px]',
              'rounded-xl border border-border/60',
              'bg-background/85 backdrop-blur-2xl backdrop-saturate-150',
              'shadow-[0_8px_32px_-8px_rgba(0,0,0,0.4),0_0_0_1px_rgba(255,255,255,0.05)_inset]',
              'overflow-hidden',
            )}
          >
            <div className="p-3 space-y-3">
              {/* 3D Scene */}
              <div className="h-48 rounded-lg overflow-hidden bg-gradient-to-b from-black/20 to-black/40 mb-1">
                <ColorPickerScene
                  value={currentColor}
                  onChange={handleSceneChange}
                />
              </div>

              {/* Selected color info */}
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                  <span
                    className="h-5 w-5 rounded-full border border-border/50 shadow-sm"
                    style={{ backgroundColor: currentColor || 'transparent' }}
                  />
                  <span className="text-xs font-mono font-medium">
                    {currentColor?.toUpperCase() || 'Nenhuma'}
                  </span>
                </div>
                {hsl && (
                  <span className="text-[10px] text-muted-foreground/60 font-mono">
                    HSL: {hsl.h}° {hsl.s}% {hsl.l}%
                  </span>
                )}
              </div>

              {/* Preset swatches */}
              <div>
                <label className="block text-[10px] text-muted-foreground mb-1.5">Cores rápidas</label>
                <div className="flex flex-wrap gap-1.5">
                  {presets.map((hex) => {
                    const isCurrent = currentColor?.toLowerCase() === hex.toLowerCase();
                    return (
                      <motion.button
                        key={hex}
                        type="button"
                        whileHover={{ scale: 1.15, y: -1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => handlePresetClick(hex)}
                        className={cn(
                          'h-6 w-6 rounded-full border shadow-sm transition-shadow',
                          isCurrent
                            ? 'border-primary/80 ring-1 ring-primary/40 ring-offset-1 ring-offset-background'
                            : 'border-border/50 hover:border-muted-foreground/40'
                        )}
                        style={{ backgroundColor: hex }}
                        title={hex}
                      />
                    );
                  })}
                </div>
              </div>

              {/* Bottom hint */}
              <p className="text-[10px] text-muted-foreground/50 text-center">
                Arraste para girar · Clique para selecionar
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
