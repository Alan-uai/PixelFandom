'use client';

import { useEffect, useState, useCallback } from 'react';
import { Flag, AlertTriangle, Loader2, ShieldCheck, ShieldX, CheckCircle2, XCircle, EyeOff, Mail, Trash2 } from 'lucide-react';
import { useAdmin } from '@/hooks/use-admin';
import { WIKI_REPORT_REASONS, WIKI_REPORT_AUTO_RESTRICT_THRESHOLD } from '@/lib/wiki-reports';

interface ReportSummary {
  tenant_id: string;
  name: string;
  slug: string;
  status: string;
  total_reports: number;
  pending_reports: number;
  distinct_reporters: number;
  urgent: boolean;
  latest_reason: string;
  latest_at: string;
}

interface ReportItem {
  id: string;
  reason: string;
  description: string | null;
  status: string;
  created_at: string;
  reporter_id: string;
}

const REASON_LABEL: Record<string, string> = Object.fromEntries(
  WIKI_REPORT_REASONS.map((r) => [r.value, r.label])
);

const STATUS_LABEL: Record<string, string> = {
  pending: 'Pendente',
  reviewing: 'Em análise',
  resolved: 'Resolvida',
  rejected: 'Rejeitada',
  dismissed: 'Arquivada',
};

export default function AdminReportsPage() {
  const { isAdmin, isLoading: adminLoading } = useAdmin();
  const [items, setItems] = useState<ReportSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<string | null>(null);
  const [detail, setDetail] = useState<{ tenant: any; reports: ReportItem[]; distinct_reporters: number } | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [busy, setBusy] = useState(false);

  const [reportModal, setReportModal] = useState(false);
  const [deleteModal, setDeleteModal] = useState(false);
  const [fine, setFine] = useState('');
  const [offlineDuration, setOfflineDuration] = useState('');
  const [message, setMessage] = useState('');
  const [evidence, setEvidence] = useState('');
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (t: string) => {
    setToast(t);
    setTimeout(() => setToast(null), 4000);
  };

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch('/api/admin/reports');
    const data = await res.json();
    setItems(data.items || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (isAdmin) load();
  }, [isAdmin, load]);

  async function openDetail(tenantId: string) {
    setSelected(tenantId);
    setDetailLoading(true);
    setDetail(null);
    const res = await fetch(`/api/admin/reports/${tenantId}`);
    const data = await res.json();
    setDetail(data);
    setDetailLoading(false);
  }

  async function decide(reportId: string, decision: string) {
    if (!selected || busy) return;
    setBusy(true);
    await fetch(`/api/admin/reports/${selected}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reportId, decision }),
    });
    setBusy(false);
    await openDetail(selected);
    await load();
  }

  async function setRestriction(tenantId: string, restriction: 'lift' | 'keep') {
    if (busy) return;
    setBusy(true);
    await fetch(`/api/admin/reports/${tenantId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ restriction }),
    });
    setBusy(false);
    await openDetail(tenantId);
    await load();
  }

  async function sendReportEmail() {
    if (!selected || busy) return;
    setBusy(true);
    const res = await fetch(`/api/admin/reports/${selected}/notify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'report', fine, offlineDuration, message }),
    });
    const data = await res.json();
    setBusy(false);
    setReportModal(false);
    setFine(''); setOfflineDuration(''); setMessage('');
    showToast(data.sent ? 'E-mail enviado ao dono da Wiki.' : 'E-mail registrado (sem SMTP configurado).');
  }

  async function deleteWiki() {
    if (!selected || !detail || busy) return;
    setBusy(true);
    const res = await fetch(`/api/admin/reports/${selected}/notify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'delete', evidence, message }),
    });
    const data = await res.json();
    if (res.ok && detail.tenant?.slug) {
      await fetch('/api/tenants/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug: detail.tenant.slug }),
      });
    }
    setBusy(false);
    setDeleteModal(false);
    setEvidence(''); setMessage('');
    setSelected(null);
    showToast(data.sent ? 'E-mail enviado e Wiki excluída.' : 'Notificação registrada e Wiki excluída.');
    await load();
  }

  if (adminLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
        <ShieldX className="h-12 w-12 text-red-500 mb-3" />
        <h1 className="text-xl font-bold">Acesso Negado</h1>
        <p className="text-muted-foreground mt-2">Apenas administradores do site podem acessar esta página.</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold">
          <Flag className="h-6 w-6 text-amber-500" />
          Denúncias de Wikis (Admin do Site)
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Painel global de moderação. Wikis com mais de {WIKI_REPORT_AUTO_RESTRICT_THRESHOLD} denunciantes diferentes são restritas automaticamente e marcadas como urgentes.
        </p>
      </div>

      {toast && (
        <div className="fixed bottom-4 right-4 z-[200] rounded-lg border bg-card px-4 py-2 text-sm shadow-lg">
          {toast}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-xl border bg-card p-10 text-center text-muted-foreground">
          Nenhuma denúncia registrada.
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((it) => (
            <button
              key={it.tenant_id}
              onClick={() => openDetail(it.tenant_id)}
              className="w-full text-left rounded-xl border bg-card p-4 hover:border-primary/40 transition-colors"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold truncate">{it.name}</span>
                    {it.urgent && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-red-500/15 px-2 py-0.5 text-xs font-medium text-red-400">
                        <AlertTriangle className="h-3 w-3" /> Urgente
                      </span>
                    )}
                    {it.status === 'restricted_review' && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2 py-0.5 text-xs font-medium text-amber-400">
                        Restrita
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground truncate">/{it.slug}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-lg font-bold">{it.distinct_reporters}</p>
                  <p className="text-[10px] uppercase tracking-wide text-muted-foreground">denunciantes</p>
                </div>
              </div>
              <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
                <span>{it.total_reports} denúncias</span>
                <span>·</span>
                <span>{it.pending_reports} pendentes</span>
                <span>·</span>
                <span>última: {REASON_LABEL[it.latest_reason] || it.latest_reason}</span>
              </div>
            </button>
          ))}
        </div>
      )}

      {selected && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4" onClick={() => setSelected(null)}>
          <div className="w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-xl border bg-card p-5" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Avaliação de denúncias</h2>
              <button onClick={() => setSelected(null)} className="rounded-md p-1 text-muted-foreground hover:bg-muted">
                <XCircle className="h-5 w-5" />
              </button>
            </div>

            {detailLoading || !detail ? (
              <div className="flex justify-center py-10">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-2 text-sm">
                  <span className="font-medium">{detail.tenant.name}</span>
                  <span className="text-muted-foreground">· {detail.distinct_reporters} denunciantes diferentes</span>
                  {detail.tenant.status === 'restricted_review' ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2 py-0.5 text-xs font-medium text-amber-400">
                      <ShieldX className="h-3 w-3" /> Restrita p/ análise
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs font-medium text-emerald-400">
                      <ShieldCheck className="h-3 w-3" /> Ativa
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap gap-2">
                  {detail.tenant.status === 'restricted_review' ? (
                    <button
                      disabled={busy}
                      onClick={() => setRestriction(detail.tenant.id, 'lift')}
                      className="inline-flex items-center gap-1.5 rounded-md bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-60"
                    >
                      <ShieldCheck className="h-4 w-4" /> Levantar restrição
                    </button>
                  ) : (
                    <button
                      disabled={busy}
                      onClick={() => setRestriction(detail.tenant.id, 'keep')}
                      className="inline-flex items-center gap-1.5 rounded-md bg-amber-500 px-3 py-1.5 text-sm font-medium text-black disabled:opacity-60"
                    >
                      <EyeOff className="h-4 w-4" /> Restringir manualmente
                    </button>
                  )}

                  <button
                    disabled={busy}
                    onClick={() => setReportModal(true)}
                    className="inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm font-medium text-muted-foreground hover:text-foreground disabled:opacity-60"
                  >
                    <Mail className="h-4 w-4" /> Enviar report ao dono
                  </button>

                  <button
                    disabled={busy}
                    onClick={() => setDeleteModal(true)}
                    className="inline-flex items-center gap-1.5 rounded-md bg-red-600 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-60"
                  >
                    <Trash2 className="h-4 w-4" /> Excluir Wiki
                  </button>
                </div>

                <div className="space-y-2">
                  {detail.reports.length === 0 && (
                    <p className="text-sm text-muted-foreground">Sem denúncias detalhadas.</p>
                  )}
                  {detail.reports.map((r) => (
                    <div key={r.id} className="rounded-lg border p-3 text-sm">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-medium">{REASON_LABEL[r.reason] || r.reason}</span>
                        <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] uppercase text-muted-foreground">
                          {STATUS_LABEL[r.status] || r.status}
                        </span>
                      </div>
                      {r.description && (
                        <p className="mt-1 text-xs text-muted-foreground whitespace-pre-wrap">{r.description}</p>
                      )}
                      <p className="mt-1 text-[10px] text-muted-foreground">
                        {new Date(r.created_at).toLocaleString('pt-BR')}
                      </p>
                      {r.status === 'pending' && (
                        <div className="mt-2 flex gap-2">
                          <button
                            disabled={busy}
                            onClick={() => decide(r.id, 'resolved')}
                            className="inline-flex items-center gap-1 rounded-md bg-emerald-600 px-2 py-1 text-xs font-medium text-white disabled:opacity-60"
                          >
                            <CheckCircle2 className="h-3.5 w-3.5" /> Resolver
                          </button>
                          <button
                            disabled={busy}
                            onClick={() => decide(r.id, 'rejected')}
                            className="inline-flex items-center gap-1 rounded-md bg-red-600 px-2 py-1 text-xs font-medium text-white disabled:opacity-60"
                          >
                            <XCircle className="h-3.5 w-3.5" /> Rejeitar
                          </button>
                          <button
                            disabled={busy}
                            onClick={() => decide(r.id, 'dismissed')}
                            className="inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs font-medium text-muted-foreground disabled:opacity-60"
                          >
                            Arquivar
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {reportModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 p-4" onClick={() => setReportModal(false)}>
          <div className="w-full max-w-md rounded-xl border bg-card p-5 space-y-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="flex items-center gap-2 font-semibold">
              <Mail className="h-4 w-4 text-primary" /> Enviar report ao dono
            </h3>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Multa (se cabível)</label>
              <input value={fine} onChange={(e) => setFine(e.target.value)} placeholder="Ex: R$ 500,00" className="w-full rounded-md border bg-background px-3 py-1.5 text-sm outline-none focus:border-primary" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Tempo de Wiki fora do ar (se cabível)</label>
              <input value={offlineDuration} onChange={(e) => setOfflineDuration(e.target.value)} placeholder="Ex: 7 dias" className="w-full rounded-md border bg-background px-3 py-1.5 text-sm outline-none focus:border-primary" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Mensagem</label>
              <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={3} className="w-full resize-none rounded-md border bg-background px-3 py-2 text-sm outline-none focus:border-primary" placeholder="Informações adicionais ao dono…" />
            </div>
            <div className="flex gap-2">
              <button onClick={() => setReportModal(false)} className="flex-1 rounded-md border px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted">Cancelar</button>
              <button onClick={sendReportEmail} disabled={busy} className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground disabled:opacity-60">
                {busy && <Loader2 className="h-4 w-4 animate-spin" />} Enviar
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 p-4" onClick={() => setDeleteModal(false)}>
          <div className="w-full max-w-md rounded-xl border border-red-500/30 bg-card p-5 space-y-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="flex items-center gap-2 font-semibold text-red-500">
              <Trash2 className="h-4 w-4" /> Excluir Wiki
            </h3>
            <p className="text-xs text-muted-foreground">
              Esta ação enviará um e-mail ao dono explicando a exclusão e, em seguida, removerá a Wiki permanentemente. Não há reversão de acordos.
            </p>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Motivo / Provas / Quebra de contrato</label>
              <textarea value={evidence} onChange={(e) => setEvidence(e.target.value)} rows={4} className="w-full resize-none rounded-md border bg-background px-3 py-2 text-sm outline-none focus:border-primary" placeholder="Descreva as provas e a quebra de políticas/contrato…" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Observações (opcional)</label>
              <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={2} className="w-full resize-none rounded-md border bg-background px-3 py-2 text-sm outline-none focus:border-primary" />
            </div>
            <div className="flex gap-2">
              <button onClick={() => setDeleteModal(false)} className="flex-1 rounded-md border px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted">Cancelar</button>
              <button onClick={deleteWiki} disabled={busy} className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-md bg-red-600 px-3 py-2 text-sm font-medium text-white disabled:opacity-60">
                {busy && <Loader2 className="h-4 w-4 animate-spin" />} Excluir e notificar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
