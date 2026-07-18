'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/supabase';
import { cn } from '@/lib/utils';

interface Variant {
  id: string;
  item_id: string;
  item_slug: string;
  variant_label: string;
  variant_order: number;
  auto_detected: boolean;
}

interface Props {
  tenantSlug: string;
  tableName: string;
  currentItemId: string;
  currentItemSlug: string;
  tenantId: string;
  /** Slug da variante atualmente ativa (undefined = "Atual") */
  activeVariantSlug?: string | null;
  /** Chamado ao selecionar uma variante — o pai deve carregar os dados dela */
  onSelectVariant?: (variant: { item_id: string; item_slug?: string | null } | null) => void;
  /** true enquanto os dados da variante selecionada estão carregando */
  loadingVariant?: boolean;
}

function buildHref(tenantSlug: string, tableName: string, slug: string) {
  return `/w/${tenantSlug}/${tableName}?item=${slug}`;
}

export default function VariantSelector({
  tenantSlug,
  tableName,
  currentItemId,
  currentItemSlug,
  tenantId,
  activeVariantSlug,
  onSelectVariant,
  loadingVariant,
}: Props) {
  const [variants, setVariants] = useState<Variant[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!tenantId || !tableName || !currentItemId) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const { data } = await supabase
          .rpc('get_item_variants', { p_table: tableName, p_item_id: currentItemId, p_tenant_id: tenantId });
        if (cancelled) return;
        const list = ((data || []) as Variant[]).filter((v) => v.item_id !== currentItemId);
        setVariants(list);
      } catch {
        // ignore
      }
      if (!cancelled) setLoading(false);
    })();

    return () => { cancelled = true; };
  }, [tenantId, tableName, currentItemId]);

  if (loading) return null;
  if (variants.length === 0) return null;

  const isActive = (slug: string | null) =>
    (activeVariantSlug ?? currentItemSlug) === (slug ?? currentItemSlug);

  const handleSelect = (slug: string | null, variant?: Variant) => {
    if (onSelectVariant) {
      onSelectVariant(slug === null ? null : { item_id: variant!.item_id, item_slug: variant?.item_slug ?? null });
    }
  };

  return (
    <div className="px-4 py-2.5 border-t border-border/50 bg-muted/20">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
          Variantes ({variants.length + 1})
        </span>
        {loadingVariant && (
          <span className="h-3 w-3 animate-spin rounded-full border border-primary border-t-transparent" />
        )}
      </div>
      <div className="flex flex-wrap gap-1.5">
        {onSelectVariant ? (
          <button
            type="button"
            onClick={() => handleSelect(null)}
            className={cn(
              'text-xs px-2.5 py-1 rounded-full border transition-colors',
              isActive(null)
                ? 'bg-primary/20 border-primary/40 text-primary font-medium'
                : 'bg-card border-primary/20 text-muted-foreground hover:border-primary/40 hover:text-foreground',
            )}
          >
            Atual
          </button>
        ) : (
          <Link
            href={buildHref(tenantSlug, tableName, currentItemSlug)}
            className={cn(
              'text-xs px-2.5 py-1 rounded-full border transition-colors',
              isActive(null)
                ? 'bg-primary/20 border-primary/40 text-primary font-medium'
                : 'bg-card border-primary/20 text-muted-foreground hover:border-primary/40 hover:text-foreground',
            )}
          >
            Atual
          </Link>
        )}

        {variants
          .sort((a, b) => a.variant_order - b.variant_order)
          .map((v) => {
            const active = isActive(v.item_slug);
            return onSelectVariant ? (
              <button
                key={v.id}
                type="button"
                onClick={() => handleSelect(v.item_slug, v)}
                className={cn(
                  'text-xs px-2.5 py-1 rounded-full border transition-colors',
                  active
                    ? 'bg-primary/20 border-primary/40 text-primary font-medium'
                    : v.auto_detected
                      ? 'bg-muted/30 border-border/50 text-muted-foreground hover:border-primary/30 hover:text-foreground'
                      : 'bg-card border-primary/20 text-muted-foreground hover:border-primary/40 hover:text-foreground',
                )}
              >
                {v.variant_label}
              </button>
            ) : (
              <Link
                key={v.id}
                href={buildHref(tenantSlug, tableName, v.item_slug)}
                className={cn(
                  'text-xs px-2.5 py-1 rounded-full border transition-colors',
                  active
                    ? 'bg-primary/20 border-primary/40 text-primary font-medium'
                    : v.auto_detected
                      ? 'bg-muted/30 border-border/50 text-muted-foreground hover:border-primary/30 hover:text-foreground'
                      : 'bg-card border-primary/20 text-muted-foreground hover:border-primary/40 hover:text-foreground',
                )}
              >
                {v.variant_label}
              </Link>
            );
          })}
      </div>
    </div>
  );
}
