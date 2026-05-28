'use client';

import { CheckCircle, XCircle, Loader2, FileText } from 'lucide-react';

interface ImportProgressProps {
  status: 'pending' | 'processing' | 'completed' | 'failed';
  totalCount: number;
  completedCount: number;
  failedCount: number;
  logs?: { article_title: string; status: string; error?: string }[];
}

export function ImportProgress({ status, totalCount, completedCount, failedCount, logs }: ImportProgressProps) {
  const percent = totalCount > 0 ? Math.round(((completedCount + failedCount) / totalCount) * 100) : 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium">
          {status === 'processing' && 'Importando...'}
          {status === 'completed' && 'Importação concluída!'}
          {status === 'failed' && 'Falha na importação'}
          {status === 'pending' && 'Aguardando...'}
        </span>
        <span className="text-muted-foreground">{percent}%</span>
      </div>

      <div className="h-2 rounded-full bg-muted overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${
            status === 'completed' ? 'bg-green-500' : status === 'failed' ? 'bg-destructive' : 'bg-primary'
          }`}
          style={{ width: `${percent}%` }}
        />
      </div>

      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <FileText className="h-3 w-3" /> {totalCount} total
        </span>
        <span className="flex items-center gap-1 text-green-500">
          <CheckCircle className="h-3 w-3" /> {completedCount} ok
        </span>
        {failedCount > 0 && (
          <span className="flex items-center gap-1 text-destructive">
            <XCircle className="h-3 w-3" /> {failedCount} erro
          </span>
        )}
      </div>

      {status === 'processing' && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Loader2 className="h-3 w-3 animate-spin" />
          Processando...
        </div>
      )}

      {logs && logs.length > 0 && (
        <div className="space-y-1 max-h-40 overflow-y-auto">
          {logs.map((log, i) => (
            <div key={i} className="flex items-center gap-2 text-xs py-1">
              {log.status === 'imported' ? (
                <CheckCircle className="h-3 w-3 text-green-500 shrink-0" />
              ) : log.status === 'error' ? (
                <XCircle className="h-3 w-3 text-destructive shrink-0" />
              ) : (
                <div className="h-3 w-3 shrink-0" />
              )}
              <span className="truncate">{log.article_title || '—'}</span>
              {log.error && <span className="text-destructive truncate">{log.error}</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
