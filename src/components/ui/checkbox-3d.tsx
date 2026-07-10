'use client';

import { useRef, useCallback, useState } from 'react';
import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  AnimatePresence,
} from 'framer-motion';
import { cn } from '@/lib/utils';

function CheckboxParticles() {
  const particles = Array.from({ length: 6 }, (_, i) => ({
    id: i,
    angle: (i / 6) * Math.PI * 2 + (Math.random() - 0.5) * 0.5,
    distance: 10 + Math.random() * 18,
    size: 1 + Math.random() * 1.5,
  }));

  return (
    <div className="pointer-events-none absolute inset-0 z-20 overflow-hidden">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute left-1/2 top-1/2 rounded-full bg-primary"
          style={{
            width: p.size,
            height: p.size,
            boxShadow: '0 0 3px hsl(var(--primary))',
          }}
          initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
          animate={{
            x: Math.cos(p.angle) * p.distance,
            y: Math.sin(p.angle) * p.distance,
            opacity: [1, 0.8, 0],
            scale: [1, 0.5, 0],
          }}
          transition={{
            duration: 0.6,
            ease: [0.17, 0.67, 0.12, 0.99],
          }}
        />
      ))}
    </div>
  );
}

export interface Checkbox3DProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  label?: string;
  labelPosition?: 'left' | 'right';
  indeterminate?: boolean;
  showParticles?: boolean;
  className?: string;
  id?: string;
}

const sizeMap = {
  sm: {
    container: 'h-3 w-3',
    checkmark: 'h-2 w-2',
    viewBox: '0 0 12 12',
    checkPath: 'M2.5 6L5 8.5L9.5 3',
    dashPath: 'M2.5 6h7',
    strokeWidth: 2.5,
  },
  md: {
    container: 'h-4 w-4',
    checkmark: 'h-2.5 w-2.5',
    viewBox: '0 0 16 16',
    checkPath: 'M3 8l4 4L13 4',
    dashPath: 'M3 8h10',
    strokeWidth: 2.5,
  },
  lg: {
    container: 'h-5 w-5',
    checkmark: 'h-3 w-3',
    viewBox: '0 0 20 20',
    checkPath: 'M4 10l5 5L16 5',
    dashPath: 'M4 10h12',
    strokeWidth: 2.5,
  },
};

export function Checkbox3D({
  checked,
  onChange,
  size = 'md',
  disabled = false,
  label,
  labelPosition = 'right',
  indeterminate = false,
  showParticles = true,
  className,
  id,
}: Checkbox3DProps) {
  const ref = useRef<HTMLButtonElement>(null);
  const [particleKey, setParticleKey] = useState(0);

  const x = useMotionValue(0.5);
  const y = useMotionValue(0.5);

  const rotateX = useSpring(useTransform(y, [0, 1], [10, -10]), {
    stiffness: 200,
    damping: 25,
  });
  const rotateY = useSpring(useTransform(x, [0, 1], [-10, 10]), {
    stiffness: 200,
    damping: 25,
  });

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      if (disabled) return;
      const rect = ref.current?.getBoundingClientRect();
      if (!rect) return;
      x.set((e.clientX - rect.left) / rect.width);
      y.set((e.clientY - rect.top) / rect.height);
    },
    [disabled, x, y],
  );

  const handleMouseLeave = useCallback(() => {
    x.set(0.5);
    y.set(0.5);
  }, [x, y]);

  const handleToggle = useCallback(() => {
    if (disabled) return;
    const next = !checked;
    onChange(next);
    if (next && showParticles) {
      setParticleKey((k) => k + 1);
    }
  }, [disabled, checked, onChange, showParticles]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        handleToggle();
      }
    },
    [handleToggle],
  );

  const dims = sizeMap[size];

  const checkbox = (
    <motion.button
      ref={ref}
      type="button"
      role="checkbox"
      aria-checked={indeterminate ? 'mixed' : checked}
      aria-disabled={disabled}
      disabled={disabled}
      id={id}
      onClick={handleToggle}
      onKeyDown={handleKeyDown}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={cn(
        'relative flex shrink-0 items-center justify-center rounded outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background',
        dims.container,
        checked
          ? 'bg-primary border-primary'
          : 'bg-card border border-border/70 hover:border-border',
        disabled && 'cursor-not-allowed opacity-40',
        !disabled && 'cursor-pointer',
      )}
      style={{ perspective: '500px', transformStyle: 'preserve-3d' }}
      whileHover={!disabled ? { scale: 1.08, transition: { duration: 0.15 } } : undefined}
      whileTap={!disabled ? { scale: 0.92 } : undefined}
    >
      <motion.div
        style={{
          rotateX: checked ? 0 : rotateX,
          rotateY: checked ? 0 : rotateY,
          transformStyle: 'preserve-3d',
        }}
        className="flex items-center justify-center"
      >
        <AnimatePresence mode="wait">
          {checked && (
            <motion.svg
              key={indeterminate ? 'dash' : 'check'}
              viewBox={dims.viewBox}
              className={cn(dims.checkmark, 'text-primary-foreground')}
              fill="none"
              stroke="currentColor"
              strokeWidth={dims.strokeWidth}
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0 }}
              transition={{ duration: 0.15 }}
            >
              <motion.path
                d={indeterminate ? dims.dashPath : dims.checkPath}
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.25, delay: 0.05, ease: 'easeOut' }}
              />
            </motion.svg>
          )}
        </AnimatePresence>
      </motion.div>

      {!disabled && showParticles && (
        <AnimatePresence>
          {particleKey > 0 && (
            <motion.div
              key={particleKey}
              initial={{ opacity: 1 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
            >
              <CheckboxParticles />
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </motion.button>
  );

  if (!label) return checkbox;

  return (
    <div
      className={cn(
        'flex items-center gap-2',
        labelPosition === 'left' && 'flex-row-reverse',
        disabled && 'opacity-40',
        className,
      )}
    >
      {checkbox}
      <span
        className={cn(
          'select-none text-sm',
          disabled ? 'cursor-not-allowed' : 'cursor-pointer',
        )}
        onClick={!disabled ? handleToggle : undefined}
      >
        {label}
      </span>
    </div>
  );
}
