import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const slug = searchParams.get('slug')
    const query = searchParams.get('q')

    if (!slug || !query) {
      return NextResponse.json({ error: 'slug and q required' }, { status: 400 })
    }

    const { supabase } = await import('@/supabase')

    const { data: tenant } = await supabase
      .from('tenants')
      .select('id')
      .eq('slug', slug)
      .single()

    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })
    }

    const cleanQuery = query.trim()

    const { data, error } = await supabase
      .from('wiki_articles')
      .select('id, title, slug, summary, content, tags, image_url, updated_at')
      .eq('tenant_id', tenant.id)
      .or(
        `title.ilike.%${cleanQuery}%,` +
        `summary.ilike.%${cleanQuery}%,` +
        `content.ilike.%${cleanQuery}%`
      )
      .limit(10)

    if (error) throw error

    const taggedResults = await supabase
      .from('wiki_articles')
      .select('id, title, slug, summary, content, tags, image_url, updated_at')
      .eq('tenant_id', tenant.id)
      .contains('tags', [cleanQuery])
      .limit(10)

    const merged = new Map<string, any>()
    for (const article of data || []) {
      merged.set(article.id, article)
    }
    for (const article of taggedResults.data || []) {
      if (!merged.has(article.id)) {
        merged.set(article.id, article)
      }
    }

    const results = Array.from(merged.values()).slice(0, 10)

    return NextResponse.json({ results })
  } catch (error) {
    console.error('Voice search error:', error)
    return NextResponse.json({ error: 'Search failed' }, { status: 500 })
  }
}
