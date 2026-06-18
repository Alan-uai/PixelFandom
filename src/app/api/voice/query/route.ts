import { NextRequest, NextResponse } from 'next/server'
import { getTenantBySlug } from '@/lib/tenant'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const slug = searchParams.get('slug')
    const action = searchParams.get('action')

    if (!slug || !action) {
      return NextResponse.json({ error: 'slug and action required' }, { status: 400 })
    }

    const tenant = await getTenantBySlug(slug)
    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })
    }

    const { executeTextChatTool } = await import('@/lib/text-chat-tools')

    const arrayKeys = new Set(['stats', 'statColumns', 'names', 'tables', 'columns', 'queries', 'matchColumns', 'itemNames'])
    const numberKeys = new Set(['limit', 'offset', 'days', 'percentRange', 'min', 'max', 'precision'])

    const args: Record<string, unknown> = {}
    for (const [key, value] of searchParams.entries()) {
      if (key === 'slug' || key === 'action') continue
      if (arrayKeys.has(key)) {
        args[key] = value.split(',').filter(Boolean)
      } else if (key === 'filters') {
        try { args[key] = JSON.parse(value) } catch { args[key] = value }
      } else if (key === 'descending') {
        args[key] = value === 'true'
      } else if (numberKeys.has(key)) {
        args[key] = Number(value)
      } else {
        args[key] = value
      }
    }

    const result = await executeTextChatTool(action, args, { slug, tenantId: tenant.id })
    return NextResponse.json(result)
  } catch (error) {
    console.error('Voice query error:', error)
    return NextResponse.json({ error: 'Query failed' }, { status: 500 })
  }
}
