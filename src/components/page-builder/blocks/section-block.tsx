'use client';

import type { SectionConfig, BlockConfig } from '../types';
import { BlockRenderer } from '../block-renderer';

interface SectionBlockProps {
  config: SectionConfig;
  children?: BlockConfig[];
  tenantId?: string;
  preview?: boolean;
}

export function SectionBlock({ config, children, tenantId, preview }: SectionBlockProps) {
  const gapMap: Record<string, string> = { none: 'gap-0', sm: 'gap-2', md: 'gap-4', lg: 'gap-6', xl: 'gap-8' };
  const alignMap: Record<string, string> = { top: 'items-start', center: 'items-center', bottom: 'items-end' };
  const paddingMap: Record<string, string> = { none: '0px', sm: '8px', md: '16px', lg: '24px', xl: '32px' };

  const colCount = Math.min(children?.length || config.columns || 1, 6);

  return (
    <div
      className={`grid ${gapMap[config.gap] || 'gap-4'} ${alignMap[config.verticalAlign] || 'items-start'}`}
      style={{
        gridTemplateColumns: `repeat(${colCount}, 1fr)`,
        backgroundColor: config.backgroundColor || undefined,
        backgroundImage: config.backgroundImage ? `url(${config.backgroundImage})` : undefined,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        padding: config.padding ? (paddingMap[config.padding] || '0px') : undefined,
      }}
    >
      {children && children.length > 0 ? (
        children.map((child) => (
          <div key={child.id} className="min-h-[40px]">
            <BlockRenderer block={child} tenantId={tenantId} preview={preview} />
          </div>
        ))
      ) : (
        Array.from({ length: config.columns || 1 }).map((_, i) => (
          <div key={i} className="min-h-[60px] rounded-lg border-2 border-dashed border-muted-foreground/20 flex items-center justify-center text-xs text-muted-foreground">
            Coluna {i + 1}
          </div>
        ))
      )}
    </div>
  );
}
