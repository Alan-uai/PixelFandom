'use client';

import { useRef, useEffect, useState } from 'react';
import Link from 'next/link';
import { Loader2, ArrowLeft, FileText } from 'lucide-react';
import { supabase } from '@/supabase';
import { getGameSchema, type ColumnInfo } from '@/lib/game-schema';
import CollectionItemView from '@/components/wiki/collection-item-view';
import { useWikiPath } from '@/hooks/use-wiki-path';

type Props = {
  tenantSlug: string;
  tableName: string;
  itemSlug: string;
  tenantId: string;
  comparisonMode: 'modal' | 'page';
};

export default function GameItemView({ tenantSlug, tableName, itemSlug, tenantId, comparisonMode }: Props) {
  const cache = useRef<any | null>(null);
  const schemaCache = useRef<ColumnInfo[] | undefined>(undefined);
  const [item, setItem] = useState<any | null>(null);
  const [schema, setSchema] = useState<ColumnInfo[] | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const { homePath } = useWikiPath(tenantSlug);

  useEffect(() => {
    if (cache.current !== undefined) {
      setItem(cache.current);
      setLoading(false);
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        // Try by slug first (URL-friendly), fallback to name match
        let data: any = null;
        const schemaRes = await getGameSchema();

        const slugResult = await supabase
          .from(tableName).select('*').eq('tenant_id', tenantId).eq('slug', itemSlug).maybeSingle();
        data = slugResult.data;

        if (!data) {
          const searchName = itemSlug.replace(/-/g, ' ');
          const nameResult = await supabase
            .from(tableName).select('*').eq('tenant_id', tenantId).ilike('name', searchName).maybeSingle();
          data = nameResult.data;
        }

        if (cancelled) return;

        schemaCache.current = schemaRes.tables.find((t) => t.table_name === tableName)?.columns;
        cache.current = data ?? null;

        setSchema(schemaCache.current);
        setItem(data ?? null);
      } catch {
        if (!cancelled) {
          cache.current = null;
          setItem(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [tableName, itemSlug, tenantId]);

  return (
    <article className="max-w-3xl mx-auto">
      <Link
        href={`${homePath}${tableName}`}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8 group"
      >
        <ArrowLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
        Voltar para {tableName}
      </Link>

      {loading ? (
        <div className="flex items-center justify-center min-h-[40vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : item ? (
        <CollectionItemView
          data={item}
          tenantId={tenantId}
          tenantSlug={tenantSlug}
          sourceTable={tableName}
          comparisonMode={comparisonMode}
          schema={schema}
        />
      ) : (
        <div className="text-center py-20 rounded-xl border bg-card">
          <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Item não encontrado</h1>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            Este item não existe na tabela &ldquo;{tableName}&rdquo;.
          </p>
        </div>
      )}
    </article>
  );
}
