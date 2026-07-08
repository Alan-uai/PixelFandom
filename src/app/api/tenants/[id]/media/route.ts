import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/supabase/server';
import { z } from 'zod';
import { detectSqlInjection } from '@/lib/sql-injection-detect';

const mediaInsertSchema = z.object({
  public_url: z.string().url().max(2048),
  storage_path: z.string().min(1).max(512),
  file_name: z.string().min(1).max(255),
  file_size: z.number().int().positive().optional().nullable(),
  mime_type: z.string().max(128).optional().default('image/png'),
  alt_text: z.string().max(500).optional().default(''),
  width: z.number().int().positive().optional().nullable(),
  height: z.number().int().positive().optional().nullable(),
  uploaded_by: z.string().uuid().optional().nullable(),
  scan_status: z.enum(['pending', 'scanning', 'clean', 'infected', 'error']).optional(),
  file_hash: z.string().max(128).optional().nullable(),
});

const mediaDeleteSchema = z.object({
  id: z.string().uuid(),
});

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

    if (detectSqlInjection(search).detected) {
      return NextResponse.json({ media: [], total: 0 });
    }

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

    const parsed = mediaInsertSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('wiki_media')
      .insert({
        tenant_id: id,
        uploaded_by: parsed.data.uploaded_by,
        file_name: parsed.data.file_name,
        file_size: parsed.data.file_size || null,
        mime_type: parsed.data.mime_type,
        storage_path: parsed.data.storage_path,
        public_url: parsed.data.public_url,
        alt_text: parsed.data.alt_text,
        width: parsed.data.width || null,
        height: parsed.data.height || null,
        scan_status: parsed.data.scan_status || 'pending',
        file_hash: parsed.data.file_hash || null,
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

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { data: membership } = await supabase
      .from('tenant_members')
      .select('role')
      .eq('tenant_id', id)
      .eq('user_id', user.id)
      .maybeSingle();

    if (!membership || !['owner', 'admin', 'editor'].includes(membership.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const body = await request.json();

    const parsed = mediaDeleteSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
    }

    const { error } = await supabase
      .from('wiki_media')
      .delete()
      .eq('id', parsed.data.id)
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
