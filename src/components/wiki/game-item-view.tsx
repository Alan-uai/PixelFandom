'use client';

import Link from 'next/link';
import { ArrowLeft, FileText } from 'lucide-react';
import CollectionItemView from '@/components/wiki/collection-item-view';
import { useWikiPath } from '@/hooks/use-wiki-path';
import { useTableItem } from '@/hooks/use-data-access';

type Props = {
  tenantSlug: string;
  tableName: string;
  itemSlug: string;
  tenantId?: string;
  comparisonMode: 'modal' | 'page';
};

export default function GameItemView({ tenantSlug, tableName, itemSlug, tenantId, comparisonMode }: Props) {
  const { data: item, loading } = useTableItem(tenantSlug, tableName, itemSlug);
  const { homePath } = useWikiPath(tenantSlug);

  return (
    <article className="max-w-3xl mx-auto">
      <Link
        href={`${homePath}${tableName}`}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8 group"
      >
        <ArrowLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
        Voltar para {tableName.replace(/_/g, ' ')}
      </Link>

      {loading ? (
        <div className="space-y-4 animate-pulse">
          <div className="h-5 w-32 bg-muted rounded" />
          <div className="h-48 rounded-xl bg-muted" />
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-24 rounded-xl bg-muted" />
            ))}
          </div>
        </div>
      ) : item ? (
        <CollectionItemView
          data={item}
          tenantId={tenantId}
          tenantSlug={tenantSlug}
          sourceTable={tableName}
          comparisonMode={comparisonMode}
          schema={undefined}
        />
      ) : (
        <div className="text-center py-20 rounded-xl border bg-card">
          <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Item não encontrado</h1>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            Este item não existe na tabela &ldquo;{tableName.replace(/_/g, ' ')}&rdquo;.
          </p>
        </div>
      )}
    </article>
  );
}
