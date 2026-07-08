import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/supabase/server';
import { checkRateLimit } from '@/lib/rate-limiter';
import { encryptApiKey, decryptApiKey } from '@/lib/crypto';
import { isTenantMember } from '@/lib/tenant';

const MASKED = '__MASKED__';

function maskKey(key: string): string {
  if (!key || key.length < 8) return '';
  return key.slice(0, 3) + '...' + key.slice(-4);
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const ip = request.headers.get('x-forwarded-for') || 'unknown';
  const rl = await checkRateLimit(`ai-config:${ip}`, { windowMs: 60_000, maxRequests: 10 });
  if (!rl.allowed) {
    return NextResponse.json({ error: 'Muitas requisições. Tente novamente em breve.' }, {
      status: 429,
      headers: { 'X-RateLimit-Reset': String(rl.resetAt) },
    });
  }

  try {
    const { id } = await params;
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });
    }

    const isMember = await isTenantMember(id, user.id, 'admin');
    if (!isMember) {
      return NextResponse.json({ error: 'Permissão insuficiente.' }, { status: 403 });
    }

    const { data: tenant, error } = await supabase.from('tenants').select('id, ai_config, ai_enabled').eq('id', id).single();

    if (error) {
      console.error(`[ai-config] GET query error:`, error.message);
      return NextResponse.json({ error: 'Erro ao carregar configurações.' }, { status: 500 });
    }
    if (!tenant) {
      return NextResponse.json({ error: 'Tenant não encontrado.' }, { status: 404 });
    }

    const config = (tenant.ai_config || {}) as Record<string, unknown>;
    const masked = {
      ...config,
      custom_api_key: config.custom_api_key ? maskKey(decryptApiKey(config.custom_api_key as string)) : '',
      gemini_custom_api_key: config.gemini_custom_api_key ? maskKey(decryptApiKey(config.gemini_custom_api_key as string)) : '',
    };

    return NextResponse.json({ ai_enabled: tenant.ai_enabled, ai_config: masked });
  } catch (err) {
    console.error('[ai-config] GET unexpected error:', err);
    return NextResponse.json({ error: 'Erro ao carregar configurações.' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const ip = request.headers.get('x-forwarded-for') || 'unknown';
  const rl = await checkRateLimit(`ai-config:${ip}`, { windowMs: 60_000, maxRequests: 10 });
  if (!rl.allowed) {
    return NextResponse.json({ error: 'Muitas requisições. Tente novamente em breve.' }, {
      status: 429,
      headers: { 'X-RateLimit-Reset': String(rl.resetAt) },
    });
  }

  try {
    const { id } = await params;
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });
    }

    const isMember = await isTenantMember(id, user.id, 'admin');
    if (!isMember) {
      return NextResponse.json({ error: 'Permissão insuficiente.' }, { status: 403 });
    }

    const { data: tenant, error } = await supabase.from('tenants').select('id, ai_config').eq('id', id).single();

    if (error || !tenant) {
      console.error(`[ai-config] PUT tenant not found: ${id}`);
      return NextResponse.json({ error: 'Tenant não encontrado.' }, { status: 404 });
    }

    const body = await request.json();
    const { ai_enabled, ai_config } = body;

    const config = { ...(ai_config || {}) } as Record<string, unknown>;
    const existing = (tenant.ai_config || {}) as Record<string, unknown>;

    if (config.custom_api_key === MASKED) {
      config.custom_api_key = existing.custom_api_key as string;
    } else if (config.custom_api_key) {
      config.custom_api_key = encryptApiKey(config.custom_api_key as string);
    }

    if (config.gemini_custom_api_key === MASKED) {
      config.gemini_custom_api_key = existing.gemini_custom_api_key as string;
    } else if (config.gemini_custom_api_key) {
      config.gemini_custom_api_key = encryptApiKey(config.gemini_custom_api_key as string);
    }

    const { error: updateError } = await supabase.from('tenants').update({ ai_enabled, ai_config: config }).eq('id', id);
    if (updateError) {
      console.error(`[ai-config] PUT update error:`, updateError.message);
      return NextResponse.json({ error: 'Erro ao salvar configurações.' }, { status: 500 });
    }

    const response = {
      ...config,
      custom_api_key: config.custom_api_key ? maskKey(decryptApiKey(config.custom_api_key as string)) : '',
      gemini_custom_api_key: config.gemini_custom_api_key ? maskKey(decryptApiKey(config.gemini_custom_api_key as string)) : '',
    };

    return NextResponse.json({ ai_enabled, ai_config: response });
  } catch (err) {
    console.error('[ai-config] PUT unexpected error:', err);
    return NextResponse.json({ error: 'Erro ao salvar configurações.' }, { status: 500 });
  }
}
