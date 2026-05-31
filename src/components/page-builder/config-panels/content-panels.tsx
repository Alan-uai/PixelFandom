import type { PanelProps } from './types';
import { StringListEditor } from './shared/string-list-editor';
import {
  SelectField, CheckboxField, NumberField, TextField, ColorField, UrlField,
} from './shared/fields';

export function ParagraphPanel({ config, onChange }: PanelProps) {
  return (
    <>
      <TextField label="Conteúdo" value={(config.content as string) || ''} onChange={(v) => onChange('content', v)} multiline />
      <SelectField label="Tamanho" value={(config.size as string) || 'md'} options={[
        { label: 'Pequeno', value: 'sm' }, { label: 'Médio', value: 'md' }, { label: 'Grande', value: 'lg' },
      ]} onChange={(v) => onChange('size', v)} />
      <ColorField label="Cor" value={(config.color as string) || ''} onChange={(v) => onChange('color', v)} />
    </>
  );
}

export function RichTextPanel({ config, onChange }: PanelProps) {
  return (
    <>
      <TextField label="Título" value={(config.title as string) || ''} onChange={(v) => onChange('title', v)} />
      <TextField label="HTML" value={(config.html as string) || ''} onChange={(v) => onChange('html', v)} multiline />
    </>
  );
}

export function DividerPanel({ config, onChange }: PanelProps) {
  return (
    <>
      <SelectField label="Estilo" value={(config.style as string) || 'solid'} options={[
        { label: 'Sólida', value: 'solid' }, { label: 'Tracejada', value: 'dashed' }, { label: 'Pontilhada', value: 'dotted' },
      ]} onChange={(v) => onChange('style', v)} />
      <ColorField label="Cor" value={(config.color as string) || ''} onChange={(v) => onChange('color', v)} />
      <SelectField label="Espessura" value={(config.thickness as string) || 'sm'} options={[
        { label: 'Fina', value: 'sm' }, { label: 'Média', value: 'md' }, { label: 'Grossa', value: 'lg' },
      ]} onChange={(v) => onChange('thickness', v)} />
    </>
  );
}

export function SpacerPanel({ config, onChange }: PanelProps) {
  return (
    <SelectField label="Altura" value={(config.height as string) || 'md'} options={[
      { label: 'Pequena', value: 'sm' }, { label: 'Média', value: 'md' }, { label: 'Grande', value: 'lg' },
      { label: 'Extra', value: 'xl' }, { label: '2x Extra', value: '2xl' },
    ]} onChange={(v) => onChange('height', v)} />
  );
}

export function ListPanel({ config, onChange }: PanelProps) {
  return (
    <>
      <StringListEditor
        label="Itens"
        values={(config.items as string[]) || []}
        onChange={(v) => onChange('items', v)}
        placeholder="Digite um item..."
      />
      <CheckboxField label="Ordenada" checked={!!config.ordered} onChange={(v) => onChange('ordered', v)} id="list-ordered" />
      <SelectField label="Estilo" value={(config.style as string) || 'disc'} options={[
        { label: 'Disco', value: 'disc' }, { label: 'Círculo', value: 'circle' }, { label: 'Quadrado', value: 'square' },
        { label: 'Decimal', value: 'decimal' }, { label: 'Romano', value: 'roman' },
      ]} onChange={(v) => onChange('style', v)} />
    </>
  );
}
