'use client';

import { createContext, useEffect, useRef, type ReactNode, type MutableRefObject } from 'react';

interface NavigationGuard {
  isDirty: boolean;
  confirmNavigation: (url: string) => void;
}

export const UnsavedChangesContext = createContext<MutableRefObject<NavigationGuard>>(
  null as unknown as MutableRefObject<NavigationGuard>
);

export function UnsavedChangesProvider({ children }: { children: ReactNode }) {
  const guardRef = useRef<NavigationGuard>({ isDirty: false, confirmNavigation: () => {} });

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const link = target.closest<HTMLAnchorElement>('a');
      if (!link) return;
      if (!guardRef.current.isDirty) return;

      const href = link.getAttribute('href');
      if (!href) return;

      if (
        href.startsWith('http') ||
        href.startsWith('//') ||
        href.startsWith('mailto:') ||
        href.startsWith('tel:') ||
        href.startsWith('#')
      ) return;

      if (link.target === '_blank') return;

      e.preventDefault();
      e.stopPropagation();
      guardRef.current.confirmNavigation(href);
    };

    document.addEventListener('click', handleClick, true);
    return () => document.removeEventListener('click', handleClick, true);
  }, []);

  return (
    <UnsavedChangesContext.Provider value={guardRef}>
      {children}
    </UnsavedChangesContext.Provider>
  );
}
