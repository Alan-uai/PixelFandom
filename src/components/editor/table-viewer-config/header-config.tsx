'use client';

import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ImageUpload } from '@/components/ui/image-upload';
import { TableIconPicker } from '@/components/ui/table-icon-picker';

export function HeaderConfig({
  config,
  onChange,
  slug,
}: {
  config: Record<string, unknown>;
  onChange: (v: Record<string, unknown>) => void;
  columns?: string[];
  slug?: string;
}) {
  const c: Record<string, any> = config || {};
  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <Label className="text-xs text-muted-foreground">Título</Label>
        <Input
          value={c.title || ''}
          onChange={(e) => onChange({ ...c, title: e.target.value })}
          placeholder="Label da tabela ou custom"
          className="h-8 text-sm"
        />
      </div>
      <div className="space-y-1">
        <Label className="text-xs text-muted-foreground">Subtítulo</Label>
        <Input
          value={c.subtitle || ''}
          onChange={(e) => onChange({ ...c, subtitle: e.target.value })}
          placeholder="Opcional"
          className="h-8 text-sm"
        />
      </div>
      <div className="space-y-1">
        <Label className="text-xs text-muted-foreground">Ícone</Label>
        <TableIconPicker value={c.icon || 'Database'} onChange={(v) => onChange({ ...c, icon: v })} slug={slug || ''} />
      </div>
      <div className="space-y-1">
        <Label className="text-xs text-muted-foreground">Imagem de fundo</Label>
        <ImageUpload
          bucket="game-items"
          pathPrefix={`wiki-covers/${slug}`}
          value={c.backgroundImage || ''}
          onChange={(url) => onChange({ ...c, backgroundImage: url })}
          label="Fundo do header"
          previewSize="w-full h-20"
        />
      </div>
      <div className="flex items-center gap-2">
        <Switch
          id="show-breadcrumb"
          checked={c.showBreadcrumb !== false}
          onCheckedChange={(v) => onChange({ ...c, showBreadcrumb: v })}
        />
        <Label htmlFor="show-breadcrumb" className="text-xs">Exibir breadcrumb (Voltar para home)</Label>
      </div>
    </div>
  );
}
