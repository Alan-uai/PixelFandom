import { z } from 'zod';
import { chatStructured, GENERIC_ERROR_MESSAGE } from '@/lib/openrouter-client';

export const ExtractStatsFromImageInputSchema = z.object({
  image: z.string().describe("Um screenshot do jogo como um data URI."),
});
export type ExtractStatsFromImageInput = z.infer<typeof ExtractStatsFromImageInputSchema>;

export const ExtractStatsFromImageOutputSchema = z.object({
  currentWorld: z.string().optional().describe('O mundo atual do jogador (ex: "Mundo 10").'),
  rank: z.string().optional().describe('O rank do jogador (ex: "115").'),
  totalDamage: z.string().optional().describe('O dano total por segundo (DPS) do jogador (ex: "1.5sx").'),
  energyGain: z.string().optional().describe('O ganho de energia por clique do jogador (ex: "87.04O").'),
});
export type ExtractStatsFromImageOutput = z.infer<typeof ExtractStatsFromImageOutputSchema>;

const SYSTEM_PROMPT = `Você é um especialista em OCR (Reconhecimento Óptico de Caracteres) para o jogo Anime Eternal. Sua tarefa é analisar a imagem fornecida e extrair as seguintes estatísticas do jogador:

1. **Mundo Atual:** Procure por texto que indique o mundo, como "Mundo X".
2. **Rank:** Procure pelo valor numérico associado ao Rank.
3. **Dano Total (DPS):** Procure pelo valor de "Dano".
4. **Ganho de Energia:** Procure pelo valor de "Energia/clique".

Se uma informação não estiver claramente visível, leave o campo correspondente vazio.

Responda em JSON com {currentWorld, rank, totalDamage, energyGain}`;

const fallbackResponse = {
  currentWorld: GENERIC_ERROR_MESSAGE,
  rank: '',
  totalDamage: '',
  energyGain: ''
};

export async function extractStatsFromImage(input: ExtractStatsFromImageInput): Promise<ExtractStatsFromImageOutput> {
  const userPrompt = `Imagem para análise:\n${input.image}`;

  try {
    const result = await chatStructured({
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userPrompt },
      ],
      model: 'minimax/minimax-m2.5:free',
      temperature: 0.3,
      responseFormat: 'json',
    });

    if (!result) {
      return fallbackResponse;
    }

    const parsed = JSON.parse(result);
    return {
      currentWorld: parsed.currentWorld || GENERIC_ERROR_MESSAGE,
      rank: parsed.rank || '',
      totalDamage: parsed.totalDamage || '',
      energyGain: parsed.energyGain || '',
    };
  } catch (error) {
    console.error("Erro no fluxo de extração de estatísticas:", error);
    return { ...fallbackResponse, currentWorld: GENERIC_ERROR_MESSAGE };
  }
}