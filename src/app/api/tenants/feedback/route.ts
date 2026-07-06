import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/supabase';
import { getTenantBySlug } from '@/lib/tenant';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get('slug');
    if (!slug) return NextResponse.json({ error: 'slug required' }, { status: 400 });

    const tenant = await getTenantBySlug(slug);
    if (!tenant) return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });

    const [totalRes, positiveRes, negativeRes, byModelRes, recentNegatives] = await Promise.all([
      supabase.from('chat_logs').select('id', { count: 'exact', head: true }).eq('tenant_id', tenant.id),
      supabase.from('chat_logs').select('id', { count: 'exact', head: true }).eq('tenant_id', tenant.id).eq('feedback', 'positive'),
      supabase.from('chat_logs').select('id', { count: 'exact', head: true }).eq('tenant_id', tenant.id).eq('feedback', 'negative'),
      supabase.from('chat_logs').select('model_used, feedback').eq('tenant_id', tenant.id).not('feedback', 'is', null),
      supabase.from('negative_feedback').select('*').eq('tenant_id', tenant.id).order('created_at', { ascending: false }).limit(20),
    ]);

    const total = totalRes.count || 0;
    const positive = positiveRes.count || 0;
    const negative = negativeRes.count || 0;
    const withFeedback = positive + negative;
    const positiveRate = withFeedback > 0 ? Math.round((positive / withFeedback) * 100) : 0;
    const negativeRate = withFeedback > 0 ? Math.round((negative / withFeedback) * 100) : 0;

    const modelMap = new Map<string, { total: number; positive: number; negative: number }>();
    (byModelRes.data || []).forEach((row: any) => {
      const model = row.model_used || 'unknown';
      if (!modelMap.has(model)) modelMap.set(model, { total: 0, positive: 0, negative: 0 });
      const entry = modelMap.get(model)!;
      entry.total++;
      if (row.feedback === 'positive') entry.positive++;
      if (row.feedback === 'negative') entry.negative++;
    });

    const byModel = Array.from(modelMap.entries()).map(([model, data]) => ({
      model, ...data
    }));

    return NextResponse.json({
      total,
      positive,
      negative,
      positiveRate,
      negativeRate,
      byModel,
      recentNegative: recentNegatives.data || [],
    });
  } catch (error) {
    console.error('Feedback fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
  }
}
