
'use server';
/**
 * @fileOverview Um fluxo que identifica itens do jogo (poderes, armas, pets, etc.) e suas categorias a partir de um screenshot.
 *
 * - identifyPowersFromImage - A função principal que lida com a identificação.
 * - IdentifyPowersInput - O tipo de entrada para a função.
 * - IdentifyPowersOutput - O tipo de retorno para a função.
 * - IdentifiedItem - O tipo para um único item identificado, incluindo seu nome e categoria.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { allGameData } from '@/lib/game-data-context';

// Gera um contexto de string com todos os itens conhecidos para a IA.
const allItemsKnowledgeContext = allGameData.flatMap(world => {
    const worldName = world.name;
    const subcollections = ['powers', 'auras', 'pets', 'weapons', 'index', 'obelisks', 'rank'];
    return subcollections.flatMap(category => 
        (world[category] || []).flatMap((item: any) => {
            if (item.stats && Array.isArray(item.stats)) {
                return item.stats.map((stat: any) => `${stat.name} (Categoria: ${category}, Mundo: ${worldName})`);
            }
            return `${item.name} (Categoria: ${category}, Mundo: ${worldName})`;
        })
    );
}).join('\n');


const IdentifiedItemSchema = z.object({
  name: z.string().describe('O nome exato do item identificado na imagem.'),
  category: z.string().describe('A categoria do item (ex: "powers", "pets", "auras", "weapons").'),
});
export type IdentifiedItem = z.infer<typeof IdentifiedItemSchema>;

const IdentifyPowersInputSchema = z.object({
  images: z.array(z.string()).describe("Uma lista de screenshots do jogo, como data URIs."),
});
export type IdentifyPowersInput = z.infer<typeof IdentifyPowersInputSchema>;

const IdentifyPowersOutputSchema = z.object({
  items: z.array(IdentifiedItemSchema).describe('Uma lista de todos os itens únicos identificados nas imagens, com seus nomes e categorias.'),
});
export type IdentifyPowersOutput = z.infer<typeof IdentifyPowersOutputSchema>;


export async function identifyPowersFromImage(input: IdentifyPowersInput): Promise<IdentifyPowersOutput> {
  return identifyPowersFlow(input);
}


export const prompt = ai.definePrompt({
  name: 'identifyItemsPrompt',
  input: { schema: IdentifyPowersInputSchema },
  output: { schema: IdentifyPowersOutputSchema },
  outputFormat: "json",
  prompt: `Você é um especialista em análise de imagem para o jogo Anime Eternal. Sua tarefa é analisar um ou mais screenshots da tela de um jogador e identificar o NOME e a CATEGORIA de cada item.

**PROCESSO:**

1.  Para cada item na imagem, extraia seu nome exato.
2.  Determine a categoria do item (como "powers", "auras", "pets", "weapons", "index", "obelisks", "rank").
3.  Use o **CONHECIMENTO DE ITENS** abaixo como referência principal para garantir que os nomes e categorias extraídos estão corretos e correspondem aos itens oficiais do jogo.
4.  Retorne uma lista JSON de objetos, onde cada objeto contém "name" e "category". Não inclua duplicatas na lista final.

---
INÍCIO DO CONHECIMENTO DE ITENS
${allItemsKnowledgeContext}
---
FIM DO CONHECIMENTO DE ITENS

Agora, analise as seguintes imagens e extraia os nomes e categorias dos itens:
{{#each images}}
{{media url=this}}
{{/each}}
`,
});


const identifyPowersFlow = ai.defineFlow(
  {
    name: 'identifyItemsFlow',
    inputSchema: IdentifyPowersInputSchema,
    outputSchema: IdentifyPowersOutputSchema,
  },
  async (input) => {
    try {
      const { output } = await prompt(input);
      if (!output || !Array.isArray(output.items)) {
         console.warn("⚠️ IA retornou saída inválida, substituindo por lista vazia.");
        return { items: [] };
      }
      // Simples filtro de duplicatas para garantir
      const uniqueItems = output.items.filter(
        (item, index, self) => index === self.findIndex((p) => p.name === item.name && p.category === item.category)
      );
      return { items: uniqueItems };
    } catch (error) {
      console.error("Erro no fluxo de identificação de itens:", error);
      return { items: [] };
    }
  }
);
