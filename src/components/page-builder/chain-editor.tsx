'use client';

import { Plus, X, GripVertical } from 'lucide-react';
import type { AnimationStep, AnimationType, DurationOption, DelayOption, EasingOption, ChainMode } from './types';
import { ANIMATION_CATEGORIES } from '@/lib/animation-categories';

interface ChainEditorProps {
  steps: AnimationStep[];
  mode: ChainMode;
  staggerDelay: number;
  onChange: (steps: AnimationStep[], mode: ChainMode, staggerDelay: number) => void;
}

function createDefaultStep(): AnimationStep {
  return { type: 'fade-in', duration: 'normal', delay: 'none', easing: 'ease' };
}

export function ChainEditor({ steps, mode, staggerDelay, onChange }: ChainEditorProps) {
  const updateStep = (index: number, partial: Partial<AnimationStep>) => {
    const next = steps.map((s, i) => (i === index ? { ...s, ...partial } : s));
    onChange(next, mode, staggerDelay);
  };

  const removeStep = (index: number) => {
    const next = steps.filter((_, i) => i !== index);
    onChange(next.length > 0 ? next : [createDefaultStep()], mode, staggerDelay);
  };

  const addStep = () => {
    onChange([...steps, createDefaultStep()], mode, staggerDelay);
  };

  const moveStep = (from: number, to: number) => {
    const next = [...steps];
    const [removed] = next.splice(from, 1);
    next.splice(to, 0, removed);
    onChange(next, mode, staggerDelay);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-muted-foreground">Cadeia de Animações</p>
        <span className="text-[10px] text-muted-foreground">{steps.length} step{steps.length !== 1 ? 's' : ''}</span>
      </div>

      {/* Mode Selector */}
      <div className="flex gap-1">
        {(['sequential', 'parallel', 'stagger'] as ChainMode[]).map((m) => (
          <button
            key={m}
            onClick={() => onChange(steps, m, staggerDelay)}
            className={`flex-1 rounded-md px-2 py-1 text-[10px] font-medium transition-colors capitalize ${
              mode === m
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:text-foreground'
            }`}
          >
            {m === 'sequential' ? 'Sequencial' : m === 'parallel' ? 'Paralelo' : 'Stagger'}
          </button>
        ))}
      </div>

      {mode === 'stagger' && (
        <div className="space-y-1">
          <label className="text-[10px] text-muted-foreground">Delay entre steps (ms)</label>
          <input
            type="number"
            value={staggerDelay}
            onChange={(e) => onChange(steps, mode, Number(e.target.value))}
            min={0}
            max={2000}
            step={50}
            className="w-full rounded-md border bg-background px-2 py-1 text-xs"
          />
        </div>
      )}

      {/* Steps */}
      <div className="space-y-2 max-h-48 overflow-y-auto">
        {steps.map((step, i) => (
          <div key={i} className="rounded-md border bg-muted/30 p-2 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1">
                <span className="text-[10px] text-muted-foreground font-mono">#{i + 1}</span>
                <span className="text-[10px] text-muted-foreground">{step.type}</span>
              </div>
              <div className="flex items-center gap-0.5">
                {i > 0 && (
                  <button onClick={() => moveStep(i, i - 1)} className="rounded p-0.5 text-muted-foreground hover:text-foreground">
                    <GripVertical className="w-3 h-3" />
                  </button>
                )}
                <button onClick={() => removeStep(i)} className="rounded p-0.5 text-muted-foreground hover:text-destructive">
                  <X className="w-3 h-3" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-1.5">
              <div className="space-y-0.5">
                <label className="text-[9px] text-muted-foreground">Tipo</label>
                <select
                  value={step.type}
                  onChange={(e) => updateStep(i, { type: e.target.value as AnimationType })}
                  className="w-full rounded-md border bg-background px-1.5 py-1 text-[10px]"
                >
                  {ANIMATION_CATEGORIES.map((cat) => (
                    <optgroup key={cat.id} label={cat.label}>
                      {cat.types.map((t) => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </div>
              <div className="space-y-0.5">
                <label className="text-[9px] text-muted-foreground">Duração</label>
                <select
                  value={step.duration || 'normal'}
                  onChange={(e) => updateStep(i, { duration: e.target.value as DurationOption })}
                  className="w-full rounded-md border bg-background px-1.5 py-1 text-[10px]"
                >
                  <option value="fast">Rápido</option>
                  <option value="normal">Normal</option>
                  <option value="slow">Lento</option>
                </select>
              </div>
              <div className="space-y-0.5">
                <label className="text-[9px] text-muted-foreground">Delay</label>
                <select
                  value={step.delay || 'none'}
                  onChange={(e) => updateStep(i, { delay: e.target.value as DelayOption })}
                  className="w-full rounded-md border bg-background px-1.5 py-1 text-[10px]"
                >
                  <option value="none">Sem</option>
                  <option value="short">Curto</option>
                  <option value="medium">Médio</option>
                  <option value="long">Longo</option>
                </select>
              </div>
              <div className="space-y-0.5">
                <label className="text-[9px] text-muted-foreground">Easing</label>
                <select
                  value={step.easing || 'ease'}
                  onChange={(e) => updateStep(i, { easing: e.target.value as EasingOption })}
                  className="w-full rounded-md border bg-background px-1.5 py-1 text-[10px]"
                >
                  <option value="ease">Ease</option>
                  <option value="ease-out">Ease Out</option>
                  <option value="ease-in">Ease In</option>
                  <option value="ease-in-out">In/Out</option>
                  <option value="bounce">Bounce</option>
                  <option value="spring">Spring</option>
                </select>
              </div>
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={addStep}
        className="flex items-center justify-center gap-1 w-full rounded-md border border-dashed py-2 text-[10px] text-muted-foreground hover:text-foreground hover:border-primary/50 transition-colors"
      >
        <Plus className="w-3 h-3" />
        Adicionar Step
      </button>
    </div>
  );
}
