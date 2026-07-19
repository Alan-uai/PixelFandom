'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { supabase } from '@/supabase';
import { cn } from '@/lib/utils';
import { IconRenderer } from '@/components/ui/icon-renderer';

interface Variant {
  id: string;
  item_id: string;
  item_slug: string;
  variant_label: string;
  variant_order: number;
  auto_detected: boolean;
  display_label?: string | null;
  icon?: string | null;
  color?: string | null;
}

interface Props {
  tenantSlug: string;
  tableName: string;
  currentItemId: string;
  currentItemSlug: string;
  tenantId: string;
  /** Slug da variante atualmente ativa (undefined = "Atual") */
  activeVariantSlug?: string | null;
  /** Chamado ao selecionar uma variante — o pai deve carregar os dados dela.
   *  `direction` é a direção do feixe 3D ('ltr' | 'rtl') com base na posição
   *  do chip clicado; `index` é a posição do chip na linha. */
  onSelectVariant?: (
    variant: { item_id: string; item_slug?: string | null } | null,
    meta?: { direction: 'ltr' | 'rtl'; index: number; total: number },
  ) => void;
  /** true enquanto os dados da variante selecionada estão carregando */
  loadingVariant?: boolean;
  /** Novo: recebe todos os registros completos das variantes (background pre-cache) */
  onVariantsLoaded?: (records: Record<string, any>[]) => void;
}

function buildHref(tenantSlug: string, tableName: string, slug: string) {
  return `/w/${tenantSlug}/${tableName}?item=${slug}`;
}

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
}

// Module-level cache of full variant rows keyed by `${tenantId}:${tableName}:${itemId}`
const variantRowCache = new Map<string, Record<string, any>>();

export function getCachedVariantRow(
  tenantId: string,
  tableName: string,
  itemId: string,
): Record<string, any> | undefined {
  return variantRowCache.get(`${tenantId}:${tableName}:${itemId}`);
}

export function setCachedVariantRow(
  tenantId: string,
  tableName: string,
  itemId: string,
  row: Record<string, any>,
): void {
  variantRowCache.set(`${tenantId}:${tableName}:${itemId}`, row);
}

export function getVariantRowCache(): Map<string, Record<string, any>> {
  return variantRowCache;
}

const chipBase =
  'relative text-xs px-2.5 py-1 rounded-full border transition-all duration-300 flex items-center gap-1.5 will-change-transform';

