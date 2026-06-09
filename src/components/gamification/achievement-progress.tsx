'use client';

import { useEffect, useState } from 'react';
import { useUser } from '@/supabase';
import { Trophy, Loader2 } from 'lucide-react';

type BadgeWithEarned = {
  id: string;
  name: string;
  slug: string;
  icon: string;
  category: string;
  rarity: number;
  earned: boolean;
};

const CATEGORY_LABELS: Record<string, string> = {
  general: 'Geral',
  content: 'Conteúdo',
  social: 'Social',
  expert: 'Especialista',
};

const CATEGORY_COLORS: Record<string, string> = {
  general: 'border-sky-500/30 bg-sky-500/5',
  content: 'border-violet-500/30 bg-violet-500/5',
  social: 'border-emerald-500/30 bg-emerald-500/5',
  expert: 'border-amber-500/30 bg-amber-500/5',
};

export function AchievementProgress() {
  const { user } = useUser();
  const [badges, setBadges] = useState<BadgeWithEarned[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return; }

    fetch(`/api/badges?user_id=${user.id}`)
      .then((r) => r.json())
      .then((data) => { setBadges(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!badges.length) return null;

  const categories = [...new Set(badges.map((b) => b.category))];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Trophy className="h-5 w-5 text-primary" />
        <h3 className="text-sm font-semibold">Conquistas</h3>
      </div>
      {categories.map((cat) => {
        const catBadges = badges.filter((b) => b.category === cat);
        const earned = catBadges.filter((b) => b.earned).length;
        const total = catBadges.length;
        const pct = total > 0 ? Math.round((earned / total) * 100) : 0;
        const color = CATEGORY_COLORS[cat] ?? CATEGORY_COLORS.general;

        return (
          <div key={cat} className={`rounded-lg border ${color} p-3`}>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-medium text-muted-foreground">
                {CATEGORY_LABELS[cat] ?? cat}
              </span>
              <span className="text-xs text-muted-foreground tabular-nums">
                {earned}/{total}
              </span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-primary/70 to-primary transition-all duration-500"
                style={{ width: `${pct}%` }}
              />
            </div>
            {pct === 100 && (
              <p className="text-[10px] text-primary mt-1 font-medium">Todas as conquistas desta categoria!</p>
            )}
          </div>
        );
      })}
    </div>
  );
}
