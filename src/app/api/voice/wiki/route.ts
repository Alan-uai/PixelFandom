import { NextRequest, NextResponse } from 'next/server';
import { getTenantBySlug } from '@/lib/tenant';
import { createClient } from '@/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get('slug');

    if (!slug) {
      return NextResponse.json({ error: 'slug required' }, { status: 400 });
    }

    const tenant = await getTenantBySlug(slug);

    if (!tenant) {
      return NextResponse.json({ error: 'Wiki not found' }, { status: 404 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      if (!tenant.is_public) {
        return NextResponse.json({ error: 'Autenticação necessária para acessar esta wiki.' }, { status: 401 });
      }
    } else {
      const { data: membership } = await supabase
        .from('tenant_members')
        .select('role')
        .eq('tenant_id', tenant.id)
        .eq('user_id', user.id)
        .single();

      if (!membership && !tenant.is_public) {
        return NextResponse.json({ error: 'Acesso negado.' }, { status: 403 });
      }
    }

    return NextResponse.json({
      wiki: {
        id: tenant.id,
        name: tenant.name,
        slug: tenant.slug,
        logo_url: tenant.logo_url,
        description: tenant.description,
      },
    });
  } catch (error) {
    console.error('Voice wiki error:', error);
    return NextResponse.json({ error: 'Failed to get wiki' }, { status: 500 });
  }
}
