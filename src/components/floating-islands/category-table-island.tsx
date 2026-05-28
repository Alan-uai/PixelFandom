'use client';

interface CategoryTableIslandProps {
  config: Record<string, unknown>;
}

export function CategoryTableIsland({ config }: CategoryTableIslandProps) {
  const headers = (config.headers as string[]) || ['#', 'Item'];
  const rows = (config.rows as string[][]) || [];

  if (rows.length === 0) {
    return <p className="text-xs text-muted-foreground">Nenhum dado na tabela.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-border/50">
            {headers.map((h, i) => (
              <th key={i} className="px-2 py-1.5 text-left font-medium text-muted-foreground uppercase tracking-wider">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, ri) => (
            <tr key={ri} className="border-b border-border/30 last:border-0 hover:bg-muted/30 transition-colors">
              {row.map((cell, ci) => {
                const isFirstImage = ci === 0 && cell.startsWith('http');
                return (
                  <td key={ci} className="px-2 py-1.5">
                    {isFirstImage ? (
                      <img src={cell} alt="" className="h-8 w-8 rounded object-cover" />
                    ) : (
                      <span className="text-muted-foreground">{cell}</span>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
