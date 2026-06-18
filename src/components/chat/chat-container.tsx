'use client';

import { useRef, useEffect, useCallback } from 'react';
import { AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface ChatContainerProps {
  children: React.ReactNode;
  className?: string;
}

export function ChatContainer({ children, className }: ChatContainerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const isAtBottomRef = useRef(true);

  const scrollToBottom = useCallback(() => {
    if (!containerRef.current || !isAtBottomRef.current) return;
    containerRef.current.scrollTo({
      top: containerRef.current.scrollHeight,
      behavior: 'smooth',
    });
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new MutationObserver(scrollToBottom);
    observer.observe(container, { childList: true, subtree: true });

    const handleScroll = () => {
      if (!container) return;
      const { scrollTop, scrollHeight, clientHeight } = container;
      isAtBottomRef.current = scrollTop + clientHeight >= scrollHeight - 100;
    };

    container.addEventListener('scroll', handleScroll);
    return () => {
      observer.disconnect();
      container.removeEventListener('scroll', handleScroll);
    };
  }, [scrollToBottom]);

  return (
    <div
      ref={containerRef}
      className={cn(
        'flex-1 overflow-y-auto p-4 space-y-4',
        className
      )}
      role="log"
      aria-live="polite"
      aria-atomic="false"
    >
      <AnimatePresence mode="popLayout">{children}</AnimatePresence>
    </div>
  );
}
