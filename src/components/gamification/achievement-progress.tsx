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
  rarity_color?: string | null;
  earned: boolean;
};

const CATEGORY_LABELS: Record<string, string> = {
  general: 'Geral',
  content: 'Conteúdo',
  social: 'Social',
  expert: 'Especialista',
  community: 'Comunidade',
  streak: 'Streak',
};

const CATEGORY_COLORS: Record<string, string> = {
  general: 'border-sky-500/30 bg-sky-500/5',
  content: 'border-violet-500/30 bg-violet-500/5',
  social: 'border-emerald-500/30 bg-emerald-500/5',
  expert: 'border-amber-500/30 bg-amber-500/5',
  community: 'border-emerald-500/30 bg-emerald-500/5',
  streak: 'border-orange-500/30 bg-orange-500/5',
};

const RARITY_HSL: Record<number, string> = {
  1: '0 0% 60%',
  2: '142 76% 36%',
  3: '217 91% 60%',
  4: '271 81% 56%',
  5: '38 92% 50%',
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

  const totalEarned = badges.filter((b) => b.earned).length;
  const categories = [...new Set(badges.map((b) => b.category))];

  function getBarGradient(catBadges: BadgeWithEarned[]): string {
    const maxRarity = Math.max(...catBadges.map((b) => b.rarity), 1);
    const hsl = RARITY_HSL[maxRarity] || RARITY_HSL[1];
    return `linear-gradient(90deg, hsl(${hsl} / 0.5), hsl(${hsl}))`;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-primary" />
          <h3 className="text-sm font-semibold">Conquistas</h3>
        </div>
        <span className="text-xs text-muted-foreground tabular-nums">
          {totalEarned}/{badges.length}
        </span>
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
            <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${pct}%`, background: getBarGradient(catBadges) }}
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
