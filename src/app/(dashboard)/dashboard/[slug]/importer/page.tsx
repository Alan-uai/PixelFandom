'use client';

import { useParams } from 'next/navigation';
import { ImportWizard } from '@/components/importer/import-wizard';
import { Download, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function ImporterPage() {
  const params = useParams();
  const slug = params.slug as string;

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
          <h1 className="text-2xl font-bold">Importar Conteúdo</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Importe artigos de arquivos Markdown com frontmatter YAML.
          </p>
        </div>
      </div>

      <ImportWizard tenantSlug={slug} />
    </div>
  );
}
