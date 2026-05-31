'use client';

import { FolderOpen } from 'lucide-react';

const demoCategories = [
  { name: 'Tecnologia', count: 42 },
  { name: 'Design', count: 28 },
  { name: 'Desenvolvimento', count: 56 },
  { name: 'UI/UX', count: 19 },
  { name: 'Marketing', count: 33 },
  { name: 'Negócios', count: 24 },
  { name: 'Tutoriais', count: 37 },
  { name: 'Notícias', count: 61 },
];

export function CategoryListBlock({ config }: { config: Record<string, any>; tenantId?: string }) {
  const title = config.title || 'Categorias';
  const showCount = config.showCount !== false;
  const layout = config.layout || 'list';
  const categories = config.categories || demoCategories;

  if (layout === 'grid') {
    return (
      <div className="space-y-4">
        {title && <h2 className="text-2xl font-bold" style={{ fontFamily: 'var(--heading-font)' }}>{title}</h2>}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {categories.map((cat: any, i: number) => (
            <div key={i} className="flex items-center gap-2 rounded-lg border bg-card p-3 hover:border-primary/30 transition-colors">
              <FolderOpen className="h-4 w-4 text-primary shrink-0" />
              <span className="text-sm font-medium truncate">{cat.name}</span>
              {showCount && (
                <span className="text-xs text-muted-foreground ml-auto shrink-0">({cat.count})</span>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (layout === 'cloud') {
    const maxCount = Math.max(...categories.map((c: any) => c.count));
    return (
      <div className="space-y-4">
        {title && <h2 className="text-2xl font-bold" style={{ fontFamily: 'var(--heading-font)' }}>{title}</h2>}
        <div className="flex flex-wrap gap-2">
          {categories.map((cat: any, i: number) => {
            const ratio = cat.count / maxCount;
            const size = ratio > 0.8 ? 'text-base' : ratio > 0.5 ? 'text-sm' : 'text-xs';
            const weight = ratio > 0.8 ? 'font-bold' : ratio > 0.5 ? 'font-semibold' : 'font-normal';
            return (
              <span
                key={i}
                className={`${size} ${weight} inline-flex items-center gap-1 rounded-full bg-secondary/50 px-3 py-1.5 text-secondary-foreground hover:bg-secondary transition-colors cursor-default`}
              >
                {cat.name}
                {showCount && (
                  <span className="text-muted-foreground">({cat.count})</span>
                )}
              </span>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {title && <h2 className="text-2xl font-bold" style={{ fontFamily: 'var(--heading-font)' }}>{title}</h2>}
      <div className="space-y-1">
        {categories.map((cat: any, i: number) => (
          <div key={i} className="flex items-center gap-2 rounded-lg px-3 py-2 hover:bg-accent transition-colors cursor-default">
            <FolderOpen className="h-4 w-4 text-primary shrink-0" />
            <span className="text-sm">{cat.name}</span>
            {showCount && (
              <span className="text-xs text-muted-foreground ml-auto">{cat.count} artigos</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
