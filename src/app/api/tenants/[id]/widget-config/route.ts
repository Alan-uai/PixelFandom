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
      .from('tenants')
      .select('theme')
      .eq('id', id)
      .single();

    if (error || !data) {
      return NextResponse.json({});
    }

    const theme = data.theme as Record<string, unknown> | undefined;
    const widgets = (theme?.widgets as Record<string, unknown>) || {};

    return NextResponse.json(widgets);
  } catch (error) {
    console.error('Get widget config error:', error);
    return NextResponse.json({});
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

    const { data: tenant, error: fetchError } = await supabase
      .from('tenants')
      .select('theme')
      .eq('id', id)
      .single();

    if (fetchError) {
      return NextResponse.json({ error: fetchError.message }, { status: 500 });
    }

    const theme = (tenant?.theme as Record<string, unknown>) || {};
    theme.widgets = body;

    const { error: updateError } = await supabase
      .from('tenants')
      .update({ theme: theme as any })
      .eq('id', id);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Save widget config error:', error);
    return NextResponse.json({ error: 'Failed to save widget config' }, { status: 500 });
  }
}
