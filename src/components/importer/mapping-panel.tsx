'use client';

import { useState } from 'react';
import { Tag, Check, FileText, Link2, History } from 'lucide-react';
import type { ImportArticle, MappingConfig } from '@/lib/importer/types';

interface MappingPanelProps {
  articles: ImportArticle[];
  detectedTags: string[];
  onConfirm: (config: MappingConfig) => void;
  onBack: () => void;
  loading: boolean;
}

export function MappingPanel({ articles, detectedTags, onConfirm, onBack, loading }: MappingPanelProps) {
  const [tagMappings, setTagMappings] = useState<Record<string, string>>(
    Object.fromEntries(detectedTags.map((t) => [t, t]))
  );
  const [defaultTags, setDefaultTags] = useState('');
  const [rewriteLinks, setRewriteLinks] = useState(true);
  const [preserveHistory, setPreserveHistory] = useState(true);
  const [createSummaries, setCreateSummaries] = useState(true);

  const handleConfirm = () => {
    onConfirm({
      tagMapping: tagMappings,
      defaultTags: defaultTags.split(',').map((t) => t.trim()).filter(Boolean),
      createSummaries,
      rewriteLinks,
      preserveHistory,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <FileText className="h-4 w-4" />
        <span>{articles.length} artigo{articles.length !== 1 ? 's' : ''} detectado{articles.length !== 1 ? 's' : ''}</span>
      </div>

      <div className="space-y-3 max-h-60 overflow-y-auto">
        {articles.map((article, i) => (
          <div key={i} className="rounded-lg border bg-card p-3 text-sm">
            <p className="font-medium truncate">{article.title}</p>
            <div className="flex flex-wrap gap-1 mt-1">
              {article.tags.map((tag) => (
                <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">{tag}</span>
              ))}
            </div>
            {article.summary && (
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{article.summary}</p>
            )}
          </div>
        ))}
      </div>

      {detectedTags.length > 0 && (
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm font-medium">
            <Tag className="h-4 w-4" /> Mapeamento de Tags
          </label>
          <p className="text-xs text-muted-foreground">Renomeie tags detectadas para tags existentes na sua wiki.</p>
          <div className="space-y-1.5">
            {detectedTags.map((tag) => (
              <div key={tag} className="flex items-center gap-2">
                <span className="text-xs w-28 truncate text-right">{tag}</span>
                <span className="text-muted-foreground">→</span>
                <input
                  value={tagMappings[tag] || tag}
                  onChange={(e) => setTagMappings((m) => ({ ...m, [tag]: e.target.value }))}
                  className="flex-1 rounded-md border bg-background px-2 py-1 text-xs"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-2">
        <label className="flex items-center gap-2 text-sm font-medium">
          <Tag className="h-4 w-4" /> Tags Padrão
        </label>
        <input
          value={defaultTags}
          onChange={(e) => setDefaultTags(e.target.value)}
          placeholder="importado, migrado, (separadas por vírgula)"
          className="w-full rounded-md border bg-background px-3 py-2 text-sm"
        />
      </div>

      <div className="space-y-3">
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={rewriteLinks} onChange={(e) => setRewriteLinks(e.target.checked)} className="rounded" />
          <span className="flex items-center gap-1.5 text-sm"><Link2 className="h-3.5 w-3.5" /> Reescrever links internos</span>
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={preserveHistory} onChange={(e) => setPreserveHistory(e.target.checked)} className="rounded" />
          <span className="flex items-center gap-1.5 text-sm"><History className="h-3.5 w-3.5" /> Preservar metadados de autor/data</span>
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={createSummaries} onChange={(e) => setCreateSummaries(e.target.checked)} className="rounded" />
          <span className="flex items-center gap-1.5 text-sm"><FileText className="h-3.5 w-3.5" /> Usar summaries dos metadados</span>
        </label>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="rounded-md border bg-card px-4 py-2 text-sm hover:bg-muted transition-colors"
        >
          Voltar
        </button>
        <button
          onClick={handleConfirm}
          disabled={loading}
          className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          {loading ? 'Importando...' : 'Confirmar Importação'}
          {loading ? null : <Check className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
}
