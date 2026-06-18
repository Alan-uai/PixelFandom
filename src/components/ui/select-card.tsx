'use client';

import { useRef, useCallback } from 'react';
import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  AnimatePresence,
} from 'framer-motion';
import { cva } from 'class-variance-authority';
import { cn } from '@/lib/utils';


export interface SelectCardOption<T = string> {
  value: T;
  label: string;
  description?: string;
  icon?: React.ReactNode;
  emoji?: string;
  disabled?: boolean;
  badge?: string;
}

export interface SelectCardProps<T = string> {
  options: SelectCardOption<T>[];
  value: T | T[];
  onChange: (value: T | T[]) => void;
  multiple?: boolean;
  layout?: 'grid' | 'list' | 'compact';
  columns?: number;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

function SelectionParticles() {
  const particles = Array.from({ length: 8 }, (_, i) => ({
    id: i,
    angle: (i / 8) * Math.PI * 2 + (Math.random() - 0.5) * 0.5,
    distance: 16 + Math.random() * 28,
    size: 1.5 + Math.random() * 2,
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
            boxShadow: '0 0 4px hsl(var(--primary))',
          }}
          initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
          animate={{
            x: Math.cos(p.angle) * p.distance,
            y: Math.sin(p.angle) * p.distance,
            opacity: [1, 0.8, 0],
            scale: [1, 0.5, 0],
          }}
          transition={{
            duration: 0.7,
            ease: [0.17, 0.67, 0.12, 0.99],
          }}
        />
      ))}
    </div>
  );
}

const itemVariants = cva(
  'relative flex select-none flex-col rounded-xl border outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
  {
    variants: {
      layout: {
        grid: 'items-center text-center',
        list: 'flex-row items-center gap-3',
        compact: 'items-center gap-0.5',
      },
      size: {
        grid_lg: 'p-5',
        grid_md: 'p-4',
        grid_sm: 'p-3',
        list_lg: 'p-4',
        list_md: 'p-3',
        list_sm: 'p-2.5',
        compact: 'px-2 py-1.5',
      },
      state: {
        idle: 'border-border/60 bg-card/50 hover:border-border hover:bg-card',
        selected:
          'border-primary/60 bg-primary/[0.08] ring-1 ring-primary/30',
      },
    },
    defaultVariants: {
      layout: 'grid',
      size: 'grid_md',
      state: 'idle',
    },
  },
);

