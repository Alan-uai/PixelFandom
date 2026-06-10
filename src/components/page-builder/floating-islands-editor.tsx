'use client';

import { useState, useCallback } from 'react';
import { nanoid } from 'nanoid';
import { motion } from 'framer-motion';
import { Plus, Trash2, ChevronDown, ChevronUp, Clock, Timer, Video, Table2, List, Image as ImageIcon, ListOrdered } from 'lucide-react';
import type { FloatingIslandConfig, FloatingIslandType, FloatingIslandPosition, IslandMedia, SlotFlowId, ClipStyleId } from './types';
import { SLOT_FLOWS } from '@/lib/floating-island-flows';
import { CLIP_STYLES } from '@/lib/floating-island-clips';

const ISLAND_TYPES: { type: FloatingIslandType; label: string; icon: React.ComponentType<{ className?: string }>; defaultConfig: Record<string, unknown> }[] = [
  {
    type: 'multi-timer',
    label: 'Cronômetro Múltiplo',
    icon: Clock,
    defaultConfig: {
      events: [{ name: 'Evento', targetDate: '', displayDuration: 10 }],
      displayFormat: 'parallel',
      media: null,
      cronFirst: false,
    },
  },
  {
    type: 'queue-timer',
    label: 'Cronômetro Sequencial',
    icon: Timer,
    defaultConfig: {
      items: [{ name: 'Item', time: '14:00' }],
      displayFormat: 'sequential',
      media: null,
      cronFirst: false,
    },
  },
  { type: 'video-list', label: 'Lista de Vídeos', icon: Video, defaultConfig: { items: [] } },
  { type: 'category-table', label: 'Tabela Categorias', icon: Table2, defaultConfig: { headers: ['#', 'Item'], rows: [] } },
  { type: 'wiki-list', label: 'Lista Wiki', icon: List, defaultConfig: { items: [] } },
  {
    type: 'carousel',
    label: 'Carrossel',
    icon: ImageIcon,
    defaultConfig: {
      direction: 'horizontal',
      autoPlay: false,
      interval: 5,
      items: [{ imageUrl: '', text: '', link: '' }],
    },
  },
  {
    type: 'list',
    label: 'Lista',
    icon: ListOrdered,
    defaultConfig: {
      style: 'standard',
      bulletIcon: '•',
      items: [{ text: '', link: '' }],
    },
  },
];

const POSITIONS: { value: FloatingIslandPosition; label: string }[] = [
  { value: 'left', label: 'Esquerda' },
  { value: 'center', label: 'Centro' },
  { value: 'right', label: 'Direita' },
];

const MEDIA_TYPES: { value: IslandMedia['type']; label: string }[] = [
  { value: 'image', label: 'Imagem' },
  { value: 'gif', label: 'GIF' },
  { value: 'video', label: 'Vídeo' },
  { value: 'link', label: 'Link' },
];

interface FloatingIslandsEditorProps {
  islands: FloatingIslandConfig[];
  onChange: (islands: FloatingIslandConfig[]) => void;
  slotFlow: SlotFlowId;
  clipStyle: ClipStyleId;
  onSlotFlowChange: (id: SlotFlowId) => void;
  onClipStyleChange: (id: ClipStyleId) => void;
}

