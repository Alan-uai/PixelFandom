import { identifyGameItem } from './gemini-vision';
import { searchAll, type SearchAllResult } from './search';
import type { ToolContext, ToolDefinition } from './text-chat-tools';

async function fetchImageBytes(imageUrl: string): Promise<{ base64: string; mime: string }> {
  if (imageUrl.startsWith('data:')) {
    const match = imageUrl.match(/^data:([^;]+);base64,(.+)$/);
    if (!match) throw new Error('Data URI de imagem inválida');
    return { base64: match[2], mime: match[1] };
  }

  const res = await fetch(imageUrl);
  if (!res.ok) throw new Error(`Falha ao baixar imagem (${res.status})`);
  const buf = Buffer.from(await res.arrayBuffer());
  const mime = res.headers.get('content-type') || 'image/png';
  return { base64: buf.toString('base64'), mime };
}

async function matchAgainstWiki(
  slug: string,
  candidateName: string,
): Promise<{ game_items: any[]; wiki: any[] }> {
  try {
    const result: SearchAllResult = await searchAll(slug, candidateName, { limit: 3 });
    return { game_items: result.game_items || [], wiki: result.wiki || [] };
  } catch {
    return { game_items: [], wiki: [] };
  }
}

const identifyItemFromImageDef: ToolDefinition = {
  type: 'function',
  function: {
    name: 'identifyItemFromImage',
    description:
      'Identify a game item, character, enemy or boss from an image (screenshot). Provide the image as a public URL. The tool uses Gemini vision to recognize the item, then matches it against this wiki\'s database and returns the best matches with stats and slugs. Use when the user uploads/attaches an image and asks "what is this", "o que é isso", "qual item é esse".',
    parameters: {
      type: 'object',
      properties: {
        image_url: {
          type: 'string',
          description: 'Public URL (or data: URI) of the image to identify',
        },
      },
      required: ['image_url'],
    },
  },
};

async function handleIdentifyItemFromImage(
  args: { image_url: string },
  ctx: ToolContext,
): Promise<Record<string, unknown>> {
  if (!args.image_url) return { error: 'image_url é obrigatório.' };

  let bytes: { base64: string; mime: string };
  try {
    bytes = await fetchImageBytes(args.image_url);
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Falha ao obter a imagem.' };
  }

  let identified: Awaited<ReturnType<typeof identifyGameItem>>;
  try {
    identified = await identifyGameItem(bytes.base64, bytes.mime);
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Falha na identificação por visão.' };
  }

  if (!identified.item_name) {
    return { error: 'Não foi possível identificar um item na imagem.', identified };
  }

  const matches = await matchAgainstWiki(ctx.slug, identified.item_name);

  const best = matches.game_items[0] || matches.wiki[0] || null;

  return {
    identified,
    matches: {
      game_items: matches.game_items.slice(0, 3).map((g: any) => ({
        name: g.name,
        slug: g.slug,
        collection: g.collection_name,
        description: g.description,
        rank: g.rank,
      })),
      wiki: matches.wiki.slice(0, 3).map((w: any) => ({
        title: w.title,
        slug: w.slug,
        summary: w.summary,
      })),
    },
    best_match: best
      ? { slug: best.slug, name: best.name || best.title, source: matches.game_items[0] ? 'game_item' : 'wiki' }
      : null,
    hint: best
      ? `Use navigateToPage("${best.slug}") para abrir a página do item.`
      : 'Nenhum item correspondente encontrado na wiki para este nome.',
  };
}

export const WIKI_IMAGE_TOOL_DEFS: ToolDefinition[] = [identifyItemFromImageDef];

export const WIKI_IMAGE_HANDLERS: Record<string, (args: any, ctx: ToolContext) => Promise<unknown>> = {
  identifyItemFromImage: handleIdentifyItemFromImage,
};
