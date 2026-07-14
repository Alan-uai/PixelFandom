'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useCachedData } from '@/hooks/use-cached-data';
import { Loader2, Eye, EyeOff, MessageSquare, TrendingUp, Calendar } from 'lucide-react';
import { type AnalyticsData } from '@/components/analytics/types';
import { MetricCard } from '@/components/analytics/metric-card';
import { ViewsChart } from '@/components/analytics/views-chart';
import { ChatsChart } from '@/components/analytics/chats-chart';
import { TopPages } from '@/components/analytics/top-pages';
import { ReferrerChart } from '@/components/analytics/referrer-chart';
import { ChatQuality } from '@/components/analytics/chat-quality';
import { CsvExport } from '@/components/analytics/csv-export';
import { ErrorState } from '@/components/analytics/error-state';

export default function AnalyticsPage() {
  const params = useParams();
  const slug = params.slug as string;
  const t = useTranslations('analytics');
  const [period, setPeriod] = useState('7d');
  const cacheKey = `analytics:${slug}:${period}`;
  const { data, loading, error, mutate } = useCachedData<AnalyticsData>(
    cacheKey,
    async () => {
      const r = await fetch(`/api/analytics?slug=${slug}&period=${period}`);
      if (!r.ok) {
        const text = await r.text().catch(() => 'Unknown error');
        throw new Error(`API error ${r.status}: ${text}`);
      }
      return r.json();
    }
  );

  const periods = [
    { value: '7d', label: t('periods.7d') },
    { value: '30d', label: t('periods.30d') },
    { value: '90d', label: t('periods.90d') },
  ];

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 max-w-5xl mx-auto">
        <ErrorState
          message={t('error_title')}
          description={t('error_description')}
          onRetry={mutate}
          retryLabel={t('retry')}
        />
      </div>
    );
  }

  const dailyAvg = data?.pageViews.daily.length
    ? Math.round(data.pageViews.total / data.pageViews.daily.length)
    : 0;

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <TrendingUp className="h-6 w-6 text-primary" />
            {t('title')}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {t('description')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {data && <CsvExport data={data} label={t('export_csv')} />}
          <div className="flex gap-1 bg-muted rounded-lg p-1">
            {periods.map(p => (
              <button
                key={p.value}
                onClick={() => setPeriod(p.value)}
                className={`px-3 py-1.5 text-xs rounded-md transition-colors ${
                  period === p.value ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard
          label={t('metrics.views')}
          value={data?.pageViews.total ?? 0}
          icon={<Eye className="h-4 w-4 text-primary" />}
          trend={data?.trends.views ? { change: data.trends.views.change } : null}
          trendLabelUp={t('metrics.trend_up')}
          trendLabelDown={t('metrics.trend_down')}
          trendLabelSame={t('metrics.trend_same')}
        />
        <MetricCard
          label={t('metrics.unique_visitors')}
          value={data?.pageViews.uniqueVisitors ?? 0}
          icon={<EyeOff className="h-4 w-4 text-violet-400" />}
        />
        <MetricCard
          label={t('metrics.chats')}
          value={data?.chatUsage.total ?? 0}
          icon={<MessageSquare className="h-4 w-4 text-primary" />}
          trend={data?.trends.chats ? { change: data.trends.chats.change } : null}
          trendLabelUp={t('metrics.trend_up')}
          trendLabelDown={t('metrics.trend_down')}
          trendLabelSame={t('metrics.trend_same')}
        />
        <MetricCard
          label={t('metrics.daily_average')}
          value={dailyAvg}
          icon={<Calendar className="h-4 w-4 text-amber-400" />}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ViewsChart
          data={data?.pageViews.daily || []}
          title={t('charts.views_per_day')}
          noDataLabel={t('charts.no_data')}
        />
        <ChatsChart
          data={data?.chatUsage.daily || []}
          title={t('charts.chats_per_day')}
          noDataLabel={t('charts.no_data')}
        />
      </div>

      <ChatQuality
        dailyData={data?.chatUsage.daily || []}
        modelUsage={data?.chatUsage.modelUsage || []}
        feedbackStats={data?.chatUsage.feedbackStats || { positive: 0, negative: 0, withContext: 0 }}
        title={t('chat_quality.title')}
        positiveLabel={t('chat_quality.positive_feedback')}
        negativeLabel={t('chat_quality.negative_feedback')}
        contextLabel={t('chat_quality.with_context')}
        latencyLabel={t('chat_quality.avg_latency')}
        latencyMsLabel={t('chat_quality.latency_ms')}
        modelUsageLabel={t('chat_quality.model_usage')}
        noFeedbackLabel={t('chat_quality.no_feedback')}
        noModelsLabel={t('chat_quality.no_models')}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TopPages
          data={data?.pageViews.topPages || []}
          title={t('top_pages.title')}
          uniqueLabel={t('top_pages.unique_visitors')}
          noDataLabel={t('top_pages.no_data')}
        />
        <ReferrerChart
          data={data?.referrerBreakdown || []}
          title={t('referrer.title')}
          labels={{
            direct: t('referrer.direct'),
            search: t('referrer.search'),
            social: t('referrer.social'),
            other: t('referrer.other'),
          }}
          noDataLabel={t('referrer.no_data')}
        />
      </div>
    </div>
  );
}
