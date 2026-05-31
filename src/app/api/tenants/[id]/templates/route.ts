import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id } = await params;

    const { data, error } = await supabase
      .from('tenant_templates')
      .select('id, name, category, blocks, thumbnail, created_at')
      .eq('tenant_id', id)
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ templates: [] });
    }

    return NextResponse.json({ templates: data || [] });
  } catch (error) {
    console.error('Get templates error:', error);
    return NextResponse.json({ templates: [] });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id } = await params;
    const body = await request.json();

    if (!body.name || !body.blocks) {
      return NextResponse.json({ error: 'name and blocks required' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('tenant_templates')
      .insert({
        tenant_id: id,
        name: body.name,
        category: body.category || 'custom',
        blocks: body.blocks,
        thumbnail: body.thumbnail || null,
      })
      .select('id, name, category, blocks, thumbnail')
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ template: data });
  } catch (error) {
    console.error('Save template error:', error);
    return NextResponse.json({ error: 'Failed to save template' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id } = await params;
    const body = await request.json();

    if (!body.id) {
      return NextResponse.json({ error: 'template id required' }, { status: 400 });
    }

    const { error } = await supabase
      .from('tenant_templates')
      .delete()
      .eq('id', body.id)
      .eq('tenant_id', id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete template error:', error);
    return NextResponse.json({ error: 'Failed to delete template' }, { status: 500 });
  }
}
