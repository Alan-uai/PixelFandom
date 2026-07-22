import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/supabase/server';
import { isTenantMember } from '@/lib/tenant';
import { getTableCatalog } from '@/lib/data-access';

const VALID_STATUSES = new Set(['online', 'idle', 'dnd', 'invisible']);
const VALID_TRIGGER_TYPES = new Set(['exact', 'startsWith', 'includes', 'regex', 'mention']);
const VALID_EXECUTION_MODES = new Set(['sequential', 'parallel']);
const SNOWFLAKE_RE = /^\d{17,19}$/;

function isValidUrl(s: string): boolean {
  try {
    const u = new URL(s);
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch { return false; }
}

function isValidRegex(s: string): boolean {
  try {
    new RegExp(s);
    if (s.length > 200) return false;
    const dangerous = /(?:^|[^\\])(?:\(|\)|\[|\]|\{|\}|\+|\*|\?|\||\.|\^|\$)/g;
    const matches = s.match(dangerous);
    if (matches && matches.length > 100) return false;
    return true;
  } catch { return false; }
}

interface ValidationError {
  field: string;
  message: string;
}

function validateConfig(body: Record<string, unknown>, _tenantSlug: string): ValidationError[] {
  const errors: ValidationError[] = [];

  if (body.prefix !== undefined) {
    if (typeof body.prefix !== 'string' || body.prefix.length > 5) {
      errors.push({ field: 'prefix', message: 'Prefixo deve ter no máximo 5 caracteres.' });
    } else if (!/^[\w!@#$%^&*\-+=.]+$/.test(body.prefix)) {
      errors.push({ field: 'prefix', message: 'Prefixo deve conter apenas caracteres alfanuméricos e símbolos comuns.' });
    }
  }

  if (body.bot_avatar !== undefined && body.bot_avatar !== null && body.bot_avatar !== '') {
    if (!isValidUrl(body.bot_avatar as string)) {
      errors.push({ field: 'bot_avatar', message: 'URL do avatar inválida.' });
    }
  }

  if (body.status !== undefined && !VALID_STATUSES.has(body.status as string)) {
    errors.push({ field: 'status', message: 'Status inválido.' });
  }

  interface ActionItem {
    id?: string;
    type?: string;
    payload?: Record<string, unknown>;
    delay?: number;
  }

  if (Array.isArray(body.custom_commands)) {
    for (let i = 0; i < body.custom_commands.length; i++) {
      const cmd = body.custom_commands[i] as Record<string, unknown>;
      const prefix = `custom_commands[${i}]`;

      if (typeof cmd.name !== 'string' || cmd.name.length > 50) {
        errors.push({ field: `${prefix}.name`, message: 'Nome do comando deve ter no máximo 50 caracteres.' });
      }

      if (Array.isArray(cmd.trigger)) {
        for (let j = 0; j < (cmd.trigger as string[]).length; j++) {
          const t = (cmd.trigger as string[])[j];
          if (typeof t !== 'string' || t.length > 100) {
            errors.push({ field: `${prefix}.trigger[${j}]`, message: 'Trigger deve ter no máximo 100 caracteres.' });
          }
        }
      }

      if (cmd.triggerType === 'regex' && Array.isArray(cmd.trigger)) {
        for (let j = 0; j < (cmd.trigger as string[]).length; j++) {
          if (!isValidRegex((cmd.trigger as string[])[j])) {
            errors.push({ field: `${prefix}.trigger[${j}]`, message: 'Regex inválido ou muito complexo (possível ReDoS).' });
          }
        }
      }

      if (cmd.description !== undefined && typeof cmd.description === 'string' && cmd.description.length > 500) {
        errors.push({ field: `${prefix}.description`, message: 'Descrição deve ter no máximo 500 caracteres.' });
      }

      if (cmd.cooldown !== undefined && (typeof cmd.cooldown !== 'number' || cmd.cooldown < 0 || cmd.cooldown > 3600)) {
        errors.push({ field: `${prefix}.cooldown`, message: 'Cooldown deve estar entre 0 e 3600 segundos.' });
      }

      if (!VALID_TRIGGER_TYPES.has(cmd.triggerType as string)) {
        errors.push({ field: `${prefix}.triggerType`, message: 'Tipo de trigger inválido.' });
      }

      if (!VALID_EXECUTION_MODES.has(cmd.executionMode as string)) {
        errors.push({ field: `${prefix}.executionMode`, message: 'Modo de execução inválido.' });
      }

      if (Array.isArray(cmd.allowedRoles)) {
        for (let j = 0; j < (cmd.allowedRoles as string[]).length; j++) {
          if (!SNOWFLAKE_RE.test((cmd.allowedRoles as string[])[j])) {
            errors.push({ field: `${prefix}.allowedRoles[${j}]`, message: 'ID de cargo inválido (deve ser um snowflake do Discord).' });
          }
        }
      }

      if (Array.isArray(cmd.allowedChannels)) {
        for (let j = 0; j < (cmd.allowedChannels as string[]).length; j++) {
          if (!SNOWFLAKE_RE.test((cmd.allowedChannels as string[])[j])) {
            errors.push({ field: `${prefix}.allowedChannels[${j}]`, message: 'ID de canal inválido (deve ser um snowflake do Discord).' });
          }
        }
      }

      if (Array.isArray(cmd.actions)) {
        for (let j = 0; j < (cmd.actions as ActionItem[]).length; j++) {
          const action = cmd.actions[j] as ActionItem;
          const ap = `${prefix}.actions[${j}]`;

          if (action.type === 'send_message' || action.type === 'edit_message' || action.type === 'send_dm') {
            if (typeof action.payload?.content === 'string' && action.payload.content.length > 2000) {
              errors.push({ field: `${ap}.payload.content`, message: 'Conteúdo da mensagem deve ter no máximo 2000 caracteres.' });
            }
          }

          if (action.type === 'execute_webhook') {
            if (action.payload?.webhookId && typeof action.payload.webhookId === 'string' && !SNOWFLAKE_RE.test(action.payload.webhookId)) {
              errors.push({ field: `${ap}.payload.webhookId`, message: 'ID do webhook inválido.' });
            }
            if (action.payload?.webhookToken && typeof action.payload.webhookToken === 'string' && action.payload.webhookToken.length > 200) {
              errors.push({ field: `${ap}.payload.webhookToken`, message: 'Token do webhook muito longo.' });
            }
          }

          if (action.payload?.content && typeof action.payload.content === 'string' && action.payload.content.length > 2000) {
            errors.push({ field: `${ap}.payload.content`, message: 'Conteúdo deve ter no máximo 2000 caracteres.' });
          }
        }
      }
    }
  }

  const snowflakeFields = [
    'text_chat_channel_id', 'curation_channel_id',
    'support_role_id', 'member_role_id', 'editor_role_id', 'admin_role_id',
    'auto_post_codes_channel_id', 'auto_post_articles_channel_id', 'auto_post_updates_channel_id',
  ] as const;

  for (const field of snowflakeFields) {
    if (body[field] !== undefined && body[field] !== null && body[field] !== '') {
      if (!SNOWFLAKE_RE.test(String(body[field]))) {
        errors.push({ field, message: `${field} deve ser um snowflake válido do Discord (17-19 dígitos).` });
      }
    }
  }

  if (Array.isArray(body.auto_ingest)) {
    for (let i = 0; i < (body.auto_ingest as Record<string, unknown>[]).length; i++) {
      const ingest = (body.auto_ingest as Record<string, unknown>[])[i];
      const ip = `auto_ingest[${i}]`;

      if (ingest.source_channel_id && typeof ingest.source_channel_id === 'string' && !SNOWFLAKE_RE.test(ingest.source_channel_id)) {
        errors.push({ field: `${ip}.source_channel_id`, message: 'ID do canal de origem inválido.' });
      }

      if (typeof ingest.command_prefix === 'string' && ingest.command_prefix.length > 10) {
        errors.push({ field: `${ip}.command_prefix`, message: 'Prefixo do comando deve ter no máximo 10 caracteres.' });
      }

      if (typeof ingest.target_table === 'string' && ingest.target_table.length > 0) {
        // validate against catalog - async, so we push a placeholder and validate after
        if (ingest.target_table.length > 100) {
          errors.push({ field: `${ip}.target_table`, message: 'Nome da tabela muito longo.' });
        }
      }
    }
  }

  if (body.bot_name !== undefined && typeof body.bot_name === 'string' && body.bot_name.length > 32) {
    errors.push({ field: 'bot_name', message: 'Nome do bot deve ter no máximo 32 caracteres (limite do Discord).' });
  }

  return errors;
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });
    }

    const isMember = await isTenantMember(id, user.id, 'admin', supabase);
    if (!isMember) {
      return NextResponse.json({ error: 'Permissão insuficiente.' }, { status: 403 });
    }

    const { data: tenant } = await supabase
      .from('tenants')
      .select('id, slug')
      .eq('id', id)
      .single();

    if (!tenant) {
      return NextResponse.json({ error: 'Tenant não encontrado.' }, { status: 404 });
    }

    const body: Record<string, unknown> = await request.json();

    const { guild_id, ...configBody } = body;

    const errors = validateConfig(configBody, tenant.slug);
    if (errors.length > 0) {
      return NextResponse.json({ error: 'Validação falhou.', details: errors }, { status: 400 });
    }

    // Validate auto_ingest target_table against catalog
    if (Array.isArray(configBody.auto_ingest)) {
      const catalog = await getTableCatalog(tenant.slug, false);
      const validTables = new Set(catalog.map(e => e.table_name));
      for (let i = 0; i < configBody.auto_ingest.length; i++) {
        const ingest = configBody.auto_ingest[i] as Record<string, unknown>;
        if (typeof ingest.target_table === 'string' && ingest.target_table.length > 0 && !validTables.has(ingest.target_table)) {
          return NextResponse.json({
            error: 'Validação falhou.',
            details: [{ field: `auto_ingest[${i}].target_table`, message: `Tabela "${ingest.target_table}" não encontrada no catálogo do tenant.` }],
          }, { status: 400 });
        }
      }
    }

    const { error: updateError } = await supabase
      .from('tenants')
      .update({ discord_config: configBody })
      .eq('id', id);

    if (updateError) {
      console.error('[discord-config] PUT update error:', updateError.message);
      return NextResponse.json({ error: 'Erro ao salvar configuração do Discord.' }, { status: 500 });
    }

    // Salvar guild_id na tabela discord_guilds
    if (guild_id && typeof guild_id === 'string') {
      const { error: guildUpsertError } = await supabase
        .from('discord_guilds')
        .upsert(
          { guild_id, tenant_id: id },
          { onConflict: 'guild_id' }
        );

      if (guildUpsertError) {
        console.error('[discord-config] PUT discord_guilds upsert error:', guildUpsertError.message);
      }
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[discord-config] PUT unexpected error:', err);
    return NextResponse.json({ error: 'Erro ao salvar configuração do Discord.' }, { status: 500 });
  }
}
