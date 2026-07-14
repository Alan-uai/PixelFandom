'use client';

import { type TopPage } from './types';
import { WeldingCard } from '@/components/ui/welding-card';
import { CardHeader, CardTitle, CardContent } from '@/components/ui/card';

interface TopPagesProps {
  data: TopPage[];
  title: string;
  uniqueLabel: string;
  noDataLabel: string;
}

export function TopPages({ data, title, uniqueLabel, noDataLabel }: TopPagesProps) {
  return (
    <WeldingCard>
      <CardHeader>
        <CardTitle className="text-sm">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {data.length > 0 ? (
          <div className="space-y-2">
            {data.map((page, i) => (
              <div key={page.page_path} className="flex items-center gap-3 py-2 border-b border-border/50 last:border-0">
                <span className="text-xs text-muted-foreground w-5 text-right">{i + 1}.</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm truncate">{page.page_title || page.page_path}</p>
                  <p className="text-xs text-muted-foreground truncate">{page.page_path}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-medium">{page.views}</p>
                  <p className="text-xs text-muted-foreground">{uniqueLabel.replace('{count}', String(page.unique_visitors))}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-8">{noDataLabel}</p>
        )}
      </CardContent>
    </WeldingCard>
  );
}
