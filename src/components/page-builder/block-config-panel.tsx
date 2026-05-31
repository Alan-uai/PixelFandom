'use client';

import { useState, useEffect } from 'react';
import { X, Layers } from 'lucide-react';
import type { BlockConfig, BlockType, BlockStyle, SpacingOption, TextAlign, AnimationConfig, AnimationType, DurationOption, DelayOption, EasingOption, HoverEffect, TapEffect, ChainMode } from './types';
import { sanitizeUrl } from '@/lib/sanitize';
import { configPanels } from './config-panels/index';
import { ANIMATION_CATEGORIES } from '@/lib/animation-categories';
import { AnimationPreview } from './animation-preview';
import { ChainEditor } from './chain-editor';

function SelectField({ label, value, options, onChange }: { label: string; value: string; options: { label: string; value: string }[]; onChange: (v: string) => void }) {
  return (
    <div className="space-y-1">
      <label className="text-[10px] text-muted-foreground">{label}</label>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="w-full rounded-md border bg-background px-2 py-1 text-xs">
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}

function Checkbox({ label, checked, onChange, id }: { label: string; checked: boolean; onChange: (v: boolean) => void; id: string }) {
  return (
    <div className="flex items-center gap-2">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} id={id} className="rounded" />
      <label htmlFor={id} className="text-xs">{label}</label>
    </div>
  );
}

function NumberField({ label, value, onChange, min, max }: { label: string; value: number; onChange: (v: number) => void; min?: number; max?: number }) {
  return (
    <div className="space-y-1">
      <label className="text-[10px] text-muted-foreground">{label}</label>
      <input type="number" value={value} onChange={(e) => onChange(Number(e.target.value))} min={min} max={max} className="w-full rounded-md border bg-background px-2 py-1 text-xs" />
    </div>
  );
}

function ColorField({ label, value, onChange }: { label: string; value?: string; onChange: (v: string) => void }) {
  return (
    <div className="space-y-1">
      <label className="text-[10px] text-muted-foreground">{label}</label>
      <div className="flex items-center gap-2">
        <input type="color" value={value || '#000000'} onChange={(e) => onChange(e.target.value)} className="w-8 h-8 rounded cursor-pointer" />
        <input type="text" value={value || ''} onChange={(e) => onChange(e.target.value)} className="flex-1 rounded-md border bg-background px-2 py-1 text-xs" />
      </div>
    </div>
  );
}

function TextField({ label, value, onChange, multiline, type }: { label: string; value: string; onChange: (v: string) => void; multiline?: boolean; type?: string }) {
  const isUrl = type === 'url';
  return (
    <div className="space-y-1">
      <label className="text-[10px] text-muted-foreground">{label}</label>
      {multiline ? (
        <textarea value={value} onChange={(e) => onChange(e.target.value)} rows={3} className="w-full rounded-md border bg-background px-2 py-1 text-xs resize-none" />
      ) : (
        <input type={isUrl ? 'url' : 'text'} value={value} onChange={(e) => onChange(isUrl ? sanitizeUrl(e.target.value) : e.target.value)} className="w-full rounded-md border bg-background px-2 py-1 text-xs" />
      )}
    </div>
  );
}

function ArrayField({ label, value, onChange }: { label: string; value: any[]; onChange: (v: any[]) => void }) {
  return (
    <div className="space-y-1">
      <label className="text-[10px] text-muted-foreground">{label}</label>
      <textarea value={JSON.stringify(value, null, 2)} onChange={(e) => { try { onChange(JSON.parse(e.target.value)); } catch {} }} rows={4} className="w-full rounded-md border bg-background px-2 py-1 font-mono text-[10px] resize-none" />
    </div>
  );
}

// ── Style Panel with Animation System ──

interface StylePanelProps {
  style?: BlockStyle;
  onChange: (s: BlockStyle) => void;
}

