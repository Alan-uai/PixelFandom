import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/supabase/server';
import { safeParseBlockConfig, BlockSchemaKey } from '@/lib/block-schemas';
import { sanitizeBlock } from '@/lib/sanitize';

function getPageType(request: NextRequest): string {
  const url = new URL(request.url);
  return url.searchParams.get('type') || 'landing';
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id } = await params;
    const pageType = getPageType(request);

    const { data, error } = await supabase
      .from('tenant_pages')
      .select('layout, floating_islands')
      .eq('tenant_id', id)
      .eq('page_type', pageType)
      .maybeSingle();

    if (error || !data) {
      if (pageType === 'landing') {
        const { data: tenant } = await supabase
          .from('tenants')
          .select('theme')
          .eq('id', id)
          .single();

        if (tenant?.theme && (tenant.theme as any).landing_layout) {
          const fallback = (tenant.theme as any).landing_layout;
          return NextResponse.json({
            blocks: fallback.blocks || [],
            floatingIslands: fallback.floatingIslands || [],
          });
        }
      }
      return NextResponse.json({ blocks: [], floatingIslands: [] });
    }

    return NextResponse.json({
      blocks: (data.layout as any)?.blocks || [],
      floatingIslands: (data.floating_islands as any[]) || [],
    });
  } catch (error) {
    console.error('Get layout error:', error);
    return NextResponse.json({ blocks: [], floatingIslands: [] });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id } = await params;
    const pageType = getPageType(request);
    const body = await request.json();

    if (!body.blocks || !Array.isArray(body.blocks)) {
      return NextResponse.json({ error: 'layout.blocks required' }, { status: 400 });
    }

    for (const block of body.blocks) {
      const type = (block as any)?.type;
      if (!type || typeof type !== 'string') {
        return NextResponse.json({ error: `Block missing type` }, { status: 400 });
      }
      const config = (block as any)?.config;
      if (config !== undefined) {
        const result = safeParseBlockConfig(type as BlockSchemaKey, config);
        if (!result.success) {
          return NextResponse.json({
            error: `Block "${type}" config validation failed`,
            details: result.error.issues,
          }, { status: 400 });
        }
      }
    }

    const sanitizedBlocks = body.blocks.map((block: unknown) =>
      sanitizeBlock(block as Record<string, unknown>)
    );

    const floatingIslands = Array.isArray(body.floatingIslands)
      ? body.floatingIslands.map((fi: any) => ({
          ...fi,
          config: fi.config ? sanitizeBlock({ config: fi.config }).config : {},
        }))
      : [];

    // Manual upsert: try update first, then insert if no row exists
    // This avoids relying on ON CONFLICT / unique index inference
    const { data: existing } = await supabase
      .from('tenant_pages')
      .select('id')
      .eq('tenant_id', id)
      .eq('page_type', pageType)
      .maybeSingle();

    let dbError: any = null;

    if (existing) {
      const { error } = await supabase
        .from('tenant_pages')
        .update({
          layout: { blocks: sanitizedBlocks },
          floating_islands: floatingIslands,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id);
      dbError = error;
    } else {
      const { error } = await supabase
        .from('tenant_pages')
        .insert({
          tenant_id: id,
          page_type: pageType,
          layout: { blocks: sanitizedBlocks },
          floating_islands: floatingIslands,
          updated_at: new Date().toISOString(),
        });
      dbError = error;
    }

    if (dbError) {
      return NextResponse.json({ error: dbError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Save layout error:', error);
    return NextResponse.json({ error: 'Failed to save layout' }, { status: 500 });
  }
}
