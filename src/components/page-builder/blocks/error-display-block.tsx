'use client';

import { TriangleAlert } from 'lucide-react';

const sizeMap: Record<string, string> = {
  sm: 'text-6xl',
  md: 'text-8xl',
  lg: 'text-[10rem]',
  xl: 'text-[14rem]',
};

const fontMap: Record<string, string> = {
  default: 'font-bold',
  mono: 'font-mono font-bold',
  display: 'font-black tracking-tight',
  outline: 'font-bold text-transparent [-webkit-text-stroke:2px_currentColor]',
};

export function ErrorDisplayBlock({ config }: { config: Record<string, unknown> }) {
  const number = (config.number as string) || '404';
  const size = (config.size as string) || 'xl';
  const title = (config.title as string) || 'Página não encontrada';
  const subtitle = (config.subtitle as string) || '';
  const glitchEnabled = config.glitchEnabled !== false;
  const showDecoration = config.showDecoration !== false;
  const font = (config.font as string) || 'default';

  return (
    <div className="flex flex-col items-center justify-center text-center space-y-4 py-12">
      {showDecoration && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-10">
          <div className="absolute top-10 left-10 w-32 h-32 rounded-full bg-primary blur-3xl" />
          <div className="absolute bottom-10 right-10 w-40 h-40 rounded-full bg-accent blur-3xl" />
        </div>
      )}
      <div
        className={`relative ${sizeMap[size] || 'text-8xl'} ${fontMap[font] || 'font-bold'} text-primary ${glitchEnabled ? 'animate-glitch-1' : ''}`}
      >
        {number}
      </div>
      <h2 className="text-2xl font-semibold text-foreground">{title}</h2>
      {subtitle && <p className="text-muted-foreground max-w-md">{subtitle}</p>}
    </div>
  );
}
