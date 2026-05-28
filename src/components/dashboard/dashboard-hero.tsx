'use client';

import Link from 'next/link';
import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

interface DashboardHeroProps {
  wikiSlug: string;
  items: NavItem[];
  currentPath: string;
}

export function DashboardHero({ wikiSlug, items, currentPath }: DashboardHeroProps) {
  const currentItem = items.find((item) => currentPath === `/dashboard/${wikiSlug}/${item.href}`);

  return (
    <div className="mb-8 space-y-5">
      {/* Wiki slug label */}
      <div className="flex items-center gap-2">
        <div className="h-2 w-2 rounded-full bg-primary" />
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          {wikiSlug}
        </span>
      </div>

      {/* Navigation items */}
      <nav className="flex flex-wrap items-center gap-1.5">
        {items.map((item) => {
          const Icon = item.icon;
          const href = `/dashboard/${wikiSlug}/${item.href}`;
          const isActive = currentPath === href;
          return (
            <Link
              key={item.href}
              href={href}
              className={cn(
                'flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary/10 text-primary shadow-sm'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              )}
            >
              <Icon className="h-5 w-5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Current page title */}
      {currentItem && (
        <div className="border-b pb-2">
          <h1 className="text-2xl font-bold">{currentItem.label}</h1>
        </div>
      )}
    </div>
  );
}
