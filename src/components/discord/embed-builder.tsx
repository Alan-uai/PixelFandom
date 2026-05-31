'use client';

import { useState } from 'react';
import { FloatingLabelInput } from '@/components/ui/floating-label-input';
import { FloatingLabelTextarea } from '@/components/ui/floating-label-textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Plus, Trash2, GripVertical, Code2 } from 'lucide-react';
import type { EmbedPayload, EmbedField } from './types';
import { VariablePicker } from './variable-picker';

interface Props {
  value?: EmbedPayload[];
  onChange: (embeds: EmbedPayload[]) => void;
}

function EmbedFieldRow({ field, index, onChange, onRemove }: {
  field: EmbedField;
  index: number;
  onChange: (f: EmbedField) => void;
  onRemove: () => void;
}) {
  return (
    <div className="flex items-start gap-2 rounded-md border p-2">
      <GripVertical className="h-4 w-4 mt-2 shrink-0 text-muted-foreground" />
      <div className="flex-1 grid grid-cols-3 gap-2">
        <FloatingLabelInput
          label="Nome"
          value={field.name}
          onChange={(e) => onChange({ ...field, name: e.target.value })}
          className="text-xs"
        />
        <FloatingLabelInput
          label="Valor"
          value={field.value}
          onChange={(e) => onChange({ ...field, value: e.target.value })}
          className="text-xs"
        />
        <div className="space-y-1 flex items-end gap-1">
          <label className="flex items-center gap-1 text-xs pb-1">
            <input
              type="checkbox"
              checked={field.inline}
              onChange={(e) => onChange({ ...field, inline: e.target.checked })}
              className="h-3 w-3"
            />
            Inline
          </label>
          <Button variant="ghost" size="icon" onClick={onRemove} className="h-8 w-8 shrink-0">
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>
    </div>
  );
}

function SingleEmbed({ embed, index, onChange, onRemove }: {
  embed: EmbedPayload;
  index: number;
  onChange: (e: EmbedPayload) => void;
  onRemove: () => void;
}) {
  const [showVars, setShowVars] = useState(false);
  const update = (partial: Partial<EmbedPayload>) => onChange({ ...embed, ...partial });

  return (
    <div className="space-y-3 rounded-lg border p-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">Embed #{index + 1}</p>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowVars(!showVars)}
            className="h-7 text-[10px] gap-1"
          >
            <Code2 className="h-3 w-3" />
            {'{ }'}
          </Button>
          <Button variant="ghost" size="icon" onClick={onRemove} className="h-7 w-7 text-destructive">
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>
      {showVars && (
        <div className="mb-2">
          <VariablePicker mode="copy" onClose={() => setShowVars(false)} />
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <FloatingLabelInput
          label="Título"
          value={embed.title ?? ''}
          onChange={(e) => update({ title: e.target.value })}
          className="text-xs"
        />
        <FloatingLabelInput
          label="URL (do título)"
          value={embed.url ?? ''}
          onChange={(e) => update({ url: e.target.value })}
          className="text-xs"
        />
      </div>

      <FloatingLabelTextarea
        label="Descrição"
        value={embed.description ?? ''}
        onChange={(e) => update({ description: e.target.value })}
        className="text-xs min-h-[80px]"
      />

      <div className="grid grid-cols-3 gap-3">
        <div className="flex gap-1 items-start">
          <input
            type="color"
            value={embed.color ?? '#4BC5FF'}
            onChange={(e) => update({ color: e.target.value })}
            className="mt-2 h-8 w-8 shrink-0 cursor-pointer rounded border bg-transparent"
          />
          <FloatingLabelInput
            label="Cor (hex)"
            value={embed.color ?? ''}
            onChange={(e) => update({ color: e.target.value })}
            className="text-xs flex-1"
          />
        </div>
        <FloatingLabelInput
          label="Imagem"
          value={embed.image?.url ?? ''}
          onChange={(e) => update({ image: { url: e.target.value } })}
          className="text-xs"
        />
        <FloatingLabelInput
          label="Thumbnail"
          value={embed.thumbnail?.url ?? ''}
          onChange={(e) => update({ thumbnail: { url: e.target.value } })}
          className="text-xs"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <FloatingLabelInput
          label="Autor"
          value={embed.author?.name ?? ''}
          onChange={(e) => update({ author: { ...embed.author, name: e.target.value } })}
          className="text-xs"
        />
        <FloatingLabelInput
          label="Ícone do Autor"
          value={embed.author?.icon_url ?? ''}
          onChange={(e) => update({ author: { ...embed.author, icon_url: e.target.value, name: embed.author?.name ?? '' } })}
          className="text-xs"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <FloatingLabelInput
          label="Footer"
          value={embed.footer?.text ?? ''}
          onChange={(e) => update({ footer: { ...embed.footer, text: e.target.value } })}
          className="text-xs"
        />
        <FloatingLabelInput
          label="Ícone do Footer"
          value={embed.footer?.icon_url ?? ''}
          onChange={(e) => update({ footer: { icon_url: e.target.value, text: embed.footer?.text ?? '' } })}
          className="text-xs"
        />
      </div>

      <label className="flex items-center gap-2 text-xs">
        <input
          type="checkbox"
          checked={embed.timestamp ?? false}
          onChange={(e) => update({ timestamp: e.target.checked })}
          className="h-3 w-3"
        />
        Incluir timestamp automático
      </label>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-xs">Campos</Label>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => update({ fields: [...(embed.fields ?? []), { name: '', value: '', inline: false }] })}
            className="h-7 text-xs gap-1"
          >
            <Plus className="h-3 w-3" /> Campo
          </Button>
        </div>
        {(embed.fields ?? []).length === 0 ? (
          <p className="text-[10px] text-muted-foreground">Nenhum campo adicional.</p>
        ) : (
          <div className="space-y-2">
            {(embed.fields ?? []).map((f, fi) => (
              <EmbedFieldRow
                key={fi}
                field={f}
                index={fi}
                onChange={(updated) => {
                  const fields = [...(embed.fields ?? [])];
                  fields[fi] = updated;
                  update({ fields });
                }}
                onRemove={() => {
                  const fields = (embed.fields ?? []).filter((_, i) => i !== fi);
                  update({ fields });
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function EmbedBuilder({ value = [], onChange }: Props) {
  return (
    <div className="space-y-3">
      {(value ?? []).length === 0 ? (
        <p className="text-xs text-muted-foreground">Nenhum embed configurado.</p>
      ) : (
        <div className="space-y-3">
          {(value ?? []).map((embed, i) => (
            <SingleEmbed
              key={i}
              embed={embed}
              index={i}
              onChange={(updated) => {
                const embeds = [...(value ?? [])];
                embeds[i] = updated;
                onChange(embeds);
              }}
              onRemove={() => {
                const embeds = (value ?? []).filter((_, idx) => idx !== i);
                onChange(embeds);
              }}
            />
          ))}
        </div>
      )}
      <Button
        variant="outline"
        size="sm"
        onClick={() => onChange([...(value ?? []), {}])}
        className="w-full text-xs gap-1"
      >
        <Plus className="h-3 w-3" /> Adicionar Embed
      </Button>
    </div>
  );
}
