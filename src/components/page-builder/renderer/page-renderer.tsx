'use client';

import type { PageLayout, BlockConfig } from '../types';
import { BlockRenderer } from '../block-renderer';

interface PageRendererProps {
  layout: PageLayout;
  tenant?: Record<string, unknown>;
  basePath?: string;
}

export function PageRenderer({ layout, tenant, basePath }: PageRendererProps) {
  return (
    <div className="space-y-0">
      {layout.blocks.map((block) => (
        <RenderBlock key={block.id} block={block} tenantId={tenant?.id as string} basePath={basePath} />
      ))}
    </div>
  );
}

function RenderBlock({ block, tenantId, basePath }: { block: BlockConfig; tenantId?: string; basePath?: string }) {
  if (block.type === 'section') {
    return (
      <div>
        <BlockRenderer block={block} tenantId={tenantId} basePath={basePath} />
      </div>
    );
  }

  return (
    <div className="px-4 md:px-8 lg:px-16 max-w-7xl mx-auto py-4">
      <BlockRenderer block={block} tenantId={tenantId} basePath={basePath} />
    </div>
  );
}
