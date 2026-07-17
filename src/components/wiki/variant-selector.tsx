'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/supabase';
import { cn } from '@/lib/utils';

interface Variant {
  id: string;
  item_id: string;
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
}

export default function VariantSelector({ tenantSlug, tableName, currentItemId, currentItemSlug, tenantId }: Props) {
  const [variants, setVariants] = useState<Variant[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);

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
        const list = (data || []) as Variant[];
        setVariants(list.filter((v) => v.item_id !== currentItemId));
      } catch {
        // ignore
      }
      if (!cancelled) setLoading(false);
    })();

    return () => { cancelled = true; };
  }, [tenantId, tableName, currentItemId]);

  if (loading) return null;
  if (variants.length === 0) return null;

  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Variantes ({variants.length + 1})
        </span>
      </div>
      <div className="flex flex-wrap gap-1.5">
        <Link
          href={`/w/${tenantSlug}/${tableName}/${currentItemSlug}`}
          className="text-xs px-2.5 py-1 rounded-full bg-primary/20 border border-primary/40 text-primary font-medium transition-colors"
        >
          Atual
        </Link>
        {variants
          .sort((a, b) => a.variant_order - b.variant_order)
          .map((v) => (
            <Link
              key={v.id}
              href={`/w/${tenantSlug}/${tableName}/${v.item_id}`}
              className={cn(
                'text-xs px-2.5 py-1 rounded-full border transition-colors',
                v.auto_detected
                  ? 'bg-muted/30 border-border/50 text-muted-foreground hover:border-primary/30 hover:text-foreground'
                  : 'bg-card border-primary/20 text-muted-foreground hover:border-primary/40 hover:text-foreground',
              )}
            >
              {v.variant_label}
            </Link>
          ))}
      </div>
    </div>
  );
}
