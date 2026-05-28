'use client';

import { useState, useCallback } from 'react';
import { nanoid } from 'nanoid';
import { Plus, Trash2, ChevronDown, ChevronUp, Timer, Video, Table2, List } from 'lucide-react';
import type { FloatingIslandConfig, FloatingIslandType, FloatingIslandPosition } from './types';

const ISLAND_TYPES: { type: FloatingIslandType; label: string; icon: React.ComponentType<{ className?: string }>; defaultConfig: Record<string, unknown> }[] = [
  { type: 'raid-timer', label: 'Timer Raid', icon: Timer, defaultConfig: { targetDate: '', label: 'Próximo Raid', raidName: '' } },
  { type: 'video-list', label: 'Lista de Vídeos', icon: Video, defaultConfig: { items: [] } },
  { type: 'category-table', label: 'Tabela Categorias', icon: Table2, defaultConfig: { headers: ['#', 'Item'], rows: [] } },
  { type: 'wiki-list', label: 'Lista Wiki', icon: List, defaultConfig: { items: [] } },
];

const POSITIONS: { value: FloatingIslandPosition; label: string }[] = [
  { value: 'left', label: 'Esquerda' },
  { value: 'center', label: 'Centro' },
  { value: 'right', label: 'Direita' },
];

interface FloatingIslandsEditorProps {
  islands: FloatingIslandConfig[];
  onChange: (islands: FloatingIslandConfig[]) => void;
}

export function FloatingIslandsEditor({ islands, onChange }: FloatingIslandsEditorProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const addIsland = useCallback(() => {
    if (islands.length >= 3) return;
    const usedPositions = new Set(islands.map((i) => i.position));
    const avail = POSITIONS.find((p) => !usedPositions.has(p.value));
    if (!avail) return;
    const newIsland: FloatingIslandConfig = {
      id: nanoid(),
      position: avail.value,
      type: 'raid-timer',
      title: 'Nova Ilha',
      enabled: true,
      config: { targetDate: '', label: 'Próximo Raid', raidName: '' },
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
      updateIsland(id, { [key]: value });
      if (key === 'type') {
        const def = ISLAND_TYPES.find((t) => t.type === value);
        updateConfig(id, def ? { ...def.defaultConfig } : {});
      }
    } else {
      updateConfig(id, { ...island.config, [key]: value });
    }
  };

  const usedPositions = new Set(islands.map((i) => i.position));

  return (
    <div className="space-y-4">
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
                <button
                  onClick={(e) => { e.stopPropagation(); removeIsland(island.id); }}
                  className="rounded-md p-1 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
                {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
              </button>

              {isExpanded && (
                <div className="border-t border-border/50 px-3 py-3 space-y-3">
                  {/* Title */}
                  <Field label="Título">
                    <input
                      type="text"
                      value={island.title}
                      onChange={(e) => handleFieldChange(island.id, 'title', e.target.value)}
                      className="w-full rounded-md border bg-background px-2 py-1.5 text-xs"
                      placeholder="Nome da ilha"
                    />
                  </Field>

                  {/* Position */}
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

                  {/* Type */}
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

                  {/* Enabled */}
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

                  {/* Type-specific config */}
                  <div className="border-t border-border/30 pt-3">
                    <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-2">
                      Configuração
                    </p>
                    <ConfigFields island={island} onChange={handleFieldChange} />
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

function ConfigFields({
  island,
  onChange,
}: {
  island: FloatingIslandConfig;
  onChange: (id: string, key: string, value: unknown) => void;
}) {
  const id = island.id;

  switch (island.type) {
    case 'raid-timer':
      return (
        <div className="space-y-2">
          <Field label="Nome do Raid">
            <input
              type="text"
              value={(island.config.raidName as string) || ''}
              onChange={(e) => onChange(id, 'raidName', e.target.value)}
              className="w-full rounded-md border bg-background px-2 py-1.5 text-xs"
              placeholder="Ex: Lord of the Dead"
            />
          </Field>
          <Field label="Label">
            <input
              type="text"
              value={(island.config.label as string) || ''}
              onChange={(e) => onChange(id, 'label', e.target.value)}
              className="w-full rounded-md border bg-background px-2 py-1.5 text-xs"
              placeholder="Ex: Próximo Raid"
            />
          </Field>
          <Field label="Data Alvo">
            <input
              type="datetime-local"
              value={(island.config.targetDate as string) || ''}
              onChange={(e) => onChange(id, 'targetDate', e.target.value)}
              className="w-full rounded-md border bg-background px-2 py-1.5 text-xs"
            />
          </Field>
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
}: {
  items: any[];
  fields?: { key: string; label: string; placeholder: string }[];
  simple?: boolean;
  onChange: (items: any[]) => void;
  emptyLabel: string;
  addLabel: string;
}) {
  const addItem = () => {
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
                    type="text"
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
      <button
        onClick={addItem}
        className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors"
      >
        <Plus className="h-3 w-3" />
        {addLabel}
      </button>
    </div>
  );
}
