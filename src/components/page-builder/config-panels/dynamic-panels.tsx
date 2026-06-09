import type { PanelProps } from './types';
import { ItemsListEditor } from './shared/items-list-editor';
import {
  SelectField, CheckboxField, TextField, UrlField,
} from './shared/fields';

export function ArticleGridPanel({ config, onChange }: PanelProps) {
  return (
    <>
      <TextField label="Título" value={(config.title as string) || ''} onChange={(v) => onChange('title', v)} />
      <SelectField label="Colunas" value={String((config.columns as number) || 3)} options={[
        { label: '1', value: '1' }, { label: '2', value: '2' }, { label: '3', value: '3' },
        { label: '4', value: '4' }, { label: '5', value: '5' }, { label: '6', value: '6' },
      ]} onChange={(v) => onChange('columns', Number(v))} />
      <SelectField label="Modo" value={(config.mode as string) || 'manual'} options={[
        { label: 'Manual', value: 'manual' }, { label: 'Tag', value: 'tag' },
      ]} onChange={(v) => onChange('mode', v)} />
      {config.mode === 'tag' ? (
        <TextField label="Tag" value={(config.tag as string) || ''} onChange={(v) => onChange('tag', v)} />
      ) : (
        <ItemsListEditor
          label="Artigos"
          fields={[
            { key: 'title', label: 'Título', type: 'text' },
            { key: 'slug', label: 'Slug', type: 'text' },
            { key: 'summary', label: 'Resumo', type: 'textarea' },
            { key: 'date', label: 'Data', type: 'text', placeholder: 'YYYY-MM-DD' },
            { key: 'imageUrl', label: 'URL da Imagem', type: 'url' },
          ]}
          items={(config.articles as Record<string, unknown>[]) || []}
          onChange={(v) => onChange('articles', v)}
        />
      )}
      <CheckboxField label="Mostrar imagens" checked={!!config.showImages} onChange={(v) => onChange('showImages', v)} id="ag-images" />
      <CheckboxField label="Mostrar resumos" checked={!!config.showSummaries} onChange={(v) => onChange('showSummaries', v)} id="ag-summaries" />
    </>
  );
}

export function ArticleCarouselPanel({ config, onChange }: PanelProps) {
  return (
    <>
      <TextField label="Título" value={(config.title as string) || ''} onChange={(v) => onChange('title', v)} />
      <TextField label="Tag" value={(config.tag as string) || ''} onChange={(v) => onChange('tag', v)} />
      <ItemsListEditor
        label="Artigos"
        fields={[
          { key: 'title', label: 'Título', type: 'text' },
          { key: 'slug', label: 'Slug', type: 'text' },
          { key: 'summary', label: 'Resumo', type: 'textarea' },
          { key: 'imageUrl', label: 'URL da Imagem', type: 'url' },
        ]}
        items={(config.articles as Record<string, unknown>[]) || []}
        onChange={(v) => onChange('articles', v)}
      />
      <CheckboxField label="Reprodução automática" checked={!!config.autoplay} onChange={(v) => onChange('autoplay', v)} id="ac-autoplay" />
      {config.autoplay && (
        <SelectField label="Intervalo (seg)" value={String(((config.interval as number) || 5000) / 1000)} options={[
          { label: '3s', value: '3' }, { label: '5s', value: '5' }, { label: '10s', value: '10' }, { label: '15s', value: '15' }, { label: '30s', value: '30' },
        ]} onChange={(v) => onChange('interval', Number(v) * 1000)} />
      )}
    </>
  );
}

export function NewsFeedPanel({ config, onChange }: PanelProps) {
  return (
    <>
      <TextField label="Título" value={(config.title as string) || ''} onChange={(v) => onChange('title', v)} />
      <SelectField label="Modo" value={(config.mode as string) || 'manual'} options={[
        { label: 'Manual', value: 'manual' }, { label: 'Tag', value: 'tag' },
      ]} onChange={(v) => onChange('mode', v)} />
      {config.mode === 'tag' ? (
        <>
          <TextField label="Tag" value={(config.tag as string) || ''} onChange={(v) => onChange('tag', v)} />
          <SelectField label="Máx. Itens" value={String((config.maxItems as number) || 10)} options={[
            { label: '5', value: '5' }, { label: '10', value: '10' }, { label: '20', value: '20' }, { label: '50', value: '50' },
          ]} onChange={(v) => onChange('maxItems', Number(v))} />
        </>
      ) : (
        <ItemsListEditor
          label="Itens"
          fields={[
            { key: 'title', label: 'Título', type: 'text' },
            { key: 'date', label: 'Data', type: 'text', placeholder: 'YYYY-MM-DD' },
            { key: 'excerpt', label: 'Resumo', type: 'textarea' },
            { key: 'link', label: 'Link', type: 'url' },
            { key: 'imageUrl', label: 'URL da Imagem', type: 'url' },
          ]}
          items={(config.items as Record<string, unknown>[]) || []}
          onChange={(v) => onChange('items', v)}
        />
      )}
    </>
  );
}

