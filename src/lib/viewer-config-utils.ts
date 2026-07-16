import { supabase } from '@/supabase';
import { parseViewerConfig, type ViewerConfig } from './viewer-config';

interface UpdateViewerConfigParams {
  tenantId: string;
  table: string;
  slug: string;
}

type ViewConfigUpdater = (config: ViewerConfig) => Record<string, unknown>;

export async function updateViewerConfigField(
  params: UpdateViewerConfigParams,
  updater: ViewConfigUpdater,
): Promise<ViewerConfig | null> {
  const { data, error } = await supabase
    .from('tenant_game_tables')
    .select('viewer_config')
    .eq('tenant_id', params.tenantId)
    .eq('table_name', params.table)
    .maybeSingle();

  if (error) {
    console.error('[viewer-config-utils] failed to load config:', error);
    return null;
  }

  const current = parseViewerConfig(data?.viewer_config);
  const updated = updater(current);

  const { error: updateError } = await supabase
    .from('tenant_game_tables')
    .update({ viewer_config: updated })
    .eq('tenant_id', params.tenantId)
    .eq('table_name', params.table);

  if (updateError) {
    console.error('[viewer-config-utils] failed to save config:', updateError);
    return null;
  }

  return parseViewerConfig(updated);
}
