'use client';

import { useParams } from 'next/navigation';
import { useCachedData } from '@/hooks/use-cached-data';
import { useState } from 'react';
import { CardContent, CardHeader, CardDescription } from '@/components/ui/card';
import { WeldingCard } from '@/components/ui/welding-card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useTranslations } from 'next-intl';
import { Loader2, ThumbsUp, ThumbsDown, TrendingUp, BarChart3, MessageSquare, Check, X } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

type FeedbackStats = {
  total: number;
  positive: number;
  negative: number;
  positiveRate: number;
  negativeRate: number;
  byModel: Array<{ model: string; total: number; positive: number; negative: number }>;
  recentNegative: Array<{
    id: string;
    question: string;
    negative_response: string;
    ai_suggestion: string | null;
    status: string;
    created_at: string;
  }>;
};

export default function AiFeedbackPage() {
  const params = useParams();
  const slug = params.slug as string;
  const { toast } = useToast();
  const t = useTranslations('ai.feedback');

  const { data: stats, loading, error: statsError } = useCachedData<FeedbackStats>(
    `ai-feedback:${slug}`,
    async () => {
      const res = await fetch(`/api/tenants/feedback?slug=${slug}`);
      if (!res.ok) throw new Error('Failed to fetch');
      return res.json();
    }
  );

  const [negativeList, setNegativeList] = useState<FeedbackStats['recentNegative'] | null>(null);

  const handleResolve = async (id: string, resolution: string) => {
    try {
      const res = await fetch(`/api/tenants/feedback/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resolution, status: 'reviewed', reviewed_at: new Date().toISOString() }),
      });
      if (res.ok) {
        setNegativeList((prev) => (prev || stats!.recentNegative).filter((item: { id: string }) => item.id !== id));
        toast({ title: t('toast.updated.title'), description: t('toast.updated.description') });
      }
    } catch {
      toast({ variant: 'destructive', title: t('toast.error.title'), description: t('toast.error.description') });
    }
  };

  if (statsError) {
    return (
      <div className="p-6 max-w-2xl mx-auto text-center py-20">
        <p className="text-destructive font-medium">{t('error.title')}</p>
        <p className="text-sm text-muted-foreground mt-1">{statsError.message}</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="p-6 max-w-2xl mx-auto text-center text-muted-foreground py-20">
        {t('empty')}
      </div>
    );
  }

  const displayNegative = negativeList ?? stats.recentNegative;

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <MessageSquare className="h-6 w-6 text-primary" />
          {t('title')}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {t('description')}
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <WeldingCard>
          <CardHeader className="pb-2">
            <CardDescription className="text-xs">{t('stats.total')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-primary" />
              <span className="text-2xl font-bold">{stats.total}</span>
            </div>
          </CardContent>
        </WeldingCard>
        <WeldingCard>
          <CardHeader className="pb-2">
            <CardDescription className="text-xs">{t('stats.positive')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <ThumbsUp className="h-4 w-4 text-green-500" />
              <span className="text-2xl font-bold">{stats.positive}</span>
            </div>
          </CardContent>
        </WeldingCard>
        <WeldingCard>
          <CardHeader className="pb-2">
            <CardDescription className="text-xs">{t('stats.negative')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <ThumbsDown className="h-4 w-4 text-red-500" />
              <span className="text-2xl font-bold">{stats.negative}</span>
            </div>
          </CardContent>
        </WeldingCard>
        <WeldingCard>
          <CardHeader className="pb-2">
            <CardDescription className="text-xs">{t('stats.satisfaction')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              <span className="text-2xl font-bold">{stats.positiveRate}%</span>
            </div>
          </CardContent>
        </WeldingCard>
      </div>

      <Tabs defaultValue="negative">
        <TabsList>
          <TabsTrigger value="negative" className="flex items-center gap-1.5">
            <ThumbsDown className="h-4 w-4" />
            {t('tabs.negative')}
          </TabsTrigger>
          <TabsTrigger value="models" className="flex items-center gap-1.5">
            <BarChart3 className="h-4 w-4" />
            {t('tabs.by_model')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="negative" className="mt-4">
          {displayNegative.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">{t('negative.empty')}</p>
          ) : (
            <div className="space-y-3">
              {displayNegative.map((item) => (
                <WeldingCard key={item.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="text-sm font-medium">{t('negative.question_label')}</p>
                        <p className="text-sm text-muted-foreground mt-1">{item.question}</p>
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        item.status === 'pending' ? 'bg-amber-500/10 text-amber-500' : 'bg-green-500/10 text-green-500'
                      }`}>
                        {item.status === 'pending' ? t('negative.status.pending') : t('negative.status.reviewed')}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <p className="text-xs font-medium text-muted-foreground">{t('negative.response_label')}</p>
                      <p className="text-sm mt-1">{item.negative_response}</p>
                    </div>
                    {item.ai_suggestion && (
                      <div>
                        <p className="text-xs font-medium text-muted-foreground">{t('negative.suggestion_label')}</p>
                        <p className="text-sm mt-1 text-primary">{item.ai_suggestion}</p>
                      </div>
                    )}
                    {item.status === 'pending' && (
                      <div className="flex gap-2 pt-2">
                        <Button size="sm" variant="outline" onClick={() => handleResolve(item.id, 'accepted')} className="gap-1">
                          <Check className="h-3 w-3" /> {t('negative.accept_suggestion')}
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handleResolve(item.id, 'dismissed')} className="gap-1 text-destructive">
                          <X className="h-3 w-3" /> {t('negative.dismiss')}
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </WeldingCard>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="models" className="mt-4">
          {stats.byModel.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">{t('byModel.empty')}</p>
          ) : (
            <div className="space-y-2">
              {stats.byModel.map((m: { model: string; total: number; positive: number; negative: number }) => (
                <div key={m.model} className="flex items-center gap-4 p-3 rounded-lg border bg-card">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{m.model}</p>
                  </div>
                  <span className="text-xs text-muted-foreground">{m.total} {t('byModel.responses_suffix')}</span>
                  <span className="text-xs text-green-500">{m.positive} 👍</span>
                  <span className="text-xs text-red-500">{m.negative} 👎</span>
                  <div className="w-24 h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full bg-green-500 transition-all"
                      style={{ width: `${m.total > 0 ? (m.positive / m.total) * 100 : 0}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
