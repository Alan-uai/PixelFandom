import type { PanelProps } from './types';
import { ItemsListEditor } from './shared/items-list-editor';
import { TableEditor } from './shared/table-editor';
import {
  SelectField, CheckboxField, TextField,
} from './shared/fields';

export function RankingTablePanel({ config, onChange }: PanelProps) {
  return (
    <>
      <TextField label="Título" value={(config.title as string) || ''} onChange={(v) => onChange('title', v)} />
      <SelectField label="Variante" value={(config.variant as string) || 'default'} options={[
        { label: 'Padrão', value: 'default' }, { label: 'Listrada', value: 'striped' },
        { label: 'Bordas', value: 'bordered' }, { label: 'Minimal', value: 'minimal' },
      ]} onChange={(v) => onChange('variant', v)} />
      <TableEditor
        label="Tabela"
        headers={(config.headers as string[]) || []}
        rows={(config.rows as string[][]) || []}
        onHeadersChange={(v) => onChange('headers', v)}
        onRowsChange={(v) => onChange('rows', v)}
      />
    </>
  );
}

export function StatisticsPanel({ config, onChange }: PanelProps) {
  return (
    <>
      <ItemsListEditor
        label="Estatísticas"
        fields={[
          { key: 'label', label: 'Nome', type: 'text' },
          { key: 'value', label: 'Valor', type: 'text' },
          { key: 'prefix', label: 'Prefixo', type: 'text', placeholder: 'R$' },
          { key: 'suffix', label: 'Sufixo', type: 'text', placeholder: '%' },
        ]}
        items={(config.items as Record<string, unknown>[]) || []}
        onChange={(v) => onChange('items', v)}
      />
      <SelectField label="Colunas" value={String((config.columns as number) || 3)} options={[
        { label: '2', value: '2' }, { label: '3', value: '3' }, { label: '4', value: '4' },
      ]} onChange={(v) => onChange('columns', Number(v))} />
      <CheckboxField label="Animar ao entrar" checked={!!config.animate} onChange={(v) => onChange('animate', v)} id="stats-animate" />
    </>
  );
}

export function ProgressBarPanel({ config, onChange }: PanelProps) {
  return (
    <ItemsListEditor
      label="Barras"
      fields={[
        { key: 'label', label: 'Nome', type: 'text' },
        { key: 'value', label: 'Valor (%)', type: 'number' },
      ]}
      items={(config.items as Record<string, unknown>[]) || []}
      onChange={(v) => onChange('items', v)}
    />
  );
}

export function TimelinePanel({ config, onChange }: PanelProps) {
  return (
    <ItemsListEditor
      label="Eventos"
      fields={[
        { key: 'title', label: 'Título', type: 'text' },
        { key: 'date', label: 'Data', type: 'text', placeholder: '2024' },
        { key: 'content', label: 'Conteúdo', type: 'textarea' },
      ]}
      items={(config.items as Record<string, unknown>[]) || []}
      onChange={(v) => onChange('items', v)}
    />
  );
}

export function FaqPanel({ config, onChange }: PanelProps) {
  return (
    <>
      <TextField label="Título" value={(config.title as string) || ''} onChange={(v) => onChange('title', v)} />
      <SelectField label="Layout" value={(config.layout as string) || 'accordion'} options={[
        { label: 'Acordeão', value: 'accordion' }, { label: 'Lista', value: 'list' },
      ]} onChange={(v) => onChange('layout', v)} />
      <ItemsListEditor
        label="Perguntas"
        fields={[
          { key: 'question', label: 'Pergunta', type: 'text' },
          { key: 'answer', label: 'Resposta', type: 'textarea' },
        ]}
        items={(config.items as Record<string, unknown>[]) || []}
        onChange={(v) => onChange('items', v)}
      />
    </>
  );
}

export function GameDataCardsPanel({ config, onChange }: PanelProps) {
  const tabsEnabled = !!config.tabsEnabled;
  return (
    <>
      <TextField label="Título" value={(config.title as string) || ''} onChange={(v) => onChange('title', v)} />
      <SelectField label="Formato de Exibição" value={(config.displayFormat as string) || 'grid'} options={[
        { label: 'Grade', value: 'grid' },
        { label: 'Lista', value: 'list' },
        { label: 'Carrossel', value: 'carousel' },
        { label: 'Carrossel Infinito', value: 'carousel_infinite' },
      ]} onChange={(v) => onChange('displayFormat', v)} />
      <SelectField label="Colunas" value={String((config.columnsCount as number) || 4)} options={[
        { label: '2', value: '2' }, { label: '3', value: '3' },
        { label: '4', value: '4' }, { label: '5', value: '5' },
      ]} onChange={(v) => onChange('columnsCount', Number(v))} />
      <CheckboxField label="Ativar abas" checked={tabsEnabled} onChange={(v) => onChange('tabsEnabled', v)} id="gdc-tabs" />
      {tabsEnabled && (
        <SelectField label="Formato das Abas" value={(config.tabsSubFormat as string) || 'grid'} options={[
          { label: 'Grade', value: 'grid' },
          { label: 'Lista', value: 'list' },
          { label: 'Carrossel', value: 'carousel' },
        ]} onChange={(v) => onChange('tabsSubFormat', v)} />
      )}
    </>
  );
}
