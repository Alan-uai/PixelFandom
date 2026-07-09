import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/supabase/server';
import { getTenantFromRequest } from '@/lib/get-tenant-from-request';

const VALID_PROVIDERS = ['text', 'voice', 'hybrid'] as const;

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const tenantSlug = searchParams.get('tenant_slug') || getTenantFromRequest(request)?.slug;
    const status = searchParams.get('status') || 'active';
    const provider = searchParams.get('provider');
    const limit = Math.min(Number(searchParams.get('limit')) || 50, 100);
    const offset = Number(searchParams.get('offset')) || 0;

    let query = supabase
      .from('chat_sessions')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', status)
      .order('updated_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (tenantSlug) {
      const { data: tenant } = await supabase
        .from('tenants')
        .select('id')
        .eq('slug', tenantSlug)
        .single();
      if (tenant) query = query.eq('tenant_id', tenant.id);
    }

    if (provider) query = query.eq('provider', provider);

    const { data, error } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  } catch (err) {
    console.error('[GET /api/chat/sessions]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { tenant_id, title, provider, model, voice_name } = body;

    if (!tenant_id) {
      return NextResponse.json({ error: 'tenant_id is required' }, { status: 400 });
    }

    if (provider && !VALID_PROVIDERS.includes(provider)) {
      return NextResponse.json({ error: `Invalid provider. Must be one of: ${VALID_PROVIDERS.join(', ')}` }, { status: 400 });
    }

    // Verify tenant exists before inserting
    const { data: tenant } = await supabase
      .from('tenants')
      .select('id')
      .eq('id', tenant_id)
      .maybeSingle();

    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }

    const { data, error } = await supabase
      .from('chat_sessions')
      .insert({
        tenant_id,
        user_id: user.id,
        title: title || 'Nova conversa',
        provider: provider || 'text',
        model: model || null,
        voice_name: voice_name || null,
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data, { status: 201 });
  } catch (err) {
    console.error('[POST /api/chat/sessions]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
