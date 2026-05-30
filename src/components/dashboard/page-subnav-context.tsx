'use client';

import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

interface PageSubNavContextType {
  collapsed: boolean;
  toggle: () => void;
}

const PageSubNavContext = createContext<PageSubNavContextType>({
  collapsed: false,
  toggle: () => {},
});

export function PageSubNavProvider({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(true);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const stored = localStorage.getItem('page-subnav-collapsed');
      if (stored === 'true') setCollapsed(true);
    } catch {}
  }, []);

  const toggle = () => {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('page-subnav-collapsed', String(next));
      } catch {}
      return next;
    });
  };

  return (
    <PageSubNavContext.Provider value={{ collapsed, toggle }}>
      {children}
    </PageSubNavContext.Provider>
  );
}

export function usePageSubNav() {
  return useContext(PageSubNavContext);
}
