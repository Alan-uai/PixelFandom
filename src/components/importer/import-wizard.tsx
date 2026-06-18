'use client';

import { useState } from 'react';
import { FileUploader } from './file-uploader';
import { MappingPanel } from './mapping-panel';
import { ImportProgress } from './import-progress';
import type { ImportPreview, MappingConfig } from '@/lib/importer/types';

interface ImportWizardProps {
  tenantSlug: string;
}

type Step = 'upload' | 'mapping' | 'progress';

export function ImportWizard({ tenantSlug }: ImportWizardProps) {
  const [step, setStep] = useState<Step>('upload');
  const [uploading, setUploading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<{
    status: string;
    totalCount: number;
    completedCount: number;
    failedCount: number;
    logs: any[];
  } | null>(null);

  const handleFilesSelected = async (files: File[]) => {
    setError(null);
    setUploading(true);

    const formData = new FormData();
    formData.append('file', files[0]);

    try {
      const res = await fetch(`/api/import?__tenant_slug=${tenantSlug}`, {
        method: 'POST',
        body: formData,
        headers: { 'x-tenant-slug': tenantSlug },
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Falha ao processar arquivo');
        setUploading(false);
        return;
      }

      setPreview(data);
      setStep('mapping');
    } catch {
      setError('Erro de rede ao enviar arquivo');
    }
    setUploading(false);
  };

  const handleConfirmMapping = async (mapping: MappingConfig) => {
    if (!preview) return;
    setImporting(true);
    setError(null);
    setStep('progress');

    setProgress({
      status: 'processing',
      totalCount: preview.totalCount,
      completedCount: 0,
      failedCount: 0,
      logs: [],
    });

    try {
      const res = await fetch(`/api/import?__tenant_slug=${tenantSlug}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'x-tenant-slug': tenantSlug },
        body: JSON.stringify({
          articles: preview.articles,
          mapping,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Falha na importação');
        setProgress(null);
        setImporting(false);
        return;
      }

      if (data.jobId) {
        pollJob(data.jobId);
      } else {
        setProgress({
          status: data.status,
          totalCount: data.total,
          completedCount: data.completed,
          failedCount: data.failed,
          logs: [],
        });
        setImporting(false);
      }
    } catch {
      setError('Erro de rede ao confirmar importação');
      setImporting(false);
    }
  };

  const pollJob = async (jobId: string) => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/import/${jobId}`);
        const data = await res.json();

        if (data.status === 'completed' || data.status === 'failed') {
          clearInterval(interval);
          setImporting(false);
        }

        setProgress({
          status: data.status,
          totalCount: data.total_count,
          completedCount: data.completed_count,
          failedCount: data.failed_count,
          logs: data.logs || [],
        });
      } catch {
        clearInterval(interval);
        setImporting(false);
      }
    }, 2000);

    // Cleanup after 5 minutes
    setTimeout(() => clearInterval(interval), 300_000);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
          {error}
        </div>
      )}

      {step === 'upload' && (
        <FileUploader onFilesSelected={handleFilesSelected} loading={uploading} />
      )}

      {step === 'mapping' && preview && (
        <MappingPanel
          articles={preview.articles}
          detectedTags={preview.detectedTags}
          onConfirm={handleConfirmMapping}
          onBack={() => { setStep('upload'); setPreview(null); setError(null); }}
          loading={importing}
        />
      )}

      {(step === 'progress' || importing) && progress && (
        <div className="rounded-lg border bg-card p-6">
          <ImportProgress
            status={progress.status as any}
            totalCount={progress.totalCount}
            completedCount={progress.completedCount}
            failedCount={progress.failedCount}
            logs={progress.logs}
          />
        </div>
      )}
    </div>
  );
}
