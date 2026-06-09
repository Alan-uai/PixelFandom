'use client';

import { useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { useUser } from '@/supabase';


type BadgeNotification = {
  id: string;
  metadata: {
    badge_name?: string;
    badge_icon?: string;
    badge_slug?: string;
    rarity?: number;
  };
};

const RARITY_COLORS: Record<number, string> = {
  1: 'from-slate-500 to-slate-400',
  2: 'from-green-600 to-green-500',
  3: 'from-blue-600 to-blue-400',
  4: 'from-purple-600 to-purple-400',
  5: 'from-amber-500 to-yellow-400',
};

const RARITY_LABELS: Record<number, string> = {
  1: 'Comum',
  2: 'Incomum',
  3: 'Raro',
  4: 'Épico',
  5: 'Lendário',
};

export function BadgeCelebration() {
  const { user } = useUser();
  const celebrated = useRef(new Set<string>());

  useEffect(() => {
    if (!user) return;

    async function checkBadges() {
      try {
        const res = await fetch('/api/notifications?limit=5&type=badge_earned&unread=true');
        if (!res.ok) return;
        const data: BadgeNotification[] = await res.json();

        for (const n of data) {
          if (celebrated.current.has(n.id)) continue;
          celebrated.current.add(n.id);
          const meta = n.metadata ?? {};
          const rarity = meta.rarity ?? 1;
          const gradient = RARITY_COLORS[rarity] ?? RARITY_COLORS[1];
          const label = RARITY_LABELS[rarity] ?? RARITY_LABELS[1];

          toast.custom(
            (t) => (
              <div
                onClick={() => toast.dismiss(t)}
                className="w-full cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className={`rounded-full bg-gradient-to-br ${gradient} p-2.5 text-2xl shadow-lg animate-pulse`}>
                    <span>{meta.badge_icon ?? '🏆'}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-foreground">Nova conquista!</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {meta.badge_name ?? 'Badge'} — {label}
                    </p>
                  </div>
                </div>
              </div>
            ),
            { duration: 6000 },
          );

          await fetch('/api/notifications', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ids: [n.id] }),
          });
        }
      } catch {}
    }

    checkBadges();
    const interval = setInterval(checkBadges, 15000);
    return () => clearInterval(interval);
  }, [user]);

  return null;
}
