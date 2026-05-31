'use client';

import { useMemo } from 'react';
import { Sparkles } from 'lucide-react';

export function ErrorParticleBlock({ config }: { config: Record<string, unknown> }) {
  const count = (config.count as number) || 50;
  const color = (config.color as string) || '#4BC5FF';
  const opacity = (config.opacity as number) ?? 0.6;
  const type = (config.type as string) || 'stars';

  const particles = useMemo(() => {
    return Array.from({ length: Math.min(count, 100) }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 4 + 1,
      duration: Math.random() * 3 + 2,
      delay: Math.random() * 2,
    }));
  }, [count]);

  if (type === 'noise') {
    return (
      <div className="relative h-40 overflow-hidden rounded-xl bg-card">
        <div
          className="absolute inset-0 opacity-20 animate-static-noise"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          }}
        />
      </div>
    );
  }

  return (
    <div className="relative h-40 overflow-hidden rounded-xl bg-card">
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute rounded-full animate-float-error"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size + 'px',
            height: p.size + 'px',
            backgroundColor: color,
            opacity,
            animationDuration: `${p.duration}s`,
            animationDelay: `${p.delay}s`,
          }}
        />
      ))}
      <div className="absolute inset-0 flex items-center justify-center">
        <Sparkles className="h-6 w-6 text-primary/30" />
      </div>
    </div>
  );
}
