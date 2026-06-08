'use client';

import { useState, useEffect } from 'react';

function getRemaining(target: string | Date) {
  const t = typeof target === 'string' ? new Date(target) : target;
  const diff = t.getTime() - Date.now();
  if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0, expired: true };
  return {
    days: Math.floor(diff / 86400000),
    hours: Math.floor((diff % 86400000) / 3600000),
    minutes: Math.floor((diff % 3600000) / 60000),
    seconds: Math.floor((diff % 60000) / 1000),
    expired: false,
  };
}

interface CountdownDisplayProps {
  targetDate: string | Date;
  compact?: boolean;
}

export function CountdownDisplay({ targetDate, compact }: CountdownDisplayProps) {
  const [remaining, setRemaining] = useState(() => getRemaining(targetDate));

  useEffect(() => {
    const id = setInterval(() => setRemaining(getRemaining(targetDate)), 1000);
    return () => clearInterval(id);
  }, [targetDate]);

  if (remaining.expired) {
    return (
      <span className="text-xs font-bold text-destructive animate-pulse">
        AGORA
      </span>
    );
  }

  if (compact) {
    return (
      <span className="text-xs font-semibold text-primary tabular-nums">
        {remaining.days > 0 && `${remaining.days}d `}
        {String(remaining.hours).padStart(2, '0')}:{String(remaining.minutes).padStart(2, '0')}:{String(remaining.seconds).padStart(2, '0')}
      </span>
    );
  }

  return (
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
  );
}

export { getRemaining };