function CardItem<T>({
  option,
  isSelected,
  isMulti,
  size,
  layout,
  onClick,
}: {
  option: SelectCardOption<T>;
  isSelected: boolean;
  isMulti: boolean;
  size: 'sm' | 'md' | 'lg';
  layout: 'grid' | 'list' | 'compact';
  onClick: () => void;
}) {
  const ref = useRef<HTMLButtonElement>(null);

  const x = useMotionValue(0.5);
  const y = useMotionValue(0.5);

  const rotateX = useSpring(useTransform(y, [0, 1], [6, -6]), {
    stiffness: 200,
    damping: 25,
  });
  const rotateY = useSpring(useTransform(x, [0, 1], [-6, 6]), {
    stiffness: 200,
    damping: 25,
  });

  const glowX = useTransform(x, [0, 1], [0, 100]);
  const glowY = useTransform(y, [0, 1], [0, 100]);

  const iconX = useSpring(useTransform(x, [0, 1], [-4, 4]), {
    stiffness: 150,
    damping: 20,
  });
  const iconY = useSpring(useTransform(y, [0, 1], [-4, 4]), {
    stiffness: 150,
    damping: 20,
  });

  const glowBackground = useTransform(() => {
    const gx = glowX.get();
    const gy = glowY.get();
    return `radial-gradient(circle at ${gx}% ${gy}%, hsl(var(--primary) / 0.12), transparent 70%)`;
  });

  const isGrid = layout === 'grid';
  const isList = layout === 'list';
  const isCompact = layout === 'compact';

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      const rect = ref.current?.getBoundingClientRect();
      if (!rect) return;
      x.set((e.clientX - rect.left) / rect.width);
      y.set((e.clientY - rect.top) / rect.height);
    },
    [x, y],
  );

  const handleMouseLeave = useCallback(() => {
    x.set(0.5);
    y.set(0.5);
  }, [x, y]);

  const resolvedSizeKey =
    layout === 'compact'
      ? 'compact'
      : (`${layout}_${size}` as 'grid_sm' | 'grid_md' | 'grid_lg' | 'list_sm' | 'list_md' | 'list_lg' | 'compact');

  return (
    <motion.button
      ref={ref}
      type="button"
      role={isMulti ? 'checkbox' : 'radio'}
      aria-checked={isSelected}
      aria-label={option.label}
      disabled={option.disabled}
      onClick={onClick}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={cn(
        itemVariants({
          layout,
          size: resolvedSizeKey,
          state: isSelected ? 'selected' : 'idle',
        }),
        option.disabled && 'cursor-not-allowed opacity-50',
        'cursor-pointer',
      )}
      style={{ perspective: '600px', transformStyle: 'preserve-3d' }}
      whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
      whileTap={{ scale: 0.98 }}
      animate={
        isSelected
          ? { scale: [1, 1.03, 1], transition: { duration: 0.3 } }
          : {}
      }
    >
      <motion.div
        style={{
          rotateX: isSelected ? 0 : rotateX,
          rotateY: isSelected ? 0 : rotateY,
          transformStyle: 'preserve-3d',
        }}
        className="relative z-10"
      >
        {!isSelected && (
          <motion.div
            className="pointer-events-none absolute -inset-px rounded-xl opacity-0 transition-opacity duration-300 group-hover:opacity-100"
            style={{ background: glowBackground }}
          />
        )}

        {isSelected && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="pointer-events-none absolute -inset-px rounded-xl"
            style={{
              background:
                'radial-gradient(circle at 50% 50%, hsl(var(--primary) / 0.15), transparent 70%)',
            }}
          />
        )}

        <div
          className={cn(
            'relative z-10',
            isGrid && 'flex flex-col items-center gap-1.5',
            isList && 'flex flex-1 items-center gap-3',
            isCompact && 'flex flex-col items-center',
          )}
        >
          {(option.icon || option.emoji) && (
            <motion.div
              style={!isSelected ? { x: iconX, y: iconY } : undefined}
              className="shrink-0"
            >
              {option.icon ? (
                <div
                  className={cn(
                    'flex items-center justify-center rounded-lg',
                    isSelected ? 'bg-primary/10 text-primary' : 'text-muted-foreground',
                    size === 'sm' && 'h-7 w-7 [&>svg]:h-3.5 [&>svg]:w-3.5',
                    size === 'md' && 'h-9 w-9 [&>svg]:h-4 [&>svg]:w-4',
                    size === 'lg' && 'h-10 w-10 [&>svg]:h-5 [&>svg]:w-5',
                    isCompact && 'h-6 w-6 [&>svg]:h-3 [&>svg]:w-3',
                  )}
                >
                  {option.icon}
                </div>
              ) : (
                <span
                  className={cn(
                    size === 'sm' && 'text-lg',
                    size === 'md' && 'text-2xl',
                    size === 'lg' && 'text-3xl',
                    isCompact && 'text-base',
                  )}
                >
                  {option.emoji}
                </span>
              )}
            </motion.div>
          )}

          <div className={cn(isList && 'flex-1')}>
            <div
              className={cn(
                'font-medium leading-tight',
                isSelected && 'text-primary',
                size === 'sm' && isGrid && 'text-[11px]',
                size === 'md' && isGrid && 'text-xs',
                size === 'lg' && isGrid && 'text-sm',
                isList && size === 'sm' && 'text-xs',
                isList && size === 'md' && 'text-sm',
                isList && size === 'lg' && 'text-base',
                isCompact && 'text-[10px]',
              )}
            >
              {option.label}
            </div>
            {option.description && (
              <div
                className={cn(
                  'mt-0.5 leading-tight text-muted-foreground',
                  size === 'sm' && 'text-[10px]',
                  size === 'md' && 'text-[11px]',
                  size === 'lg' && 'text-xs',
                  isCompact && 'hidden',
                )}
              >
                {option.description}
              </div>
            )}
          </div>

          {option.badge && (
            <span
              className={cn(
                'inline-flex shrink-0 items-center rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary',
                isGrid && 'mt-1',
              )}
            >
              {option.badge}
            </span>
          )}
        </div>
      </motion.div>

      <AnimatePresence>
        {isSelected && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 500, damping: 25 }}
            className={cn(
              'absolute z-20 flex items-center justify-center rounded-full bg-primary text-primary-foreground',
              isGrid && 'right-2 top-2 h-5 w-5',
              isList && 'h-5 w-5 shrink-0',
              isCompact && '-right-1 -top-1 h-4 w-4',
            )}
          >
            <motion.svg
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.3, delay: 0.1 }}
              viewBox="0 0 24 24"
              className={cn(isCompact ? 'h-2.5 w-2.5' : 'h-3 w-3')}
              fill="none"
              stroke="currentColor"
              strokeWidth={3}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <motion.path
                d="M5 13l4 4L19 7"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.25, delay: 0.12 }}
              />
            </motion.svg>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isSelected && <SelectionParticles />}
      </AnimatePresence>
    </motion.button>
  );
}

