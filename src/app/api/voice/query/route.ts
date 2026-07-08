import { NextRequest, NextResponse } from 'next/server'
import { getTenantBySlug } from '@/lib/tenant'
import { createClient } from '@/supabase/server'

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

    // Verify auth — if user is logged in and member of this tenant, allow all.
    // If not, allow only if tenant is public.
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      if (!tenant.is_public) {
        return NextResponse.json({ error: 'Autenticação necessária para acessar esta wiki.' }, { status: 401 })
      }
    } else {
      const { data: membership } = await supabase
        .from('tenant_members')
        .select('role')
        .eq('tenant_id', tenant.id)
        .eq('user_id', user.id)
        .single()

      if (!membership && !tenant.is_public) {
        return NextResponse.json({ error: 'Acesso negado.' }, { status: 403 })
      }
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
