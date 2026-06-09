'use client';

import { useEffect, useState } from 'react';
import { useUser } from '@/supabase';
import { Zap, Loader2 } from 'lucide-react';

const LEVEL_THRESHOLDS = [
  { level: 1, repNeeded: 0, label: 'Novato' },
  { level: 2, repNeeded: 10, label: 'Iniciante' },
  { level: 3, repNeeded: 50, label: 'Contribuidor' },
  { level: 4, repNeeded: 200, label: 'Dedicado' },
  { level: 5, repNeeded: 500, label: 'Veterano' },
  { level: 6, repNeeded: 1000, label: 'Mestre' },
  { level: 7, repNeeded: 2500, label: 'Lendário' },
];

function getLevel(rep: number): { level: number; label: string; currentThreshold: number; nextThreshold: number } {
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (rep >= LEVEL_THRESHOLDS[i].repNeeded) {
      const next = LEVEL_THRESHOLDS[i + 1];
      const nextRep = next?.repNeeded ?? LEVEL_THRESHOLDS[i].repNeeded;
      return {
        level: LEVEL_THRESHOLDS[i].level,
        label: LEVEL_THRESHOLDS[i].label,
        currentThreshold: LEVEL_THRESHOLDS[i].repNeeded,
        nextThreshold: nextRep,
      };
    }
  }
  return { level: 1, label: 'Novato', currentThreshold: 0, nextThreshold: 10 };
}

export function LevelUpDisplay() {
  const { user } = useUser();
  const [rep, setRep] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return; }

    const fetchProfile = async () => {
      const res = await fetch(`/api/profile?user_id=${user.id}`);
      if (res.ok) {
        const data = await res.json();
        setRep(data.reputation_points ?? 0);
      }
      setLoading(false);
    };

    fetchProfile();
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-6">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (rep === null) return null;

  const { level: currentLevel, label, currentThreshold, nextThreshold } = getLevel(rep);
  const range = nextThreshold - currentThreshold;
  const progress = range > 0 ? ((rep - currentThreshold) / range) * 100 : 100;
  const toNext = Math.max(0, nextThreshold - rep);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Zap className="h-4 w-4 text-amber-400" />
          <span className="text-sm font-semibold">Nível {currentLevel}</span>
          <span className="text-[10px] text-muted-foreground px-1.5 py-0.5 rounded-full bg-muted">{label}</span>
        </div>
        <span className="text-xs text-muted-foreground tabular-nums">
          {rep} XP
        </span>
      </div>
      <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-amber-500/70 to-amber-500 transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>
      {toNext > 0 && currentLevel < LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1].level && (
        <p className="text-[10px] text-muted-foreground">
          {toNext} XP para o próximo nível
        </p>
      )}
    </div>
  );
}
