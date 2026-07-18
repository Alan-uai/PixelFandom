import { supabase } from '@/supabase';

// Intelligent slug generation for game-table items, mirroring the tenant slug
// logic in /dashboard/new: slugify the name, then deduplicate against existing
// rows in the same tenant-scoped table.
export function slugifyItemName(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9一-鿿\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

// Consult the table to find a unique slug for the given base, appending
// -2, -3, ... when a collision is found (same strategy as the tenant flow).
export async function generateUniqueItemSlug(
  table: string,
  tenantId: string,
  baseSlug: string,
  excludeId?: string,
): Promise<string | null> {
  if (!baseSlug) return null;

  let exactQuery = supabase
    .from(table)
    .select('slug')
    .eq('tenant_id', tenantId)
    .eq('slug', baseSlug);
  if (excludeId) exactQuery = exactQuery.neq('id', excludeId);
  const { data: exact } = await exactQuery.maybeSingle();

  if (!exact) return baseSlug;

  let matchQuery = supabase
    .from(table)
    .select('slug')
    .eq('tenant_id', tenantId)
    .like('slug', `${baseSlug}-%`);
  if (excludeId) matchQuery = matchQuery.neq('id', excludeId);
  const { data: allMatching } = await matchQuery;

  let maxNum = 1;
  for (const row of allMatching || []) {
    const suffix = (row.slug as string).slice(baseSlug.length + 1);
    const num = parseInt(suffix, 10);
    if (!isNaN(num) && num > maxNum) maxNum = num;
  }

  return `${baseSlug}-${maxNum + 1}`;
}
