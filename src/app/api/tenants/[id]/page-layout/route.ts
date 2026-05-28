import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/supabase/server';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id } = await params;

    const { data, error } = await supabase
      .from('tenant_pages')
      .select('layout, floating_islands')
      .eq('tenant_id', id)
      .single();

    if (error || !data) {
      // Fall back to tenants.theme.landing_layout
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
    const body = await request.json();

    if (!body.blocks || !Array.isArray(body.blocks)) {
      return NextResponse.json({ error: 'layout.blocks required' }, { status: 400 });
    }

    const floatingIslands = Array.isArray(body.floatingIslands) ? body.floatingIslands : [];

    // Upsert into tenant_pages
    const { error: upsertError } = await supabase
      .from('tenant_pages')
      .upsert(
        {
          tenant_id: id,
          layout: { blocks: body.blocks },
          floating_islands: floatingIslands,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'tenant_id' }
      );

    if (upsertError) {
      // Fallback: store in tenants.theme.landing_layout
      const { data: tenant } = await supabase
        .from('tenants')
        .select('theme')
        .eq('id', id)
        .single();

      const theme = (tenant?.theme || {}) as Record<string, unknown>;
      theme.landing_layout = { blocks: body.blocks, floatingIslands };

      const { error: themeError } = await supabase
        .from('tenants')
        .update({ theme: theme as any })
        .eq('id', id);

      if (themeError) {
        return NextResponse.json({ error: themeError.message }, { status: 500 });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Save layout error:', error);
    return NextResponse.json({ error: 'Failed to save layout' }, { status: 500 });
  }
}
