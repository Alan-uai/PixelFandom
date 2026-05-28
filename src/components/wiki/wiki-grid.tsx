'use client';

import Link from 'next/link';
import { Calendar, Tags, FileText, ImageIcon } from 'lucide-react';

type Article = {
  id: string;
  title: string;
  slug: string | null;
  summary: string | null;
  tags: string[] | null;
  image_url: string | null;
  updated_at: string | null;
};

type Props = {
  articles: Article[];
  basePath: string;
  tenantSlug?: string;
};

export default function WikiGrid({ articles, basePath }: Props) {
  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-4">
      {articles.map((article) => {
        const href = `${basePath}/${article.slug || article.id}`;

        return (
          <Link
            key={article.id}
            href={href}
            className="group rounded-xl border bg-card hover:border-primary/30 hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col"
          >
            <div className="aspect-video overflow-hidden">
              {article.image_url ? (
                <img
                  src={article.image_url}
                  alt={article.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-muted text-muted-foreground">
                  <ImageIcon className="h-8 w-8" />
                </div>
              )}
            </div>

            <div className="flex flex-col flex-1 p-4">
              <h3 className="font-semibold text-base group-hover:text-primary transition-colors line-clamp-2">
                {article.title}
              </h3>

              {article.summary && (
                <p className="text-sm text-muted-foreground mt-1.5 line-clamp-2 flex-1">
                  {article.summary}
                </p>
              )}

              <div className="flex flex-wrap items-center gap-3 mt-3 pt-3 border-t text-xs text-muted-foreground">
                {article.updated_at && (
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {new Date(article.updated_at).toLocaleDateString('pt-BR')}
                  </span>
                )}

                {article.tags && article.tags.length > 0 && (
                  <span className="flex items-center gap-1 truncate flex-1 min-w-0">
                    <Tags className="h-3 w-3 shrink-0" />
                    <span className="truncate">{article.tags.slice(0, 2).join(', ')}</span>
                  </span>
                )}
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