function BaseStyleTab({ style, onChange }: { style: BlockStyle; onChange: (s: BlockStyle) => void }) {
  const spacingOptions: { label: string; value: SpacingOption }[] = [
    { label: 'Nenhum', value: 'none' },
    { label: 'Pequeno', value: 'sm' },
    { label: 'Médio', value: 'md' },
    { label: 'Grande', value: 'lg' },
    { label: 'Extra', value: 'xl' },
  ];
  const alignOptions: { label: string; value: TextAlign }[] = [
    { label: 'Esquerda', value: 'left' },
    { label: 'Centro', value: 'center' },
    { label: 'Direita', value: 'right' },
  ];

  return (
    <div className="space-y-3">
      <ColorField label="Cor de Fundo" value={style.backgroundColor} onChange={(v) => onChange({ ...style, backgroundColor: v })} />
      <SelectField label="Padding" value={style.padding || 'none'} options={spacingOptions} onChange={(v) => onChange({ ...style, padding: v as SpacingOption })} />
      <SelectField label="Margem" value={style.margin || 'none'} options={spacingOptions} onChange={(v) => onChange({ ...style, margin: v as SpacingOption })} />
      <SelectField label="Alinhamento" value={style.textAlign || 'left'} options={alignOptions} onChange={(v) => onChange({ ...style, textAlign: v as TextAlign })} />
      <SelectField label="Borda" value={style.border || 'none'} options={[{ label: 'Nenhuma', value: 'none' }, { label: 'Sólida', value: 'solid' }, { label: 'Inferior', value: 'bottom' }]} onChange={(v) => onChange({ ...style, border: v as any })} />
      {style.border && style.border !== 'none' && (
        <ColorField label="Cor da Borda" value={style.borderColor} onChange={(v) => onChange({ ...style, borderColor: v })} />
      )}
      <SelectField label="Sombra" value={style.shadow || 'none'} options={[{ label: 'Nenhuma', value: 'none' }, { label: 'Pequena', value: 'sm' }, { label: 'Média', value: 'md' }, { label: 'Grande', value: 'lg' }]} onChange={(v) => onChange({ ...style, shadow: v as any })} />
      <SelectField label="Largura" value={style.width || 'full'} options={[{ label: 'Completa', value: 'full' }, { label: 'Contida', value: 'contained' }, { label: 'Auto', value: 'auto' }]} onChange={(v) => onChange({ ...style, width: v as any })} />
      <SelectField label="Visibilidade" value={style.visibility || 'all'} options={[{ label: 'Todos', value: 'all' }, { label: 'Desktop', value: 'desktop-only' }, { label: 'Mobile', value: 'mobile-only' }]} onChange={(v) => onChange({ ...style, visibility: v as any })} />
    </div>
  );
}