function SelectCardInner<T = string>({
  options,
  value,
  onChange,
  multiple = false,
  layout = 'grid',
  columns = 3,
  size = 'md',
  className,
}: SelectCardProps<T>) {
  const isSelected = useCallback(
    (opt: SelectCardOption<T>) => {
      if (multiple && Array.isArray(value)) {
        return (value as T[]).includes(opt.value);
      }
      return (value as T) === opt.value;
    },
    [value, multiple],
  );

  const handleToggle = useCallback(
    (opt: SelectCardOption<T>) => {
      if (opt.disabled) return;

      if (multiple && Array.isArray(value)) {
        const arr = value as T[];
        const exists = arr.includes(opt.value);
        const next = exists
          ? arr.filter((v) => v !== opt.value)
          : [...arr, opt.value];
        onChange(next);
      } else {
        onChange(opt.value);
      }
    },
    [value, multiple, onChange],
  );

  const gridCols =
    (
      {
        1: 'grid-cols-1',
        2: 'grid-cols-2',
        3: 'grid-cols-3',
        4: 'grid-cols-4',
        5: 'grid-cols-5',
        6: 'grid-cols-6',
      } as Record<number, string>
    )[Math.min(columns, 6)] || 'grid-cols-3';

  if (layout === 'compact') {
    return (
      <div
        className={cn('flex flex-wrap gap-1.5', className)}
        role={multiple ? 'group' : 'radiogroup'}
      >
        {options.map((opt) => (
          <CardItem
            key={String(opt.value)}
            option={opt}
            isSelected={isSelected(opt)}
            isMulti={multiple}
            size="sm"
            layout="compact"
            onClick={() => handleToggle(opt)}
          />
        ))}
      </div>
    );
  }

  if (layout === 'list') {
    return (
      <div
        className={cn('flex flex-col gap-1.5', className)}
        role={multiple ? 'group' : 'radiogroup'}
      >
        {options.map((opt) => (
          <CardItem
            key={String(opt.value)}
            option={opt}
            isSelected={isSelected(opt)}
            isMulti={multiple}
            size={size}
            layout="list"
            onClick={() => handleToggle(opt)}
          />
        ))}
      </div>
    );
  }

  return (
    <div
      className={cn('grid gap-2', gridCols, className)}
      role={multiple ? 'group' : 'radiogroup'}
    >
      {options.map((opt) => (
        <CardItem
          key={String(opt.value)}
          option={opt}
          isSelected={isSelected(opt)}
          isMulti={multiple}
          size={size}
          layout="grid"
          onClick={() => handleToggle(opt)}
        />
      ))}
    </div>
  );
}

export const SelectCard = SelectCardInner as <T = string>(
  props: SelectCardProps<T>,
) => React.ReactElement;
