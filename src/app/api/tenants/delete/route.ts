import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { createClient } from '@/supabase/server';
import { removeDomain } from '@/lib/vercel-domains';

export async function POST(request: NextRequest) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { slug } = await request.json();
  if (!slug || typeof slug !== 'string') {
    return NextResponse.json({ error: 'Slug is required' }, { status: 400 });
  }

  const { data: tenant, error: tenantError } = await supabase
    .from('tenants')
    .select('*')
    .eq('slug', slug)
    .single();

  if (tenantError || !tenant) {
    return NextResponse.json({ error: 'Wiki não encontrada' }, { status: 404 });
  }

  const { data: membership } = await supabase
    .from('tenant_members')
    .select('role')
    .eq('tenant_id', tenant.id)
    .eq('user_id', user.id)
    .single();

  if (!membership || membership.role !== 'owner') {
    return NextResponse.json({ error: 'Apenas o owner pode excluir a wiki' }, { status: 403 });
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

  const tenantId = tenant.id;
  const errors: string[] = [];

  try {
    // polymorphic votes (no FK to tenants — must delete explicitly)
    try {
      await adminClient.from('votes').delete()
        .eq('target_type', 'tenant')
        .eq('target_id', tenantId);
    } catch {
      // votes table may not exist
    }

    // storage: wiki-images bucket (logos, covers, favicons, og images)
    const storagePrefixes = [
      `wiki-logos/${slug}`,
      `wiki-covers/${slug}`,
      `wiki-favicons/${slug}`,
      `wiki-og/${slug}`,
    ];

    for (const prefix of storagePrefixes) {
      try {
        const { data: files } = await adminClient.storage
          .from('wiki-images')
          .list(prefix);

        if (files && files.length > 0) {
          const { error: rmErr } = await adminClient.storage
            .from('wiki-images')
            .remove(files.map(f => `${prefix}/${f.name}`));

          if (rmErr) errors.push(`storage:wiki-images/${prefix}: ${rmErr.message}`);
        }
      } catch (e) {
        errors.push(`storage:wiki-images/${prefix}: ${e}`);
      }
    }

    // storage: wiki-assets bucket
    try {
      const { data: assetFiles } = await adminClient.storage
        .from('wiki-assets')
        .list(slug);

      if (assetFiles && assetFiles.length > 0) {
        const { error: rmErr } = await adminClient.storage
          .from('wiki-assets')
          .remove(assetFiles.map(f => `${slug}/${f.name}`));

        if (rmErr) errors.push(`storage:wiki-assets/${slug}: ${rmErr.message}`);
      }
    } catch {
      // bucket may not exist
    }

    // Vercel custom domain
    if (tenant.custom_domain) {
      try {
        await removeDomain(tenant.custom_domain);
      } catch (e) {
        errors.push(`vercel_domain(${tenant.custom_domain}): ${e}`);
      }
    }

    // delete tenant — ON DELETE CASCADE handles all related tables
    const { error: deleteErr } = await adminClient
      .from('tenants')
      .delete()
      .eq('id', tenantId);

    if (deleteErr) errors.push(`tenants: ${deleteErr.message}`);

    if (errors.length > 0) {
      console.error('Wiki deletion partial errors:', errors);
      return NextResponse.json({
        success: false,
        error: 'Alguns dados não puderam ser excluídos',
        details: errors,
      }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Wiki deletion error:', err);
    return NextResponse.json({ error: 'Erro interno ao excluir wiki' }, { status: 500 });
  }
}
