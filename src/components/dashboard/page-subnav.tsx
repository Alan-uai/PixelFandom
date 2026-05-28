'use client';

import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { PanelLeft, PanelLeftClose } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface Section {
  id: string;
  label: string;
  icon: LucideIcon;
}

interface PageSubNavProps {
  sections: Section[];
}

export function PageSubNav({ sections }: PageSubNavProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [activeId, setActiveId] = useState(sections[0]?.id);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const stored = localStorage.getItem('page-subnav-collapsed');
      if (stored === 'true') setCollapsed(true);
    } catch {}
  }, []);

  const toggle = () => {
    const next = !collapsed;
    setCollapsed(next);
    try {
      localStorage.setItem('page-subnav-collapsed', String(next));
    } catch {}
  };

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible.length > 0) {
          setActiveId(visible[0].target.id);
        }
      },
      { rootMargin: '-80px 0px -60% 0px', threshold: 0 }
    );

    sections.forEach((s) => {
      const el = document.getElementById(s.id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [sections]);

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <aside
      className={cn(
        'sticky top-20 shrink-0 self-start border-r bg-muted/30 flex flex-col transition-all duration-200',
        collapsed ? 'w-12' : 'w-48'
      )}
    >
      <div className="flex items-center gap-1 p-3">
        {!collapsed && (
          <p className="px-2 text-xs font-medium text-muted-foreground uppercase tracking-wider truncate flex-1">
            Seções
          </p>
        )}
        <button
          onClick={toggle}
          className="rounded-md p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          title={collapsed ? 'Expandir seções' : 'Recolher seções'}
        >
          {collapsed ? <PanelLeft className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
        </button>
      </div>
      <nav className="flex-1 overflow-y-auto px-3 pb-3 space-y-1">
        {sections.map((s) => {
          const Icon = s.icon;
          const isActive = activeId === s.id;
          return (
            <button
              key={s.id}
              onClick={() => scrollTo(s.id)}
              title={collapsed ? s.label : undefined}
              className={cn(
                'w-full flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors text-left',
                isActive
                  ? 'bg-primary/10 text-primary font-medium'
                  : 'hover:bg-muted text-muted-foreground'
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {!collapsed && <span className="truncate">{s.label}</span>}
            </button>
          );
        })}
      </nav>
    </aside>
  );
}
