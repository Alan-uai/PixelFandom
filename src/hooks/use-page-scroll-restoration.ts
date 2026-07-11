'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

export function usePageScrollRestoration(pageKey?: string) {
  const pathname = usePathname();
  const key = pageKey || pathname;
  const storageKey = `pf:scroll:${key}`;

  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(storageKey);
      if (saved !== null) {
        const scrollY = parseInt(saved, 10);
        if (!isNaN(scrollY)) {
          requestAnimationFrame(() => window.scrollTo(0, scrollY));
        }
      }
    } catch { /* sessionStorage may be unavailable */ }

    const save = () => {
      try {
        sessionStorage.setItem(storageKey, String(window.scrollY));
      } catch { /* sessionStorage may be unavailable */ }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') save();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', save);

    return () => {
      save();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', save);
    };
  }, [storageKey]);
}
