'use client';

import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CollapsibleSectionProps {
  id: string;
  title: string;
  description?: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
  className?: string;
}

export function CollapsibleSection({
  id,
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
    <section id={id} className={cn('rounded-xl border bg-card text-card-foreground shadow-sm', className)}>
      <motion.button
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between gap-4 w-full px-6 py-4 text-left cursor-pointer select-none hover:bg-accent/50 transition-colors rounded-t-xl"
        whileTap={{ scale: 0.995 }}
        style={{ perspective: 1000, transformStyle: 'preserve-3d' }}
      >
        <div className="space-y-1 min-w-0 flex-1">
          <motion.h3
            className="font-semibold leading-none tracking-tight"
            animate={{
              color: open ? 'hsl(var(--primary))' : 'inherit',
              x: open ? 4 : 0,
            }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
          >
            {title}
          </motion.h3>
          {description && (
            <p className="text-sm text-muted-foreground">{description}</p>
          )}
        </div>
        <motion.div
          animate={{ rotate: open ? 180 : 0, scale: open ? 1.2 : 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 12, mass: 0.8 }}
          style={{ transformStyle: 'preserve-3d' }}
        >
          <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
        </motion.div>
      </motion.button>

      <motion.div
        initial={false}
        animate={{
          height: open ? height : 0,
          opacity: open ? 1 : 0,
          rotateX: open ? 0 : -15,
          scaleY: open ? 1 : 0.92,
          filter: open ? 'blur(0px)' : 'blur(6px)',
        }}
        transition={{
          duration: 0.5,
          ease: [0.22, 1, 0.36, 1],
          height: { duration: 0.4, ease: [0.22, 1, 0.36, 1] },
          opacity: { duration: 0.3, delay: open ? 0.08 : 0 },
          rotateX: { duration: 0.45 },
          scaleY: { duration: 0.4 },
          filter: { duration: 0.35, delay: open ? 0.05 : 0 },
        }}
        style={{
          transformOrigin: 'top center',
          perspective: 1200,
          transformStyle: 'preserve-3d',
          overflow: 'hidden',
        }}
      >
        <div ref={contentRef} className="px-6 pb-4">
          {children}
        </div>
      </motion.div>
    </section>
  );
}
