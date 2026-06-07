'use client';

import Link from 'next/link';
import { FileText, Database, ArrowLeft } from 'lucide-react';
import { useWikiPath } from '@/hooks/use-wiki-path';
import { useTableItems } from '@/hooks/use-data-access';

function toSlug(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

type Props = {
  tenantSlug: string;
  tableName: string;
  tenantId?: string;
};

export default function GameTableListing({ tenantSlug, tableName }: Props) {
  const { data, loading } = useTableItems(tenantSlug, tableName);
  const items: any[] = data?.items ?? [];
  const labelCol = data?.labelCol ?? 'name';
  const { homePath } = useWikiPath(tenantSlug);

  return (
    <article className="max-w-3xl mx-auto">
      <Link
        href={homePath}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8 group"
      >
        <ArrowLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
        Voltar para home
      </Link>

      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
            <Database className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold capitalize">{tableName.replace(/_/g, ' ')}</h1>
            <p className="text-sm text-muted-foreground">{items.length} ite{items.length === 1 ? 'm' : 'ns'}</p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3 animate-pulse">
          <div className="h-5 w-32 bg-muted rounded mb-6" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-20 rounded-xl bg-muted" />
            ))}
          </div>
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-20 rounded-xl border bg-card">
          <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Nenhum item encontrado</h2>
          <p className="text-muted-foreground">Esta tabela ainda não possui dados.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {items.map((item) => {
            const label = item[labelCol] || item.name || '';
            const itemSlug = toSlug(String(label));
            const image = item.image_url || item.image || item.icon || item.icon_url;
            const subtitle = item.rarity || item.type || item.weapon_type || item.obtain || item.description || '';

            return (
              <Link
                key={item.id}
                href={`${homePath}${tableName}/${itemSlug}`}
                className="flex items-center gap-3 rounded-xl border bg-card p-4 hover:border-primary/50 hover:bg-accent/50 transition-all group"
              >
                {image ? (
                  <div className="w-12 h-12 rounded-lg overflow-hidden shrink-0 bg-muted">
                    <img src={image} alt="" className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 text-primary">
                    <FileText className="h-5 w-5" />
                  </div>
                )}
                <div className="min-w-0">
                  <p className="text-sm font-medium group-hover:text-primary transition-colors truncate">
                    {label}
                  </p>
                  {subtitle && (
                    <p className="text-xs text-muted-foreground truncate mt-0.5">
                      {typeof subtitle === 'string' ? subtitle : ''}
                    </p>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </article>
  );
}
