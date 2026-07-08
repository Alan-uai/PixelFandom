'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Info } from 'lucide-react';

export function PopoverBlock({ config, preview: _preview }: { config: Record<string, unknown>; preview?: boolean }) {
  const [open, setOpen] = useState(false);
  const trigger = (config.trigger as string) || 'hover';
  const position = (config.position as string) || 'top';
  const title = (config.title as string) || '';
  const content = (config.content as string) || '';
  const triggerText = (config.triggerText as string) || 'Saiba mais';

  const positionClasses: Record<string, string> = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  };

  const arrowClasses: Record<string, string> = {
    top: 'top-full left-1/2 -translate-x-1/2 border-l-transparent border-r-transparent border-b-transparent border-t-muted',
    bottom: 'bottom-full left-1/2 -translate-x-1/2 border-l-transparent border-r-transparent border-t-transparent border-b-muted',
    left: 'left-full top-1/2 -translate-y-1/2 border-t-transparent border-b-transparent border-r-transparent border-l-muted',
    right: 'right-full top-1/2 -translate-y-1/2 border-t-transparent border-b-transparent border-l-transparent border-r-muted',
  };

  const showEvent = trigger === 'click'
    ? { onClick: () => setOpen(!open) }
    : { onMouseEnter: () => setOpen(true), onMouseLeave: () => setOpen(false) };

  return (
    <div className="relative inline-flex">
      <button
        type="button"
        className="inline-flex items-center gap-1.5 text-sm text-primary hover:text-primary/80 transition-colors cursor-pointer"
        {...showEvent}
      >
        <Info className="h-4 w-4" />
        <span>{triggerText}</span>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: position === 'top' ? 4 : position === 'bottom' ? -4 : 0 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: position === 'top' ? 4 : position === 'bottom' ? -4 : 0 }}
            transition={{ duration: 0.15, ease: [0.22, 1, 0.36, 1] }}
            className={`absolute z-50 min-w-[200px] max-w-[300px] rounded-lg border bg-popover p-3 shadow-lg ${positionClasses[position]}`}
            {...(trigger === 'hover' ? { onMouseEnter: () => setOpen(true), onMouseLeave: () => setOpen(false) } : {})}
          >
            <div className={`absolute w-0 h-0 border-4 ${arrowClasses[position]}`} />
            {title && <p className="text-xs font-semibold mb-1">{title}</p>}
            <p className="text-[11px] text-muted-foreground leading-relaxed">{content}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
