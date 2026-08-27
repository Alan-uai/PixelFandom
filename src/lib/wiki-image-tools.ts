import { supabase } from '@/supabase';
import { identifyGameItem, checkImageSafety, compareItemImages } from './gemini-vision';
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

function extractIconUrl(rawData: any): string | null {
  if (!rawData || typeof rawData !== 'object') return null;
  return (
    rawData.image_url ||
    rawData.icon ||
    rawData.icon_url ||
    rawData.img ||
    rawData.thumbnail ||
    rawData.image ||
    null
  );
}

async function banUser(ctx: ToolContext): Promise<void> {
  if (!ctx.userId || !ctx.tenantId) return;
  try {
    await supabase
      .from('tenant_members')
      .upsert({ tenant_id: ctx.tenantId, user_id: ctx.userId, role: 'banned' }, {
        onConflict: 'tenant_id,user_id',
      });
    await supabase.from('activity_log').insert({
      tenant_id: ctx.tenantId,
      type: 'user_banned',
      description: 'Usuário banido automaticamente por envio de imagem não permitida (detecção por visão).',
    });
  } catch {
    /* best-effort */
  }
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

  // 1) Safety moderation — auto-ban on unsafe content.
  let safety;
  try {
    safety = await checkImageSafety(bytes.base64, bytes.mime);
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Falha na moderação da imagem.' };
  }

  if (!safety.safe) {
    await banUser(ctx);
    return {
      error: 'Conteúdo de imagem não permitido detectado.',
      banned: true,
      categories: safety.categories,
      message:
        'Esta imagem viola as diretrizes da comunidade (conteúdo impróprio, gore ou explícito). O usuário foi banido automaticamente.',
    };
  }

  // 2) Identify the item via Gemini vision.
  let identified: Awaited<ReturnType<typeof identifyGameItem>>;
  try {
    identified = await identifyGameItem(bytes.base64, bytes.mime);
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Falha na identificação por visão.' };
  }

  if (!identified.item_name) {
    return { error: 'Não foi possível identificar um item na imagem.', identified };
  }

  // 3) Match against the wiki database.
  const matches = await matchAgainstWiki(ctx.slug, identified.item_name);

  const bestGameItem = matches.game_items[0];
  const best = bestGameItem || matches.wiki[0] || null;

  // 4) Confirm by comparing the sent image with the item's official icon (if available).
  let iconMatch: { same: boolean; confidence: number; note: string } | null = null;
  const iconUrl = bestGameItem ? extractIconUrl(bestGameItem.raw_data) : null;
  if (iconUrl) {
    try {
      const iconBytes = await fetchImageBytes(iconUrl);
      iconMatch = await compareItemImages(bytes.base64, bytes.mime, iconBytes.base64, iconBytes.mime);
    } catch {
      iconMatch = null;
    }
  }

  return {
    identified,
    icon_match: iconMatch,
    icon_used: !!iconUrl,
    confirmed:
      iconMatch && iconMatch.same && iconMatch.confidence >= 0.6
        ? 'O ícone do item confere com a imagem enviada — confirmação visual positiva.'
        : iconMatch
          ? 'O ícone não confere totalmente com a imagem enviada — trate como sugestão, não confirmação.'
          : 'Sem ícone no banco para confirmação visual.',
    matches: {
      game_items: matches.game_items.slice(0, 3).map((g: any) => ({
        name: g.name,
        slug: g.slug,
        collection: g.collection_name,
        description: g.description,
        rank: g.rank,
        icon_url: extractIconUrl(g.raw_data),
      })),
      wiki: matches.wiki.slice(0, 3).map((w: any) => ({
        title: w.title,
        slug: w.slug,
        summary: w.summary,
      })),
    },
    best_match: best
      ? { slug: best.slug, name: best.name || best.title, source: bestGameItem ? 'game_item' : 'wiki' }
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
