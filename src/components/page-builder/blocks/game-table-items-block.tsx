'use client';

import { useParams } from 'next/navigation';
import type { GameTableItemsConfig } from '../types';
import GameTableListing from '@/components/wiki/game-table-listing';

export function GameTableItemsBlock({ config, tenantId }: { config: GameTableItemsConfig; tenantId?: string; basePath?: string }) {
  const params = useParams();
  const slug = (params?.slug as string) || '';

  if (!tenantId || !config.table) return null;

  return (
    <div className="space-y-4">
      {config.showHeader !== false && config.title && (
        <h2 className="text-2xl font-bold">{config.title}</h2>
      )}
      <GameTableListing
        tenantSlug={slug}
        tableName={config.table}
        tenantId={tenantId}
        displayFormat={config.displayFormat || 'grid'}
        columnsCount={config.columnsCount}
      />
    </div>
  );
}
