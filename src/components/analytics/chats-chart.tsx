'use client';

import { type DailyChat } from './types';
import { WeldingCard } from '@/components/ui/welding-card';
import { CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';

interface ChatsChartProps {
  data: DailyChat[];
  title: string;
  noDataLabel: string;
}

export function ChatsChart({ data, title, noDataLabel }: ChatsChartProps) {
  return (
    <WeldingCard>
      <CardHeader>
        <CardTitle className="text-sm">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          {data.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="day" tick={{ fontSize: 11 }} stroke="#64748b" tickFormatter={(v) => v?.slice(5, 10) || ''} />
                <YAxis tick={{ fontSize: 11 }} stroke="#64748b" />
                <Tooltip
                  contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', fontSize: '12px' }}
                />
                <Bar dataKey="total_questions" fill="#4BC5FF" radius={[4, 4, 0, 0]} />
              </BarChart>
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
