'use client';

import { useState, useEffect } from 'react';
import { X, Search, Download, FileText, Layout as LayoutIcon, Trash2 } from 'lucide-react';
import type { BlockConfig } from './types';
import { BUILT_IN_TEMPLATES, type BuiltInTemplate } from '@/data/built-in-templates';

interface Template {
  id: string;
  name: string;
  category: string;
  blocks: BlockConfig[];
  thumbnail?: string;
  builtIn?: boolean;
}

interface TemplateLibraryProps {
  tenantId: string;
  onApply: (blocks: BlockConfig[]) => void;
  onClose: () => void;
}

export function TemplateLibrary({ tenantId, onApply, onClose }: TemplateLibraryProps) {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<string | null>(null);
  const [savedTemplates, setSavedTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/api/tenants/${tenantId}/templates`);
        if (res.ok) {
          const data = await res.json();
          setSavedTemplates((data.templates || []).map((t: any) => ({ ...t, builtIn: false })));
        }
      } catch (e) {
        console.error('Failed to load templates:', e);
      }
      setLoading(false);
    })();
  }, [tenantId]);

  const builtIn: Template[] = BUILT_IN_TEMPLATES.map((t: BuiltInTemplate) => ({
    id: t.id,
    name: t.name,
    category: t.category,
    blocks: t.blocks,
    builtIn: true,
  }));

  const allTemplates = [...builtIn, ...savedTemplates];

  const categories = Array.from(new Set(allTemplates.map((t) => t.category)));

  const filtered = allTemplates.filter((t) => {
    if (search && !t.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (category && t.category !== category) return false;
    return true;
  });

  const handleApply = (template: Template) => {
    onApply(template.blocks);
    onClose();
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/tenants/${tenantId}/templates`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      if (res.ok) {
        setSavedTemplates((prev) => prev.filter((t) => t.id !== id));
      }
    } catch (e) {
      console.error('Failed to delete template:', e);
    }
  };

  const catCounts = categories.map((cat) => ({
    cat,
    count: allTemplates.filter((t) => t.category === cat).length,
  }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative w-full max-w-3xl max-h-[80vh] bg-background rounded-xl border shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b shrink-0">
          <h2 className="text-sm font-medium">Biblioteca de Templates</h2>
          <button onClick={onClose} className="rounded-md p-1 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Search + Filters */}
        <div className="p-4 border-b shrink-0 space-y-3">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Buscar templates..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-md border bg-background pl-8 pr-3 py-2 text-sm outline-none focus:border-primary"
            />
          </div>
          <div className="flex gap-1.5">
            <button
              onClick={() => setCategory(null)}
              className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${!category ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:text-foreground'}`}
            >
              Todos ({allTemplates.length})
            </button>
            {catCounts.map(({ cat, count }) => (
              <button
                key={cat}
                onClick={() => setCategory(category === cat ? null : cat)}
                className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors capitalize ${category === cat ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:text-foreground'}`}
              >
                {cat} ({count})
              </button>
            ))}
          </div>
        </div>

        {/* Grid */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Nenhum template encontrado</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {filtered.map((template) => (
                <div
                  key={template.id}
                  className="group rounded-lg border bg-card hover:border-primary/50 transition-colors cursor-pointer overflow-hidden"
                >
                  <div className="aspect-video bg-muted/50 flex items-center justify-center" onClick={() => handleApply(template)}>
                    <LayoutIcon className="h-8 w-8 text-muted-foreground/50" />
                  </div>
                  <div className="p-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium truncate">{template.name}</p>
                        <p className="text-[10px] text-muted-foreground capitalize mt-0.5">{template.category} • {template.blocks.length} blocos</p>
                      </div>
                      <div className="flex items-center gap-1 ml-2">
                        <button
                          onClick={() => handleApply(template)}
                          className="rounded p-1 text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                          title="Aplicar template"
                        >
                          <Download className="h-3.5 w-3.5" />
                        </button>
                        {!template.builtIn && (
                          <button
                            onClick={() => handleDelete(template.id)}
                            className="rounded p-1 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                            title="Excluir"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
