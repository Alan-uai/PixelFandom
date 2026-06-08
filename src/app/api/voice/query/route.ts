import { NextRequest, NextResponse } from 'next/server'

async function getTenantId(slug: string): Promise<string | null> {
  const { supabase } = await import('@/supabase')
  const { data } = await supabase
    .from('tenants')
    .select('id')
    .eq('slug', slug)
    .single()
  return data?.id || null
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const slug = searchParams.get('slug')
    const action = searchParams.get('action')

    if (!slug || !action) {
      return NextResponse.json({ error: 'slug and action required' }, { status: 400 })
    }

    const tenantId = await getTenantId(slug)
    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })
    }

    const { executeTextChatTool } = await import('@/lib/text-chat-tools')

    const args: Record<string, unknown> = {}
    for (const [key, value] of searchParams.entries()) {
      if (key === 'slug' || key === 'action') continue
      if (key === 'stats' || key === 'statColumns') {
        args[key] = value.split(',').filter(Boolean)
      } else if (key === 'filters') {
        try { args[key] = JSON.parse(value) } catch { args[key] = value }
      } else if (key === 'descending') {
        args[key] = value === 'true'
      } else if (key === 'limit' || key === 'offset' || key === 'days' || key === 'percentRange' || key === 'min' || key === 'max') {
        args[key] = Number(value)
      } else {
        args[key] = value
      }
    }

    const result = await executeTextChatTool(action, args, { slug, tenantId })
    return NextResponse.json(result)
  } catch (error) {
    console.error('Voice query error:', error)
    return NextResponse.json({ error: 'Query failed' }, { status: 500 })
  }
}
