import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/supabase';
import { getTenantFromRequest } from '@/lib/get-tenant-from-request';
import { parseMarkdownFile, extractTagsFromArticles } from '@/lib/importer/parse-markdown';
import { rewriteLinks } from '@/lib/importer/link-rewriter';
import type { ImportArticle, ImportPreview, MappingConfig } from '@/lib/importer/types';

export async function POST(request: NextRequest) {
  try {
    const tenant = getTenantFromRequest(request);
    if (!tenant) {
      return NextResponse.json({ error: 'Tenant não identificado' }, { status: 400 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    if (!file) {
      return NextResponse.json({ error: 'Nenhum arquivo enviado' }, { status: 400 });
    }

    const fileName = file.name;
    const source = fileName.endsWith('.zip') ? 'zip' : 'markdown';

    const articles: ImportArticle[] = [];

    if (source === 'zip') {
      return NextResponse.json({
        error: 'Upload de ZIP será suportado em breve. Envie arquivos .md individuais.',
      }, { status: 400 });
    }

    if (!fileName.endsWith('.md')) {
      return NextResponse.json({ error: 'Formato não suportado. Envie arquivos .md' }, { status: 400 });
    }

    const text = await file.text();
    const article = parseMarkdownFile(text, fileName.replace(/\.md$/, ''));
    if (!article) {
      return NextResponse.json({
        error: 'Não foi possível parsear o arquivo. Certifique-se de que ele tem frontmatter YAML (---).',
      }, { status: 400 });
    }

    articles.push(article);

    const preview: ImportPreview = {
      articles,
      totalCount: articles.length,
      source,
      detectedTags: extractTagsFromArticles(articles),
      fileName,
    };

    return NextResponse.json(preview);
  } catch (error) {
    console.error('Import error:', error);
    return NextResponse.json({ error: 'Falha ao processar importação' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const tenant = getTenantFromRequest(request);
    if (!tenant) {
      return NextResponse.json({ error: 'Tenant não identificado' }, { status: 400 });
    }

    const body: {
      articles: ImportArticle[];
      mapping: MappingConfig;
    } = await request.json();

    if (!body.articles?.length || !body.mapping) {
      return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 });
    }

    const { articles, mapping } = body;

    const slugMap = new Map<string, string>();
    for (const a of articles) {
      if (a.slug) {
        slugMap.set(a.slug.toLowerCase(), a.slug);
      }
    }

    const { data: job, error: jobError } = await supabase
      .from('import_jobs')
      .insert({
        tenant_id: tenant.id,
        source: 'markdown',
        status: 'processing',
        total_count: articles.length,
        options: { mapping },
        created_by: request.headers.get('x-user-id') || null,
      })
      .select()
      .single();

    if (jobError || !job) {
      return NextResponse.json({ error: 'Falha ao criar job' }, { status: 500 });
    }

    let completed = 0;
    let failed = 0;
    const logs: { article_title: string; original_slug: string | null; new_slug: string | null; status: string; error: string | null }[] = [];

    for (const article of articles) {
      try {
        const finalTags = [
          ...article.tags.map((t) => mapping.tagMapping[t] || t),
          ...mapping.defaultTags,
        ];
        const uniqueTags = [...new Set(finalTags)];

        let content = article.content;
        if (mapping.rewriteLinks) {
          content = rewriteLinks(content, slugMap, tenant.slug);
        }

        const now = new Date().toISOString();
        const articleSlug = article.slug || article.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

        const { data: existing } = await supabase
          .from('wiki_articles')
          .select('id')
          .eq('tenant_id', tenant.id)
          .eq('slug', articleSlug)
          .maybeSingle();

        if (existing) {
          logs.push({
            article_title: article.title,
            original_slug: article.slug || null,
            new_slug: articleSlug,
            status: 'skipped',
            error: 'Artigo já existe',
          });
          completed++;
          continue;
        }

        const { error: insertError } = await supabase
          .from('wiki_articles')
          .insert({
            tenant_id: tenant.id,
            title: article.title,
            summary: article.summary || '',
            content,
            tags: uniqueTags,
            slug: articleSlug,
            image_url: article.imageUrl || null,
            created_at: article.createdAt || now,
            updated_at: article.updatedAt || now,
          });

        if (insertError) throw insertError;

        if (mapping.preserveHistory && (article.author || article.createdAt)) {
          const historyNote = [
            article.author && `Autor original: ${article.author}`,
            article.createdAt && `Data original: ${article.createdAt}`,
          ].filter(Boolean).join(' — ');

          if (historyNote) {
            const { data: inserted } = await supabase
              .from('wiki_articles')
              .select('id')
              .eq('tenant_id', tenant.id)
              .eq('slug', articleSlug)
              .single();

            if (inserted) {
              await supabase.rpc('update_last_version_summary', {
                p_article_id: inserted.id,
                p_summary: `Importado — ${historyNote}`,
              });
            }
          }
        }

        logs.push({
          article_title: article.title,
          original_slug: article.slug || null,
          new_slug: articleSlug,
          status: 'imported',
          error: null,
        });
        completed++;
      } catch (err) {
        logs.push({
          article_title: article.title,
          original_slug: article.slug || null,
          new_slug: null,
          status: 'error',
          error: err instanceof Error ? err.message : 'Erro desconhecido',
        });
        failed++;
      }
    }

    await supabase.from('import_log').insert(
      logs.map((l) => ({ job_id: job.id, ...l }))
    );

    const finalStatus = failed === articles.length ? 'failed' : completed > 0 ? 'completed' : 'failed';

    await supabase
      .from('import_jobs')
      .update({
        status: finalStatus,
        completed_count: completed,
        failed_count: failed,
        completed_at: new Date().toISOString(),
        result: { logs },
      })
      .eq('id', job.id);

    return NextResponse.json({
      jobId: job.id,
      status: finalStatus,
      completed,
      failed,
      total: articles.length,
    });
  } catch (error) {
    console.error('Import confirm error:', error);
    return NextResponse.json({ error: 'Falha ao processar importação' }, { status: 500 });
  }
}
