'use client';

import { useState } from 'react';
import { Flag, X, Loader2, CheckCircle2, AlertTriangle } from 'lucide-react';
import { WIKI_REPORT_REASONS } from '@/lib/wiki-reports';

type Variant = 'icon' | 'button';

interface ReportWikiButtonProps {
  tenantId: string;
  tenantName?: string;
  variant?: Variant;
  className?: string;
  color?: string;
  label?: string;
}

export function ReportWikiButton({
  tenantId,
  tenantName,
  variant = 'button',
  className = '',
  color,
  label = 'Denunciar',
}: ReportWikiButtonProps) {
  const [open, setOpen] = useState(false);

  const triggerStyle =
    variant === 'icon'
      ? `rounded-md p-2 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors ${className}`
      : `inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors ${className}`;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={triggerStyle}
        title="Denunciar esta Wiki"
        aria-label="Denunciar esta Wiki"
      >
        <Flag className="h-4 w-4" style={color ? { color } : undefined} />
        {variant === 'button' && <span>{label}</span>}
      </button>

      {open && (
        <ReportWikiModal
          tenantId={tenantId}
          tenantName={tenantName}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}

interface ReportWikiModalProps {
  tenantId: string;
  tenantName?: string;
  onClose: () => void;
}

function ReportWikiModal({ tenantId, tenantName, onClose }: ReportWikiModalProps) {
  const [reason, setReason] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<{ restricted: boolean } | null>(null);

  async function handleSubmit() {
    if (!reason) {
      setError('Selecione um motivo.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/tenants/${tenantId}/report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason, description }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Não foi possível enviar a denúncia.');
        return;
      }
      setDone({ restricted: data.restricted });
    } catch {
      setError('Erro de conexão. Tente novamente.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div
        className="w-full max-w-md rounded-xl border bg-card p-5 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-base font-semibold">
            <Flag className="h-4 w-4 text-amber-500" />
            Denunciar Wiki
          </h2>
          <button onClick={onClose} className="rounded-md p-1 text-muted-foreground hover:bg-muted">
            <X className="h-4 w-4" />
          </button>
        </div>

        {done ? (
          <div className="space-y-3 py-2 text-center">
            <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-500" />
            <p className="text-sm text-muted-foreground">
              Denúncia enviada. Nossa equipe e o sistema vão analisar.
            </p>
            {done.restricted && (
              <p className="flex items-center justify-center gap-1.5 text-xs font-medium text-amber-500">
                <AlertTriangle className="h-3.5 w-3.5" />
                Esta Wiki foi restrita automaticamente para análise de denúncias.
              </p>
            )}
            <button
              onClick={onClose}
              className="mt-2 w-full rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground"
            >
              Fechar
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {tenantName && (
              <p className="text-xs text-muted-foreground">
                Você está denunciando <span className="font-medium text-foreground">{tenantName}</span>.
              </p>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Motivo</label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
              >
                <option value="">Selecione um motivo…</option>
                {WIKI_REPORT_REASONS.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                Detalhes (opcional)
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                maxLength={2000}
                placeholder="Descreva o problema com mais detalhes…"
                className="w-full resize-none rounded-md border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
              />
            </div>

            {error && <p className="text-xs text-red-500">{error}</p>}

            <div className="flex gap-2">
              <button
                onClick={onClose}
                className="flex-1 rounded-md border px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted"
              >
                Cancelar
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-md bg-amber-500 px-3 py-2 text-sm font-medium text-black disabled:opacity-60"
              >
                {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                Enviar denúncia
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
