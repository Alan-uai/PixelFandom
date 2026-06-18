'use client';

import { ChevronRight } from 'lucide-react';

const demoStructure: Record<string, string[]> = {
  'Início': ['/'],
  'Artigos': ['/artigos', '/artigos/como-comecar', '/artigos/guias'],
  'Sobre': ['/sobre'],
  'Contato': ['/contato'],
};

export function ErrorMapBlock({ config }: { config: Record<string, unknown> }) {
  const title = (config.title as string) || 'Mapa do Site';
  const showSections = config.showSections !== false;

  return (
    <div className="space-y-3">
      {title && <h3 className="text-lg font-semibold text-center">{title}</h3>}
      <div className="max-w-md mx-auto space-y-1">
        {Object.entries(demoStructure).map(([section, pages]) => (
          <div key={section}>
            {showSections && (
              <div className="flex items-center gap-2 px-3 py-2 text-sm font-semibold text-muted-foreground">
                <ChevronRight className="h-3 w-3" />
                {section}
              </div>
            )}
            {pages.map((url, j) => (
              <a
                key={j}
                href={url}
                className="block rounded-lg px-6 py-2 text-sm hover:bg-muted transition-colors"
              >
                {url === '/' ? 'Home' : url.replace(/\//g, ' › ').replace(/^ › /, '').replace(/^./, (c) => c.toUpperCase())}
              </a>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
