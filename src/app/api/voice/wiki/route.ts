import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get('slug');

    if (!slug) {
      return NextResponse.json({ error: 'slug required' }, { status: 400 });
    }

    const { supabase } = await import('@/supabase');

    const { data: tenant, error } = await supabase
      .from('tenants')
      .select('id, name, slug, logo_url, description')
      .eq('slug', slug)
      .single();

    if (error || !tenant) {
      return NextResponse.json({ error: 'Wiki not found' }, { status: 404 });
    }

    return NextResponse.json({ wiki: tenant });
  } catch (error) {
    console.error('Voice wiki error:', error);
    return NextResponse.json({ error: 'Failed to get wiki' }, { status: 500 });
  }
}
