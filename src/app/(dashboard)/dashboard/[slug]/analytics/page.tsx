'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, Eye, MessageSquare, TrendingUp, BarChart3, Calendar } from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';

type DailyView = { day: string; views: number; unique_visitors: number };
type DailyChat = { day: string; total_questions: number; unique_users: number; avg_latency_ms: number };
type TopPage = { page_title: string; page_path: string; views: number; unique_visitors: number };

type AnalyticsData = {
  period: string;
  pageViews: { daily: DailyView[]; topPages: TopPage[]; total: number };
  chatUsage: { daily: DailyChat[]; total: number };
};

export default function AnalyticsPage() {
  const params = useParams();
  const slug = params.slug as string;
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('7d');
  const cache = useRef<Record<string, any>>({});

  useEffect(() => {
    const key = `${slug}:${period}`;
    if (cache.current[key]) {
      setData(cache.current[key]);
      return;
    }
    setLoading(true);
    fetch(`/api/analytics?slug=${slug}&period=${period}`)
      .then(r => r.json())
      .then(d => { cache.current[key] = d; setData(d); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [slug, period]);

  const periods = [
    { value: '7d', label: '7 dias' },
    { value: '30d', label: '30 dias' },
    { value: '90d', label: '90 dias' },
  ];

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-primary" />
            Analytics
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Métricas de visualizações e uso do chat.
          </p>
        </div>
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

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="text-xs">Visualizações</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Eye className="h-4 w-4 text-primary" />
              <span className="text-2xl font-bold">{data?.pageViews.total ?? 0}</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="text-xs">Chats</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-primary" />
              <span className="text-2xl font-bold">{data?.chatUsage.total ?? 0}</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="text-xs">Média Diária</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              <span className="text-2xl font-bold">
                {data?.pageViews.daily.length
                  ? Math.round(data.pageViews.total / data.pageViews.daily.length)
                  : 0}
              </span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="text-xs">Período</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">{period}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Visualizações por Dia</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              {data?.pageViews.daily && data.pageViews.daily.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data.pageViews.daily}>
                    <defs>
                      <linearGradient id="viewGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#4BC5FF" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#4BC5FF" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="day" tick={{ fontSize: 11 }} stroke="#64748b" tickFormatter={(v) => v?.slice(5, 10) || ''} />
                    <YAxis tick={{ fontSize: 11 }} stroke="#64748b" />
                    <Tooltip
                      contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', fontSize: '12px' }}
                    />
                    <Area type="monotone" dataKey="views" stroke="#4BC5FF" fill="url(#viewGradient)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
                  Nenhum dado no período.
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Chats por Dia</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              {data?.chatUsage.daily && data.chatUsage.daily.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.chatUsage.daily}>
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
                  Nenhum dado no período.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Páginas Mais Visitadas</CardTitle>
        </CardHeader>
        <CardContent>
          {data?.pageViews.topPages && data.pageViews.topPages.length > 0 ? (
            <div className="space-y-2">
              {data.pageViews.topPages.map((page, i) => (
                <div key={page.page_path} className="flex items-center gap-3 py-2 border-b border-border/50 last:border-0">
                  <span className="text-xs text-muted-foreground w-5 text-right">{i + 1}.</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm truncate">{page.page_title || page.page_path}</p>
                    <p className="text-xs text-muted-foreground truncate">{page.page_path}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-medium">{page.views}</p>
                    <p className="text-xs text-muted-foreground">{page.unique_visitors} únicos</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">
              Nenhuma página visitada no período.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
