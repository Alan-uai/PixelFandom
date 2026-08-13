'use client';

import { useState } from 'react';
import { ElasticSlider3D } from '@/components/ui/elastic-slider-3d';
import { ScaledValue, useBaseXmaxConfig } from '@/lib/scaling-context';
import type { BaseMaxValue } from '@/lib/scaling-engine';

export interface BaseMaxSliderProps {
  value: BaseMaxValue;
  /** Axis range for the slider (e.g. level 1..100). */
  axisMin?: number;
  axisMax?: number;
  /** Optional explicit axis label override. */
  axisLabel?: string;
  defaultValue?: number;
}

/**
 * Per-stat elastic slider that lets the viewer sweep a base/max range along its
 * axis (level / tier / copy count / rarity) and see the interpolated result.
 */
export function BaseMaxSlider({
  value,
  axisMin,
  axisMax,
  axisLabel,
  defaultValue,
}: BaseMaxSliderProps) {
  const min = axisMin ?? 1;
  const max = axisMax ?? 100;
  const initial = defaultValue ?? min;
  const [axisValue, setAxisValue] = useState<number>(initial);

  return (
    <div className="flex flex-col gap-1.5 w-full">
      <ScaledValue
        base={value.base}
        max={value.max}
        curve={value.curve}
        axis={value.axis}
        axisValue={axisValue}
      />
      <ElasticSlider3D
        startingValue={min}
        maxValue={max}
        defaultValue={initial}
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
 * interactive elastic slider. Consumes BaseXmaxContext for axis + slider config.
 */
export function BaseMaxValueNode({ value, fallbackAxisLabel }: { value: BaseMaxValue; fallbackAxisLabel?: string }) {
  const bx = useBaseXmaxConfig();

  if (bx?.enabled && bx.showPerCardSlider) {
    return (
      <BaseMaxSlider
        value={value}
        axisMin={bx.axisMin}
        axisMax={bx.axisMax}
        axisLabel={bx.axisLabel || value.axis || fallbackAxisLabel}
        defaultValue={bx.defaultValue}
      />
    );
  }

  return <ScaledValue base={value.base} max={value.max} curve={value.curve} axis={value.axis} />;
}
