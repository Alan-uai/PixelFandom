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

  // ── Seed default data (non-blocking) ──

  // Default pages (landing, footer, 404)
  const PAGE_TEMPLATES: Record<string, { blocks: Record<string, unknown>[] }> = {
    landing: {
      blocks: [
        { id: 'default-landing-welcome', type: 'heading', config: { content: 'Bem-vindo à Wiki!', level: 'h2', align: 'center' } },
        { id: 'default-landing-desc', type: 'paragraph', config: { content: 'Explore nosso universo de conteúdo criado pela comunidade. Navegue pelos dados do jogo e artigos mais recentes.', size: 'md', align: 'center' } },
        { id: 'default-landing-game-data', type: 'game-data-cards', config: { title: 'Dados do Jogo' } },
        { id: 'default-landing-divider', type: 'divider', config: { style: 'dashed', thickness: 'sm' } },
        { id: 'default-landing-articles-heading', type: 'heading', config: { content: 'Artigos Recentes', level: 'h2' } },
        { id: 'default-landing-article-feed', type: 'article-feed', config: { sortBy: 'recent', layout: 'grid', columns: 3, count: 9, showImages: true, showSummaries: true } },
      ],
    },
    footer: {
      blocks: [
        { id: 'default-footer-brand', type: 'footer-brand', config: { tagline: 'Wiki Comunitária', description: 'Conteúdo criado por fãs, para fãs. Este site não tem vínculo oficial com os desenvolvedores.', showSocialLinks: false, socialLinks: [], align: 'center' } },
        { id: 'default-footer-credits', type: 'footer-credits', config: { brandName: '', year: 'auto', showHeart: true, showRights: true, align: 'center', size: 'sm' } },
      ],
    },
    404: {
      blocks: [
        { id: 'default-404-display', type: 'error-display', config: { number: '404', size: 'xl', font: 'display', title: 'Página não encontrada', subtitle: 'Ops! O conteúdo que você procura não está aqui ou foi movido.', glitchEnabled: false, showDecoration: true } },
        { id: 'default-404-search', type: 'error-search', config: { placeholder: 'Buscar na wiki...', showSuggestions: true } },
        { id: 'default-404-actions', type: 'error-actions', config: { buttons: [{ label: 'Voltar ao Início', url: '/', variant: 'primary', icon: 'home' }, { label: 'Explorar Artigos', url: '/artigos', variant: 'outline', icon: 'back' }], layout: 'row', size: 'md' } },
        { id: 'default-404-character', type: 'error-character', config: { character: 'sad-robot', mood: 'sad', speech: 'Hmm... não encontrei nada por aqui. Que tal tentar uma busca?', size: 'md', showBubble: true } },
      ],
    },
  };

  try {
    const pageRows = Object.entries(PAGE_TEMPLATES).map(([pageType, template]) => ({
      tenant_id: tenant.id,
      page_type: pageType,
      layout: template,
      floating_islands: {},
    }));
    await adminClient.from('tenant_pages').insert(pageRows);
  } catch {
    // non-blocking
  }

  // 3. Default game_config
  try {
    await adminClient.from('game_config').insert([
      { tenant_id: tenant.id, config_key: 'gameDataVersion', config_value: '"1.0.0"' },
      { tenant_id: tenant.id, config_key: 'allGameData', config_value: '{}' },
    ]);
  } catch {
    // non-blocking
  }

  return NextResponse.json({ ...tenant, slug });
}
