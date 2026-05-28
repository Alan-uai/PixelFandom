import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const slug = searchParams.get('slug')

    if (!slug) {
      return NextResponse.json({ error: 'slug required' }, { status: 400 })
    }

    const { supabase } = await import('@/supabase')

    const { data: tenant } = await supabase
      .from('tenants')
      .select('id, name, slug, logo_url, description')
      .eq('slug', slug)
      .single()

    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })
    }

    const [{ count: articleCount }, { data: rawTags }] = await Promise.all([
      supabase
        .from('wiki_articles')
        .select('id', { count: 'exact', head: true })
        .eq('tenant_id', tenant.id),
      supabase
        .from('wiki_articles')
        .select('tags')
        .eq('tenant_id', tenant.id)
        .not('tags', 'is', null),
    ])

    const uniqueTags = [...new Set((rawTags || []).flatMap((r) => r.tags || []))].sort()

    const tagCounts: Record<string, number> = {}
    for (const row of rawTags || []) {
      for (const tag of row.tags || []) {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1
      }
    }

    return NextResponse.json({
      wiki: {
        name: tenant.name,
        slug: tenant.slug,
        logo_url: tenant.logo_url,
        description: tenant.description,
      },
      article_count: articleCount || 0,
      tags: uniqueTags,
      tag_counts: tagCounts,
    })
  } catch (error) {
    console.error('Voice wiki info error:', error)
    return NextResponse.json({ error: 'Failed to get wiki info' }, { status: 500 })
  }
}
