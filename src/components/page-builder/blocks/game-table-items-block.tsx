'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { supabase } from '@/supabase';
import type { GameTableItemsConfig } from '../types';
import GameTableListing from '@/components/wiki/game-table-listing';
import type { ViewerConfig } from '@/lib/viewer-config';
import { parseViewerConfig } from '@/lib/viewer-config';

export function GameTableItemsBlock({ config, tenantId }: { config: GameTableItemsConfig; tenantId?: string; basePath?: string }) {
  const params = useParams();
  const slug = (params?.slug as string) || '';
  const [viewerConfig, setViewerConfig] = useState<ViewerConfig | null>(null);

  useEffect(() => {
    if (!tenantId || !config.table) return;
    supabase
      .from('tenant_game_tables')
      .select('viewer_config')
      .eq('tenant_id', tenantId)
      .eq('slug', config.table)
      .maybeSingle()
      .then(({ data }) => {
        if (data?.viewer_config) {
          setViewerConfig(parseViewerConfig(data.viewer_config));
        }
      });
  }, [tenantId, config.table]);

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
        viewerConfig={viewerConfig}
      />
    </div>
  );
}
