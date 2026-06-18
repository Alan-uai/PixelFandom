'use client';

import { useState, useRef, useEffect, type ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { WeldingCard } from '@/components/ui/welding-card';

interface CollapsibleSectionProps {
  id: string;
  title: string;
  description?: string;
  defaultOpen?: boolean;
  children: ReactNode;
  className?: string;
}

export function CollapsibleSection({
  id: _id,
  title,
  description,
  defaultOpen = true,
  children,
  className,
}: CollapsibleSectionProps) {
  const [open, setOpen] = useState(defaultOpen);
  const contentRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState(0);

  useEffect(() => {
    if (contentRef.current) {
      setHeight(contentRef.current.scrollHeight);
    }
  }, [open, children]);

  return (
    <WeldingCard className={cn('', className)}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between gap-4 w-full px-6 py-4 text-left cursor-pointer select-none hover:bg-accent/50 transition-colors rounded-t-xl"
      >
        <div className="space-y-1 min-w-0 flex-1">
          <h3 className="font-semibold leading-none tracking-tight">{title}</h3>
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
        className="transition-all duration-300 overflow-hidden"
        style={{ height: open ? height : 0, opacity: open ? 1 : 0 }}
      >
        <div ref={contentRef} className="px-6 pb-4 pt-2">
          {children}
        </div>
      </div>
    </WeldingCard>
  );
}
