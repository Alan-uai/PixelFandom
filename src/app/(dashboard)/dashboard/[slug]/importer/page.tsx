'use client';

import { useEffect } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { ImportWizard } from '@/components/importer/import-wizard';
import { ExportPanel } from '@/components/importer/export-panel';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Download, Upload, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useTenantRole } from '@/hooks/use-tenant-role';
import { usePageState } from '@/hooks/use-page-state';

export default function ImporterPage() {
  const params = useParams();
  const slug = params.slug as string;
  const { canManage } = useTenantRole(slug);
  const searchParams = useSearchParams();
  const router = useRouter();
  const [importerTab, setImporterTab] = usePageState('tab', 'import');
  const urlImporterTab = searchParams.get('tab');

  useEffect(() => {
    if (urlImporterTab) setImporterTab(urlImporterTab);
  }, [urlImporterTab, setImporterTab]);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <Link
        href={`/dashboard/${slug}/editor`}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Voltar para artigos
      </Link>

      <div className="flex items-center gap-3 mb-8">
        <div className="rounded-lg bg-primary/10 p-2">
          <Download className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Importar / Exportar</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Importe artigos de arquivos Markdown ou exporte sua wiki completa.
          </p>
        </div>
      </div>

      <Tabs value={importerTab} onValueChange={(v) => { setImporterTab(v); router.replace(`?tab=${v}`, { scroll: false }); }} className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="import" className="flex items-center gap-1.5">
            <Upload className="h-4 w-4" />Importar
          </TabsTrigger>
          {canManage && (
            <TabsTrigger value="export" className="flex items-center gap-1.5">
              <Download className="h-4 w-4" />Exportar
            </TabsTrigger>
          )}
        </TabsList>
        <TabsContent value="import">
          <ImportWizard tenantSlug={slug} />
        </TabsContent>
        {canManage && (
          <TabsContent value="export">
            <ExportPanel />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
