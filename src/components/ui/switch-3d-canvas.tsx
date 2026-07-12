'use client';

import dynamic from 'next/dynamic';
import { cn } from '@/lib/utils';

const SwitchScene = dynamic(
  () => import('./switch-3d-scene').then((m) => ({ default: m.SwitchScene })),
  { ssr: false },
);

export interface Switch3DCanvasProps {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  disabled?: boolean;
  id?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeMap = {
  sm: { container: 'h-5 w-9' },
  md: { container: 'h-6 w-11' },
  lg: { container: 'h-7 w-[52px]' },
};

export function Switch3DCanvas({
  checked = false,
  onCheckedChange,
  disabled = false,
  id,
  size = 'md',
  className,
}: Switch3DCanvasProps) {
  return (
    <div
      id={id}
      className={cn(
        'relative overflow-hidden rounded-full',
        sizeMap[size].container,
        disabled ? 'cursor-not-allowed opacity-40' : 'cursor-pointer',
        className,
      )}
      onClick={() => {
        if (!disabled) onCheckedChange?.(!checked);
      }}
    >
      <SwitchScene checked={checked} onChange={(v) => onCheckedChange?.(v)} disabled={disabled} />
    </div>
  );
}
