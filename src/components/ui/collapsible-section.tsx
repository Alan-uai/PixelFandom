'use client';

import { useState, useRef, useEffect, useCallback, type ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { WeldingCard } from '@/components/ui/welding-card';

interface CollapsibleSectionProps {
  id: string;
  title: string;
  description?: string;
  defaultOpen?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: ReactNode;
  className?: string;
  corner?: ReactNode;
  storageKey?: string;
  titleIcon?: ReactNode;
}

function getStoredOpen(key: string, fallback: boolean): boolean {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = sessionStorage.getItem(key);
    if (raw !== null) return JSON.parse(raw);
  } catch { /* sessionStorage may be unavailable */ }
  return fallback;
}

function saveStoredOpen(key: string, open: boolean): void {
  try {
    sessionStorage.setItem(key, JSON.stringify(open));
  } catch { /* sessionStorage may be unavailable */ }
}

export function CollapsibleSection({
  id: _id,
  title,
  description,
  defaultOpen = true,
  open: controlledOpen,
  onOpenChange,
  children,
  className,
  corner,
  storageKey,
  titleIcon,
}: CollapsibleSectionProps) {
  const persistentKey = storageKey ? `pf:collapsible:${storageKey}` : undefined;
  const initialOpen = persistentKey ? getStoredOpen(persistentKey, defaultOpen) : defaultOpen;
  const [internalOpen, setInternalOpen] = useState(initialOpen);
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;

  const handleToggle = useCallback(() => {
    const next = !open;
    if (onOpenChange) {
      onOpenChange(next);
    } else {
      setInternalOpen(next);
      if (persistentKey) saveStoredOpen(persistentKey, next);
    }
  }, [open, onOpenChange, persistentKey]);

  const contentRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState(0);
  const [overflowHidden, setOverflowHidden] = useState(true);

  useEffect(() => {
    if (contentRef.current) {
      setHeight(contentRef.current.scrollHeight);
    }
  }, [open, children]);

  useEffect(() => {
    if (open) {
      const timer = setTimeout(() => setOverflowHidden(false), 300);
      return () => clearTimeout(timer);
    } else {
      setOverflowHidden(true);
    }
  }, [open]);

  return (
    <WeldingCard className={cn('relative', className)}>
      {corner && (
        <div className="absolute -top-2 -right-2 z-20 flex items-center gap-0.5">
          {corner}
        </div>
      )}
      <button
        onClick={handleToggle}
        className="flex items-center justify-between gap-4 w-full px-6 py-4 text-left cursor-pointer select-none hover:bg-accent/50 transition-colors rounded-t-xl"
      >
        <div className="space-y-1 min-w-0 flex-1">
          <h3 className="font-semibold leading-none tracking-tight flex items-center gap-2">
            {titleIcon && <span className="shrink-0">{titleIcon}</span>}
            {title}
          </h3>
          {description && (
            <p className="text-sm text-muted-foreground">{description}</p>
          )}
        </div>
        <div
          className={`shrink-0 transition-transform duration-300 ${open ? 'rotate-180 scale-110' : ''}`}
        >
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        </div>
      </button>

      <div
        className="transition-all duration-300"
        style={{ height: open ? height : 0, opacity: open ? 1 : 0, overflow: overflowHidden ? 'hidden' : 'visible' }}
      >
        <div ref={contentRef} className="px-6 pb-4 pt-2">
          {children}
        </div>
      </div>
    </WeldingCard>
  );
}
