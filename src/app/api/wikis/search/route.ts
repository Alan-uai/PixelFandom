import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/supabase/server';

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q')?.trim() || '';
  const limit = Math.min(Number(searchParams.get('limit')) || 20, 50);

  if (!query) {
    const { data, error } = await supabase
      .from('tenants')
      .select('id, name, slug, description, logo_url, cover_image, is_public')
      .eq('is_public', true)
      .order('name')
      .limit(limit);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data || []);
  }

  const { data, error } = await supabase
    .from('tenants')
    .select('id, name, slug, description, logo_url, cover_image, is_public')
    .eq('is_public', true)
    .or(`name.ilike.%${query}%,slug.ilike.%${query}%,description.ilike.%${query}%`)
    .limit(limit);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const sorted = (data || []).sort((a, b) => {
    const aLower = a.name.toLowerCase();
    const bLower = b.name.toLowerCase();
    const qLower = query.toLowerCase();
    const aExact = aLower === qLower ? 3 : aLower.startsWith(qLower) ? 2 : a.slug?.toLowerCase().startsWith(qLower) ? 1 : 0;
    const bExact = bLower === qLower ? 3 : bLower.startsWith(qLower) ? 2 : b.slug?.toLowerCase().startsWith(qLower) ? 1 : 0;
    return bExact - aExact || a.name.localeCompare(b.name);
  });

  return NextResponse.json(sorted);
}
