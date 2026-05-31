'use client';

import { useState, useEffect } from 'react';
import { TimerOff } from 'lucide-react';

export function ErrorCountdownBlock({ config }: { config: Record<string, unknown> }) {
  const redirectUrl = (config.redirectUrl as string) || '/';
  const totalSeconds = (config.seconds as number) || 10;
  const message = (config.message as string) || 'Redirecionando para o início em:';
  const showProgress = config.showProgress !== false;
  const showSeconds = config.showSeconds !== false;

  const [count, setCount] = useState(totalSeconds);

  useEffect(() => {
    if (count <= 0) return;
    const id = setInterval(() => setCount((c) => c - 1), 1000);
    return () => clearInterval(id);
  }, [count]);

  if (count <= 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 space-y-3">
        <a href={redirectUrl} className="text-primary underline underline-offset-4 text-lg font-medium">
          Redirecionando...
        </a>
      </div>
    );
  }

  const progress = ((totalSeconds - count) / totalSeconds) * 100;

  return (
    <div className="flex flex-col items-center justify-center py-8 space-y-4">
      <TimerOff className="h-8 w-8 text-primary" />
      {message && <p className="text-sm text-muted-foreground">{message}</p>}
      {showSeconds && (
        <span className="text-5xl font-bold tabular-nums text-primary">{count}</span>
      )}
      {showProgress && (
        <div className="w-48 h-1.5 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all duration-1000"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </div>
  );
}
