'use client';

export function FooterMenuBlock({ config }: { config: Record<string, unknown> }) {
  const title = (config.title as string) || '';
  const columns = (config.columns as Array<{ title: string; links?: Array<{ label: string; url: string }> }>) || [];
  const layout = (config.layout as string) || 'columns';

  if (columns.length === 0) {
    return (
      <div className="text-center text-sm text-muted-foreground py-2">
        {title && <p className="mb-2 font-medium">{title}</p>}
        <p>Configure os links do menu</p>
      </div>
    );
  }

  if (layout === 'inline') {
    return (
      <div className="text-center space-y-2">
        {title && <h3 className="text-sm font-semibold">{title}</h3>}
        <div className="flex flex-wrap justify-center gap-x-4 gap-y-1">
          {columns.flatMap((col) =>
            (col.links || []).map((link, i) => (
              <a
                key={`${col.title}-${i}`}
                href={link.url || '#'}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                {link.label}
              </a>
            ))
          )}
        </div>
      </div>
    );
  }

  const gridCols = columns.length === 2 ? 'grid-cols-2' : columns.length === 3 ? 'grid-cols-3' : columns.length === 4 ? 'grid-cols-4' : 'grid-cols-1';

  return (
    <div className="space-y-4">
      {title && <h3 className="text-sm font-semibold text-center">{title}</h3>}
      <div className={`grid ${gridCols} gap-6`}>
        {columns.map((col, i) => (
          <div key={i}>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
              {col.title}
            </h4>
            <ul className="space-y-1.5">
              {(col.links || []).map((link, j) => (
                <li key={j}>
                  <a
                    href={link.url || '#'}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
