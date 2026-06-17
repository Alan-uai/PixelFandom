import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const limit = Math.min(Number(searchParams.get('limit')) || 50, 100);
    const offset = Number(searchParams.get('offset')) || 0;

    let query = supabase
      .from('wiki_media')
      .select('id, file_name, file_size, mime_type, public_url, alt_text, width, height, created_at, uploaded_by')
      .eq('tenant_id', id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (search) {
      query = query.ilike('file_name', `%${search}%`);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ media: [], total: 0 });
    }

    const { count } = await supabase
      .from('wiki_media')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', id);

    return NextResponse.json({ media: data || [], total: count || 0 });
  } catch (error) {
    console.error('Get media error:', error);
    return NextResponse.json({ media: [], total: 0 });
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

    if (!body.public_url || !body.storage_path || !body.file_name) {
      return NextResponse.json(
        { error: 'public_url, storage_path, and file_name required' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('wiki_media')
      .insert({
        tenant_id: id,
        uploaded_by: body.uploaded_by,
        file_name: body.file_name,
        file_size: body.file_size || null,
        mime_type: body.mime_type || 'image/png',
        storage_path: body.storage_path,
        public_url: body.public_url,
        alt_text: body.alt_text || '',
        width: body.width || null,
        height: body.height || null,
      })
      .select('id, file_name, public_url, alt_text, created_at')
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ media: data });
  } catch (error) {
    console.error('Save media error:', error);
    return NextResponse.json({ error: 'Failed to save media' }, { status: 500 });
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
      return NextResponse.json({ error: 'media id required' }, { status: 400 });
    }

    const { error } = await supabase
      .from('wiki_media')
      .delete()
      .eq('id', body.id)
      .eq('tenant_id', id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete media error:', error);
    return NextResponse.json({ error: 'Failed to delete media' }, { status: 500 });
  }
}
