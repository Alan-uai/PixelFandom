const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta';
const VISION_MODEL = 'gemini-2.0-flash';

export interface IdentifiedItem {
  item_name: string;
  category: string;
  description: string;
  confidence: number;
}

const IDENTIFY_PROMPT = `You are a game-wiki item identifier. Look at the image and identify the game item, character, enemy, boss, weapon, armor or resource shown.

Return ONLY a JSON object with this exact shape (no markdown, no extra text):
{
  "item_name": string,      // best guess of the exact in-game name, preserving original casing/language
  "category": string,       // one of: weapon | armor | enemy | boss | character | item | resource | other
  "description": string,    // one short sentence describing what it is
  "confidence": number      // 0 to 1, how sure you are
}`;

export async function identifyGameItem(
  imageBase64: string,
  mimeType: string,
  apiKey?: string,
): Promise<IdentifiedItem> {
  const key = apiKey || process.env.GEMINI_API_KEY;
  if (!key) throw new Error('GEMINI_API_KEY not set');

  const body = {
    contents: [
      {
        role: 'user',
        parts: [
          { text: IDENTIFY_PROMPT },
          { inline_data: { mime_type: mimeType, data: imageBase64 } },
        ],
      },
    ],
    generationConfig: {
      temperature: 0.2,
      maxOutputTokens: 1024,
      responseMimeType: 'application/json',
    },
  };

  const res = await fetch(`${GEMINI_API_BASE}/models/${VISION_MODEL}:generateContent?key=${key}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text().catch(() => '');
    throw new Error(`Gemini vision failed (${res.status}): ${err.slice(0, 300)}`);
  }

  const json = await res.json();
  const text = json?.candidates?.[0]?.content?.parts?.[0]?.text || '';
  let parsed: Partial<IdentifiedItem>;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error('Gemini vision returned unparseable output');
  }

  return {
    item_name: String(parsed.item_name || '').trim(),
    category: String(parsed.category || 'other').trim(),
    description: String(parsed.description || '').trim(),
    confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 0,
  };
}
