'use server';
/**
 * @fileOverview Um fluxo que extrai estatísticas do jogador de um screenshot do jogo.
 *
 * - extractStatsFromImage - A função principal que lida com a extração.
 * - ExtractStatsFromImageInput - O tipo de entrada para a função.
 * - ExtractStatsFromImageOutput - O tipo de retorno para a função.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const ExtractStatsFromImageInputSchema = z.object({
  image: z.string().describe("Um screenshot do jogo como um data URI."),
});
export type ExtractStatsFromImageInput = z.infer<typeof ExtractStatsFromImageInputSchema>;

const ExtractStatsFromImageOutputSchema = z.object({
  currentWorld: z.string().optional().describe('O mundo atual do jogador (ex: "Mundo 10").'),
  rank: z.string().optional().describe('O rank do jogador (ex: "115").'),
  totalDamage: z.string().optional().describe('O dano total por segundo (DPS) do jogador (ex: "1.5sx").'),
  energyGain: z.string().optional().describe('O ganho de energia por clique do jogador (ex: "87.04O").'),
});
export type ExtractStatsFromImageOutput = z.infer<typeof ExtractStatsFromImageOutputSchema>;

export async function extractStatsFromImage(input: ExtractStatsFromImageInput): Promise<ExtractStatsFromImageOutput> {
  return extractStatsFromImageFlow(input);
}

const prompt = ai.definePrompt({
  name: 'extractStatsFromImagePrompt',
  input: { schema: ExtractStatsFromImageInputSchema },
  output: { schema: ExtractStatsFromImageOutputSchema },
  prompt: `Você é um especialista em OCR (Reconhecimento Óptico de Caracteres) para o jogo Anime Eternal. Sua tarefa é analisar a imagem fornecida e extrair as seguintes estatísticas do jogador:

1.  **Mundo Atual:** Procure por texto que indique o mundo, como "Mundo X".
2.  **Rank:** Procure pelo valor numérico associado ao Rank.
3.  **Dano Total (DPS):** Procure pelo valor de "Dano".
4.  **Ganho de Energia:** Procure pelo valor de "Energia/clique".

Se uma informação não estiver claramente visível, deixe o campo correspondente vazio.

Imagem para análise:
{{media url=image}}
`,
});

const extractStatsFromImageFlow = ai.defineFlow(
  {
    name: 'extractStatsFromImageFlow',
    inputSchema: ExtractStatsFromImageInputSchema,
    outputSchema: ExtractStatsFromImageOutputSchema,
  },
  async (input) => {
    const fallbackResponse = {
      currentWorld: '',
      rank: '',
      totalDamage: '',
      energyGain: ''
    };

    try {
      const { output } = await prompt(input);
      if (!output) {
        return fallbackResponse;
      }
      return output;
    } catch (error) {
      console.error("Erro no fluxo de extração de estatísticas:", error);
      return fallbackResponse;
    }
  }
);
