'use server';
import { z } from 'zod';
import { chatStructured } from '@/lib/openrouter-client';
import { nanoid } from 'nanoid';

const GenerateWikiArticleFromDataInputSchema = z.object({
  worldName: z.string().describe("O nome do mundo, por exemplo, 'World 20 - Grand Elder'."),
  worldDataJson: z.string().describe("Uma string JSON contendo todos os dados do mundo, incluindo subcoleções como powers, npcs, etc."),
});
export type GenerateWikiArticleFromDataInput = z.infer<typeof GenerateWikiArticleFromDataInputSchema>;

const GenerateWikiArticleFromDataOutputSchema = z.object({
    wikiArticleJson: z.string().describe("Uma string JSON que representa o objeto completo do artigo da wiki gerado."),
});
export type GenerateWikiArticleFromDataOutput = z.infer<typeof GenerateWikiArticleFromDataOutputSchema>;

const SYSTEM_PROMPT = `Você é um especialista em criar artigos de wiki para o jogo "Anime Eternal". Sua tarefa é pegar os dados JSON brutos de um mundo específico e transformá-los em um artigo de wiki bem estruturado no formato de um objeto JSON.

Siga estas regras estritamente:

1. **Título:** Crie um título claro e informativo, como "Guia do Mundo: {worldName}".
2. **ID:** Gere um ID único para o artigo usando o nome do mundo em formato de slug (ex: 'guia-mundo-20').
3. **Resumo:** Escreva um resumo conciso de 2-3 frases sobre o que os jogadores encontrarão neste mundo, com base nos dados fornecidos.
4. **Conteúdo Principal (Markdown):**
   * Comece com uma breve introdução sobre o mundo.
   * Para cada subcoleção nos dados (powers, npcs, pets, etc.), crie uma seção com um cabeçalho (ex: "### Poderes").
   * Para cada seção, formate os itens em uma tabela Markdown.
   * **Importante:** Se uma subcoleção não estiver presente ou estiver vazia nos dados JSON, omita completamente essa seção do conteúdo. Não crie tabelas vazias.
   * Se um poder tiver uma sub-subcoleção 'stats', crie uma tabela separada para esses stats logo após a informação do poder principal.
5. **Tags:** Gere uma lista de tags relevantes separadas por vírgula. Inclua o nome do mundo, os nomes das subcoleções presentes e termos gerais como "guia", "dicas", "novo mundo".
6. **Saída Final:** A saída DEVE ser um único objeto JSON contendo o artigo da wiki formatado, encapsulado em uma chave 'wikiArticleJson'. O valor dessa chave deve ser uma string JSON válida.

Responda em JSON com {wikiArticleJson: "{\"id\":\"...\",\"title\":\"...\",\"summary\":\"...\",\"content\":\"...\",\"tags\":\"...\",\"imageUrl\":\"\",\"tables\":{}}"}`;

export async function generateWikiArticleFromData(input: GenerateWikiArticleFromDataInput): Promise<GenerateWikiArticleFromDataOutput> {
  const userPrompt = `**Dados do Mundo para Análise:**
\`\`\`json
${input.worldDataJson}
\`\`\`

Estrutue o objeto JSON de saída.`;

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
      throw new Error('A IA não conseguiu gerar o artigo da wiki.');
    }

    const parsed = JSON.parse(result);
    return { wikiArticleJson: parsed.wikiArticleJson };
  } catch (error) {
    console.error("Erro no fluxo de geração de wiki:", error);
    const errorArticle = {
      id: nanoid(),
      title: `Erro ao gerar artigo para ${input.worldName}`,
      summary: 'Não foi possível gerar o conteúdo.',
      content: `Ocorreu um erro ao tentar gerar o artigo a partir dos dados fornecidos.`,
      tags: 'erro',
      imageUrl: '',
      tables: {}
    };
    return { wikiArticleJson: JSON.stringify(errorArticle) };
  }
}