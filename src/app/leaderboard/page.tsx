'use client';

import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { LeaderboardTable } from '@/components/gamification/leaderboard-table';

const metrics = [
  { key: 'reputation_points', label: 'Reputação' },
  { key: 'articles_count', label: 'Artigos' },
  { key: 'comments_count', label: 'Comentários' },
  { key: 'streak_days', label: 'Streak' },
  { key: 'reactions_received', label: 'Reações' },
];

export default function LeaderboardPage() {
  const [activeMetric, setActiveMetric] = useState('reputation_points');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/leaderboard?metric=${activeMetric}&limit=50`)
      .then((r) => r.json())
      .then((d) => setData(d))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [activeMetric]);

  return (
    <div className="max-w-3xl mx-auto p-4 pt-10">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Leaderboard</CardTitle>
          <CardDescription>Os maiores contribuidores da plataforma.</CardDescription>
        </CardHeader>
      </Card>

      <div className="mt-6">
        <Tabs value={activeMetric} onValueChange={setActiveMetric}>
          <TabsList className="grid grid-cols-5 w-full">
            {metrics.map((m) => (
              <TabsTrigger key={m.key} value={m.key} className="text-xs">
                {m.label}
              </TabsTrigger>
            ))}
          </TabsList>
          {metrics.map((m) => (
            <TabsContent key={m.key} value={m.key} className="mt-4">
              {loading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : data?.users ? (
                <LeaderboardTable users={data.users} metric={m.key} />
              ) : (
                <p className="text-center text-muted-foreground py-12">Nenhum dado disponível.</p>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </div>
  );
}