export function FloatingIslandsEditor({ islands, onChange, slotFlow, clipStyle, onSlotFlowChange, onClipStyleChange }: FloatingIslandsEditorProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const POSITION_PRIORITY: FloatingIslandPosition[] = ['center', 'left', 'right'];

  const addIsland = useCallback(() => {
    if (islands.length >= 3) return;
    const usedPositions = new Set(islands.map((i) => i.position));
    const avail = POSITION_PRIORITY.find((p) => !usedPositions.has(p));
    if (!avail) return;
    const def = ISLAND_TYPES[0];
    const newIsland: FloatingIslandConfig = {
      id: nanoid(),
      position: avail,
      type: def.type,
      title: 'Nova Ilha',
      enabled: true,
      config: { ...def.defaultConfig },
    };
    onChange([...islands, newIsland]);
    setExpandedId(newIsland.id);
  }, [islands, onChange]);

  const updateIsland = useCallback((id: string, patch: Partial<FloatingIslandConfig>) => {
    onChange(islands.map((i) => (i.id === id ? { ...i, ...patch } : i)));
  }, [islands, onChange]);

  const updateConfig = useCallback((id: string, config: Record<string, unknown>) => {
    onChange(islands.map((i) => (i.id === id ? { ...i, config } : i)));
  }, [islands, onChange]);

  const removeIsland = useCallback((id: string) => {
    onChange(islands.filter((i) => i.id !== id));
    if (expandedId === id) setExpandedId(null);
  }, [islands, onChange, expandedId]);

  const handleFieldChange = (id: string, key: string, value: unknown) => {
    const island = islands.find((i) => i.id === id);
    if (!island) return;
    if (key === 'position' || key === 'type' || key === 'title' || key === 'enabled') {
      if (key === 'type') {
        const def = ISLAND_TYPES.find((t) => t.type === value);
        onChange(islands.map((i) =>
          i.id === id
            ? { ...i, type: value as FloatingIslandType, config: def ? { ...def.defaultConfig } : {} }
            : i
        ));
      } else {
        onChange(islands.map((i) => (i.id === id ? { ...i, [key]: value } : i)));
      }
    } else {
      onChange(islands.map((i) => (i.id === id ? { ...i, config: { ...i.config, [key]: value } } : i)));
    }
  };

  const handleMediaChange = (id: string, media: IslandMedia | null) => {
    const island = islands.find((i) => i.id === id);
    if (!island) return;
    updateConfig(id, { ...island.config, media });
  };

  const usedPositions = new Set(islands.map((i) => i.position));

  const flowDef = SLOT_FLOWS.find((f) => f.id === slotFlow) || SLOT_FLOWS[0];

  const previewSlots = flowDef.getSlots(islands.length || 1);

  return (
    <div className="space-y-4">
      {/* Slot Flow + Clip Style selectors */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Fluxo de Slots</label>
          <select
            value={slotFlow}
            onChange={(e) => onSlotFlowChange(e.target.value as SlotFlowId)}
            className="w-full rounded-md border bg-background px-2 py-1.5 text-xs"
          >
            {SLOT_FLOWS.map((f) => (
              <option key={f.id} value={f.id}>{f.label}</option>
            ))}
          </select>
          <p className="text-[10px] text-muted-foreground">{flowDef.description}</p>
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Formato Visual</label>
          <select
            value={clipStyle}
            onChange={(e) => onClipStyleChange(e.target.value as ClipStyleId)}
            className="w-full rounded-md border bg-background px-2 py-1.5 text-xs"
          >
            {CLIP_STYLES.map((c) => (
              <option key={c.id} value={c.id}>{c.label}</option>
            ))}
          </select>
          <p className="text-[10px] text-muted-foreground">
            {CLIP_STYLES.find((c) => c.id === clipStyle)?.description}
          </p>
        </div>
      </div>

      {/* Animated preview */}
      <div className="rounded-lg border bg-muted/20 p-3">
        <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-2">Pré-visualização</p>
        <div className="flex items-stretch gap-1 h-12">
          {(['left', 'center', 'right'] as const).map((pos) => {
            const filled = previewSlots.includes(pos);
            return (
              <motion.div
                key={pos}
                layout
                animate={{
                  flex: filled ? 1 : 0.3,
                  opacity: filled ? 1 : 0.3,
                }}
                transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                className={`rounded flex items-center justify-center text-[10px] font-medium ${
                  filled
                    ? 'bg-primary/20 text-primary border border-primary/30'
                    : 'bg-muted text-muted-foreground/40 border border-dashed border-muted-foreground/20'
                }`}
              >
                {filled && (pos === 'left' ? 'L' : pos === 'center' ? 'C' : 'R')}
              </motion.div>
            );
          })}
        </div>
        <div className="flex items-center justify-center gap-4 mt-2">
          {[1, 2, 3].map((n) => {
            const slots = flowDef.getSlots(n);
            return (
              <div key={n} className="flex items-center gap-0.5">
                <span className="text-[9px] text-muted-foreground">{n}:</span>
                {(['left', 'center', 'right'] as const).map((p) => (
                  <span
                    key={p}
                    className={`inline-block w-2 h-2 rounded-sm ${
                      slots.includes(p) ? 'bg-primary' : 'bg-muted-foreground/20'
                    }`}
                  />
                ))}
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Ilhas Flutuantes ({islands.length}/3)
        </p>
        <button
          onClick={addIsland}
          disabled={islands.length >= 3}
          className="flex items-center gap-1 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Plus className="h-3 w-3" />
          Adicionar
        </button>
      </div>

      {islands.length === 0 && (
        <div className="rounded-lg border-2 border-dashed border-muted-foreground/25 p-8 text-center">
          <p className="text-sm text-muted-foreground">
            Adicione até 3 ilhas flutuantes para exibir conteúdos especiais na sua wiki.
          </p>
        </div>
      )}

      <div className="space-y-3">
        {islands.map((island) => {
          const isExpanded = expandedId === island.id;
          const def = ISLAND_TYPES.find((t) => t.type === island.type);
          const Icon = def?.icon || List;

          return (
            <div key={island.id} className="rounded-lg border bg-card">
              <button
                onClick={() => setExpandedId(isExpanded ? null : island.id)}
                className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm font-medium hover:bg-muted/50 transition-colors rounded-t-lg"
              >
                <Icon className="h-4 w-4 text-primary shrink-0" />
                <span className="flex-1 truncate">{island.title || 'Sem título'}</span>
                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${
                  island.enabled ? 'bg-green-500/10 text-green-600' : 'bg-muted text-muted-foreground'
                }`}>
                  {island.enabled ? 'Ativo' : 'Inativo'}
                </span>
                <span
                  role="button"
                  tabIndex={0}
                  onClick={(e) => { e.stopPropagation(); removeIsland(island.id); }}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.stopPropagation(); removeIsland(island.id); } }}
                  className="rounded-md p-1 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </span>
                {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
              </button>

              {isExpanded && (
                <div className="border-t border-border/50 px-3 py-3 space-y-3">
                  <Field label="Título">
                    <input
                      type="text"
                      value={island.title}
                      onChange={(e) => handleFieldChange(island.id, 'title', e.target.value)}
                      className="w-full rounded-md border bg-background px-2 py-1.5 text-xs"
                      placeholder="Nome da ilha"
                    />
                  </Field>

                  <Field label="Posição">
                    <select
                      value={island.position}
                      onChange={(e) => handleFieldChange(island.id, 'position', e.target.value)}
                      className="w-full rounded-md border bg-background px-2 py-1.5 text-xs"
                    >
                      {POSITIONS.map((p) => (
                        <option key={p.value} value={p.value} disabled={p.value !== island.position && usedPositions.has(p.value)}>
                          {p.label} {p.value !== island.position && usedPositions.has(p.value) ? '(já em uso)' : ''}
                        </option>
                      ))}
                    </select>
                  </Field>

                  <Field label="Tipo">
                    <select
                      value={island.type}
                      onChange={(e) => handleFieldChange(island.id, 'type', e.target.value)}
                      className="w-full rounded-md border bg-background px-2 py-1.5 text-xs"
                    >
                      {ISLAND_TYPES.map((t) => (
                        <option key={t.type} value={t.type}>{t.label}</option>
                      ))}
                    </select>
                  </Field>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id={`enable-${island.id}`}
                      checked={island.enabled}
                      onChange={(e) => handleFieldChange(island.id, 'enabled', e.target.checked)}
                      className="rounded"
                    />
                    <label htmlFor={`enable-${island.id}`} className="text-xs text-muted-foreground">Ativo</label>
                  </div>

                  <Field label="Expirar em (opcional)">
                    <input
                      type="datetime-local"
                      value={island.endsAt ? island.endsAt.slice(0, 16) : ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        updateIsland(island.id, { endsAt: val ? new Date(val).toISOString() : null });
                      }}
                      className="w-full rounded-md border bg-background px-2 py-1.5 text-xs"
                    />
                  </Field>

                  <div className="border-t border-border/30 pt-3">
                    <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-2">
                      Configuração
                    </p>
                    <ConfigFields island={island} onChange={handleFieldChange} onMediaChange={handleMediaChange} />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <label className="text-xs text-muted-foreground">{label}</label>
      {children}
    </div>
  );
}

function MediaEditor({
  media,
  onChange,
}: {
  media: IslandMedia | null | undefined;
  onChange: (m: IslandMedia | null) => void;
}) {
  const enabled = !!media;

  return (
    <div className="space-y-2 rounded-lg border border-border/50 bg-muted/20 p-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-muted-foreground">Mídia do Evento</p>
        <button
          onClick={() => onChange(enabled ? null : { type: 'image', url: '', displayMode: 'on-trigger' })}
          className="text-xs text-primary hover:underline"
        >
          {enabled ? 'Remover' : 'Adicionar'}
        </button>
      </div>
      {enabled && media && (
        <div className="space-y-2">
          <Field label="Tipo">
            <select
              value={media.type}
              onChange={(e) => onChange({ ...media, type: e.target.value as IslandMedia['type'] })}
              className="w-full rounded-md border bg-background px-2 py-1.5 text-xs"
            >
              {MEDIA_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </Field>
          <Field label="URL">
            <input
              type="url"
              value={media.url}
              onChange={(e) => onChange({ ...media, url: e.target.value })}
              className="w-full rounded-md border bg-background px-2 py-1.5 text-xs"
              placeholder="https://..."
            />
          </Field>
          <Field label="Aparição">
            <select
              value={media.displayMode}
              onChange={(e) => onChange({ ...media, displayMode: e.target.value as 'always' | 'on-trigger' })}
              className="w-full rounded-md border bg-background px-2 py-1.5 text-xs"
            >
              <option value="on-trigger">Ao evento (dispara no horário)</option>
              <option value="always">Visível sempre</option>
            </select>
          </Field>
        </div>
      )}
    </div>
  );
}

function ConfigFields({
  island,
  onChange,
  onMediaChange,
}: {
  island: FloatingIslandConfig;
  onChange: (id: string, key: string, value: unknown) => void;
  onMediaChange: (id: string, media: IslandMedia | null) => void;
}) {
  const id = island.id;

  switch (island.type) {
    case 'multi-timer':
      return (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id={`cronFirst-${id}`}
              checked={!!island.config.cronFirst}
              onChange={(e) => onChange(id, 'cronFirst', e.target.checked)}
              className="rounded"
            />
            <label htmlFor={`cronFirst-${id}`} className="text-xs text-muted-foreground">
              Cron primeiro (timer no cabeçalho)
            </label>
          </div>
          <Field label="Formato de Exibição">
            <select
              value={(island.config.displayFormat as string) || 'parallel'}
              onChange={(e) => onChange(id, 'displayFormat', e.target.value)}
              className="w-full rounded-md border bg-background px-2 py-1.5 text-xs"
            >
              <option value="parallel">Paralelo (rotação)</option>
              <option value="carousel">Carrossel</option>
              <option value="list">Lista</option>
            </select>
          </Field>
          <ArrayEditor
            items={(island.config.events as any[]) || []}
            fields={[
              { key: 'name', label: 'Nome', placeholder: 'Ex: Evento Aniversário' },
              { key: 'targetDate', label: 'Data/Hora', type: 'datetime-local', placeholder: '' },
              { key: 'displayDuration', label: 'Duração (seg)', type: 'number', placeholder: '10' },
            ]}
            onChange={(items) => onChange(id, 'events', items)}
            emptyLabel="Nenhum evento"
            addLabel="Adicionar Evento"
            maxItems={5}
          />
          <MediaEditor
            media={(island.config.media as IslandMedia | null) || undefined}
            onChange={(m) => onMediaChange(id, m)}
          />
        </div>
      );

    case 'queue-timer':
      return (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id={`cronFirst-${id}`}
              checked={!!island.config.cronFirst}
              onChange={(e) => onChange(id, 'cronFirst', e.target.checked)}
              className="rounded"
            />
            <label htmlFor={`cronFirst-${id}`} className="text-xs text-muted-foreground">
              Cron primeiro (timer no cabeçalho)
            </label>
          </div>
          <Field label="Formato de Exibição">
            <select
              value={(island.config.displayFormat as string) || 'sequential'}
              onChange={(e) => onChange(id, 'displayFormat', e.target.value)}
              className="w-full rounded-md border bg-background px-2 py-1.5 text-xs"
            >
              <option value="sequential">Sequencial (próximo)</option>
              <option value="carousel">Carrossel</option>
              <option value="list">Lista</option>
            </select>
          </Field>
          <ArrayEditor
            items={(island.config.items as any[]) || []}
            fields={[
              { key: 'name', label: 'Nome', placeholder: 'Ex: Lord of the Dead' },
              { key: 'time', label: 'Horário', type: 'time', placeholder: '14:00' },
            ]}
            onChange={(items) => onChange(id, 'items', items)}
            emptyLabel="Nenhum item"
            addLabel="Adicionar Item"
          />
          <MediaEditor
            media={(island.config.media as IslandMedia | null) || undefined}
            onChange={(m) => onMediaChange(id, m)}
          />
        </div>
      );

    case 'video-list':
      return (
        <ArrayEditor
          items={(island.config.items as any[]) || []}
          fields={[
            { key: 'title', label: 'Título', placeholder: 'Título do vídeo' },
            { key: 'url', label: 'URL', placeholder: 'https://...' },
            { key: 'thumbnail', label: 'Thumbnail URL', placeholder: 'https://...' },
          ]}
          onChange={(items) => onChange(id, 'items', items)}
          emptyLabel="Nenhum vídeo"
          addLabel="Adicionar Vídeo"
        />
      );

    case 'category-table':
      return (
        <div className="space-y-3">
          <ArrayEditor
            items={(island.config.headers as string[]) || []}
            simple
            onChange={(headers) => onChange(id, 'headers', headers)}
            emptyLabel="Nenhum cabeçalho"
            addLabel="Adicionar Cabeçalho"
          />
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Linhas (JSON)</label>
            <textarea
              value={JSON.stringify((island.config.rows as string[][]) || [], null, 2)}
              onChange={(e) => {
                try { onChange(id, 'rows', JSON.parse(e.target.value)); } catch {}
              }}
              rows={4}
              className="w-full rounded-md border bg-background px-2 py-1.5 font-mono text-[10px] resize-none"
            />
          </div>
        </div>
      );

    case 'wiki-list':
      return (
        <ArrayEditor
          items={(island.config.items as any[]) || []}
          fields={[
            { key: 'label', label: 'Label', placeholder: 'Nome do link' },
            { key: 'slug', label: 'Slug', placeholder: 'nome-do-artigo' },
          ]}
          onChange={(items) => onChange(id, 'items', items)}
          emptyLabel="Nenhum link"
          addLabel="Adicionar Link"
        />
      );

    case 'carousel':
      return (
        <div className="space-y-3">
          <Field label="Direção">
            <select
              value={(island.config.direction as string) || 'horizontal'}
              onChange={(e) => onChange(id, 'direction', e.target.value)}
              className="w-full rounded-md border bg-background px-2 py-1.5 text-xs"
            >
              <option value="horizontal">Horizontal</option>
              <option value="vertical">Vertical</option>
            </select>
          </Field>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id={`autoplay-${id}`}
              checked={!!island.config.autoPlay}
              onChange={(e) => onChange(id, 'autoPlay', e.target.checked)}
              className="rounded"
            />
            <label htmlFor={`autoplay-${id}`} className="text-xs text-muted-foreground">Auto-play</label>
          </div>
          {(island.config.autoPlay as boolean) && (
            <Field label="Intervalo (segundos)">
              <input
                type="number"
                value={(island.config.interval as number) || 5}
                onChange={(e) => onChange(id, 'interval', Number(e.target.value))}
                min={1}
                className="w-full rounded-md border bg-background px-2 py-1.5 text-xs"
              />
            </Field>
          )}
          <ArrayEditor
            items={(island.config.items as any[]) || []}
            fields={[
              { key: 'imageUrl', label: 'Imagem URL', placeholder: 'https://...' },
              { key: 'videoUrl', label: 'Vídeo URL', placeholder: 'https://...' },
              { key: 'text', label: 'Texto', placeholder: 'Legenda ou descrição' },
              { key: 'link', label: 'Link', placeholder: 'https://...' },
            ]}
            onChange={(items) => onChange(id, 'items', items)}
            emptyLabel="Nenhum slide"
            addLabel="Adicionar Slide"
          />
        </div>
      );

    case 'list':
      return (
        <div className="space-y-3">
          <Field label="Estilo">
            <select
              value={(island.config.style as string) || 'standard'}
              onChange={(e) => onChange(id, 'style', e.target.value)}
              className="w-full rounded-md border bg-background px-2 py-1.5 text-xs"
            >
              <option value="standard">Padrão</option>
              <option value="numbered">Enumerada</option>
              <option value="topic">Tópico</option>
            </select>
          </Field>
          {(island.config.style as string) === 'topic' && (
            <Field label="Ícone do Tópico">
              <div className="flex gap-1.5 flex-wrap">
                {['•', '♦', '★', '♥', '×', '∆'].map((icon) => (
                  <button
                    key={icon}
                    onClick={() => onChange(id, 'bulletIcon', icon)}
                    className={`h-7 w-7 rounded-md border text-sm flex items-center justify-center transition-colors ${
                      (island.config.bulletIcon as string) === icon
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border text-muted-foreground hover:border-primary/50'
                    }`}
                  >
                    {icon}
                  </button>
                ))}
              </div>
            </Field>
          )}
          <ArrayEditor
            items={(island.config.items as any[]) || []}
            fields={[
              { key: 'text', label: 'Texto', placeholder: 'Texto do item' },
              { key: 'link', label: 'Link (opcional)', placeholder: 'https://...' },
            ]}
            onChange={(items) => onChange(id, 'items', items)}
            emptyLabel="Nenhum item"
            addLabel="Adicionar Item"
          />
        </div>
      );

    default:
      return null;
  }
}

function ArrayEditor({
  items,
  fields,
  simple,
  onChange,
  emptyLabel,
  addLabel,
  maxItems,
}: {
  items: any[];
  fields?: { key: string; label: string; type?: string; placeholder: string }[];
  simple?: boolean;
  onChange: (items: any[]) => void;
  emptyLabel: string;
  addLabel: string;
  maxItems?: number;
}) {
  const canAdd = maxItems ? items.length < maxItems : true;

  const addItem = () => {
    if (!canAdd) return;
    if (simple) {
      onChange([...items, '']);
    } else if (fields) {
      const obj: Record<string, string> = {};
      fields.forEach((f) => { obj[f.key] = ''; });
      onChange([...items, obj]);
    }
  };

  const updateItem = (index: number, key: string, value: string) => {
    const next = [...items];
    if (simple) {
      next[index] = value;
    } else {
      next[index] = { ...next[index], [key]: value };
    }
    onChange(next);
  };

  const removeItem = (index: number) => {
    onChange(items.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-2">
      {items.length === 0 && (
        <p className="text-xs text-muted-foreground">{emptyLabel}.</p>
      )}
      <div className="space-y-2 max-h-48 overflow-y-auto">
        {items.map((item, index) => (
          <div key={index} className="flex items-start gap-1.5">
            <div className="flex-1 space-y-1">
              {simple ? (
                <input
                  type="text"
                  value={item as string}
                  onChange={(e) => updateItem(index, '', e.target.value)}
                  className="w-full rounded-md border bg-background px-2 py-1.5 text-xs"
                />
              ) : fields ? (
                fields.map((f) => (
                  <input
                    key={f.key}
                    type={f.type || 'text'}
                    value={item[f.key] || ''}
                    onChange={(e) => updateItem(index, f.key, e.target.value)}
                    className="w-full rounded-md border bg-background px-2 py-1.5 text-xs"
                    placeholder={f.placeholder}
                  />
                ))
              ) : null}
            </div>
            <button
              onClick={() => removeItem(index)}
              className="rounded-md p-1 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors mt-0.5"
            >
              <Trash2 className="h-3 w-3" />
            </button>
          </div>
        ))}
      </div>
      {canAdd && (
        <button
          onClick={addItem}
          className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors"
        >
          <Plus className="h-3 w-3" />
          {addLabel} {maxItems ? `(${items.length}/${maxItems})` : ''}
        </button>
      )}
    </div>
  );
}
