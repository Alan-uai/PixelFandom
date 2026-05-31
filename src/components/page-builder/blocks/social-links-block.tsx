'use client';

import { MessageCircle, Twitter, Youtube, Github, Instagram, Music2, Link } from 'lucide-react';

const platformIconMap: Record<string, React.ElementType> = {
  Discord: MessageCircle,
  'Twitter/X': Twitter,
  YouTube: Youtube,
  GitHub: Github,
  Instagram: Instagram,
  TikTok: Music2,
};

const sizeMap: Record<string, string> = {
  sm: 'h-4 w-4',
  md: 'h-5 w-5',
  lg: 'h-6 w-6',
};

const buttonSizeMap: Record<string, string> = {
  sm: 'p-1.5',
  md: 'p-2',
  lg: 'p-3',
};

export function SocialLinksBlock({ config }: { config: Record<string, unknown> }) {
  const title = (config.title as string) || '';
  const links = (config.links as Array<{ platform: string; url: string }>) || [];
  const layout = (config.layout as string) || 'row';
  const size = (config.size as string) || 'md';

  const iconSize = sizeMap[size] || sizeMap.md;
  const buttonSize = buttonSizeMap[size] || buttonSizeMap.md;

  const containerClass =
    layout === 'column' ? 'flex flex-col items-center gap-3' :
    layout === 'grid' ? 'grid grid-cols-3 gap-3 justify-items-center' :
    'flex flex-wrap justify-center gap-3';

  if (links.length === 0) {
    return (
      <div className="text-center text-sm text-muted-foreground py-4">
        {title && <p className="mb-2 font-medium">{title}</p>}
        <p>Nenhum link configurado</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {title && <h3 className="text-lg font-semibold text-center">{title}</h3>}
      <div className={containerClass}>
        {links.map((link, i) => {
          const Icon = platformIconMap[link.platform] || Link;
          return (
            <a
              key={i}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className={`rounded-full border bg-background hover:bg-muted transition-colors ${buttonSize}`}
            >
              <Icon className={iconSize} />
            </a>
          );
        })}
      </div>
    </div>
  );
}
