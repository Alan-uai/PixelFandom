'use client';

import { type DailyChat, type ModelUsageItem } from './types';
import { WeldingCard } from '@/components/ui/welding-card';
import { CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { ThumbsUp, ThumbsDown, Brain, Clock, FileText } from 'lucide-react';

interface ChatQualityProps {
  dailyData: DailyChat[];
  modelUsage: ModelUsageItem[];
  feedbackStats: { positive: number; negative: number; withContext: number };
  title: string;
  positiveLabel: string;
  negativeLabel: string;
  contextLabel: string;
  latencyLabel: string;
  latencyMsLabel: string;
  modelUsageLabel: string;
  noFeedbackLabel: string;
  noModelsLabel: string;
}

export function ChatQuality({
  dailyData, modelUsage, feedbackStats,
  title, positiveLabel, negativeLabel, contextLabel, latencyLabel, latencyMsLabel,
  modelUsageLabel, noFeedbackLabel, noModelsLabel,
}: ChatQualityProps) {
  const totalQuestions = dailyData.reduce((s, d) => s + d.total_questions, 0);
  const avgLatency = dailyData.length > 0
    ? Math.round(dailyData.reduce((s, d) => s + d.avg_latency_ms, 0) / dailyData.length)
    : 0;
  const totalFeedback = feedbackStats.positive + feedbackStats.negative;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <WeldingCard>
        <CardHeader>
          <CardTitle className="text-sm">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <QualityItem icon={<ThumbsUp className="h-4 w-4 text-emerald-400" />} label={positiveLabel} value={String(feedbackStats.positive)} />
            <QualityItem icon={<ThumbsDown className="h-4 w-4 text-red-400" />} label={negativeLabel} value={String(feedbackStats.negative)} />
            <QualityItem icon={<FileText className="h-4 w-4 text-violet-400" />} label={contextLabel} value={String(feedbackStats.withContext)} />
            <QualityItem icon={<Clock className="h-4 w-4 text-amber-400" />} label={latencyLabel} value={latencyMsLabel.replace('{ms}', String(avgLatency))} />
          </div>
          {totalFeedback > 0 && (
            <div className="mt-4">
              <div className="flex h-2 rounded-full overflow-hidden">
                <div
                  className="bg-emerald-400 transition-all"
                  style={{ width: `${(feedbackStats.positive / totalFeedback) * 100}%` }}
                />
                <div
                  className="bg-red-400 transition-all"
                  style={{ width: `${(feedbackStats.negative / totalFeedback) * 100}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {Math.round((feedbackStats.positive / totalFeedback) * 100)}% {positiveLabel.toLowerCase()}
              </p>
            </div>
          )}
          {totalFeedback === 0 && (
            <p className="text-xs text-muted-foreground mt-4 text-center">{noFeedbackLabel}</p>
          )}
        </CardContent>
      </WeldingCard>

      <WeldingCard>
        <CardHeader>
          <CardTitle className="text-sm">{modelUsageLabel}</CardTitle>
        </CardHeader>
        <CardContent>
          {modelUsage.length > 0 ? (
            <div className="space-y-2">
              {modelUsage.map((item) => {
                const pct = Math.round((item.count / totalQuestions) * 100);
                return (
                  <div key={item.model} className="flex items-center gap-3">
                    <Brain className="h-4 w-4 text-primary shrink-0" />
                    <span className="flex-1 text-sm truncate">{item.model}</span>
                    <span className="text-sm font-medium">{item.count}</span>
                    <span className="text-xs text-muted-foreground w-8 text-right">{pct}%</span>
                    <div className="w-20 h-2 bg-muted rounded-full overflow-hidden shrink-0">
                      <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">{noModelsLabel}</p>
          )}
        </CardContent>
      </WeldingCard>
    </div>
  );
}

function QualityItem({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
      {icon}
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-lg font-bold">{value}</p>
      </div>
    </div>
  );
}
