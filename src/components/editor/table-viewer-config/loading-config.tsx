'use client';

import { Label } from '@/components/ui/label';
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

      <div className="space-y-1">
        <Label className="text-xs text-muted-foreground">Quantidade de skeletons ({c.skeletonCount || 6})</Label>
        <input
          type="range"
          min={1}
          max={12}
          value={c.skeletonCount || 6}
          onChange={(e) => onChange({ ...c, skeletonCount: Number(e.target.value) })}
          className="w-full h-1.5 bg-muted rounded-full appearance-none cursor-pointer accent-primary"
        />
        <div className="flex justify-between text-[10px] text-muted-foreground">
          <span>1</span><span>12</span>
        </div>
      </div>
    </div>
  );
}
