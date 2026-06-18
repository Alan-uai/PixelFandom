import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { addDomain, removeDomain, getDomainConfig, listDomains, addDomainWithRetry } from '@/lib/vercel-domains';
import { ROLE_HIERARCHY } from '@/lib/tenant';

function domainRegex(d: string): boolean {
  return /^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)*\.[a-z]{2,}$/i.test(d.trim());
}

export async function POST(request: NextRequest) {
  const cookieModifications: { name: string; value: string; options?: any }[] = [];

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieModifications.push({ name, value, options })
          );
        },
      },
    }
  );

  try {
    const body = await request.json();
    const { action, tenantSlug, domain } = body;

    if (!tenantSlug) {
      return NextResponse.json({ error: 'tenantSlug é obrigatório' }, { status: 400 });
    }

    const { data: tenant, error: tenantError } = await supabase
      .from('tenants')
      .select('*')
      .eq('slug', tenantSlug)
      .single();

    if (tenantError || !tenant) {
      return NextResponse.json({ error: 'Wiki não encontrada' }, { status: 404 });
    }

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const { data: membership } = await supabase
      .from('tenant_members')
      .select('role')
      .eq('tenant_id', tenant.id)
      .eq('user_id', user.id)
      .single();

    if (!membership) {
      return NextResponse.json({ error: 'Você não é membro desta wiki' }, { status: 403 });
    }

    if ((ROLE_HIERARCHY[membership.role] ?? -1) < 2) {
      return NextResponse.json({ error: 'Permissão insuficiente. É necessário ser admin ou owner.' }, { status: 403 });
    }

    switch (action) {
      case 'add': {
        if (!domain) return NextResponse.json({ error: 'domain é obrigatório' }, { status: 400 });

        if (!domainRegex(domain)) {
          return NextResponse.json({ error: 'Formato de domínio inválido' }, { status: 400 });
        }

        try {
          const existing = await listDomains();
          if (existing.includes(domain)) {
            return NextResponse.json({ error: 'Este domínio já está neste projeto' }, { status: 409 });
          }
        } catch {
          // Vercel não configurado — pula verificação
        }

        try {
          const config = await getDomainConfig(domain);
          if (config.verified || config.configured) {
            return NextResponse.json({ error: 'Este domínio já está em uso por outro projeto Vercel' }, { status: 409 });
          }
        } catch {
          // Domínio não encontrado na Vercel — disponível
        }

        let vercelResult;
        try {
          vercelResult = await addDomain(domain);
        } catch (err: any) {
          const msg = err.message?.toLowerCase() || '';
          if (msg.includes('already in use') || msg.includes('already exists')) {
            return NextResponse.json({ error: 'Este domínio já está em uso' }, { status: 409 });
          }
          if (err.message?.includes('VERCEL_PROJECT_ID')) {
            const { error: updateError } = await supabase
              .from('tenants')
              .update({ custom_domain: domain })
              .eq('id', tenant.id);

            if (updateError) throw updateError;

            return NextResponse.json({
              status: 'saved',
              message: 'Domínio salvo. Configure o VERCEL_API_TOKEN para verificação automática.',
              domain,
            });
          }
          throw err;
        }

        const { error: updateError } = await supabase
          .from('tenants')
          .update({
            custom_domain: domain,
            domain_verified: false,
            domain_last_checked_at: new Date().toISOString(),
          })
          .eq('id', tenant.id);

        if (updateError) throw updateError;

        const res = NextResponse.json({
          status: 'added',
          ...vercelResult,
          instructions: [
            vercelResult.cname
              ? `Crie um registro CNAME apontando ${domain} para ${vercelResult.cname}`
              : 'Configure os nameservers conforme acima.',
          ],
        });
        cookieModifications.forEach(({ name, value, options }) => res.cookies.set(name, value, options));
        return res;
      }

      case 'auto': {
        if (tenant.custom_domain) {
          const res = NextResponse.json({ status: 'skipped', domain: tenant.custom_domain });
          cookieModifications.forEach(({ name, value, options }) => res.cookies.set(name, value, options));
          return res;
        }

        try {
          const { domain: foundDomain, status } = await addDomainWithRetry(tenantSlug);

          const { error: updateError } = await supabase
            .from('tenants')
            .update({ custom_domain: foundDomain })
            .eq('id', tenant.id);

          if (updateError) throw updateError;

          const res = NextResponse.json({
            status: 'auto_added',
            domain: foundDomain,
            ...status,
          });
          cookieModifications.forEach(({ name, value, options }) => res.cookies.set(name, value, options));
          return res;
        } catch (err: any) {
          if (err.message?.includes('VERCEL_PROJECT_ID')) {
            const res = NextResponse.json({
              status: 'vercel_not_configured',
              message: 'Vercel não configurado. Domínio automático não criado.',
            });
            cookieModifications.forEach(({ name, value, options }) => res.cookies.set(name, value, options));
            return res;
          }
          throw err;
        }
      }

      case 'remove': {
        try {
          await removeDomain(domain || tenant.custom_domain || '');
        } catch {
          // Vercel removal failed, still remove from DB
        }

        const { error: updateError } = await supabase
          .from('tenants')
          .update({
            custom_domain: null,
            domain_verified: false,
            domain_verified_at: null,
            domain_last_checked_at: new Date().toISOString(),
          })
          .eq('id', tenant.id);

        if (updateError) throw updateError;

        const res = NextResponse.json({ status: 'removed' });
        cookieModifications.forEach(({ name, value, options }) => res.cookies.set(name, value, options));
        return res;
      }

      case 'verify': {
        const targetDomain = domain || tenant.custom_domain;
        if (!targetDomain) {
          return NextResponse.json({ error: 'Nenhum domínio configurado' }, { status: 400 });
        }

        // Check if any other tenant already has this domain
        const { data: dup } = await supabase
          .from('tenants')
          .select('id')
          .eq('custom_domain', targetDomain)
          .neq('id', tenant.id)
          .maybeSingle();

        if (dup) {
          return NextResponse.json({ error: 'Este domínio já está em uso por outra wiki' }, { status: 409 });
        }

        // .vercel.app domains are auto-provisioned by Vercel
        if (targetDomain.endsWith('.vercel.app')) {
          const res = NextResponse.json({
            status: 'checked',
            domain: targetDomain,
            verified: true,
            configured: true,
            nameservers: [],
            intendedNameservers: [],
            cname: null,
            cnameResolves: true,
            conflict: false,
            pending: false,
          });
          cookieModifications.forEach(({ name, value, options }) => res.cookies.set(name, value, options));
          return res;
        }

        let config;
        try {
          config = await getDomainConfig(targetDomain);
        } catch {
          config = { verified: false, configured: false, cnameResolves: false, pending: true };
        }

        // Persist verification status
        const verified = config.verified === true && config.configured === true;
        await supabase
          .from('tenants')
          .update({
            domain_verified: verified,
            domain_verified_at: verified ? new Date().toISOString() : null,
            domain_last_checked_at: new Date().toISOString(),
          })
          .eq('id', tenant.id);

        const res = NextResponse.json({
          status: 'checked',
          domain: targetDomain,
          ...config,
        });
        cookieModifications.forEach(({ name, value, options }) => res.cookies.set(name, value, options));
        return res;
      }

      case 'list': {
        let domains: string[] = [];
        try {
          domains = await listDomains();
        } catch {
          // Vercel not configured
        }

        const res = NextResponse.json({ domains });
        cookieModifications.forEach(({ name, value, options }) => res.cookies.set(name, value, options));
        return res;
      }

      default:
        return NextResponse.json({ error: 'Ação inválida' }, { status: 400 });
    }
  } catch (err: any) {
    console.error('[Domains API]', err);
    return NextResponse.json({ error: err.message || 'Erro interno' }, { status: 500 });
  }
}
