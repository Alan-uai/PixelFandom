import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/supabase/server';
import { safeParseBlockConfig, BlockSchemaKey } from '@/lib/block-schemas';
import { sanitizeBlock } from '@/lib/sanitize.server';

function getPageType(request: NextRequest): string {
  const url = new URL(request.url);
  return url.searchParams.get('type') || 'landing';
}

// ── Default page templates ──

const LANDING_DEFAULT_BLOCKS = [
  { id: 'default-landing-welcome', type: 'heading' as const, config: { content: 'Bem-vindo à Wiki!', level: 'h2', align: 'center' } },
  { id: 'default-landing-desc', type: 'paragraph' as const, config: { content: 'Explore nosso universo de conteúdo criado pela comunidade. Navegue pelos dados do jogo e artigos mais recentes.', size: 'md', align: 'center' } },
  { id: 'default-landing-game-data', type: 'game-data-cards' as const, config: { title: 'Dados do Jogo' } },
  { id: 'default-landing-divider', type: 'divider' as const, config: { style: 'dashed', thickness: 'sm' } },
  { id: 'default-landing-articles-heading', type: 'heading' as const, config: { content: 'Artigos Recentes', level: 'h2' } },
  { id: 'default-landing-article-feed', type: 'article-feed' as const, config: { sortBy: 'recent', layout: 'grid', columns: 3, count: 9, showImages: true, showSummaries: true } },
];

const FOOTER_DEFAULT_BLOCKS = [
  { id: 'default-footer-brand', type: 'footer-brand' as const, config: { tagline: 'Wiki Comunitária', description: 'Conteúdo criado por fãs, para fãs. Este site não tem vínculo oficial com os desenvolvedores.', showSocialLinks: false, socialLinks: [], align: 'center' } },
  { id: 'default-footer-credits', type: 'footer-credits' as const, config: { brandName: '', year: 'auto', showHeart: true, showRights: true, align: 'center', size: 'sm' } },
];

const ERROR_404_DEFAULT_BLOCKS = [
  { id: 'default-404-display', type: 'error-display' as const, config: { number: '404', size: 'xl', font: 'display', title: 'Página não encontrada', subtitle: 'Ops! O conteúdo que você procura não está aqui ou foi movido.', glitchEnabled: false, showDecoration: true } },
  { id: 'default-404-search', type: 'error-search' as const, config: { placeholder: 'Buscar na wiki...', showSuggestions: true } },
  { id: 'default-404-actions', type: 'error-actions' as const, config: { buttons: [{ label: 'Voltar ao Início', url: '/', variant: 'primary', icon: 'home' }, { label: 'Explorar Artigos', url: '/artigos', variant: 'outline', icon: 'back' }], layout: 'row', size: 'md' } },
  { id: 'default-404-character', type: 'error-character' as const, config: { character: 'sad-robot', mood: 'sad', speech: 'Hmm... não encontrei nada por aqui. Que tal tentar uma busca?', size: 'md', showBubble: true } },
];