function AnimationTab({ style, onChange }: StylePanelProps) {
  const anim = style?.animation || { type: 'none' };
  const [showChainEditor, setShowChainEditor] = useState(false);

  const updateAnim = (partial: Partial<AnimationConfig>) => {
    onChange({ ...style, animation: { ...anim, ...partial } });
  };

  const is3D = ['flip-x', 'flip-y', 'flip-x-in', 'flip-y-in', 'perspective-up', 'perspective-down', 'three-d-tilt', 'card-flip'].includes(anim.type);
  const isChain = ['chain-sequential', 'chain-parallel', 'chain-stagger', 'chain-stagger-reverse'].includes(anim.type);

  return (
    <div className="space-y-4">
      {/* Category Grid */}
      <div className="space-y-2">
        <p className="text-[10px] text-muted-foreground font-medium">Categoria</p>
        <div className="flex flex-wrap gap-1">
          <button
            onClick={() => updateAnim({ type: 'none', steps: undefined })}
            className={`rounded-md px-2 py-1 text-[10px] font-medium transition-colors ${anim.type === 'none' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:text-foreground'}`}
          >
            Sem
          </button>
          {ANIMATION_CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => {
                const firstType = cat.types[0] as AnimationType;
                updateAnim({ type: firstType, steps: undefined });
              }}
              className={`rounded-md px-2 py-1 text-[10px] font-medium transition-colors capitalize ${
                cat.types.includes(anim.type as AnimationType)
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:text-foreground'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Type Grid */}
      {anim.type !== 'none' && (
        <div className="space-y-2">
          <p className="text-[10px] text-muted-foreground font-medium">Tipo</p>
          <div className="grid grid-cols-5 gap-1.5">
            {ANIMATION_CATEGORIES.filter((cat) => cat.types.includes(anim.type as AnimationType)).map((cat) =>
              cat.types.map((t) => (
                <button
                  key={t}
                  onClick={() => updateAnim({ type: t, steps: undefined })}
                  className={`rounded-md p-1 transition-colors ${anim.type === t ? 'ring-2 ring-primary bg-primary/10' : 'hover:bg-muted'}`}
                  title={t}
                >
                  <AnimationPreview type={t} size="sm" />
                </button>
              ))
            )}
            {!ANIMATION_CATEGORIES.some((cat) => cat.types.includes(anim.type as AnimationType)) && (
              <div className="col-span-5 text-[10px] text-muted-foreground italic">Selecione uma categoria primeiro</div>
            )}
          </div>
        </div>
      )}

      {/* Options */}
      {anim.type !== 'none' && (
        <div className="space-y-2 border-t pt-3">
          <p className="text-[10px] text-muted-foreground font-medium">Opções</p>

          {!isChain && (
            <>
              <SelectField label="Duração" value={anim.duration || 'normal'} options={[{ label: 'Rápido', value: 'fast' }, { label: 'Normal', value: 'normal' }, { label: 'Lento', value: 'slow' }]} onChange={(v) => updateAnim({ duration: v as DurationOption })} />
              <SelectField label="Delay" value={anim.delay || 'none'} options={[{ label: 'Sem', value: 'none' }, { label: 'Curto', value: 'short' }, { label: 'Médio', value: 'medium' }, { label: 'Longo', value: 'long' }]} onChange={(v) => updateAnim({ delay: v as DelayOption })} />
              <SelectField label="Easing" value={anim.easing || 'ease'} options={[{ label: 'Ease', value: 'ease' }, { label: 'Ease Out', value: 'ease-out' }, { label: 'Ease In', value: 'ease-in' }, { label: 'In/Out', value: 'ease-in-out' }, { label: 'Bounce', value: 'bounce' }, { label: 'Spring', value: 'spring' }]} onChange={(v) => updateAnim({ easing: v as EasingOption })} />
              <SelectField label="Repetir" value={typeof anim.iteration === 'number' ? String(anim.iteration) : anim.iteration || 'once'} options={[{ label: 'Uma vez', value: 'once' }, { label: 'Infinito', value: 'infinite' }, { label: '2x', value: '2' }, { label: '3x', value: '3' }]} onChange={(v) => updateAnim({ iteration: v === 'once' ? 'once' : v === 'infinite' ? 'infinite' : Number(v) as any })} />
              <Checkbox label="Animação ao scroll" checked={!!anim.animateOnScroll} onChange={(v) => updateAnim({ animateOnScroll: v })} id="anim-scroll" />
            </>
          )}

          {/* 3D Options */}
          {is3D && (
            <div className="space-y-2 border-t pt-2">
              <p className="text-[10px] text-muted-foreground">3D</p>
              <Checkbox label="Perspectiva" checked={!!anim.perspective} onChange={(v) => updateAnim({ perspective: v })} id="anim-3d-persp" />
              <Checkbox label="Tilt ao passar mouse" checked={!!anim.tiltOnHover} onChange={(v) => updateAnim({ tiltOnHover: v })} id="anim-3d-tilt" />
              {anim.tiltOnHover && (
                <NumberField label="Tilt Máx (graus)" value={anim.tiltMax || 15} onChange={(v) => updateAnim({ tiltMax: v })} min={1} max={45} />
              )}
            </div>
          )}

          {/* Gesture Options */}
          <div className="space-y-2 border-t pt-2">
            <p className="text-[10px] text-muted-foreground">Gestos</p>
            <SelectField label="Ao passar mouse" value={anim.hoverEffect || 'none'} options={[{ label: 'Nada', value: 'none' }, { label: 'Escalar', value: 'scale' }, { label: 'Elevar', value: 'lift' }, { label: 'Brilhar', value: 'glow' }, { label: 'Inclinar', value: 'tilt' }, { label: 'Rotacionar', value: 'rotate' }]} onChange={(v) => updateAnim({ hoverEffect: v as HoverEffect })} />
            <SelectField label="Ao clicar" value={anim.tapEffect || 'none'} options={[{ label: 'Nada', value: 'none' }, { label: 'Escalar', value: 'scale' }, { label: 'Onda', value: 'ripple' }]} onChange={(v) => updateAnim({ tapEffect: v as TapEffect })} />
          </div>
        </div>
      )}

      {/* Chain */}
      {anim.type !== 'none' && (
        <div className="border-t pt-3">
          <button
            onClick={() => setShowChainEditor(!showChainEditor)}
            className="flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-[10px] font-medium text-muted-foreground hover:text-foreground hover:border-primary/50 transition-colors w-full justify-center"
          >
            <Layers className="w-3 h-3" />
            {showChainEditor ? 'Fechar Chain' : `Chain (${anim.steps?.length || 0} steps)`}
          </button>
          {showChainEditor && (
            <div className="mt-2">
              <ChainEditor
                steps={anim.steps || []}
                mode={anim.chainMode || 'sequential'}
                staggerDelay={anim.staggerDelay || 100}
                onChange={(steps, mode, staggerDelay) => updateAnim({ steps, chainMode: mode, staggerDelay })}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function StylePanel({ style, onChange }: StylePanelProps) {
  const s = style || {};
  const [tab, setTab] = useState<'basic' | 'animation'>('basic');

  return (
    <div className="space-y-3">
      <p className="text-xs font-medium text-muted-foreground">Estilo</p>
      <div className="flex gap-1">
        <button
          onClick={() => setTab('basic')}
          className={`flex-1 rounded-md px-2 py-1 text-[10px] font-medium transition-colors ${tab === 'basic' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:text-foreground'}`}
        >
          Básico
        </button>
        <button
          onClick={() => setTab('animation')}
          className={`flex-1 rounded-md px-2 py-1 text-[10px] font-medium transition-colors ${tab === 'animation' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:text-foreground'}`}
        >
          Animação
        </button>
      </div>
      {tab === 'basic' ? (
        <BaseStyleTab style={s} onChange={onChange} />
      ) : (
        <AnimationTab style={s} onChange={onChange} />
      )}
    </div>
  );
}

// ── Main Config Panel ──

export function BlockConfigPanel({ block, onUpdate, onClose }: BlockConfigPanelProps) {
  const [localConfig, setLocalConfig] = useState({ ...block.config });

  useEffect(() => {
    setLocalConfig({ ...block.config });
  }, [block.id, block.config]);

  const update = (key: string, value: unknown) => {
    const next = { ...localConfig, [key]: value };
    setLocalConfig(next);
    onUpdate({ ...block, config: next });
  };

  const updateStyle = (style: BlockStyle) => {
    onUpdate({ ...block, style });
  };

  const SpecificPanel = configPanels[block.type as BlockType];

  return (
    <div className="w-72 shrink-0 border-l bg-background p-4 overflow-y-auto max-h-full">
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm font-medium capitalize">{block.type.replace(/-/g, ' ')}</p>
        <button onClick={onClose} className="rounded-md p-1 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="space-y-3">
        {SpecificPanel ? (
          <SpecificPanel config={localConfig} onChange={(key: string, value: unknown) => update(key, value)} />
        ) : (
          Object.entries(localConfig).map(([key, value]) => {
            if (typeof value === 'boolean') {
              return (
                <div key={key} className="flex items-center gap-2">
                  <input type="checkbox" checked={value} onChange={(e) => update(key, e.target.checked)} id={`cfg-${block.id}-${key}`} className="rounded" />
                  <label htmlFor={`cfg-${block.id}-${key}`} className="text-xs">{key.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase())}</label>
                </div>
              );
            }
            if (typeof value === 'number') {
              return <NumberField key={key} label={key.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase())} value={value} onChange={(v) => update(key, v)} />;
            }
            if (typeof value === 'string') {
              const isUrl = key.toLowerCase().includes('url') || key.toLowerCase().includes('src');
              const isMultiline = key === 'html' || key === 'content' || key === 'answer';
              const isColor = key.toLowerCase().includes('color');
              if (isColor) return <ColorField key={key} label={key.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase())} value={value} onChange={(v) => update(key, v)} />;
              return <TextField key={key} label={key.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase())} value={value} onChange={(v) => update(key, v)} multiline={isMultiline} type={isUrl ? 'url' : undefined} />;
            }
            if (Array.isArray(value)) {
              return <ArrayField key={key} label={key.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase())} value={value} onChange={(v) => update(key, v)} />;
            }
            return null;
          })
        )}
      </div>

      <StylePanel style={block.style} onChange={updateStyle} />
    </div>
  );
}

interface BlockConfigPanelProps {
  block: BlockConfig;
  onUpdate: (config: BlockConfig) => void;
  onClose: () => void;
}
