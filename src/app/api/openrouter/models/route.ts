import { OPENROUTER_FREE_MODELS } from '@/lib/models';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 3600;

interface OpenRouterModel {
  id: string;
  name: string;
  context_length: number;
  description: string;
  pricing: { prompt: string; completion: string };
}

export async function GET() {
  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (process.env.OPENROUTER_API_KEY) {
      headers['Authorization'] = `Bearer ${process.env.OPENROUTER_API_KEY}`;
    }

    const res = await fetch('https://openrouter.ai/api/v1/models', {
      headers,
      signal: AbortSignal.timeout(10_000),
    });

    if (!res.ok) {
      throw new Error(`OpenRouter API error: ${res.status}`);
    }

    const data = await res.json();
    const models: OpenRouterModel[] = (data.data || []).filter(
      (m: OpenRouterModel) =>
        m.pricing?.prompt === '0' && m.pricing?.completion === '0'
    );

    const sorted = models
      .map((m) => ({
        id: m.id,
        name: m.name,
        context_length: m.context_length,
        description: m.description?.slice(0, 200) || '',
      }))
      .sort((a, b) => a.id.localeCompare(b.id));

    return NextResponse.json(sorted, {
      headers: {
        'Cache-Control': 'public, max-age=3600, s-maxage=3600',
      },
    });
  } catch (err) {
    console.error('Failed to fetch OpenRouter models:', err);
    return NextResponse.json(
      {
        error: 'Failed to fetch models',
        fallback: getFallbackModels(),
      },
      { status: 503 }
    );
  }
}

function getFallbackModels() {
  return OPENROUTER_FREE_MODELS;
}
