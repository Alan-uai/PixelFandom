'use client';

import { Heart } from 'lucide-react';

export function FooterCreditsBlock({ config }: { config: Record<string, unknown> }) {
  const brandName = (config.brandName as string) || 'PixelFandom';
  const year = config.year === 'auto' || config.year == null ? new Date().getFullYear() : (config.year as number);
  const showHeart = config.showHeart as boolean | undefined;
  const showRights = config.showRights as boolean | undefined;
  const align = (config.align as string) || 'center';
  const size = (config.size as string) || 'md';

  const alignClass = align === 'left' ? 'text-left' : align === 'right' ? 'text-right' : 'text-center';
  const sizeClass = size === 'sm' ? 'text-xs' : 'text-sm';

  return (
    <div className={`${alignClass} ${sizeClass} text-muted-foreground`}>
      <p>
        &copy; {year} {brandName}
        {showHeart && (
          <>
            {' '}&mdash; Feito com <Heart className="inline-block h-3 w-3 text-red-500 fill-red-500" />
          </>
        )}
        {showRights && <span>. Todos os direitos reservados.</span>}
      </p>
    </div>
  );
}
