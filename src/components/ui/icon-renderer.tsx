'use client';

import { Icon } from '@iconify/react';
import Image from 'next/image';
import { motion, type Variants } from 'framer-motion';
import { type CSSProperties } from 'react';

export type AnimationStyle = 'none' | 'pulse' | 'spin' | 'bounce' | 'shake' | 'wiggle' | 'float' | 'glow';

const SIZE_MAP: Record<string, number> = {
  sm: 16,
  md: 20,
  lg: 28,
  xl: 36,
  '2xl': 48,
  '3xl': 64,
};

const animationVariants: Record<AnimationStyle, Variants> = {
  none: {},
  pulse: {
    animate: { scale: [1, 1.15, 1] },
  },
  spin: {
    animate: { rotate: [0, 360] },
  },
  bounce: {
    animate: { y: [0, -4, 0] },
  },
  shake: {
    animate: { x: [0, -3, 3, -3, 3, 0] },
  },
  wiggle: {
    animate: { rotate: [0, -8, 8, -8, 8, 0] },
  },
  float: {
    animate: { y: [0, -6, 0] },
  },
  glow: {
    animate: { opacity: [0.7, 1, 0.7] },
  },
};

const animationTransitions: Record<AnimationStyle, Record<string, unknown>> = {
  none: {},
  pulse: { duration: 1.2, repeat: Infinity, ease: 'easeInOut' },
  spin: { duration: 2, repeat: Infinity, ease: 'linear' },
  bounce: { duration: 0.8, repeat: Infinity, ease: 'easeInOut' },
  shake: { duration: 0.5, repeat: Infinity, ease: 'easeInOut' },
  wiggle: { duration: 0.4, repeat: Infinity, ease: 'easeInOut' },
  float: { duration: 2, repeat: Infinity, ease: 'easeInOut' },
  glow: { duration: 1.5, repeat: Infinity, ease: 'easeInOut' },
};

export interface IconDef {
  icon: string;
  animation?: AnimationStyle;
}

interface IconRendererProps {
  icon: string | IconDef;
  animation?: AnimationStyle;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | number;
  className?: string;
  style?: CSSProperties;
}

function pascalToKebab(name: string): string {
  return name
    .replace(/([A-Z]{2,})([A-Z][a-z])/g, '$1-$2')
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .replace(/([a-zA-Z])(\d)/g, '$1-$2')
    .toLowerCase();
}

function isUrlIcon(value: string): boolean {
  return value.startsWith('http://') || value.startsWith('https://');
}

function isIconifyIcon(value: string): boolean {
  return value.includes(':') && !value.startsWith('http');
}

export function IconRenderer({ icon, animation: animProp, size = 'md', style, className }: IconRendererProps) {
  const iconId = typeof icon === 'string' ? icon : icon.icon;
  const anim = typeof icon === 'string' ? (animProp || 'none') : (icon.animation || 'none');
  const dim = typeof size === 'number' ? size : (SIZE_MAP[size] || 20);
  const variants = animationVariants[anim];
  const transition = animationTransitions[anim];

  let iconEl: React.ReactNode;

  if (isUrlIcon(iconId)) {
    iconEl = <Image src={iconId} alt="" width={dim} height={dim} className={className} style={style as CSSProperties} />;
  } else if (isIconifyIcon(iconId)) {
    iconEl = <Icon icon={iconId} width={dim} height={dim} style={style as CSSProperties} className={className} />;
  } else {
    iconEl = <Icon icon={`lucide:${pascalToKebab(iconId)}`} width={dim} height={dim} style={style as CSSProperties} className={className} />;
  }

  if (anim === 'none' || !anim) return iconEl;

  return (
    <motion.div
      variants={variants}
      animate="animate"
      transition={transition}
      style={{ display: 'inline-flex', lineHeight: 0 }}
    >
      {iconEl}
    </motion.div>
  );
}

export function isIconDef(value: unknown): value is IconDef {
  return typeof value === 'object' && value !== null && 'icon' in value;
}

export function resolveIconValue(value: string | IconDef | undefined): string {
  if (!value) return 'lucide:star';
  if (typeof value === 'string') return value;
  return value.icon || 'lucide:star';
}

export function parseIconId(iconId: string): { provider: string; name: string } {
  const idx = iconId.indexOf(':');
  if (idx === -1) return { provider: 'lucide', name: iconId };
  return { provider: iconId.slice(0, idx), name: iconId.slice(idx + 1) };
}
