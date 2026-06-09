import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/supabase/server';
import { encryptApiKey, decryptApiKey } from '@/lib/crypto';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: tenant, error } = await supabase.from('tenants').select('ai_config, ai_enabled').eq('id', id).single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const config = (tenant?.ai_config || {}) as Record<string, unknown>;

  const decrypted = {
    ...config,
    custom_api_key: config.custom_api_key ? decryptApiKey(config.custom_api_key as string) : '',
    gemini_custom_api_key: config.gemini_custom_api_key ? decryptApiKey(config.gemini_custom_api_key as string) : '',
  };

  return NextResponse.json({ ai_enabled: tenant.ai_enabled, ai_config: decrypted });
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const body = await request.json();
  const { ai_enabled, ai_config } = body;

  const config = { ...(ai_config || {}) } as Record<string, unknown>;

  if (config.custom_api_key) {
    config.custom_api_key = encryptApiKey(config.custom_api_key as string);
  }
  if (config.gemini_custom_api_key) {
    config.gemini_custom_api_key = encryptApiKey(config.gemini_custom_api_key as string);
  }

  const { error } = await supabase.from('tenants').update({ ai_enabled, ai_config: config }).eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const response = {
    ...config,
    custom_api_key: config.custom_api_key ? decryptApiKey(config.custom_api_key as string) : '',
    gemini_custom_api_key: config.gemini_custom_api_key ? decryptApiKey(config.gemini_custom_api_key as string) : '',
  };

  return NextResponse.json({ ai_enabled, ai_config: response });
}