export function FeaturedListPanel({ config, onChange }: PanelProps) {
  return (
    <>
      <TextField label="Título" value={(config.title as string) || ''} onChange={(v) => onChange('title', v)} />
      <SelectField label="Layout" value={(config.layout as string) || 'list'} options={[
        { label: 'Lista', value: 'list' }, { label: 'Grade', value: 'grid' }, { label: 'Cartões', value: 'cards' },
      ]} onChange={(v) => onChange('layout', v)} />
      <ItemsListEditor
        label="Itens"
        fields={[
          { key: 'label', label: 'Nome', type: 'text' },
          { key: 'description', label: 'Descrição', type: 'textarea' },
          { key: 'imageUrl', label: 'URL da Imagem', type: 'url' },
        ]}
        items={(config.items as Record<string, unknown>[]) || []}
        onChange={(v) => onChange('items', v)}
      />
    </>
  );
}

export function CategoryListPanel({ config, onChange }: PanelProps) {
  return (
    <>
      <TextField label="Título" value={(config.title as string) || ''} onChange={(v) => onChange('title', v)} />
      <CheckboxField label="Mostrar contagem" checked={!!config.showCount} onChange={(v) => onChange('showCount', v)} id="cl-count" />
      <SelectField label="Layout" value={(config.layout as string) || 'list'} options={[
        { label: 'Lista', value: 'list' }, { label: 'Grade', value: 'grid' }, { label: 'Nuvem', value: 'cloud' },
      ]} onChange={(v) => onChange('layout', v)} />
    </>
  );
}

export function LatestArticlesPanel({ config, onChange }: PanelProps) {
  return (
    <>
      <TextField label="Título" value={(config.title as string) || ''} onChange={(v) => onChange('title', v)} />
      <SelectField label="Quantidade" value={String((config.count as number) || 6)} options={[
        { label: '3', value: '3' }, { label: '6', value: '6' }, { label: '9', value: '9' }, { label: '12', value: '12' },
      ]} onChange={(v) => onChange('count', Number(v))} />
      <SelectField label="Colunas" value={String((config.columns as number) || 3)} options={[
        { label: '1', value: '1' }, { label: '2', value: '2' }, { label: '3', value: '3' }, { label: '4', value: '4' },
      ]} onChange={(v) => onChange('columns', Number(v))} />
      <TextField label="Tag (opcional)" value={(config.tag as string) || ''} onChange={(v) => onChange('tag', v)} />
      <CheckboxField label="Mostrar imagens" checked={!!config.showImages} onChange={(v) => onChange('showImages', v)} id="la-images" />
      <CheckboxField label="Mostrar resumos" checked={!!config.showSummaries} onChange={(v) => onChange('showSummaries', v)} id="la-summaries" />
    </>
  );
}

export function ArticleFeedPanel({ config, onChange }: PanelProps) {
  return (
    <>
      <TextField label="Título" value={(config.title as string) || ''} onChange={(v) => onChange('title', v)} />
      <SelectField label="Ordenar por" value={(config.sortBy as string) || 'recent'} options={[
        { label: 'Recentes', value: 'recent' },
        { label: 'Mais Votados', value: 'most_voted' },
        { label: 'Mais Comentados', value: 'most_commented' },
        { label: 'Populares', value: 'popular' },
      ]} onChange={(v) => onChange('sortBy', v)} />
      <TextField label="Tag (opcional)" value={(config.tag as string) || ''} onChange={(v) => onChange('tag', v)} />
      <SelectField label="Layout" value={(config.layout as string) || 'grid'} options={[
        { label: 'Grade', value: 'grid' },
        { label: 'Lista', value: 'list' },
        { label: 'Carrossel', value: 'carousel' },
      ]} onChange={(v) => onChange('layout', v)} />
      <SelectField label="Colunas" value={String((config.columns as number) || 3)} options={[
        { label: '1', value: '1' }, { label: '2', value: '2' }, { label: '3', value: '3' }, { label: '4', value: '4' },
      ]} onChange={(v) => onChange('columns', Number(v))} />
      <SelectField label="Quantidade" value={String((config.count as number) || 6)} options={[
        { label: '3', value: '3' }, { label: '6', value: '6' }, { label: '9', value: '9' }, { label: '12', value: '12' },
      ]} onChange={(v) => onChange('count', Number(v))} />
      <CheckboxField label="Mostrar imagens" checked={!!config.showImages} onChange={(v) => onChange('showImages', v)} id="af-images" />
      <CheckboxField label="Mostrar resumos" checked={!!config.showSummaries} onChange={(v) => onChange('showSummaries', v)} id="af-summaries" />
    </>
  );
}
