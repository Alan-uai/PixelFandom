'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/supabase';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Download, Loader2, FileArchive, Database, AlertTriangle } from 'lucide-react';

export function ExportPanel() {
  const params = useParams();
  const slug = params.slug as string;
  const { toast } = useToast();
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    setExporting(true);
    try {
      const { data: tenant } = await supabase
        .from('tenants')
        .select('id')
        .eq('slug', slug)
        .single();

      if (!tenant) {
        toast({ variant: 'destructive', title: 'Erro', description: 'Wiki não encontrada.' });
        setExporting(false);
        return;
      }

      const res = await fetch(`/api/tenants/${tenant.id}/export`, {
        method: 'POST',
      });

      if (!res.ok) throw new Error('Export failed');

      const data = await res.json();
      const json = JSON.stringify(data, null, 2);

      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `wiki-${slug}-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);

      toast({ title: 'Exportado', description: 'Wiki exportada com sucesso.' });
    } catch {
      toast({ variant: 'destructive', title: 'Erro', description: 'Falha ao exportar wiki.' });
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="rounded-lg border bg-card">
        <div className="p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Database className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-semibold">Dados Exportados</h3>
              <p className="text-sm text-muted-foreground">
                O arquivo incluirá artigos, tabelas, membros e páginas da wiki.
              </p>
            </div>
          </div>

          <div className="rounded-lg border bg-muted/50 p-3 text-xs text-muted-foreground space-y-1">
            <div className="flex items-center gap-2">
              <FileArchive className="h-3.5 w-3.5" />
              <span>Artigos da wiki</span>
            </div>
            <div className="flex items-center gap-2">
              <FileArchive className="h-3.5 w-3.5" />
              <span>Tabelas de jogo</span>
            </div>
            <div className="flex items-center gap-2">
              <FileArchive className="h-3.5 w-3.5" />
              <span>Membros e permissões</span>
            </div>
            <div className="flex items-center gap-2">
              <FileArchive className="h-3.5 w-3.5" />
              <span>Páginas personalizadas</span>
            </div>
          </div>

          <Button onClick={handleExport} disabled={exporting} className="gap-2">
            {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            {exporting ? 'Exportando...' : 'Exportar Wiki'}
          </Button>

          <div className="flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/5 p-3">
            <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-amber-500" />
            <p className="text-xs text-muted-foreground">
              O arquivo exportado contém dados dos membros da wiki. Mantenha-o em local seguro e não o compartilhe publicamente.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
