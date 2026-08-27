'use client';

import { ReportWikiButton } from '@/components/wiki/report-wiki-button';
import type { WidgetReportConfig } from '@/components/page-builder/types';
import { useWikiData } from '@/context/wiki-provider';

const POSITION_STYLES: Record<string, React.CSSProperties> = {
  'bottom-right': { bottom: '1rem', right: '1rem' },
  'bottom-left': { bottom: '1rem', left: '1rem' },
  'bottom-center': { bottom: '1rem', left: '50%', transform: 'translateX(-50%)' },
};

export default function ReportWikiWidget({
  widgetConfig,
}: {
  widgetConfig?: WidgetReportConfig;
}) {
  const { data } = useWikiData();
  const tenant = data?.tenant;
  if (!widgetConfig?.enabled || !tenant) return null;

  const position = widgetConfig.position || 'bottom-left';
  const color = widgetConfig.color;
  const label = widgetConfig.label || 'Denunciar';

  return (
    <div
      className="fixed z-40"
      style={POSITION_STYLES[position] || POSITION_STYLES['bottom-left']}
    >
      <ReportWikiButton
        tenantId={tenant.id}
        tenantName={tenant.name}
        variant={label ? 'button' : 'icon'}
        label={label}
        color={color}
      />
    </div>
  );
}
