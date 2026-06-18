import { NextRequest, NextResponse } from 'next/server';
import { getTenantBySlug } from '@/lib/tenant';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get('slug');

    if (!slug) {
      return NextResponse.json({ error: 'slug required' }, { status: 400 });
    }

    const tenant = await getTenantBySlug(slug);

    if (!tenant) {
      return NextResponse.json({ error: 'Wiki not found' }, { status: 404 });
    }

    return NextResponse.json({
      wiki: {
        id: tenant.id,
        name: tenant.name,
        slug: tenant.slug,
        logo_url: tenant.logo_url,
        description: tenant.description,
      },
    });
  } catch (error) {
    console.error('Voice wiki error:', error);
    return NextResponse.json({ error: 'Failed to get wiki' }, { status: 500 });
  }
}