function getDefaultBlocks(pageType: string) {
  if (pageType === 'footer') return FOOTER_DEFAULT_BLOCKS;
  if (pageType === '404') return ERROR_404_DEFAULT_BLOCKS;
  return LANDING_DEFAULT_BLOCKS;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id } = await params;
    const pageType = getPageType(request);

    const { data, error } = await supabase
      .from('tenant_pages')
      .select('layout, floating_islands')
      .eq('tenant_id', id)
      .eq('page_type', pageType)
      .maybeSingle();

    if (error || !data) {
      if (pageType === 'landing') {
        const { data: tenant } = await supabase
          .from('tenants')
          .select('theme')
          .eq('id', id)
          .single();

        if (tenant?.theme && (tenant.theme as any).landing_layout) {
          const fallback = (tenant.theme as any).landing_layout;
          return NextResponse.json({
            blocks: fallback.blocks || [],
            floatingIslands: fallback.floatingIslands || [],
          });
        }
      }
      return NextResponse.json({
        blocks: getDefaultBlocks(pageType),
        floatingIslands: [],
      });
    }

    const rawIslands = data.floating_islands as any;

    // Backward compat: if old array format, wrap in new object structure
    if (Array.isArray(rawIslands)) {
      return NextResponse.json({
        blocks: (data.layout as any)?.blocks || [],
        floatingIslands: rawIslands,
        slotFlow: 'current',
        clipStyle: 'trapezoid',
      });
    }

    const islandData = rawIslands || {};
    return NextResponse.json({
      blocks: (data.layout as any)?.blocks || [],
      floatingIslands: (islandData.islands as any[]) || [],
      slotFlow: islandData.slotFlow || 'current',
      clipStyle: islandData.clipStyle || 'trapezoid',
    });
  } catch (error) {
    console.error('Get layout error:', error);
    return NextResponse.json({ blocks: [], floatingIslands: [] });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id } = await params;
    const pageType = getPageType(request);
    const body = await request.json();

    if (!body.blocks && !body.floatingIslands) {
      return NextResponse.json({ error: 'blocks or floatingIslands required' }, { status: 400 });
    }

    let sanitizedBlocks: Record<string, unknown>[] | null = null;
    if (body.blocks) {
      if (!Array.isArray(body.blocks)) {
        return NextResponse.json({ error: 'layout.blocks must be an array' }, { status: 400 });
      }
      for (const block of body.blocks) {
        const type = (block as any)?.type;
        if (!type || typeof type !== 'string') {
          return NextResponse.json({ error: `Block missing type` }, { status: 400 });
        }
        const config = (block as any)?.config;
        if (config !== undefined) {
          const result = safeParseBlockConfig(type as BlockSchemaKey, config);
          if (!result.success) {
            return NextResponse.json({
              error: `Block "${type}" config validation failed`,
              details: result.error.issues,
            }, { status: 400 });
          }
        }
      }
      sanitizedBlocks = await Promise.all(
        body.blocks.map((block: unknown) =>
          sanitizeBlock(block as Record<string, unknown>)
        )
      );
    }

    let floatingIslandsPayload: Record<string, unknown> | null = null;
    if (body.floatingIslands !== undefined) {
      const rawIslands = Array.isArray(body.floatingIslands) ? body.floatingIslands : [];
      const sanitizedIslands = await Promise.all(
        rawIslands.map(async (fi: any) => ({
          ...fi,
          config: fi.config ? (await sanitizeBlock({ config: fi.config })).config : {},
        }))
      );
      floatingIslandsPayload = {
        islands: sanitizedIslands,
        slotFlow: body.slotFlow || 'current',
        clipStyle: body.clipStyle || 'trapezoid',
      };
    }

    // Manual upsert: try update first, then insert if no row exists
    const { data: existing } = await supabase
      .from('tenant_pages')
      .select('id')
      .eq('tenant_id', id)
      .eq('page_type', pageType)
      .maybeSingle();

    const updateFields: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };
    if (sanitizedBlocks) updateFields.layout = { blocks: sanitizedBlocks };
    if (floatingIslandsPayload) updateFields.floating_islands = floatingIslandsPayload;

    let dbError: any = null;

    if (existing) {
      const { error } = await supabase
        .from('tenant_pages')
        .update(updateFields)
        .eq('id', existing.id);
      dbError = error;
    } else {
      const insertFields: Record<string, unknown> = {
        tenant_id: id,
        page_type: pageType,
        updated_at: new Date().toISOString(),
      };
      if (sanitizedBlocks) insertFields.layout = { blocks: sanitizedBlocks };
      if (floatingIslandsPayload) insertFields.floating_islands = floatingIslandsPayload;
      const { error } = await supabase
        .from('tenant_pages')
        .insert(insertFields);
      dbError = error;
    }

    if (dbError) {
      return NextResponse.json({ error: dbError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Save layout error:', error);
    return NextResponse.json({ error: 'Failed to save layout' }, { status: 500 });
  }
}
