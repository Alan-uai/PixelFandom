'use client';

import { useState, useEffect } from 'react';

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

function calculateTimeLeft(target: Date): TimeLeft {
  const diff = target.getTime() - Date.now();
  if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 };
  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
    seconds: Math.floor((diff / 1000) % 60),
  };
}

export function CountdownBlock({ config }: { config: Record<string, unknown> }) {
  const title = (config.title as string) || '';
  const targetDate = (config.targetDate as string) || '';
  const targetTime = (config.targetTime as string) || '00:00';
  const showDays = config.showDays !== false;
  const showHours = config.showHours !== false;
  const showMinutes = config.showMinutes !== false;
  const showSeconds = config.showSeconds !== false;
  const labelDays = (config.labelDays as string) || 'Dias';
  const labelHours = (config.labelHours as string) || 'Horas';
  const labelMinutes = (config.labelMinutes as string) || 'Minutos';
  const labelSeconds = (config.labelSeconds as string) || 'Segundos';

  const target = targetDate ? new Date(targetDate + 'T' + targetTime) : null;

  const [timeLeft, setTimeLeft] = useState<TimeLeft | null>(
    target ? calculateTimeLeft(target) : null
  );

  useEffect(() => {
    if (!target) return;
    setTimeLeft(calculateTimeLeft(target));
    const id = setInterval(() => setTimeLeft(calculateTimeLeft(target)), 1000);
    return () => clearInterval(id);
  }, [targetDate, targetTime]);

  if (!target || isNaN(target.getTime())) {
    return (
      <div className="text-center text-sm text-muted-foreground py-4">
        {title && <p className="mb-2 font-medium">{title}</p>}
        <p>Data alvo não configurada</p>
      </div>
    );
  }

  if (!timeLeft) return null;

  const units: Array<{ key: keyof TimeLeft; show: boolean; label: string }> = [
    { key: 'days', show: showDays, label: labelDays },
    { key: 'hours', show: showHours, label: labelHours },
    { key: 'minutes', show: showMinutes, label: labelMinutes },
    { key: 'seconds', show: showSeconds, label: labelSeconds },
  ];

  const visible = units.filter((u) => u.show);

  return (
    <div className="text-center space-y-4">
      {title && <h3 className="text-lg font-semibold">{title}</h3>}
      <div className="flex justify-center gap-3 flex-wrap">
        {visible.map((unit) => (
          <div
            key={unit.key}
            className="flex flex-col items-center rounded-xl border bg-card px-4 py-3 min-w-[72px]"
          >
            <span className="text-2xl font-bold tabular-nums">
              {String(timeLeft[unit.key]).padStart(2, '0')}
            </span>
            <span className="text-xs text-muted-foreground mt-1">{unit.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
