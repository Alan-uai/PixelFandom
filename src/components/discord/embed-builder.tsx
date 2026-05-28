'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Plus, Trash2, GripVertical } from 'lucide-react';
import type { EmbedPayload, EmbedField } from './types';

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
        <div className="space-y-1">
          <Label className="text-xs">Nome</Label>
          <Input
            value={field.name}
            onChange={(e) => onChange({ ...field, name: e.target.value })}
            placeholder="Nome do campo"
            className="h-8 text-xs"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Valor</Label>
          <Input
            value={field.value}
            onChange={(e) => onChange({ ...field, value: e.target.value })}
            placeholder="Valor"
            className="h-8 text-xs"
          />
        </div>
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
  const update = (partial: Partial<EmbedPayload>) => onChange({ ...embed, ...partial });

  return (
    <div className="space-y-3 rounded-lg border p-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">Embed #{index + 1}</p>
        <Button variant="ghost" size="icon" onClick={onRemove} className="h-7 w-7 text-destructive">
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label className="text-xs">Título</Label>
          <Input
            value={embed.title ?? ''}
            onChange={(e) => update({ title: e.target.value })}
            placeholder="Título do embed"
            className="h-8 text-xs"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">URL (do título)</Label>
          <Input
            value={embed.url ?? ''}
            onChange={(e) => update({ url: e.target.value })}
            placeholder="https://..."
            className="h-8 text-xs"
          />
        </div>
      </div>

      <div className="space-y-1">
        <Label className="text-xs">Descrição</Label>
        <textarea
          value={embed.description ?? ''}
          onChange={(e) => update({ description: e.target.value })}
          rows={3}
          className="w-full rounded-lg border bg-background px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary/50"
          placeholder="Markdown suportado..."
        />
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="space-y-1">
          <Label className="text-xs">Cor (hex)</Label>
          <div className="flex gap-1">
            <input
              type="color"
              value={embed.color ?? '#4BC5FF'}
              onChange={(e) => update({ color: e.target.value })}
              className="h-8 w-8 cursor-pointer rounded border bg-transparent"
            />
            <Input
              value={embed.color ?? ''}
              onChange={(e) => update({ color: e.target.value })}
              placeholder="#4BC5FF"
              className="h-8 text-xs flex-1"
            />
          </div>
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Imagem</Label>
          <Input
            value={embed.image?.url ?? ''}
            onChange={(e) => update({ image: { url: e.target.value } })}
            placeholder="URL da imagem"
            className="h-8 text-xs"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Thumbnail</Label>
          <Input
            value={embed.thumbnail?.url ?? ''}
            onChange={(e) => update({ thumbnail: { url: e.target.value } })}
            placeholder="URL do thumbnail"
            className="h-8 text-xs"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label className="text-xs">Autor</Label>
          <Input
            value={embed.author?.name ?? ''}
            onChange={(e) => update({ author: { ...embed.author, name: e.target.value } })}
            placeholder="Nome do autor"
            className="h-8 text-xs"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Ícone do Autor</Label>
          <Input
            value={embed.author?.icon_url ?? ''}
            onChange={(e) => update({ author: { ...embed.author, icon_url: e.target.value, name: embed.author?.name ?? '' } })}
            placeholder="URL do ícone"
            className="h-8 text-xs"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label className="text-xs">Footer</Label>
          <Input
            value={embed.footer?.text ?? ''}
            onChange={(e) => update({ footer: { ...embed.footer, text: e.target.value } })}
            placeholder="Texto do footer"
            className="h-8 text-xs"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Ícone do Footer</Label>
          <Input
            value={embed.footer?.icon_url ?? ''}
            onChange={(e) => update({ footer: { icon_url: e.target.value, text: embed.footer?.text ?? '' } })}
            placeholder="URL do ícone"
            className="h-8 text-xs"
          />
        </div>
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
