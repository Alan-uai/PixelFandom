'use client';

import { type ReferrerItem } from './types';
import { WeldingCard } from '@/components/ui/welding-card';
import { CardHeader, CardTitle, CardContent } from '@/components/ui/card';

const REFERRER_COLORS: Record<string, string> = {
  direct: '#4BC5FF',
  search: '#34d399',
  social: '#f472b6',
  other: '#64748b',
};

interface ReferrerChartProps {
  data: ReferrerItem[];
  title: string;
  labels: Record<string, string>;
  noDataLabel: string;
}

export function ReferrerChart({ data, title, labels, noDataLabel }: ReferrerChartProps) {
  return (
    <WeldingCard>
      <CardHeader>
        <CardTitle className="text-sm">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {data.length > 0 ? (
          <div className="space-y-4">
            <div className="flex h-3 rounded-full overflow-hidden">
              {data.map((item) => (
                <div
                  key={item.label}
                  style={{ width: `${item.percentage}%`, backgroundColor: REFERRER_COLORS[item.label] || '#64748b' }}
                  title={`${labels[item.label] || item.label}: ${item.percentage}%`}
                />
              ))}
            </div>
            <div className="space-y-2">
              {data.map((item) => (
                <div key={item.label} className="flex items-center gap-3">
                  <div
                    className="w-3 h-3 rounded-full shrink-0"
                    style={{ backgroundColor: REFERRER_COLORS[item.label] || '#64748b' }}
                  />
                  <span className="flex-1 text-sm">{labels[item.label] || item.label}</span>
                  <span className="text-sm font-medium">{item.count}</span>
                  <span className="text-xs text-muted-foreground w-10 text-right">{item.percentage}%</span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-8">{noDataLabel}</p>
        )}
      </CardContent>
    </WeldingCard>
  );
}
