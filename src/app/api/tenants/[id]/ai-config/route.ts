import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/supabase/server';
import { encryptApiKey, decryptApiKey } from '@/lib/crypto';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: tenant, error } = await supabase.from('tenants').select('id, ai_config, ai_enabled').eq('id', id).single();

    if (error) {
      console.error(`[ai-config] GET query error:`, error.message);
      return NextResponse.json({ error: 'Erro ao carregar configurações.' }, { status: 500 });
    }
    if (!tenant) {
      console.error(`[ai-config] GET tenant not found: ${id}`);
      return NextResponse.json({ error: 'Tenant não encontrado.' }, { status: 404 });
    }

    const config = (tenant.ai_config || {}) as Record<string, unknown>;
    const decrypted = {
      ...config,
      custom_api_key: config.custom_api_key ? decryptApiKey(config.custom_api_key as string) : '',
      gemini_custom_api_key: config.gemini_custom_api_key ? decryptApiKey(config.gemini_custom_api_key as string) : '',
    };

    return NextResponse.json({ ai_enabled: tenant.ai_enabled, ai_config: decrypted });
  } catch (err) {
    console.error('[ai-config] GET unexpected error:', err);
    return NextResponse.json({ error: 'Erro ao carregar configurações.' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: tenant, error } = await supabase.from('tenants').select('id').eq('id', id).single();

    if (error) {
      console.error(`[ai-config] PUT query error:`, error.message);
      return NextResponse.json({ error: 'Erro ao salvar configurações.' }, { status: 500 });
    }
    if (!tenant) {
      console.error(`[ai-config] PUT tenant not found: ${id}`);
      return NextResponse.json({ error: 'Tenant não encontrado.' }, { status: 404 });
    }

    const body = await request.json();
    const { ai_enabled, ai_config } = body;

    const config = { ...(ai_config || {}) } as Record<string, unknown>;

    if (config.custom_api_key) {
      config.custom_api_key = encryptApiKey(config.custom_api_key as string);
    }
    if (config.gemini_custom_api_key) {
      config.gemini_custom_api_key = encryptApiKey(config.gemini_custom_api_key as string);
    }

    const { error: updateError } = await supabase.from('tenants').update({ ai_enabled, ai_config: config }).eq('id', id);
    if (updateError) {
      console.error(`[ai-config] PUT update error:`, updateError.message);
      return NextResponse.json({ error: 'Erro ao salvar configurações.' }, { status: 500 });
    }

    const response = {
      ...config,
      custom_api_key: config.custom_api_key ? decryptApiKey(config.custom_api_key as string) : '',
      gemini_custom_api_key: config.gemini_custom_api_key ? decryptApiKey(config.gemini_custom_api_key as string) : '',
    };

    return NextResponse.json({ ai_enabled, ai_config: response });
  } catch (err) {
    console.error('[ai-config] PUT unexpected error:', err);
    return NextResponse.json({ error: 'Erro ao salvar configurações.' }, { status: 500 });
  }
}
