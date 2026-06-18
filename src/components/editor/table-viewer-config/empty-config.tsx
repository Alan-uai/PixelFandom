'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ImageUpload } from '@/components/ui/image-upload';

export function EmptyConfig({
  config,
  slug,
  onChange,
}: {
  config: Record<string, unknown>;
  onChange: (v: Record<string, unknown>) => void;
  slug?: string;
  columns?: string[];
}) {
  const c: Record<string, any> = config || {};

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <Label className="text-xs text-muted-foreground">Mensagem</Label>
        <Input
          value={c.message || 'Nenhum item encontrado'}
          onChange={(e) => onChange({ ...c, message: e.target.value })}
          className="h-8 text-sm"
        />
      </div>
      <div className="space-y-1">
        <Label className="text-xs text-muted-foreground">Imagem (opcional)</Label>
        <ImageUpload
          bucket="game-items"
          pathPrefix={`wiki-empty/${slug}`}
          value={c.imageUrl || ''}
          onChange={(url) => onChange({ ...c, imageUrl: url })}
          label="Ilustração vazia"
          previewSize="w-16 h-16"
        />
      </div>
      <div className="space-y-1">
        <Label className="text-xs text-muted-foreground">Texto do CTA (opcional)</Label>
        <Input
          value={c.ctaText || ''}
          onChange={(e) => onChange({ ...c, ctaText: e.target.value })}
          placeholder="Ex: Ver todos"
          className="h-8 text-sm"
        />
      </div>
      <div className="space-y-1">
        <Label className="text-xs text-muted-foreground">URL do CTA</Label>
        <Input
          value={c.ctaUrl || ''}
          onChange={(e) => onChange({ ...c, ctaUrl: e.target.value })}
          placeholder="/wiki/items"
          className="h-8 text-sm"
        />
      </div>
    </div>
  );
}
