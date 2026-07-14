import { NextRequest, NextResponse } from 'next/server';
import { getTenantBySlug } from '@/lib/tenant';

function categorizeReferrer(referrer: string | null): string {
  if (!referrer || referrer === '') return 'direct';
  try {
    const host = new URL(referrer).hostname.toLowerCase();
    if (/google|bing|duckduckgo|yahoo|baidu|yandex|ecosia|qwant/.test(host)) return 'search';
    if (/reddit|twitter|x\.com|discord|facebook|instagram|linkedin|t\.co|youtube|twitch/.test(host)) return 'social';
    return 'other';
  } catch {
    return 'other';
  }
}

function calcChange(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100);
}

export async function POST(request: NextRequest) {
  try {
    const { type, tenantSlug, articleId, pagePath, pageTitle, sessionId, question, modelUsed, provider, latencyMs, hadContext, feedback } = await request.json();

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

    const viewerIpHash = ip
      ? await import('crypto').then(c => c.createHash('sha256').update(ip + tenantSlug).digest('hex').slice(0, 16))
      : null;

    if (type === 'pageview') {
      await supabase.from('page_views').insert({
        tenant_id: tenant.id,
        article_id: articleId || null,
        page_path: pagePath || '/',
        page_title: pageTitle || '',
        viewer_ip_hash: viewerIpHash,
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
        feedback: feedback || null,
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

    const days = period === '7d' ? 7 : period === '30d' ? 30 : 90;
    const since = new Date();
    since.setDate(since.getDate() - days);

    const prevSince = new Date(since);
    prevSince.setDate(prevSince.getDate() - days);

    const { supabase } = await import('@/supabase');

    const [dailyViews, topPages, totalViews, dailyChats, chatSummary, prevViewsCount, prevChatsCount, referrerRows, modelRows, feedbackRows] = await Promise.all([
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
        .select('day, total_questions, unique_users, avg_latency_ms, with_context, positive_feedback, negative_feedback')
        .eq('tenant_id', tenant.id)
        .gte('day', since.toISOString())
        .order('day', { ascending: true }),

      supabase
        .from('chat_logs')
        .select('id', { count: 'exact', head: true })
        .eq('tenant_id', tenant.id)
        .gte('created_at', since.toISOString()),

      supabase
        .from('page_views')
        .select('id', { count: 'exact', head: true })
        .eq('tenant_id', tenant.id)
        .gte('viewed_at', prevSince.toISOString())
        .lt('viewed_at', since.toISOString()),

      supabase
        .from('chat_logs')
        .select('id', { count: 'exact', head: true })
        .eq('tenant_id', tenant.id)
        .gte('created_at', prevSince.toISOString())
        .lt('created_at', since.toISOString()),

      supabase
        .from('page_views')
        .select('referrer')
        .eq('tenant_id', tenant.id)
        .gte('viewed_at', since.toISOString()),

      supabase
        .from('chat_logs')
        .select('model_used')
        .eq('tenant_id', tenant.id)
        .gte('created_at', since.toISOString())
        .not('model_used', 'is', null),

      supabase
        .from('chat_logs')
        .select('feedback')
        .eq('tenant_id', tenant.id)
        .gte('created_at', since.toISOString())
        .not('feedback', 'is', null),
    ]);

    const currentViews = totalViews.count || 0;
    const currentChats = chatSummary.count || 0;
    const prevViews = prevViewsCount.count || 0;
    const prevChats = prevChatsCount.count || 0;

    const referrerMap = new Map<string, number>();
    for (const row of (referrerRows.data || [])) {
      const category = categorizeReferrer(row.referrer as string | null);
      referrerMap.set(category, (referrerMap.get(category) || 0) + 1);
    }
    const totalReferrers = [...referrerMap.values()].reduce((a, b) => a + b, 0);
    const referrerBreakdown = [...referrerMap.entries()]
      .map(([label, count]) => ({ label, count, percentage: Math.round((count / totalReferrers) * 100) }))
      .sort((a, b) => b.count - a.count);

    const modelMap = new Map<string, number>();
    for (const row of (modelRows.data || [])) {
      const model = (row.model_used as string) || 'unknown';
      modelMap.set(model, (modelMap.get(model) || 0) + 1);
    }
    const modelUsage = [...modelMap.entries()]
      .map(([model, count]) => ({ model, count }))
      .sort((a, b) => b.count - a.count);

    const feedbackTotals = { positive: 0, negative: 0, withContext: 0 };
    for (const row of (feedbackRows.data || [])) {
      const fb = row.feedback as string;
      if (fb === 'positive') feedbackTotals.positive++;
      else if (fb === 'negative') feedbackTotals.negative++;
    }
    for (const row of (dailyChats.data || [])) {
      feedbackTotals.withContext += (row as any).with_context || 0;
    }

    const dailyChatData = (dailyChats.data || []).map((row: any) => ({
      day: row.day,
      total_questions: row.total_questions,
      unique_users: row.unique_users,
      avg_latency_ms: row.avg_latency_ms,
    }));

    const totalUnique = [...new Set((dailyViews.data || []).map((r: any) => r.unique_visitors))].reduce((a, b) => a + b, 0);

    return NextResponse.json({
      period,
      pageViews: {
        daily: dailyViews.data || [],
        topPages: topPages.data || [],
        total: currentViews,
        uniqueVisitors: totalUnique,
      },
      chatUsage: {
        daily: dailyChatData,
        total: currentChats,
        feedbackStats: feedbackTotals,
        modelUsage,
      },
      trends: {
        views: { current: currentViews, previous: prevViews, change: calcChange(currentViews, prevViews) },
        chats: { current: currentChats, previous: prevChats, change: calcChange(currentChats, prevChats) },
      },
      referrerBreakdown,
    });
  } catch (error) {
    console.error('Analytics fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 });
  }
}
