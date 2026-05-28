'use client';

import { useState, useEffect } from 'react';

interface RaidTimerIslandProps {
  config: Record<string, unknown>;
}

function getTimeRemaining(target: string): { days: number; hours: number; minutes: number; seconds: number; expired: boolean } {
  const diff = new Date(target).getTime() - Date.now();
  if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0, expired: true };
  return {
    days: Math.floor(diff / 86400000),
    hours: Math.floor((diff % 86400000) / 3600000),
    minutes: Math.floor((diff % 3600000) / 60000),
    seconds: Math.floor((diff % 60000) / 1000),
    expired: false,
  };
}

export function RaidTimerIsland({ config }: RaidTimerIslandProps) {
  const targetDate = config.targetDate as string;
  const raidName = config.raidName as string;
  const label = config.label as string;

  const [remaining, setRemaining] = useState(() => getTimeRemaining(targetDate || ''));

  useEffect(() => {
    if (!targetDate) return;
    const id = setInterval(() => setRemaining(getTimeRemaining(targetDate)), 1000);
    return () => clearInterval(id);
  }, [targetDate]);

  if (!targetDate) {
    return <p className="text-xs text-muted-foreground">Nenhum raid configurado.</p>;
  }

  if (remaining.expired) {
    return (
      <div className="text-center">
        <p className="text-xs font-medium text-destructive">RAID OCORREU</p>
        {raidName && <p className="text-[10px] text-muted-foreground mt-1">{raidName}</p>}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {label && <p className="text-xs font-medium text-center">{label}</p>}
      {raidName && <p className="text-[10px] text-muted-foreground text-center">{raidName}</p>}
      <div className="grid grid-cols-4 gap-1 text-center">
        <div className="rounded bg-primary/10 p-1">
          <p className="text-sm font-bold text-primary">{remaining.days}</p>
          <p className="text-[9px] text-muted-foreground">dias</p>
        </div>
        <div className="rounded bg-primary/10 p-1">
          <p className="text-sm font-bold text-primary">{String(remaining.hours).padStart(2, '0')}</p>
          <p className="text-[9px] text-muted-foreground">horas</p>
        </div>
        <div className="rounded bg-primary/10 p-1">
          <p className="text-sm font-bold text-primary">{String(remaining.minutes).padStart(2, '0')}</p>
          <p className="text-[9px] text-muted-foreground">min</p>
        </div>
        <div className="rounded bg-primary/10 p-1">
          <p className="text-sm font-bold text-primary">{String(remaining.seconds).padStart(2, '0')}</p>
          <p className="text-[9px] text-muted-foreground">seg</p>
        </div>
      </div>
    </div>
  );
}
