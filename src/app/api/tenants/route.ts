import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/supabase';
import { getTenantBySlug } from '@/lib/tenant';

export async function GET(request: NextRequest) {
  const slug = request.nextUrl.searchParams.get('slug');
  const _id = request.nextUrl.searchParams.get('id');

  if (slug) {
    const tenant = await getTenantBySlug(slug);
    if (!tenant) return NextResponse.json(null, { status: 404 });
    return NextResponse.json(tenant);
  }

  if (_id) {
    const { data } = await supabase
      .from('tenants')
      .select('*')
      .eq('id', _id)
      .single();
    return NextResponse.json(data);
  }

  // List public tenants
  const { data } = await supabase
    .from('tenants')
    .select('*')
    .eq('is_public', true)
    .order('name');

  return NextResponse.json(data || []);
}
