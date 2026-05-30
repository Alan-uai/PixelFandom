'use client';

import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { PanelLeft } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { usePageSubNav } from '@/components/dashboard/page-subnav-context';

interface Section {
  id: string;
  label: string;
  icon: LucideIcon;
}

interface PageSubNavProps {
  sections: Section[];
}

export function PageSubNav({ sections }: PageSubNavProps) {
  const { collapsed } = usePageSubNav();
  const [activeId, setActiveId] = useState(sections[0]?.id);

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
        'sticky top-[66px] shrink-0 self-start border-r bg-muted/30 flex flex-col transition-all duration-200',
        collapsed ? 'w-12' : 'w-48'
      )}
    >
      {!collapsed && (
        <div className="px-4 pt-3 pb-1">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider truncate">
            Seções
          </p>
        </div>
      )}
      <nav className="flex-1 overflow-y-auto scrollbar-none px-3 pb-3 space-y-1 pt-2">
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
