'use client';

import { ElasticSlider3D } from '@/components/ui/elastic-slider-3d';
import { Select3D } from '@/components/ui/select3d';

export function LoadingConfig({
  config,
  onChange,
}: {
  config: Record<string, unknown>;
  onChange: (v: Record<string, unknown>) => void;
  columns?: string[];
  slug?: string;
}) {
  const c: Record<string, any> = config || {};

  return (
    <div className="space-y-4">
      <Select3D
        label="Tipo de skeleton"
        value={c.skeleton || 'shimmer'}
        options={[
          { label: 'Shimmer', value: 'shimmer' },
          { label: 'Pulse', value: 'pulse' },
          { label: 'Spinner', value: 'spinner' },
          { label: 'Nenhum', value: 'none' },
        ]}
        onChange={(v) => onChange({ ...c, skeleton: v })}
      />

      <ElasticSlider3D
        label="Quantidade de skeletons"
        defaultValue={c.skeletonCount || 6}
        startingValue={1}
        maxValue={12}
        showValue
        onValueChange={(v) => onChange({ ...c, skeletonCount: v })}
      />
    </div>
  );
}
