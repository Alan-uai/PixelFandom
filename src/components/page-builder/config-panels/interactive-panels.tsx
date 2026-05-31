import type { PanelProps } from './types';
import { ItemsListEditor } from './shared/items-list-editor';
import {
  SelectField, CheckboxField, TextField, UrlField,
} from './shared/fields';

export function DiscordEmbedPanel({ config, onChange }: PanelProps) {
  return (
    <>
      <UrlField label="URL do Discord" value={(config.discordUrl as string) || ''} onChange={(v) => onChange('discordUrl', v)} />
      <TextField label="Título" value={(config.title as string) || ''} onChange={(v) => onChange('title', v)} />
      <TextField label="Descrição" value={(config.description as string) || ''} onChange={(v) => onChange('description', v)} multiline />
      <SelectField label="Variante" value={(config.variant as string) || 'default'} options={[
        { label: 'Padrão', value: 'default' }, { label: 'Compacto', value: 'compact' }, { label: 'Minimal', value: 'minimal' },
      ]} onChange={(v) => onChange('variant', v)} />
    </>
  );
}

export function SocialLinksPanel({ config, onChange }: PanelProps) {
  return (
    <>
      <TextField label="Título" value={(config.title as string) || ''} onChange={(v) => onChange('title', v)} />
      <SelectField label="Layout" value={(config.layout as string) || 'row'} options={[
        { label: 'Linha', value: 'row' }, { label: 'Coluna', value: 'column' }, { label: 'Grade', value: 'grid' },
      ]} onChange={(v) => onChange('layout', v)} />
      <SelectField label="Tamanho" value={(config.size as string) || 'md'} options={[
        { label: 'Pequeno', value: 'sm' }, { label: 'Médio', value: 'md' }, { label: 'Grande', value: 'lg' },
      ]} onChange={(v) => onChange('size', v)} />
      <ItemsListEditor
        label="Links"
        fields={[
          { key: 'platform', label: 'Plataforma', type: 'text', placeholder: 'Twitter' },
          { key: 'url', label: 'URL', type: 'url' },
        ]}
        items={(config.links as Record<string, unknown>[]) || []}
        onChange={(v) => onChange('links', v)}
      />
    </>
  );
}

export function SearchPanel({ config, onChange }: PanelProps) {
  return (
    <>
      <TextField label="Placeholder" value={(config.placeholder as string) || 'Buscar...'} onChange={(v) => onChange('placeholder', v)} />
      <SelectField label="Variante" value={(config.variant as string) || 'default'} options={[
        { label: 'Padrão', value: 'default' }, { label: 'Minimal', value: 'minimal' }, { label: 'Largura Total', value: 'full-width' },
      ]} onChange={(v) => onChange('variant', v)} />
    </>
  );
}

export function TabsPanel({ config, onChange }: PanelProps) {
  return (
    <>
      <SelectField label="Posição" value={(config.layout as string) || 'top'} options={[
        { label: 'Topo', value: 'top' }, { label: 'Esquerda', value: 'left' },
      ]} onChange={(v) => onChange('layout', v)} />
      <ItemsListEditor
        label="Abas"
        fields={[
          { key: 'label', label: 'Nome', type: 'text' },
          { key: 'content', label: 'Conteúdo', type: 'textarea' },
        ]}
        items={(config.tabs as Record<string, unknown>[]) || []}
        onChange={(v) => onChange('tabs', v)}
      />
    </>
  );
}
