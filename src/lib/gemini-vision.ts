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

export interface SafetyResult {
  safe: boolean;
  categories: string[];
  reason: string;
}

const SAFETY_PROMPT = `You are a strict content moderator for a game wiki assistant. Inspect the image and decide if it contains ANY unsafe content.

Unsafe categories (mark as unsafe if ANY is present):
- gore (blood, corpses, dead bodies, mutilation, extreme wounds)
- violence (graphic injury, accidents, crashes with visible harm)
- sexual (nudity, sexual acts, sexually explicit)
- hate / self-harm
- illegal / disturbing

Return ONLY a JSON object, no markdown:
{
  "safe": boolean,           // true if NONE of the unsafe categories are present
  "categories": string[],    // which unsafe categories were found (empty if safe)
  "reason": string           // one short sentence, in English, explaining the decision
}`;

export async function checkImageSafety(
  imageBase64: string,
  mimeType: string,
  apiKey?: string,
): Promise<SafetyResult> {
  const key = apiKey || process.env.GEMINI_API_KEY;
  if (!key) throw new Error('GEMINI_API_KEY not set');

  const body = {
    contents: [
      {
        role: 'user',
        parts: [
          { text: SAFETY_PROMPT },
          { inline_data: { mime_type: mimeType, data: imageBase64 } },
        ],
      },
    ],
    generationConfig: {
      temperature: 0,
      maxOutputTokens: 512,
      responseMimeType: 'application/json',
    },
  };

  const res = await fetch(`${GEMINI_API_BASE}/models/${VISION_MODEL}:generateContent?key=${key}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    // On moderation failure, fail safe (treat as unsafe to protect users).
    return { safe: false, categories: ['moderation_error'], reason: 'Não foi possível moderar a imagem.' };
  }

  const json = await res.json();
  const text = json?.candidates?.[0]?.content?.parts?.[0]?.text || '';
  try {
    const parsed = JSON.parse(text);
    return {
      safe: parsed.safe !== false,
      categories: Array.isArray(parsed.categories) ? parsed.categories : [],
      reason: String(parsed.reason || ''),
    };
  } catch {
    return { safe: false, categories: ['parse_error'], reason: 'Saída de moderação inválida.' };
  }
}

export interface IconMatchResult {
  same: boolean;
  confidence: number;
  note: string;
}

const ICON_COMPARE_PROMPT = `You are comparing two images of game items. The first image is a photo/screenshot the user sent. The second image is the official icon of a candidate item from the wiki database.

Decide whether BOTH images depict the SAME item (same object, same visual identity), considering that the icon may be stylized/clean while the photo is realistic.

Return ONLY a JSON object, no markdown:
{
  "same": boolean,            // true if they clearly represent the same item
  "confidence": number,       // 0 to 1
  "note": string              // one short sentence explaining the decision
}`;

export async function compareItemImages(
  sentBase64: string,
  sentMime: string,
  iconBase64: string,
  iconMime: string,
  apiKey?: string,
): Promise<IconMatchResult> {
  const key = apiKey || process.env.GEMINI_API_KEY;
  if (!key) throw new Error('GEMINI_API_KEY not set');

  const body = {
    contents: [
      {
        role: 'user',
        parts: [
          { text: ICON_COMPARE_PROMPT },
          { inline_data: { mime_type: sentMime, data: sentBase64 } },
          { inline_data: { mime_type: iconMime, data: iconBase64 } },
        ],
      },
    ],
    generationConfig: {
      temperature: 0.1,
      maxOutputTokens: 512,
      responseMimeType: 'application/json',
    },
  };

  const res = await fetch(`${GEMINI_API_BASE}/models/${VISION_MODEL}:generateContent?key=${key}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    return { same: false, confidence: 0, note: 'Não foi possível comparar com o ícone.' };
  }

  const json = await res.json();
  const text = json?.candidates?.[0]?.content?.parts?.[0]?.text || '';
  try {
    const parsed = JSON.parse(text);
    return {
      same: parsed.same === true,
      confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 0,
      note: String(parsed.note || ''),
    };
  } catch {
    return { same: false, confidence: 0, note: 'Saída de comparação inválida.' };
  }
}