export default function VariantSelector({
  tenantSlug,
  tableName,
  currentItemId,
  currentItemSlug,
  tenantId,
  activeVariantSlug,
  onSelectVariant,
  loadingVariant,
  onVariantsLoaded,
}: Props) {
  const [variants, setVariants] = useState<Variant[]>([]);
  const [loading, setLoading] = useState(true);
  const loadedFor = useRef<string>('');

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

        // Background pre-cache: busca o row completo de cada variante de uma vez
        const cacheKey = `${tenantId}:${tableName}:${currentItemId}`;
        if (list.length > 0 && loadedFor.current !== cacheKey) {
          loadedFor.current = cacheKey;
          const ids = list.map((v) => v.item_id);
          try {
            const { data: rows } = await supabase
              .from(tableName as any)
              .select('*')
              .eq('tenant_id', tenantId)
              .in('id', ids as any);
            if (cancelled) return;
            const records = (rows as Record<string, any>[] | null) || [];
            // store full rows (keyed by id) in the module cache
            for (const r of records) {
              if (r?.id) {
                setCachedVariantRow(tenantId, tableName, r.id as string, r);
                // also index by slug when present
                const slug = r.slug as string | undefined;
                if (slug) setCachedVariantRow(tenantId, tableName, slug, r);
              }
            }
            if (onVariantsLoaded) onVariantsLoaded(records);
          } catch {
            /* ignore background pre-cache failures */
          }
        }
      } catch {
        // ignore
      }
      if (!cancelled) setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [tenantId, tableName, currentItemId, onVariantsLoaded]);

  if (loading) return null;
  if (variants.length === 0) return null;

  const isActive = (slug: string | null) =>
    (activeVariantSlug ?? currentItemSlug) === (slug ?? currentItemSlug);

  const allChips: { v: Variant | null; label: string; slug: string | null }[] = [
    { v: null, label: 'Atual', slug: null },
    ...variants
      .slice()
      .sort((a, b) => a.variant_order - b.variant_order)
      .map((v) => ({ v, label: v.variant_label, slug: v.item_slug })),
  ];

  const ordered = allChips;

  const reduced = prefersReducedMotion();

  const handleSelect = (slug: string | null, variant?: Variant, index?: number) => {
    const idx = index ?? 0;
    const total = allChips.length;
    // direção do feixe 3D: chip à direita => rtl, à esquerda => ltr
    const direction: 'ltr' | 'rtl' = idx >= Math.ceil(total / 2) ? 'rtl' : 'ltr';
    if (onSelectVariant) {
      onSelectVariant(
        slug === null ? null : { item_id: variant!.item_id, item_slug: variant?.item_slug ?? null },
        { direction, index: idx, total },
      );
    }
  };

  const chipStyle = (v: Variant | null, active: boolean): React.CSSProperties => {
    if (!v) return {};
    if (v.color) {
      return active
        ? { color: v.color, borderColor: v.color, backgroundColor: `${v.color}26`, boxShadow: `0 0 16px ${v.color}66` }
        : { color: v.color, borderColor: `${v.color}80`, backgroundColor: `${v.color}14` };
    }
    return {};
  };

  const chipClass = (v: Variant | null, active: boolean) =>
    cn(
      chipBase,
      active
        ? cn(
            'bg-primary/30 border-primary text-primary font-semibold shadow-[0_0_18px_rgba(75,197,255,0.55)] translate-z-[6px] scale-110',
            !reduced && 'animate-[chip-pop_0.4s_ease-out]',
          )
        : v?.color
          ? 'hover:bg-muted/40'
          : v?.auto_detected
            ? 'bg-muted/30 border-border/50 text-muted-foreground hover:border-primary/30 hover:text-foreground'
            : 'bg-card border-primary/20 text-muted-foreground hover:border-primary/40 hover:text-foreground hover:-translate-y-0.5',
    );

  const renderChipContent = (v: Variant | null, label: string) => (
    <>
      {v?.icon && <IconRenderer icon={v.icon} size="sm" />}
      <span>{v?.display_label || label}</span>
      {isActive(v?.item_slug ?? null) && (
        <span
          className="ml-0.5 h-1.5 w-1.5 rounded-full bg-primary shadow-[0_0_6px_2px_rgba(75,197,255,0.8)]"
          aria-hidden
        />
      )}
    </>
  );

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

      <div className="flex flex-wrap gap-1.5" style={{ perspective: '600px' }}>
        {ordered.map((c, i) => {
          const active = isActive(c.slug);
          const chipEl = onSelectVariant ? (
            <button
              type="button"
              onClick={() => handleSelect(c.slug, c.v ?? undefined, i)}
              className={chipClass(c.v, active)}
              style={chipStyle(c.v, active)}
              aria-pressed={active}
            >
              {renderChipContent(c.v, c.label)}
            </button>
          ) : (
            <Link
              href={buildHref(tenantSlug, tableName, c.slug ?? currentItemSlug)}
              className={chipClass(c.v, active)}
              style={chipStyle(c.v, active)}
            >
              {renderChipContent(c.v, c.label)}
            </Link>
          );
          return <div key={c.slug ?? 'atual'} className="[transform-style:preserve-3d]">{chipEl}</div>;
        })}
      </div>

      <ChipKeyframes />
    </div>
  );
}

function ChipKeyframes() {
  // Inject once; safe no-op on server / re-renders
  if (typeof document === 'undefined') return null;
  if (document.getElementById('variant-selector-chip-kf')) return null;
  const el = document.createElement('style');
  el.id = 'variant-selector-chip-kf';
  el.textContent = `
@keyframes chip-pop {
  0% { transform: translateZ(0) scale(1); }
  45% { transform: translateZ(10px) scale(1.18); }
  100% { transform: translateZ(6px) scale(1.1); }
}
@media (prefers-reduced-motion: reduce) {
  .animate-\\[chip-pop_0\\.4s_ease-out\\] { animation: none !important; }
}
`;
  document.head.appendChild(el);
  return null;
}
