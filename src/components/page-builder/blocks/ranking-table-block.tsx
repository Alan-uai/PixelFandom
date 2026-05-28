'use client';

import { Trophy } from 'lucide-react';

export function RankingTableBlock({ config }: { config: Record<string, unknown> }) {
  const title = (config.title as string) || 'Ranking';
  const headers = (config.headers as string[]) || ['#', 'Item', 'Valor'];
  const rows = (config.rows as string[][]) || [];

  return (
    <div className="space-y-4">
      {title && <h2 className="text-2xl font-bold">{title}</h2>}
      <div className="rounded-lg border bg-card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              {headers.map((h, i) => (
                <th key={i} className="px-4 py-3 text-left font-medium text-muted-foreground text-xs uppercase tracking-wider">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length > 0 ? (
              rows.map((row, ri) => (
                <tr key={ri} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                  {row.map((cell, ci) => (
                    <td key={ci} className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {ci === 0 && ri < 3 && <Trophy className={`h-4 w-4 ${ri === 0 ? 'text-yellow-500' : ri === 1 ? 'text-gray-400' : 'text-amber-600'}`} />}
                        {cell}
                      </div>
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={headers.length} className="px-4 py-8 text-center text-muted-foreground text-sm">
                  Adicione dados nas configurações do bloco
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
