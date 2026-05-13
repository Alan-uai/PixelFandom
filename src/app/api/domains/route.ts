import { NextRequest, NextResponse } from 'next/server';
import { addDomain, removeDomain, verifyDomain, getDomainConfig, listDomains } from '@/lib/vercel-domains';
import { getTenantBySlug } from '@/lib/tenant';
import { supabase } from '@/supabase';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, tenantSlug, domain } = body;

    if (!tenantSlug) {
      return NextResponse.json({ error: 'tenantSlug é obrigatório' }, { status: 400 });
    }

    const tenant = await getTenantBySlug(tenantSlug);
    if (!tenant) {
      return NextResponse.json({ error: 'Wiki não encontrada' }, { status: 404 });
    }

    switch (action) {
      case 'add': {
        if (!domain) return NextResponse.json({ error: 'domain é obrigatório' }, { status: 400 });

        let vercelResult;
        try {
          vercelResult = await addDomain(domain);
        } catch (err: any) {
          // If Vercel is not configured, just save domain
          if (err.message?.includes('VERCEL_PROJECT_ID')) {
            await supabase.from('tenants').update({ custom_domain: domain }).eq('id', tenant.id);
            return NextResponse.json({
              status: 'saved',
              message: 'Domínio salvo. Configure o VERCEL_API_TOKEN para verificação automática.',
              domain,
            });
          }
          throw err;
        }

        // Save to DB
        await supabase.from('tenants').update({ custom_domain: domain }).eq('id', tenant.id);

        return NextResponse.json({
          status: 'added',
          ...vercelResult,
          instructions: [
            vercelResult.cname
              ? `Crie um registro CNAME apontando ${domain} para ${vercelResult.cname}`
              : 'Configure os nameservers conforme acima.',
          ],
        });
      }

      case 'remove': {
        try {
          await removeDomain(domain || tenant.custom_domain || '');
        } catch {
          // Vercel removal failed, still remove from DB
        }
        await supabase.from('tenants').update({ custom_domain: null }).eq('id', tenant.id);
        return NextResponse.json({ status: 'removed' });
      }

      case 'verify': {
        const targetDomain = domain || tenant.custom_domain;
        if (!targetDomain) return NextResponse.json({ error: 'Nenhum domínio configurado' }, { status: 400 });

        let config;
        try {
          config = await getDomainConfig(targetDomain);
        } catch {
          config = { verified: false, configured: false, cnameResolves: false, pending: true };
        }

        return NextResponse.json({
          status: 'checked',
          domain: targetDomain,
          ...config,
        });
      }

      case 'list': {
        let domains: string[] = [];
        try {
          domains = await listDomains();
        } catch {
          // Vercel not configured
        }
        return NextResponse.json({ domains });
      }

      default:
        return NextResponse.json({ error: 'Ação inválida' }, { status: 400 });
    }
  } catch (err: any) {
    console.error('[Domains API]', err);
    return NextResponse.json({ error: err.message || 'Erro interno' }, { status: 500 });
  }
}
