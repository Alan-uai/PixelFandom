'use client';

import Link from 'next/link';
import { usePathname, useParams } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  BookOpen,
  Crosshair,
  Shield,
  Circle,
  Droplets,
  ArrowUp,
  Bug,
  Star,
  Hash,
  FlaskConical,
  Package,
  Settings,
  PanelLeft,
  PanelLeftClose,
} from 'lucide-react';
import { usePageSubNav } from '@/components/dashboard/page-subnav-context';

const editorNavItems = [
  { href: `/editor`, label: 'Artigos', icon: BookOpen },
  { href: `/editor/data/weapons`, label: 'Armas', icon: Crosshair },
  { href: `/editor/data/armors`, label: 'Armaduras', icon: Shield },
  { href: `/editor/data/rings`, label: 'Anéis', icon: Circle },
  { href: `/editor/data/potions`, label: 'Poções', icon: Droplets },
  { href: `/editor/data/upgrades`, label: 'Upgrades', icon: ArrowUp },
  { href: `/editor/data/enemies`, label: 'Inimigos', icon: Bug },
  { href: `/editor/data/bosses`, label: 'Bosses', icon: Star },
  { href: `/editor/data/codes`, label: 'Códigos', icon: Hash },
  { href: `/editor/data/crafting_recipes`, label: 'Receitas', icon: FlaskConical },
  { href: `/editor/data/resources`, label: 'Recursos', icon: Package },
  { href: `/editor/data/game_config`, label: 'Config', icon: Settings },
];

export default function EditorLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const params = useParams();
  const slug = params.slug as string;
  const { collapsed, toggle } = usePageSubNav();

  return (
    <div className="flex min-h-0">
      <aside
        className={cn(
          'shrink-0 self-start border-r bg-muted/30 flex flex-col transition-all duration-200',
          collapsed ? 'w-12' : 'w-48'
        )}
      >
        <div className="flex items-center gap-1 p-3">
          {!collapsed && (
            <p className="px-2 text-xs font-medium text-muted-foreground uppercase tracking-wider truncate flex-1">
              Conteúdo
            </p>
          )}
          <button
            onClick={toggle}
            className="rounded-md p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            title={collapsed ? 'Expandir' : 'Recolher'}
          >
            {collapsed ? <PanelLeft className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
          </button>
        </div>
        <nav className="flex-1 overflow-y-auto px-3 pb-3 space-y-1">
          {editorNavItems.map((item) => {
            const Icon = item.icon;
            const href = `/dashboard/${slug}${item.href}`;
            const isArticles = item.href === '/editor';
            const isActive = isArticles
              ? pathname === href || pathname.startsWith(href + '/')
              : pathname === href || pathname.startsWith(href + '/');
            return (
              <Link
                key={item.href}
                href={href}
                title={collapsed ? item.label : undefined}
                className={cn(
                  'flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors',
                  isActive
                    ? 'bg-primary/10 text-primary font-medium'
                    : 'hover:bg-muted text-muted-foreground'
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {!collapsed && <span className="truncate">{item.label}</span>}
              </Link>
            );
          })}
        </nav>
      </aside>
      <div className="flex-1 min-w-0 p-6">
        {children}
      </div>
    </div>
  );
}
