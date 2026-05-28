'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Loader2, Lock } from 'lucide-react';
import { BadgeDisplay } from '@/components/gamification/badge-display';
import { supabase } from '@/supabase';

const categories = [
  { key: 'all', label: 'Todas' },
  { key: 'content', label: 'Conteúdo' },
  { key: 'community', label: 'Comunidade' },
  { key: 'streak', label: 'Streak' },
  { key: 'general', label: 'Geral' },
];

export default function BadgesPage() {
  const [badges, setBadges] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('all');
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const suffix = user ? `?user_id=${user.id}` : '';
        const res = await fetch(`/api/badges${suffix}`);
        if (res.ok) setBadges(await res.json());
      } catch {} finally {
        setLoading(false);
      }
    })();
  }, [user]);

  const filtered = category === 'all' ? badges : badges.filter((b) => b.category === category);
  const earned = filtered.filter((b) => b.earned);
  const locked = filtered.filter((b) => !b.earned);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-4 pt-10">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-2xl">Conquistas</CardTitle>
          <CardDescription>
            Complete ações na plataforma para desbloquear conquistas.
            {user && (
              <span className="block mt-1">
                {badges.filter((b) => b.earned).length} / {badges.length} desbloqueadas
              </span>
            )}
          </CardDescription>
        </CardHeader>
      </Card>

      <Tabs value={category} onValueChange={setCategory}>
        <TabsList className="grid grid-cols-5 w-full">
          {categories.map((c) => (
            <TabsTrigger key={c.key} value={c.key} className="text-xs">
              {c.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {categories.map((c) => (
          <TabsContent key={c.key} value={c.key} className="mt-6 space-y-6">
            {earned.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  Desbloqueadas ({earned.length})
                </h3>
                <div className="flex flex-wrap gap-3">
                  {earned.map((b: any) => (
                    <div key={b.id} className="flex flex-col items-center gap-1">
                      <BadgeDisplay badge={b} size="lg" />
                      <span className="text-[10px] text-muted-foreground">{b.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {locked.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <Lock className="h-3 w-3 text-muted-foreground" />
                  Bloqueadas ({locked.length})
                </h3>
                <div className="flex flex-wrap gap-3">
                  {locked.map((b: any) => (
                    <div key={b.id} className="flex flex-col items-center gap-1">
                      <BadgeDisplay badge={b} size="lg" />
                      <span className="text-[10px] text-muted-foreground">{b.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {filtered.length === 0 && (
              <p className="text-center text-muted-foreground py-8">Nenhuma conquista nesta categoria.</p>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
