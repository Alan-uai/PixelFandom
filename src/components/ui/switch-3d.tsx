'use client';

import { useRef, useCallback, useState, forwardRef } from 'react';
import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  AnimatePresence,
} from 'framer-motion';
import { cn } from '@/lib/utils';

function SwitchParticles({ color }: { color: string }) {
  const particles = Array.from({ length: 8 }, (_, i) => ({
    id: i,
    angle: (i / 8) * Math.PI * 2 + (Math.random() - 0.5) * 0.5,
    distance: 12 + Math.random() * 22,
    size: 1.5 + Math.random() * 2,
  }));

  return (
    <div className="pointer-events-none absolute inset-0 z-20 overflow-hidden">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute left-1/2 top-1/2 rounded-full"
          style={{
            width: p.size,
            height: p.size,
            backgroundColor: color,
            boxShadow: `0 0 4px ${color}`,
          }}
          initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
          animate={{
            x: Math.cos(p.angle) * p.distance,
            y: Math.sin(p.angle) * p.distance,
            opacity: [1, 0.6, 0],
            scale: [1, 0.3, 0],
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

export interface Switch3DProps {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  defaultChecked?: boolean;
  disabled?: boolean;
  name?: string;
  value?: string;
  id?: string;
  size?: 'sm' | 'md' | 'lg';
  showParticles?: boolean;
  label?: string;
  labelPosition?: 'left' | 'right';
  className?: string;
}

const PRIMARY = 'hsl(var(--primary))';
const PRIMARY_FG = 'hsl(var(--primary-foreground))';

const sizeMap = {
  sm: { trackClass: 'h-5 w-9', knobClass: 'h-[14px] w-[14px]', offset: 16 },
  md: { trackClass: 'h-6 w-11', knobClass: 'h-4 w-4', offset: 20 },
  lg: { trackClass: 'h-7 w-[52px]', knobClass: 'h-[18px] w-[18px]', offset: 24 },
};

export const Switch3D = forwardRef<HTMLButtonElement, Switch3DProps>(
  (
    {
      checked: controlledChecked,
      onCheckedChange,
      defaultChecked,
      disabled = false,
      name,
      value,
      id,
      size = 'md',
      showParticles = true,
      label,
      labelPosition = 'right',
      className,
    },
    ref,
  ) => {
    const isControlled = controlledChecked !== undefined;
    const [internalChecked, setInternalChecked] = useState(defaultChecked ?? false);
    const checked = isControlled ? controlledChecked : internalChecked;
    const [particleKey, setParticleKey] = useState(0);
    const internalRef = useRef<HTMLButtonElement>(null);
    const resolvedRef = (ref || internalRef) as React.RefObject<HTMLButtonElement>;

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
        const rect = resolvedRef.current?.getBoundingClientRect();
        if (!rect) return;
        x.set((e.clientX - rect.left) / rect.width);
        y.set((e.clientY - rect.top) / rect.height);
      },
      [disabled, x, y, resolvedRef],
    );

    const handleMouseLeave = useCallback(() => {
      x.set(0.5);
      y.set(0.5);
    }, [x, y]);

    const handleToggle = useCallback(() => {
      if (disabled) return;
      const next = !checked;
      if (!isControlled) setInternalChecked(next);
      onCheckedChange?.(next);
      if (next && showParticles) {
        setParticleKey((k) => k + 1);
      }
    }, [disabled, checked, isControlled, onCheckedChange, showParticles]);

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
    const glowSize = size === 'sm' ? 4 : size === 'lg' ? 10 : 6;

    const switchEl = (
      <motion.button
        ref={resolvedRef}
        type="button"
        role="switch"
        aria-checked={checked}
        aria-disabled={disabled}
        disabled={disabled}
          name={name}
        value={value}
        id={id}
        onClick={handleToggle}
        onKeyDown={handleKeyDown}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className={cn(
          'relative flex shrink-0 items-center rounded-full outline-none',
          'focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
          dims.trackClass,
          disabled && 'cursor-not-allowed opacity-40',
          !disabled && 'cursor-pointer',
        )}
        style={{ perspective: '600px', transformStyle: 'preserve-3d' }}
        animate={{
          backgroundColor: checked ? PRIMARY : 'hsl(var(--input))',
          boxShadow: checked
            ? [
                `0 0 ${glowSize}px ${PRIMARY}/0.35`,
                `inset 0 1px 0 ${PRIMARY_FG}/0.08`,
              ].join(', ')
            : 'inset 0 1.5px 3px rgba(0,0,0,0.25), 0 1px 0 rgba(255,255,255,0.04)',
        }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        whileHover={!disabled ? { scale: 1.06, transition: { duration: 0.15 } } : undefined}
        whileTap={!disabled ? { scale: 0.94 } : undefined}
      >
        {/* Inner shadow / highlight overlay */}
        <motion.div
          className="pointer-events-none absolute inset-0 rounded-full"
          style={{ transformStyle: 'preserve-3d', translateZ: '-1px' }}
          animate={{
            background: checked
              ? 'linear-gradient(135deg, rgba(255,255,255,0.12), transparent 60%)'
              : 'linear-gradient(135deg, rgba(0,0,0,0.15), transparent 60%)',
          }}
          transition={{ duration: 0.3 }}
        />

        {/* Knob */}
        <motion.div
          className={cn(
            'relative z-10 rounded-full',
            dims.knobClass,
          )}
          style={{ transformStyle: 'preserve-3d' }}
          animate={{
            x: checked ? dims.offset : 0,
            translateZ: checked ? 4 : 2,
            background: checked
              ? `radial-gradient(circle at 32% 28%, ${PRIMARY_FG}, hsl(var(--primary-foreground)/0.8))`
              : 'radial-gradient(circle at 32% 28%, hsl(var(--background)), hsl(var(--background)/0.75))',
            boxShadow: checked
              ? `0 2px 8px ${PRIMARY}/0.5, 0 0 14px ${PRIMARY}/0.2, inset 0 1px 0 ${PRIMARY_FG}/0.3`
              : '0 2px 4px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.08)',
          }}
          transition={{
            type: 'spring',
            stiffness: 550,
            damping: 32,
            mass: 1,
          }}
        >
          {/* Knob gloss highlight */}
          <div
            className="pointer-events-none absolute inset-0 rounded-full"
            style={{
              background:
                'radial-gradient(circle at 33% 22%, rgba(255,255,255,0.35), transparent 55%)',
            }}
          />
        </motion.div>

        {/* Glow ring pulse (checked only) */}
        <AnimatePresence>
          {checked && (
            <motion.div
              className="pointer-events-none absolute inset-0 rounded-full"
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1.2 }}
              exit={{ opacity: 0, scale: 0.85 }}
              transition={{ duration: 0.35 }}
              style={{
                border: `2px solid ${PRIMARY}/0.25`,
                filter: 'blur(3px)',
              }}
            />
          )}
        </AnimatePresence>

        {/* 3D tilt overlay */}
        <motion.div
          className="pointer-events-none absolute inset-0 rounded-full"
          style={{
            rotateX: checked ? 0 : rotateX,
            rotateY: checked ? 0 : rotateY,
            transformStyle: 'preserve-3d',
          }}
        />

        {/* Particles */}
        {!disabled && showParticles && (
          <AnimatePresence mode="popLayout">
            {particleKey > 0 && (
              <motion.div
                key={particleKey}
                initial={{ opacity: 1 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4 }}
              >
                <SwitchParticles color={PRIMARY} />
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </motion.button>
    );

    if (!label) return switchEl;

    return (
      <label
        className={cn(
          'inline-flex items-center gap-2',
          labelPosition === 'left' && 'flex-row-reverse',
          disabled && 'opacity-40',
          className,
        )}
      >
        {switchEl}
        <span
          className={cn(
            'select-none text-sm',
            disabled ? 'cursor-not-allowed' : 'cursor-pointer',
          )}
        >
          {label}
        </span>
      </label>
    );
  },
);

Switch3D.displayName = 'Switch3D';
