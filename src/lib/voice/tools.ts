export const TOOL_DECLARATIONS = [
  {
    name: 'searchWikiContent',
    description: 'Search wiki articles semantically for relevant content. Returns titles, summaries, and slugs.',
    parameters: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'The search query to find relevant wiki content',
        },
      },
      required: ['query'],
    },
  },
  {
    name: 'getWikiArticle',
    description: 'Get the full content of a specific wiki article by its slug or title.',
    parameters: {
      type: 'object',
      properties: {
        slug: {
          type: 'string',
          description: 'The slug or URL-friendly identifier of the article',
        },
      },
      required: ['slug'],
    },
  },
  {
    name: 'navigateToPage',
    description: 'Navigate the user to a specific wiki page or article.',
    parameters: {
      type: 'object',
      properties: {
        path: {
          type: 'string',
          description: 'The path to navigate to (e.g., article slug or full URL path)',
        },
      },
      required: ['path'],
    },
  },
  {
    name: 'listWikiArticles',
    description: 'List all available articles in the current wiki.',
    parameters: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'switchWiki',
    description: 'Switch to a different wiki by its slug.',
    parameters: {
      type: 'object',
      properties: {
        slug: {
          type: 'string',
          description: 'The slug identifier of the target wiki',
        },
      },
      required: ['slug'],
    },
  },
];

export type ToolHandler = (
  name: string,
  args: Record<string, unknown>
) => Promise<unknown>;

import { stripTipTapContent } from './utils';

export async function handleToolCall(
  name: string,
  args: Record<string, unknown>,
  context: { tenantSlug: string; navigate: (path: string) => void }
): Promise<unknown> {
  switch (name) {
    case 'searchWikiContent': {
      const query = args.query as string;
      const res = await fetch(
        `/api/voice/search?slug=${encodeURIComponent(context.tenantSlug)}&q=${encodeURIComponent(query)}`
      );
      if (!res.ok) return { error: 'Search failed' };
      const data = await res.json();
      const results = (data.results || []).map((r: any) => ({
        ...r,
        content: r.content ? stripTipTapContent(r.content) : r.content,
      }));
      return { results };
    }

    case 'getWikiArticle': {
      const slug = args.slug as string;
      const res = await fetch(
        `/api/voice/article?slug=${encodeURIComponent(context.tenantSlug)}&article=${encodeURIComponent(slug)}`
      );
      if (!res.ok) return { error: 'Article not found' };
      const data = await res.json();
      const article = data.article
        ? {
            ...data.article,
            content: data.article.content
              ? stripTipTapContent(data.article.content)
              : data.article.content,
          }
        : null;
      return { article };
    }

    case 'navigateToPage': {
      const path = args.path as string;
      context.navigate(`/w/${context.tenantSlug}/${path}`);
      return { success: true, path };
    }

    case 'listWikiArticles': {
      const res = await fetch(`/api/voice/articles?slug=${encodeURIComponent(context.tenantSlug)}`);
      if (!res.ok) return { error: 'Failed to list articles' };
      const data = await res.json();
      return { articles: data.articles };
    }

    case 'switchWiki': {
      const targetSlug = args.slug as string;
      context.navigate(`/w/${targetSlug}`);
      return { success: true, slug: targetSlug };
    }

    default:
      return { error: `Unknown tool: ${name}` };
  }
}
