'use client';

import { useState } from 'react';
import { ElasticSlider3D } from '@/components/ui/elastic-slider-3d';
import { ScaledValue, useBaseXmaxConfig } from '@/lib/scaling-context';
import { axisValueToRatio } from '@/lib/scaling-engine';
import type { BaseMaxValue } from '@/lib/scaling-engine';

export interface BaseMaxSliderProps {
  value: BaseMaxValue;
  /** Axis range for the slider (e.g. level 1..100). */
  axisMin?: number;
  axisMax?: number;
  /** Optional explicit axis label override. */
  axisLabel?: string;
  defaultValue?: number;
  /** Per-row / shared level value that positions the slider. */
  levelValue?: number;
}

/**
 * Per-stat elastic slider that lets the viewer sweep a base/max range along its
 * axis (level / tier / copy count / rarity) and see the interpolated result.
 * When `levelValue` is provided (from a row's level / Max Copies column) the
 * slider starts at that position and the value is computed from it.
 */
export function BaseMaxSlider({
  value,
  axisMin,
  axisMax,
  axisLabel,
  defaultValue,
  levelValue,
}: BaseMaxSliderProps) {
  const min = axisMin ?? 1;
  const max = axisMax ?? 100;
  const start =
    levelValue != null ? Math.min(Math.max(levelValue, min), max) : defaultValue ?? min;
  const [axisValue, setAxisValue] = useState<number>(start);

  const ratio = axisValueToRatio(axisValue, min, max);

  return (
    <div className="flex flex-col gap-1.5 w-full">
      <ScaledValue
        base={value.base}
        max={value.max}
        curve={value.curve}
        axis={value.axis}
        ratio={ratio}
      />
      <ElasticSlider3D
        startingValue={min}
        maxValue={max}
        defaultValue={axisValue}
        label={axisLabel || value.axis || 'Nível'}
        valueSuffix=""
        showValue
        onValueChange={(v) => setAxisValue(Math.round(v))}
      />
    </div>
  );
}

/**
 * Renders a base/max range value: either a static scaled value (driven by the
 * global scaling context) or, when the viewer enables per-card sliders, an
 * interactive elastic slider. Consumes BaseXmaxContext for axis + slider config
 * and BaseXmaxLevelContext for the per-row / shared level position.
 */
export function BaseMaxValueNode({ value }: { value: BaseMaxValue }) {
  const bx = useBaseXmaxConfig();

  // When the viewer enables a footer elastic slider (item / ambos / table mode),
  // the interactive control lives in the card footer / collection-item-view.
  // Inside the mini-card we only show the starting (base) status — never "base → max".
  if (bx?.enabled) {
    return (
      <span className="font-mono text-sm font-medium text-foreground">
        {value.base}
      </span>
    );
  }

  return <ScaledValue base={value.base} max={value.max} curve={value.curve} axis={value.axis} />;
}
