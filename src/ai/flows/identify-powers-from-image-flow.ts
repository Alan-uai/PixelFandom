'use server';
import { z } from 'zod';
import { chatStructured } from '@/lib/openrouter-client';
import { allGameData } from '@/lib/game-data-context';

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

const SYSTEM_PROMPT = `Você é um especialista em análise de imagem para o jogo Anime Eternal. Sua tarefa é analisar um ou mais screenshots da tela de um jogador e identificar o NOME e a CATEGORIA de cada item.

**PROCESSO:**

1. Para cada item na imagem, extraia seu nome exato.
2. Determine a categoria do item (como "powers", "auras", "pets", "weapons", "index", "obelisks", "rank").
3. Use o **CONHECIMENTO DE ITENS** abaixo como referência principal para garantir que os nomes e categorias extraídos estão corretos e correspondem aos itens oficiais do jogo.
4. Retorne uma lista JSON de objetos, onde cada objeto contém "name" e "category". Não inclua duplicatas na lista final.

---
INÍCIO DO CONHECIMENTO DE ITENS
${allItemsKnowledgeContext}
---
FIM DO CONHECIMENTO DE ITENS

Responda em JSON com {items: [{name, category}]}`;

export async function identifyPowersFromImage(input: IdentifyPowersInput): Promise<IdentifyPowersOutput> {
  const imageContents = input.images.map((img, i) => `Imagem ${i + 1}: ${img}`).join('\n');

  const userPrompt = `Agora, analise as seguintes imagens e extraia os nomes e categorias dos itens:\n${imageContents}`;

  try {
    const result = await chatStructured({
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userPrompt },
      ],
      model: 'openai/gpt-4o-mini',
      temperature: 0.3,
      responseFormat: 'json',
    });

    if (!result) {
      return { items: [] };
    }

    const parsed = JSON.parse(result);
    const items = Array.isArray(parsed.items) ? parsed.items : [];
    
    const uniqueItems = items.filter(
      (item: IdentifiedItem, index: number, self: IdentifiedItem[]) => 
        index === self.findIndex((p) => p.name === item.name && p.category === item.category)
    );
    
    return { items: uniqueItems };
  } catch (error) {
    console.error("Erro no fluxo de identificação de itens:", error);
    return { items: [] };
  }
}