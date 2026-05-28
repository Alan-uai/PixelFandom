import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/supabase/server';

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q')?.trim() || '';
  const limit = Math.min(Number(searchParams.get('limit')) || 20, 50);

  let dbQuery = supabase
    .from('tenants')
    .select('id, name, slug, description, logo_url, cover_image, is_public')
    .eq('is_public', true)
    .order('name')
    .limit(limit);

  if (query) {
    dbQuery = supabase
      .from('tenants')
      .select('id, name, slug, description, logo_url, cover_image, is_public')
      .eq('is_public', true)
      .or(`name.ilike.%${query}%,description.ilike.%${query}%`)
      .order('name')
      .limit(limit);
  }

  const { data, error } = await dbQuery;

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data || []);
}
