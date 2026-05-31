import { ArticleGridBlock } from '../blocks/article-grid-block';
import type { PageLayout } from '../types';
import { sanitizeHtml, sanitizeUrl } from '@/lib/sanitize';

interface PageRendererProps {
  layout: PageLayout;
  tenant: Record<string, unknown>;
  basePath?: string;
}

const BLOCK_STYLES: Record<string, React.CSSProperties> = {
  hero: { padding: '64px 16px' },
  'article-grid': { padding: '32px 16px' },
  'featured-list': { padding: '32px 16px' },
  'discord-embed': { padding: '32px 16px' },
  'news-feed': { padding: '32px 16px' },
  'image-gallery': { padding: '32px 16px' },
  'ranking-table': { padding: '32px 16px' },
  'rich-text': { padding: '32px 16px' },
};

export function PageRenderer({ layout, tenant, basePath = '' }: PageRendererProps) {
  if (!layout?.blocks?.length) return null;

  return (
    <div className="max-w-5xl mx-auto">
      {layout.blocks.map((block) => (
        <div key={block.id} style={BLOCK_STYLES[block.type] || { padding: '32px 16px' }}>
          <RenderBlock block={block} tenant={tenant} basePath={basePath} />
        </div>
      ))}
    </div>
  );
}

function RenderBlock({ block, tenant, basePath }: { block: any; tenant: Record<string, unknown>; basePath?: string }) {
  const config = block.config || {};

  switch (block.type) {
    case 'hero':
      return (
        <div
          className="relative flex flex-col items-center justify-center rounded-xl overflow-hidden text-center py-16 px-6"
          style={
            config.backgroundColor
              ? { backgroundColor: config.backgroundColor as string }
              : { background: 'linear-gradient(135deg, hsl(var(--primary)/0.1), hsl(var(--primary)/0.05))' }
          }
        >
          {config.imageUrl && (
            <>
              <div className="absolute inset-0">
                <img src={sanitizeUrl(config.imageUrl as string)} alt="" className="w-full h-full object-cover" />
              </div>
              <div className="absolute inset-0 bg-gradient-to-b from-black/60 to-black/80" />
            </>
          )}
          <div className="relative z-10 max-w-2xl">
            <h1 className="text-4xl font-bold tracking-tight" style={{ color: config.imageUrl ? '#fff' : undefined }}>
              {(config.title as string) || tenant.name as string}
            </h1>
            {config.subtitle && (
              <p className="mt-3 text-lg" style={{ color: config.imageUrl ? 'rgba(255,255,255,0.8)' : 'hsl(var(--muted-foreground))' }}>
                {config.subtitle as string}
              </p>
            )}
            {config.ctaText && (
              <a
                href={sanitizeUrl((config.ctaUrl as string) || '#')}
                className="inline-flex items-center gap-2 mt-6 rounded-lg bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                {config.ctaText as string}
              </a>
            )}
          </div>
        </div>
      );

    case 'article-grid':
      return config.tag ? (
        <ArticleGridBlock config={{ ...config, preview: false }} tenantId={tenant.id as string} />
      ) : (
        <div className="space-y-6">
          {config.title && <h2 className="text-2xl font-bold">{config.title as string}</h2>}
          <div
            className="grid gap-4"
            style={{ gridTemplateColumns: `repeat(${Math.min((config.columns as number) || 3, 4)}, 1fr)` }}
          >
            {(config.articles as any[] || []).map((article: any, i: number) => (
              <a
                key={i}
                href={sanitizeUrl(`${basePath}/${article.slug || article.id}`)}
                className="rounded-lg border bg-card p-4 hover:border-primary/30 transition-colors block"
              >
                <p className="font-medium text-sm truncate">{article.title}</p>
                {article.summary && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{article.summary}</p>}
              </a>
            ))}
          </div>
        </div>
      );

    case 'featured-list':
      return (
        <div className="space-y-4">
          {config.title && <h2 className="text-2xl font-bold">{config.title as string}</h2>}
          <div className="space-y-3">
            {(config.items as any[] || []).map((item: any, i: number) => (
              <div key={i} className="flex items-start gap-3 rounded-lg border bg-card p-4">
                <div className="h-2 w-2 rounded-full bg-primary mt-2 shrink-0" />
                <div>
                  <p className="font-medium text-sm">{item.label}</p>
                  {item.description && <p className="text-xs text-muted-foreground mt-1">{item.description}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      );

    case 'discord-embed':
      return (
        <div className="rounded-xl border bg-[#5865F2]/5 p-8 text-center space-y-4">
          <h2 className="text-xl font-bold">{(config.title as string) || 'Junte-se ao nosso Discord'}</h2>
          <p className="text-sm text-muted-foreground">{(config.description as string) || ''}</p>
          {config.discordUrl && (
            <a
              href={sanitizeUrl(config.discordUrl as string)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-lg bg-[#5865F2] px-6 py-3 text-sm font-medium text-white hover:bg-[#5865F2]/90 transition-colors"
            >
              Entrar no Discord
            </a>
          )}
        </div>
      );

    case 'news-feed':
      return (
        <div className="space-y-4">
          {config.title && <h2 className="text-2xl font-bold">{config.title as string}</h2>}
          <div className="space-y-3">
            {(config.items as any[] || []).map((item: any, i: number) => (
              <div key={i} className="rounded-lg border bg-card p-4">
                <p className="font-medium text-sm">{item.title}</p>
                {item.date && <p className="text-xs text-muted-foreground mt-1">{item.date}</p>}
                {item.excerpt && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{item.excerpt}</p>}
              </div>
            ))}
          </div>
        </div>
      );

    case 'image-gallery':
      return (
        <div className="space-y-4">
          {config.title && <h2 className="text-2xl font-bold">{config.title as string}</h2>}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {(config.images as any[] || []).map((img: any, i: number) => (
              <div key={i} className="aspect-video rounded-lg overflow-hidden border bg-muted">
                {img.src && <img src={sanitizeUrl(img.src)} alt={img.alt || ''} className="w-full h-full object-cover" />}
              </div>
            ))}
          </div>
        </div>
      );

    case 'ranking-table':
      return (
        <div className="space-y-4">
          {config.title && <h2 className="text-2xl font-bold">{config.title as string}</h2>}
          <div className="rounded-lg border bg-card overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  {(config.headers as string[] || ['#', 'Item', 'Valor']).map((h: string, i: number) => (
                    <th key={i} className="px-4 py-3 text-left font-medium text-muted-foreground text-xs uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(config.rows as string[][] || []).map((row: string[], ri: number) => (
                  <tr key={ri} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                    {row.map((cell: string, ci: number) => (
                      <td key={ci} className="px-4 py-3">{cell}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      );

    case 'rich-text':
      return (
        <div className="space-y-4">
          {config.title && <h2 className="text-2xl font-bold">{config.title as string}</h2>}
          <div className="prose prose-sm dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: sanitizeHtml((config.html as string) || '') }} />
        </div>
      );

    default:
      return null;
  }
}
