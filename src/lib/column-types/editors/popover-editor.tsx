'use client';

import { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';

interface PopoverSettings {
  trigger: 'hover' | 'click';
  position: 'top' | 'bottom' | 'left' | 'right';
  title: string;
  content: string;
}

const defaultSettings: PopoverSettings = {
  trigger: 'hover',
  position: 'top',
  title: '',
  content: '',
};

function parseValue(value: string): PopoverSettings {
  if (!value) return { ...defaultSettings };
  try {
    const parsed = JSON.parse(value);
    return {
      trigger: parsed.trigger || 'hover',
      position: parsed.position || 'top',
      title: parsed.title || '',
      content: parsed.content || '',
    };
  } catch {
    return { ...defaultSettings };
  }
}

interface PopoverEditorProps {
  value: string;
  onChange: (value: string) => void;
}

export function PopoverEditor({ value, onChange }: PopoverEditorProps) {
  const [settings, setSettings] = useState<PopoverSettings>(() => parseValue(value));

  const update = (partial: Partial<PopoverSettings>) => {
    const next = { ...settings, ...partial };
    setSettings(next);
    onChange(JSON.stringify(next));
  };

  return (
    <div className="space-y-2 rounded-lg border bg-muted/20 p-2.5">
      <p className="text-[10px] font-medium text-muted-foreground">Configuração do Popover</p>
      <div className="space-y-2">
        <div className="flex gap-2">
          <div className="flex-1 space-y-1">
            <Label className="text-[10px] text-muted-foreground">Ação</Label>
            <select
              value={settings.trigger}
              onChange={(e) => update({ trigger: e.target.value as 'hover' | 'click' })}
              className="w-full rounded-md border bg-background px-2 py-1 text-xs"
            >
              <option value="hover">Passar mouse</option>
              <option value="click">Clicar</option>
            </select>
          </div>
          <div className="flex-1 space-y-1">
            <Label className="text-[10px] text-muted-foreground">Posição</Label>
            <select
              value={settings.position}
              onChange={(e) => update({ position: e.target.value as 'top' | 'bottom' | 'left' | 'right' })}
              className="w-full rounded-md border bg-background px-2 py-1 text-xs"
            >
              <option value="top">Topo</option>
              <option value="bottom">Baixo</option>
              <option value="left">Esquerda</option>
              <option value="right">Direita</option>
            </select>
          </div>
        </div>
        <div className="space-y-1">
          <Label className="text-[10px] text-muted-foreground">Título</Label>
          <Input
            value={settings.title}
            onChange={(e) => update({ title: e.target.value })}
            placeholder="Título do popover"
            className="h-7 text-xs"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-[10px] text-muted-foreground">Conteúdo</Label>
          <Textarea
            value={settings.content}
            onChange={(e) => update({ content: e.target.value })}
            placeholder="Conteúdo do popover..."
            rows={3}
            className="text-xs min-h-[60px]"
          />
        </div>
      </div>
    </div>
  );
}
