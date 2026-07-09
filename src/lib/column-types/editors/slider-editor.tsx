'use client';

import { ElasticSlider3D } from '@/components/ui/elastic-slider-3d';

interface SliderEditorProps {
  value: string;
  onChange: (value: string) => void;
  min?: number;
  max?: number;
  step?: number;
}

export function SliderEditor({ value, onChange, min = 0, max = 100, step = 1 }: SliderEditorProps) {
  const numVal = parseFloat(value) || 0;

  return (
    <div className="flex items-center gap-3">
      <ElasticSlider3D
        defaultValue={numVal}
        startingValue={min}
        maxValue={max}
        isStepped={step > 0}
        stepSize={step}
        showValue
        onValueChange={(v) => onChange(String(v))}
        className="flex-1"
      />
    </div>
  );
}