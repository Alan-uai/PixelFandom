import { NextRequest, NextResponse } from 'next/server';
import { getTenantBySlug } from '@/lib/tenant';

export async function POST(request: NextRequest) {
  try {
    const { type, tenantSlug, articleId, pagePath, pageTitle, sessionId, question, modelUsed, provider, latencyMs, hadContext } = await request.json();

    if (!tenantSlug) {
      return NextResponse.json({ error: 'tenantSlug is required' }, { status: 400 });
    }

    const tenant = await getTenantBySlug(tenantSlug);
    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }

    const { supabase } = await import('@/supabase');
    const userAgent = request.headers.get('user-agent') || '';
    const referrer = request.headers.get('referer') || '';
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '';

    import('crypto').then(crypto => {
      const hash = crypto.createHash('sha256').update(ip + tenantSlug).digest('hex').slice(0, 16);
    });

    if (type === 'pageview') {
      await supabase.from('page_views').insert({
        tenant_id: tenant.id,
        article_id: articleId || null,
        page_path: pagePath || '/',
        page_title: pageTitle || '',
        user_agent: userAgent.slice(0, 500),
        referrer: referrer.slice(0, 500),
      });
    }

    if (type === 'chat') {
      await supabase.from('chat_logs').insert({
        tenant_id: tenant.id,
        session_id: sessionId || null,
        question: (question || '').slice(0, 1000),
        answer_length: 0,
        model_used: modelUsed || null,
        provider: provider || null,
        latency_ms: latencyMs || null,
        had_context: hadContext || false,
      });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Analytics track error:', error);
    return NextResponse.json({ error: 'Failed to track' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get('slug');
    const period = searchParams.get('period') || '7d';

    if (!slug) {
      return NextResponse.json({ error: 'slug is required' }, { status: 400 });
    }

    const tenant = await getTenantBySlug(slug);
    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }

    const since = new Date();
    if (period === '7d') since.setDate(since.getDate() - 7);
    else if (period === '30d') since.setDate(since.getDate() - 30);
    else if (period === '90d') since.setDate(since.getDate() - 90);
    else since.setDate(since.getDate() - 7);

    const { supabase } = await import('@/supabase');

    const [dailyViews, topPages, totalViews, dailyChats, chatSummary] = await Promise.all([
      supabase
        .from('mv_daily_page_views')
        .select('day, views, unique_visitors')
        .eq('tenant_id', tenant.id)
        .gte('day', since.toISOString())
        .order('day', { ascending: true }),

      supabase
        .from('mv_daily_page_views')
        .select('page_title, page_path, views, unique_visitors')
        .eq('tenant_id', tenant.id)
        .gte('day', since.toISOString())
        .order('views', { ascending: false })
        .limit(10),

      supabase
        .from('page_views')
        .select('id', { count: 'exact', head: true })
        .eq('tenant_id', tenant.id)
        .gte('viewed_at', since.toISOString()),

      supabase
        .from('mv_daily_chat_stats')
        .select('day, total_questions, unique_users, avg_latency_ms')
        .eq('tenant_id', tenant.id)
        .gte('day', since.toISOString())
        .order('day', { ascending: true }),

      supabase
        .from('chat_logs')
        .select('id', { count: 'exact', head: true })
        .eq('tenant_id', tenant.id)
        .gte('created_at', since.toISOString()),
    ]);

    return NextResponse.json({
      period,
      pageViews: {
        daily: dailyViews.data || [],
        topPages: topPages.data || [],
        total: totalViews.count || 0,
      },
      chatUsage: {
        daily: dailyChats.data || [],
        total: chatSummary.count || 0,
      },
    });
  } catch (error) {
    console.error('Analytics fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 });
  }
}
