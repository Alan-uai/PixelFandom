import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { supabase } from '@/supabase';
import { createClient } from '@/supabase/server';
import { getTenantBySlug } from '@/lib/tenant';
import { listDomains } from '@/lib/vercel-domains';

export async function GET(request: NextRequest) {
  const slug = request.nextUrl.searchParams.get('slug');
  const _id = request.nextUrl.searchParams.get('id');
  const checkDomain = request.nextUrl.searchParams.get('checkDomain');
  const checkSlug = request.nextUrl.searchParams.get('checkSlug');

  if (checkSlug) {
    const { data: exact } = await supabase
      .from('tenants')
      .select('slug')
      .eq('slug', checkSlug)
      .maybeSingle();

    if (!exact) {
      return NextResponse.json({ available: true });
    }

    const { data: allMatching } = await supabase
      .from('tenants')
      .select('slug')
      .like('slug', `${checkSlug}-%`);

    let maxNum = 0;
    for (const row of allMatching || []) {
      const suffix = row.slug.slice(checkSlug.length + 1);
      const num = parseInt(suffix, 10);
      if (!isNaN(num) && num > maxNum) maxNum = num;
    }

    return NextResponse.json({ available: false, suggested: `${checkSlug}-${maxNum + 1}` });
  }

  if (checkDomain) {
    try {
      const fullDomain = `${checkDomain}.vercel.app`;

      const { data: existing } = await supabase
        .from('tenants')
        .select('vercel_domain')
        .eq('vercel_domain', fullDomain)
        .maybeSingle();

      if (existing) {
        return NextResponse.json({ available: false, source: 'database' });
      }

      try {
        const domains = await listDomains();
        if (domains.includes(fullDomain)) {
          return NextResponse.json({ available: false, source: 'vercel' });
        }
      } catch {
        // Vercel not configured
      }

      return NextResponse.json({ available: true });
    } catch {
      return NextResponse.json({ available: false, error: 'Erro ao verificar domínio' }, { status: 500 });
    }
  }

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

  const { data } = await supabase
    .from('tenants')
    .select('*')
    .eq('is_public', true)
    .order('name');

  return NextResponse.json(data || []);
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();

  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  }

  const { name, description, slug: clientSlug, domainPrefix } = await request.json();
  if (!name || typeof name !== 'string' || !name.trim()) {
    return NextResponse.json({ error: 'Nome é obrigatório' }, { status: 400 });
  }

  let slug: string;
  if (clientSlug && typeof clientSlug === 'string' && clientSlug.trim()) {
    slug = clientSlug.trim().toLowerCase().replace(/[^a-z0-9-]/g, '').replace(/-+/g, '-').replace(/^-|-$/g, '');
  } else {
    slug = name.trim().toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
  }
  if (!slug) {
    return NextResponse.json({ error: 'Slug inválido' }, { status: 400 });
  }

  {
    const { data: exact } = await supabase.from('tenants').select('slug').eq('slug', slug).maybeSingle();
    if (exact) {
      const { data: allMatching } = await supabase
        .from('tenants')
        .select('slug')
        .like('slug', `${slug}-%`);
      let maxNum = 0;
      for (const row of allMatching || []) {
        const suffix = row.slug.slice(slug.length + 1);
        const num = parseInt(suffix, 10);
        if (!isNaN(num) && num > maxNum) maxNum = num;
      }
      slug = `${slug}-${maxNum + 1}`;
    }
  }

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) {
    return NextResponse.json({ error: 'Service role key not configured' }, { status: 500 });
  }

  const adminClient = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceKey,
    { cookies: { getAll: () => [], setAll: () => {} } }
  );

  const { data: tenant, error: tenantError } = await adminClient
    .from('tenants')
    .insert({ name: name.trim(), slug, description: description?.trim() || null, ai_enabled: true })
    .select()
    .single();

  if (tenantError) {
    return NextResponse.json({ error: tenantError.message }, { status: 500 });
  }

  const { error: memberError } = await adminClient
    .from('tenant_members')
    .insert({ tenant_id: tenant.id, user_id: user.id, role: 'owner' });

  if (memberError) {
    await adminClient.from('tenants').delete().eq('id', tenant.id);
    return NextResponse.json({ error: memberError.message }, { status: 500 });
  }

  const effectiveDomainPrefix = domainPrefix?.trim() ? domainPrefix.trim().toLowerCase().replace(/[^a-z0-9-]/g, '') : slug;
  if (effectiveDomainPrefix) {
    try {
      const { addDomain } = await import('@/lib/vercel-domains');
      const vercelDomain = `${effectiveDomainPrefix}.vercel.app`;
      await addDomain(vercelDomain);
      await adminClient.from('tenants').update({ vercel_domain: vercelDomain }).eq('id', tenant.id);
    } catch {
      // non-blocking
    }
  }

  return NextResponse.json({ ...tenant, slug });
}
