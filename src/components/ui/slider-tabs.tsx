'use client';

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  useEffect,
} from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

// ── Types ──

type Direction2D = { x: -1 | 0 | 1; y: -1 | 0 | 1 };

type TransitionMode =
  | 'auto'
  | 'left' | 'right'
  | 'up' | 'down'
  | 'top-left' | 'top-right'
  | 'bottom-left' | 'bottom-right';

const DIR_VECTORS: Record<Exclude<TransitionMode, 'auto'>, Direction2D> = {
  'left':         { x: -1, y:  0 },
  'right':        { x:  1, y:  0 },
  'up':           { x:  0, y: -1 },
  'down':         { x:  0, y:  1 },
  'top-left':     { x: -1, y: -1 },
  'top-right':    { x:  1, y: -1 },
  'bottom-left':  { x: -1, y:  1 },
  'bottom-right': { x:  1, y:  1 },
};

function computeDirection(
  prevIndex: number,
  nextIndex: number,
  mode: TransitionMode,
): Direction2D {
  if (mode === 'auto') {
    return { x: nextIndex < prevIndex ? -1 : 1, y: 0 };
  }
  return DIR_VECTORS[mode];
}

interface SliderTabsContextValue {
  activeValue: string;
  setActiveValue: (value: string) => void;
  direction: Direction2D;
  values: string[];
  registerValue: (value: string) => void;
}

// ── Context ──

const SliderTabsContext = createContext<SliderTabsContextValue | null>(null);

function useSliderTabs() {
  const ctx = useContext(SliderTabsContext);
  if (!ctx) throw new Error('SliderTabs components must be used within <SliderTabs>');
  return ctx;
}

// ── Root ──

interface SliderTabsProps {
  defaultValue: string;
  value?: string;
  onValueChange?: (value: string) => void;
  transition?: TransitionMode;
  className?: string;
  children: React.ReactNode;
}

export function SliderTabs({
  defaultValue,
  value: controlledValue,
  onValueChange,
  transition = 'auto',
  className,
  children,
}: SliderTabsProps) {
  const [internalValue, setInternalValue] = useState(defaultValue);
  const [direction, setDirection] = useState<Direction2D>({ x: 0, y: 0 });
  const valuesRef = useRef<string[]>([]);
  const prevValueRef = useRef(defaultValue);

  const activeValue = controlledValue ?? internalValue;

  const setActiveValue = useCallback(
    (newValue: string) => {
      const values = valuesRef.current;
      const prevIndex = values.indexOf(prevValueRef.current);
      const nextIndex = values.indexOf(newValue);

      if (prevIndex !== -1 && nextIndex !== -1) {
        setDirection(computeDirection(prevIndex, nextIndex, transition));
      }

      prevValueRef.current = newValue;

      if (!controlledValue) setInternalValue(newValue);
      onValueChange?.(newValue);
    },
    [controlledValue, onValueChange, transition],
  );

  const registerValue = useCallback((value: string) => {
    if (!valuesRef.current.includes(value)) {
      valuesRef.current.push(value);
    }
  }, []);

  return (
    <SliderTabsContext.Provider
      value={{
        activeValue,
        setActiveValue,
        direction,
        values: valuesRef.current,
        registerValue,
      }}
    >
      <div className={cn('flex flex-col', className)}>{children}</div>
    </SliderTabsContext.Provider>
  );
}

// ── List ──

interface SliderTabsListProps {
  className?: string;
  children: React.ReactNode;
}

export function SliderTabsList({ className, children }: SliderTabsListProps) {
  const { activeValue } = useSliderTabs();
  const listRef = useRef<HTMLDivElement>(null);
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 });
  const rafRef = useRef(0);

  const updateIndicator = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      const list = listRef.current;
      if (!list) return;
      const activeEl = list.querySelector<HTMLElement>(`[data-slider-value="${activeValue}"]`);
      if (!activeEl) return;

      const listRect = list.getBoundingClientRect();
      const elRect = activeEl.getBoundingClientRect();

      setIndicatorStyle({
        left: elRect.left - listRect.left,
        width: elRect.width,
      });
    });
  }, [activeValue]);

  useEffect(() => { updateIndicator(); }, [updateIndicator]);

  useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    const ro = new ResizeObserver(updateIndicator);
    ro.observe(list);
    return () => { ro.disconnect(); cancelAnimationFrame(rafRef.current); };
  }, [updateIndicator]);

  return (
    <div
      ref={listRef}
      role="tablist"
      className={cn(
        'relative flex flex-row items-center gap-1 overflow-x-auto scrollbar-none',
        'rounded-xl border border-border/50 bg-background/60 backdrop-blur-xl p-1.5',
        className,
      )}
    >
      {children}
      <motion.div
        className="pointer-events-none absolute bottom-0 z-10 h-[2px] rounded-full bg-gradient-to-r from-primary via-secondary to-accent"
        animate={{
          left: indicatorStyle.left,
          width: indicatorStyle.width,
          bottom: 0,
        }}
        transition={{ type: 'spring', stiffness: 500, damping: 35 }}
      />
    </div>
  );
}

// ── Trigger ──

interface SliderTabsTriggerProps {
  value: string;
  icon?: React.ElementType;
  disabled?: boolean;
  className?: string;
  title?: string;
  children?: React.ReactNode;
}

export function SliderTabsTrigger({
  value,
  icon: Icon,
  disabled,
  className,
  title,
  children,
}: SliderTabsTriggerProps) {
  const { activeValue, setActiveValue, registerValue } = useSliderTabs();
  const isActive = activeValue === value;

  useEffect(() => { registerValue(value); }, [value, registerValue]);

  return (
    <button
      role="tab"
      aria-selected={isActive}
      data-slider-value={value}
      disabled={disabled}
      title={title}
      onClick={() => setActiveValue(value)}
      className={cn(
        'relative inline-flex items-center gap-2 whitespace-nowrap rounded-lg px-4 py-2.5 text-sm font-medium',
        'transition-all duration-200',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        'disabled:pointer-events-none disabled:opacity-50',
        isActive ? 'text-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-muted/40',
        className,
      )}
    >
      {Icon && <Icon className="h-4 w-4 shrink-0" />}
      {children}
    </button>
  );
}

// ── Content ──

interface SliderTabsContentProps {
  value: string;
  className?: string;
  children: React.ReactNode;
}

export function SliderTabsContent({ value, className, children }: SliderTabsContentProps) {
  const { activeValue, direction } = useSliderTabs();
  const isActive = activeValue === value;

  const slideTransition = {
    type: 'spring' as const,
    stiffness: 450,
    damping: 45,
    mass: 0.9,
  };

  return (
    <AnimatePresence mode="popLayout" initial={false} custom={direction}>
      {isActive && (
        <motion.div
          key={value}
          role="tabpanel"
          custom={direction}
          variants={{
            enter: (dir: Direction2D) => ({
              x: dir.x * 120,
              y: dir.y * 80,
              opacity: 0,
            }),
            center: {
              x: 0,
              y: 0,
              opacity: 1,
            },
            exit: (dir: Direction2D) => ({
              x: dir.x * -120,
              y: dir.y * -80,
              opacity: 0,
            }),
          }}
          initial="enter"
          animate="center"
          exit="exit"
          transition={slideTransition}
          className={cn('w-full min-w-0', className)}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ── Content Group ──

interface SliderTabsContentGroupProps {
  className?: string;
  children: React.ReactNode;
}

export function SliderTabsContentGroup({ className, children }: SliderTabsContentGroupProps) {
  return (
    <div
      className={cn(
        'relative mt-4',
        className,
      )}
    >
      {children}
    </div>
  );
}
