'use client';

import { useRef, useState, useCallback, useMemo, useEffect } from 'react';
import {
  motion,
  AnimatePresence,
  useMotionValue,
  useSpring,
  useTransform,
} from 'framer-motion';
import { format, parse, addMonths, subMonths, setHours, setMinutes } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Clock, CalendarIcon } from 'lucide-react';
import dynamic from 'next/dynamic';
import { cn } from '@/lib/utils';

const THREE_SCENE_ENABLED = true;

const DateTimeScene3D = dynamic(
  () => import('./date-time-picker-3d-scene').then((m) => ({ default: m.DateTimeScene3D })),
  { ssr: false },
);

type PickerMode = 'date' | 'time' | 'datetime';

interface DateTimePicker3DProps {
  mode: PickerMode;
  value: string;
  onChange: (value: string) => void;
  min?: string;
  max?: string;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
const MINUTES = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'));

function formatDisplayValue(mode: PickerMode, value: string): string {
  if (!value) return '';
  try {
    if (mode === 'date') {
      const d = parse(value, 'yyyy-MM-dd', new Date());
      return format(d, 'dd/MM/yyyy', { locale: ptBR });
    }
    if (mode === 'time') {
      return value.slice(0, 5);
    }
    const d = new Date(value);
    return format(d, 'dd/MM/yyyy HH:mm', { locale: ptBR });
  } catch {
    return value;
  }
}

function getPlaceholder(mode: PickerMode): string {
  switch (mode) {
    case 'date': return 'Selecionar data...';
    case 'time': return 'Selecionar horário...';
    case 'datetime': return 'Selecionar data e hora...';
  }
}

function TimeWheel3D({
  label,
  items,
  value,
  onChange,
}: {
  label: string;
  items: string[];
  value: string;
  onChange: (v: string) => void;
}) {
  const itemHeight = 28;
  const visibleItems = 5;
  const containerHeight = itemHeight * visibleItems;

  const selectedIndex = items.indexOf(value);
  const scrollY = useMotionValue(-(selectedIndex >= 0 ? selectedIndex : 0) * itemHeight);

  const ySpring = useSpring(scrollY, {
    stiffness: 200,
    damping: 25,
    mass: 0.5,
  });

  const snapToIndex = useCallback((index: number) => {
    const clamped = Math.max(0, Math.min(index, items.length - 1));
    scrollY.set(-clamped * itemHeight);
    onChange(items[clamped]);
  }, [items, onChange, scrollY]);

  const handleDragEnd = useCallback(() => {
    const currentY = scrollY.get();
    const index = Math.round(-currentY / itemHeight);
    snapToIndex(index);
  }, [scrollY, itemHeight, snapToIndex]);

  return (
    <div className="flex flex-col items-center gap-1">
      <span className="text-[10px] font-medium text-muted-foreground/60 uppercase tracking-wider">{label}</span>
      <div
        className="relative overflow-hidden rounded-lg"
        style={{ height: containerHeight }}
      >
        <div
          className="absolute inset-0 pointer-events-none z-10"
          style={{
            background: 'linear-gradient(to bottom, hsl(var(--background)) 0%, transparent 30%, transparent 70%, hsl(var(--background)) 100%)',
          }}
        />
        <motion.div
          drag="y"
          dragConstraints={{ top: -(items.length * itemHeight - containerHeight), bottom: 0 }}
          dragElastic={0.1}
          onDragEnd={handleDragEnd}
          style={{ y: ySpring }}
          className="relative cursor-grab active:cursor-grabbing"
        >
          {items.map((item, i) => {
            const isSelected = item === value;
            return (
              <motion.div
                key={item}
                onClick={() => snapToIndex(i)}
                className={cn(
                  'flex items-center justify-center h-7 w-12 text-sm rounded-md transition-colors',
                  'outline-none focus-visible:ring-2 focus-visible:ring-primary/50',
                  isSelected
                    ? 'text-primary font-bold'
                    : 'text-muted-foreground/60 hover:text-foreground/80',
                )}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
              >
                {item}
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </div>
  );
}

function formatDateValue(mode: PickerMode, date?: Date, time?: string): string {
  if (mode === 'date' && date) {
    return format(date, 'yyyy-MM-dd');
  }
  if (mode === 'time') {
    return time || '';
  }
  if (mode === 'datetime' && date) {
    const [h = '00', m = '00'] = (time || '00:00').split(':');
    const d = setMinutes(setHours(date, parseInt(h)), parseInt(m));
    return d.toISOString();
  }
  return '';
}

function parseDateValue(mode: PickerMode, value: string): { date?: Date; time?: string } {
  if (!value) return {};
  try {
    if (mode === 'date') {
      return { date: parse(value, 'yyyy-MM-dd', new Date()) };
    }
    if (mode === 'time') {
      return { time: value.slice(0, 5) };
    }
    const d = new Date(value);
    if (isNaN(d.getTime())) return {};
    return {
      date: d,
      time: `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`,
    };
  } catch {
    return {};
  }
}

export function DateTimePicker3D({
  mode,
  value,
  onChange,
  min: _min,
  max: _max,
  placeholder,
  className,
  disabled,
}: DateTimePicker3DProps) {
  const [open, setOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(() => {
    const { date } = parseDateValue(mode, value);
    return date || new Date();
  });
  const ref = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const x = useMotionValue(0.5);
  const y = useMotionValue(0.5);

  const rotateX = useSpring(useTransform(y, [0, 1], [6, -6]), { stiffness: 150, damping: 20 });
  const rotateY = useSpring(useTransform(x, [0, 1], [-6, 6]), { stiffness: 150, damping: 20 });

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!open) return;
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    x.set((e.clientX - rect.left) / rect.width);
    y.set((e.clientY - rect.top) / rect.height);
  }, [open, x, y]);

  const handleMouseLeave = useCallback(() => {
    x.set(0.5);
    y.set(0.5);
  }, [x, y]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const { date: parsedDate, time: parsedTime } = useMemo(
    () => parseDateValue(mode, value),
    [mode, value],
  );

  const handleDateSelect = useCallback((d: Date) => {
    setCurrentMonth(d);
    const newValue = formatDateValue(mode, d, parsedTime);
    onChange(newValue);
    if (mode === 'date') {
      setOpen(false);
    }
  }, [mode, onChange, parsedTime]);

  const handleTimeChange = useCallback((type: 'hours' | 'minutes', val: string) => {
    const currentTime = parsedTime || '00:00';
    const [h, m] = currentTime.split(':');
    const newTime = type === 'hours' ? `${val}:${m}` : `${h}:${val}`;
    const newValue = formatDateValue(mode, parsedDate, newTime);
    onChange(newValue);
  }, [mode, onChange, parsedDate, parsedTime]);

  const handle3DTimeChange = useCallback((time: string) => {
    if (mode === 'time') {
      onChange(time);
    }
  }, [mode, onChange]);

  const currentTime = parsedTime || '00:00';
  const [currentHours, currentMinutes] = currentTime.split(':');

  const displayText = value ? formatDisplayValue(mode, value) : '';

  const showCalendar = mode === 'date' || mode === 'datetime';

  const handlePrevMonth = useCallback(() => setCurrentMonth((m) => subMonths(m, 1)), []);
  const handleNextMonth = useCallback(() => setCurrentMonth((m) => addMonths(m, 1)), []);

  return (
    <div ref={ref} className={cn('relative', className)}>
      <motion.button
        ref={triggerRef}
        type="button"
        onClick={() => !disabled && setOpen((prev) => !prev)}
        disabled={disabled}
        whileHover={!disabled ? { scale: 1.02 } : undefined}
        whileTap={!disabled ? { scale: 0.97 } : undefined}
        className={cn(
          'relative flex items-center gap-2 h-8 w-full rounded-lg border bg-background px-2.5 text-sm',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50',
          'transition-colors overflow-hidden',
          open
            ? 'border-primary/50 shadow-[0_0_12px_-2px_hsl(var(--primary)/0.3)]'
            : 'border-input hover:border-muted-foreground/30',
          disabled && 'opacity-50 cursor-not-allowed',
        )}
      >
        <motion.div
          className="h-4 w-4 shrink-0 text-muted-foreground/70"
          animate={open ? { rotate: 180, scale: 1.1 } : { rotate: 0, scale: 1 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        >
          {mode === 'time' ? (
            <Clock className="h-full w-full" />
          ) : (
            <CalendarIcon className="h-full w-full" />
          )}
        </motion.div>
        <span
          className={cn(
            'truncate flex-1 text-left',
            value ? 'text-foreground/90 font-medium' : 'text-muted-foreground/60',
          )}
        >
          {value ? displayText : (placeholder || getPlaceholder(mode))}
        </span>
        {value && (
          <motion.button
            type="button"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            onClick={(e) => {
              e.stopPropagation();
              onChange('');
            }}
            whileHover={{ scale: 1.2 }}
            whileTap={{ scale: 0.8 }}
            className="h-3.5 w-3.5 rounded-full bg-muted-foreground/20 flex items-center justify-center text-[8px] text-muted-foreground/60 hover:bg-muted-foreground/30 hover:text-foreground/80 shrink-0"
          >
            ✕
          </motion.button>
        )}
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scaleY: 0.85, rotateX: -8, y: -4 }}
            animate={{ opacity: 1, scaleY: 1, rotateX: 0, y: 0 }}
            exit={{ opacity: 0, scaleY: 0.85, rotateX: -8, y: -4 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            style={{
              transformOrigin: 'top center',
              perspective: 1000,
              rotateX,
              rotateY,
            }}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            className={cn(
              'absolute top-full left-0 right-0 mt-1.5 z-50 min-w-[280px]',
              'rounded-xl border border-border/60',
              'bg-background/85 backdrop-blur-2xl backdrop-saturate-150',
              'shadow-[0_8px_32px_-8px_rgba(0,0,0,0.4),0_0_0_1px_rgba(255,255,255,0.05)_inset]',
              'overflow-hidden',
            )}
          >
            <div className="relative p-3 space-y-2">
              {showCalendar && (
                <div className="flex items-center justify-between">
                  <motion.button
                    type="button"
                    onClick={handlePrevMonth}
                    whileHover={{ scale: 1.1, x: -1 }}
                    whileTap={{ scale: 0.9 }}
                    className="h-6 w-6 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent/50"
                  >
                    <ChevronLeft className="h-3.5 w-3.5" />
                  </motion.button>
                  <AnimatePresence mode="wait">
                    <motion.span
                      key={format(currentMonth, 'yyyy-MM')}
                      initial={{ opacity: 0, rotateY: -45, filter: 'blur(4px)' }}
                      animate={{ opacity: 1, rotateY: 0, filter: 'blur(0px)' }}
                      exit={{ opacity: 0, rotateY: 45, filter: 'blur(4px)' }}
                      transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                      className="text-xs font-semibold"
                      style={{ perspective: 500, transformStyle: 'preserve-3d' }}
                    >
                      {format(currentMonth, 'MMMM yyyy', { locale: ptBR })}
                    </motion.span>
                  </AnimatePresence>
                  <motion.button
                    type="button"
                    onClick={handleNextMonth}
                    whileHover={{ scale: 1.1, x: 1 }}
                    whileTap={{ scale: 0.9 }}
                    className="h-6 w-6 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent/50"
                  >
                    <ChevronRight className="h-3.5 w-3.5" />
                  </motion.button>
                </div>
              )}

              <div className="relative w-full h-[190px] rounded-lg overflow-hidden bg-black/10">
                {THREE_SCENE_ENABLED && (
                  <DateTimeScene3D
                    mode={mode}
                    value={value}
                    onTimeChange={handle3DTimeChange}
                    onDateSelect={handleDateSelect}
                    displayMonth={currentMonth}
                    onMonthChange={setCurrentMonth}
                  />
                )}
              </div>

              <div className="text-center py-0.5">
                <span className="text-sm font-semibold text-foreground/80">
                  {value ? formatDisplayValue(mode, value) : (mode === 'time' ? '--:--' : 'Selecione...')}
                </span>
              </div>

              {mode === 'datetime' && (
                <div className="flex items-center justify-center gap-3 pt-1 border-t border-border/30">
                  <TimeWheel3D
                    label="Hora"
                    items={HOURS}
                    value={currentHours}
                    onChange={(v) => handleTimeChange('hours', v)}
                  />
                  <span className="text-lg font-bold text-muted-foreground/40 mt-6">:</span>
                  <TimeWheel3D
                    label="Min"
                    items={MINUTES}
                    value={currentMinutes}
                    onChange={(v) => handleTimeChange('minutes', v)}
                  />
                </div>
              )}

              {mode !== 'date' && (
                <motion.button
                  type="button"
                  onClick={() => setOpen(false)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full py-1.5 rounded-lg bg-primary/10 text-primary text-xs font-medium hover:bg-primary/20 transition-colors"
                >
                  Confirmar
                </motion.button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
