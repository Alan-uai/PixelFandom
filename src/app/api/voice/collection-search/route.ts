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

    const { data, error } = await supabase.rpc('search_collection_items', {
      p_tenant_slug: slug,
      p_search: query,
      p_embedding: null,
      p_limit: 5,
    })

    if (error) throw error

    const results = (data || []).map((item: any) => {
      const name = item?.name || item?.data?.name || ''
      const itemSlug = name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
      return { ...item, slug: itemSlug || item.id }
    })

    return NextResponse.json({ results })
  } catch (error) {
    console.error('Voice collection search error:', error)
    return NextResponse.json({ error: 'Collection search failed' }, { status: 500 })
  }
}
