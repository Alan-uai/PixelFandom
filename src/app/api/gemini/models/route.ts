import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 3600;

interface GeminiApiModel {
  name: string;
  displayName: string;
  description?: string;
  inputTokenLimit?: number;
  outputTokenLimit?: number;
  supportedGenerationMethods: string[];
}

interface GeminiModelsResponse {
  models?: GeminiApiModel[];
}

export async function GET() {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'GEMINI_API_KEY not configured', fallback: getFallbackModels() },
        { status: 503 }
      );
    }

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`,
      { signal: AbortSignal.timeout(10_000) }
    );

    if (!res.ok) {
      throw new Error(`Gemini API error: ${res.status}`);
    }

    const data: GeminiModelsResponse = await res.json();
    const textModels = (data.models || [])
      .filter((m) => m.supportedGenerationMethods.includes('generateContent'))
      .map((m) => ({
        id: m.name.replace('models/', ''),
        name: m.displayName || m.name.replace('models/', ''),
        context_length: m.inputTokenLimit || 1_000_000,
      }))
      .sort((a, b) => a.id.localeCompare(b.id));

    if (textModels.length === 0) {
      return NextResponse.json(getFallbackModels(), {
        headers: { 'Cache-Control': 'public, max-age=3600, s-maxage=3600' },
      });
    }

    return NextResponse.json(textModels, {
      headers: { 'Cache-Control': 'public, max-age=3600, s-maxage=3600' },
    });
  } catch (err) {
    console.error('Failed to fetch Gemini models:', err);
    return NextResponse.json(getFallbackModels(), { status: 503 });
  }
}

function getFallbackModels() {
  return [
    { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash', context_length: 1_000_000 },
    { id: 'gemini-2.0-flash-lite', name: 'Gemini 2.0 Flash-Lite', context_length: 1_000_000 },
    { id: 'gemini-2.0-pro', name: 'Gemini 2.0 Pro', context_length: 2_000_000 },
    { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash', context_length: 1_000_000 },
    { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro', context_length: 2_000_000 },
  ];
}
