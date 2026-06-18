'use client';

import Image from 'next/image';
import { MessageCircle, Twitter, Youtube, Github, Instagram, Music2, Link } from 'lucide-react';

const platformIconMap: Record<string, React.ElementType> = {
  Discord: MessageCircle,
  'Twitter/X': Twitter,
  YouTube: Youtube,
  GitHub: Github,
  Instagram: Instagram,
  TikTok: Music2,
};

export function FooterBrandBlock({ config }: { config: Record<string, unknown> }) {
  const logo = (config.logo as string) || '';
  const tagline = (config.tagline as string) || '';
  const description = (config.description as string) || '';
  const showSocialLinks = config.showSocialLinks as boolean | undefined;
  const socialLinks = (config.socialLinks as Array<{ platform: string; url: string }>) || [];
  const align = (config.align as string) || 'center';

  const alignClass = align === 'left' ? 'text-left items-start' : align === 'right' ? 'text-right items-end' : 'text-center items-center';

  return (
    <div className={`flex flex-col gap-2 ${alignClass}`}>
      {logo && (
        <div className="relative h-8" style={{ width: 'fit-content', maxWidth: 200 }}>
          <Image src={logo} alt={tagline || 'Logo'} fill className="object-contain" />
        </div>
      )}
      {tagline && <h3 className="text-base font-semibold">{tagline}</h3>}
      {description && <p className="text-sm text-muted-foreground max-w-xs">{description}</p>}
      {showSocialLinks && socialLinks.length > 0 && (
        <div className={`flex gap-2 mt-1 ${align === 'left' ? '' : align === 'right' ? 'justify-end' : 'justify-center'}`}>
          {socialLinks.map((link, i) => {
            const Icon = platformIconMap[link.platform] || Link;
            return (
              <a
                key={i}
                href={link.url || '#'}
                className="rounded-full border bg-background p-2 text-muted-foreground hover:text-foreground hover:border-primary transition-colors"
              >
                <Icon className="h-3.5 w-3.5" />
              </a>
            );
          })}
        </div>
      )}
      {!logo && !tagline && !description && (
        <span className="text-sm text-muted-foreground">Configure a marca do footer</span>
      )}
    </div>
  );
}
