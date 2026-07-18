import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/supabase';

interface Variant {
  id: string;
  item_id: string;
  variant_label: string;
  variant_order: number;
  auto_detected: boolean;
}

interface VariantGroup {
  group_key: string;
  variant_count: number;
  variants: Variant[];
}

export function useItemVariants(tenantId: string | null, tableName: string | null, itemId: string | null) {
  const [variants, setVariants] = useState<Variant[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchVariants = useCallback(async () => {
    if (!tenantId || !tableName || !itemId) { setVariants([]); return; }
    setLoading(true);
    const { data } = await supabase
      .rpc('get_item_variants', { p_table: tableName, p_item_id: itemId, p_tenant_id: tenantId });
    const list = ((data || []) as Variant[]).filter((v) => v.item_id !== itemId);
    setVariants(list);
    setLoading(false);
  }, [tenantId, tableName, itemId]);

  useEffect(() => { fetchVariants(); }, [fetchVariants]);

  const linkVariant = useCallback(async (targetItemId: string, label?: string) => {
    if (!tenantId || !tableName || !itemId) return false;
    const { data, error } = await supabase
      .rpc('link_item_variant', {
        p_table: tableName, p_item_id: itemId,
        p_target_item_id: targetItemId, p_tenant_id: tenantId,
        p_variant_label: label || null,
      });
    if (error) {
      console.error('link_item_variant RPC error:', error);
      return false;
    }
    const result = data as { ok?: boolean; error?: string } | null;
    if (result?.ok) { await fetchVariants(); return true; }
    if (result?.error) console.error('link_item_variant failed:', result.error);
    return false;
  }, [tenantId, tableName, itemId, fetchVariants]);

  const unlinkVariant = useCallback(async (targetItemId: string) => {
    if (!tenantId || !tableName) return false;
    const { data } = await supabase
      .rpc('unlink_item_variant', { p_table: tableName, p_item_id: targetItemId, p_tenant_id: tenantId });
    const result = data as { ok?: boolean } | null;
    if (result?.ok) { await fetchVariants(); return true; }
    return false;
  }, [tenantId, tableName, fetchVariants]);

  const detectVariants = useCallback(async () => {
    if (!tenantId || !tableName) return;
    await supabase.rpc('detect_item_variants', { p_table: tableName, p_tenant_id: tenantId });
    await fetchVariants();
  }, [tenantId, tableName, fetchVariants]);

  return { variants, loading, fetchVariants, linkVariant, unlinkVariant, detectVariants };
}

export function useVariantGroups(tenantId: string | null, tableName: string | null) {
  const [groups, setGroups] = useState<VariantGroup[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchGroups = useCallback(async () => {
    if (!tenantId || !tableName) { setGroups([]); return; }
    setLoading(true);
    const { data } = await supabase
      .rpc('list_variant_groups', { p_table: tableName, p_tenant_id: tenantId });
    setGroups((data || []) as VariantGroup[]);
    setLoading(false);
  }, [tenantId, tableName]);

  useEffect(() => { fetchGroups(); }, [fetchGroups]);

  return { groups, loading, fetchGroups };
}
