import { useState } from 'react';
import type { PanelProps } from './types';
import { ItemsListEditor } from './shared/items-list-editor';
import {
  SelectField, CheckboxField, TextField, ColorField, UrlField,
} from './shared/fields';
import { ImageIcon } from 'lucide-react';
import { MediaLibrary } from '@/components/ui/media-library';

function ImageUrlField({ label, value, onChange, tenantId }: { label: string; value: string; onChange: (v: string) => void; tenantId?: string }) {
  const [libOpen, setLibOpen] = useState(false);
  return (
    <div className="space-y-1">
      <label className="text-[10px] text-muted-foreground">{label}</label>
      <div className="flex gap-1">
        <input type="url" value={value} onChange={(e) => onChange(e.target.value)} className="flex-1 rounded-md border bg-background px-2 py-1 text-xs" />
        {tenantId && (
          <button type="button" onClick={() => setLibOpen(true)} className="shrink-0 rounded-md border bg-background px-2 text-muted-foreground hover:text-foreground transition-colors" title="Biblioteca">
            <ImageIcon className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
      {tenantId && (
        <MediaLibraryInline open={libOpen} onOpenChange={setLibOpen} tenantId={tenantId} onSelect={onChange} />
      )}
    </div>
  );
}

function MediaLibraryInline({ open, onOpenChange, tenantId, onSelect }: { open: boolean; onOpenChange: (v: boolean) => void; tenantId: string; onSelect: (url: string) => void }) {
  if (!open) return null;
  return (
    <MediaLibrary open={open} onOpenChange={onOpenChange} tenantId={tenantId} onSelect={onSelect} />
  );
}

export function ImagePanel(props: PanelProps) {
  const { config, onChange, tenantId } = props;
  return (
    <>
      <ImageUrlField label="URL da Imagem" value={(config.src as string) || ''} onChange={(v) => onChange('src', v)} tenantId={tenantId} />
      <TextField label="Alt" value={(config.alt as string) || ''} onChange={(v) => onChange('alt', v)} />
      <TextField label="Legenda" value={(config.caption as string) || ''} onChange={(v) => onChange('caption', v)} />
      <UrlField label="Link" value={(config.link as string) || ''} onChange={(v) => onChange('link', v)} />
      <SelectField label="Arredondamento" value={(config.rounded as string) || 'none'} options={[
        { label: 'Nenhum', value: 'none' }, { label: 'Pequeno', value: 'sm' }, { label: 'Médio', value: 'md' }, { label: 'Total', value: 'full' },
      ]} onChange={(v) => onChange('rounded', v)} />
      <SelectField label="Sombra" value={(config.shadow as string) || 'none'} options={[
        { label: 'Nenhuma', value: 'none' }, { label: 'Pequena', value: 'sm' }, { label: 'Média', value: 'md' }, { label: 'Grande', value: 'lg' },
      ]} onChange={(v) => onChange('shadow', v)} />
    </>
  );
}

export function ImageGalleryPanel({ config, onChange }: PanelProps) {
  return (
    <>
      <TextField label="Título" value={(config.title as string) || ''} onChange={(v) => onChange('title', v)} />
      <ItemsListEditor
        label="Imagens"
        fields={[
          { key: 'src', label: 'URL', type: 'url' },
          { key: 'alt', label: 'Alt', type: 'text' },
        ]}
        items={(config.images as Record<string, unknown>[]) || []}
        onChange={(v) => onChange('images', v)}
      />
      <SelectField label="Colunas" value={String((config.columns as number) || 3)} options={[
        { label: '1', value: '1' }, { label: '2', value: '2' }, { label: '3', value: '3' },
        { label: '4', value: '4' }, { label: '5', value: '5' }, { label: '6', value: '6' },
      ]} onChange={(v) => onChange('columns', Number(v))} />
      <SelectField label="Proporção" value={(config.aspectRatio as string) || 'square'} options={[
        { label: 'Quadrado', value: 'square' }, { label: 'Vídeo', value: 'video' }, { label: 'Panorâmico', value: 'wide' }, { label: 'Retrato', value: 'portrait' },
      ]} onChange={(v) => onChange('aspectRatio', v)} />
    </>
  );
}

export function VideoEmbedPanel({ config, onChange }: PanelProps) {
  return (
    <>
      <TextField label="Título" value={(config.title as string) || ''} onChange={(v) => onChange('title', v)} />
      <UrlField label="URL do Vídeo" value={(config.url as string) || ''} onChange={(v) => onChange('url', v)} />
      <SelectField label="Provedor" value={(config.provider as string) || 'youtube'} options={[
        { label: 'YouTube', value: 'youtube' }, { label: 'Vimeo', value: 'vimeo' }, { label: 'Twitch', value: 'twitch' },
      ]} onChange={(v) => onChange('provider', v)} />
      <SelectField label="Proporção" value={(config.aspectRatio as string) || '16:9'} options={[
        { label: '16:9', value: '16:9' }, { label: '4:3', value: '4:3' }, { label: '1:1', value: '1:1' },
      ]} onChange={(v) => onChange('aspectRatio', v)} />
    </>
  );
}

export function CoverPanel({ config, onChange }: PanelProps) {
  return (
    <>
      <TextField label="Título" value={(config.title as string) || ''} onChange={(v) => onChange('title', v)} />
      <TextField label="Subtítulo" value={(config.subtitle as string) || ''} onChange={(v) => onChange('subtitle', v)} />
      <UrlField label="Imagem de Fundo" value={(config.backgroundImage as string) || ''} onChange={(v) => onChange('backgroundImage', v)} />
      <CheckboxField label="Overlay escuro" checked={!!config.overlay} onChange={(v) => onChange('overlay', v)} id="cover-overlay" />
      {config.overlay && <ColorField label="Cor do Overlay" value={(config.overlayColor as string) || ''} onChange={(v) => onChange('overlayColor', v)} />}
      <SelectField label="Altura" value={(config.height as string) || 'md'} options={[
        { label: 'Pequena', value: 'sm' }, { label: 'Média', value: 'md' }, { label: 'Grande', value: 'lg' }, { label: 'Tela Cheia', value: 'full' },
      ]} onChange={(v) => onChange('height', v)} />
    </>
  );
}

export function MediaTextPanel({ config, onChange }: PanelProps) {
  return (
    <>
      <TextField label="Título" value={(config.title as string) || ''} onChange={(v) => onChange('title', v)} />
      <TextField label="Conteúdo" value={(config.content as string) || ''} onChange={(v) => onChange('content', v)} multiline />
      <UrlField label="URL da Imagem" value={(config.imageSrc as string) || ''} onChange={(v) => onChange('imageSrc', v)} />
      <SelectField label="Posição da Imagem" value={(config.imagePosition as string) || 'left'} options={[
        { label: 'Esquerda', value: 'left' }, { label: 'Direita', value: 'right' },
      ]} onChange={(v) => onChange('imagePosition', v)} />
      <SelectField label="Proporção da Imagem" value={(config.imageRatio as string) || '50'} options={[
        { label: '50%', value: '50' }, { label: '40%', value: '40' }, { label: '60%', value: '60' },
      ]} onChange={(v) => onChange('imageRatio', v)} />
      <TextField label="Texto do CTA" value={(config.ctaText as string) || ''} onChange={(v) => onChange('ctaText', v)} />
      <UrlField label="URL do CTA" value={(config.ctaUrl as string) || ''} onChange={(v) => onChange('ctaUrl', v)} />
    </>
  );
}
