'use client';

import { type DailyView } from './types';
import { WeldingCard } from '@/components/ui/welding-card';
import { CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';

interface ViewsChartProps {
  data: DailyView[];
  title: string;
  noDataLabel: string;
}

export function ViewsChart({ data, title, noDataLabel }: ViewsChartProps) {
  return (
    <WeldingCard>
      <CardHeader>
        <CardTitle className="text-sm">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          {data.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data}>
                <defs>
                  <linearGradient id="viewGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4BC5FF" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#4BC5FF" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="uniqueGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#a78bfa" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#a78bfa" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="day" tick={{ fontSize: 11 }} stroke="#64748b" tickFormatter={(v) => v?.slice(5, 10) || ''} />
                <YAxis tick={{ fontSize: 11 }} stroke="#64748b" />
                <Tooltip
                  contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', fontSize: '12px' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', color: '#94a3b8' }} />
                <Area type="monotone" dataKey="views" stroke="#4BC5FF" fill="url(#viewGradient)" strokeWidth={2} name="Views" />
                <Area type="monotone" dataKey="unique_visitors" stroke="#a78bfa" fill="url(#uniqueGradient)" strokeWidth={2} name="Unique" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
              {noDataLabel}
            </div>
          )}
        </div>
      </CardContent>
    </WeldingCard>
  );
}
