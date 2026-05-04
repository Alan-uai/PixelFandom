'use server';
/**
 * @fileOverview Um fluxo que gera um artigo de wiki completo a partir de dados estruturados de um mundo de jogo.
 *
 * - generateWikiArticleFromData - Uma função que lida com o processo de geração do artigo.
 * - GenerateWikiArticleFromDataInput - O tipo de entrada para a função.
 * - GenerateWikiArticleFromDataOutput - O tipo de retorno para a função.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { nanoid } from 'nanoid';

const GenerateWikiArticleFromDataInputSchema = z.object({
  worldName: z.string().describe("O nome do mundo, por exemplo, 'World 20 - Grand Elder'."),
  worldDataJson: z.string().describe("Uma string JSON contendo todos os dados do mundo, incluindo subcoleções como powers, npcs, etc."),
});
export type GenerateWikiArticleFromDataInput = z.infer<typeof GenerateWikiArticleFromDataInputSchema>;

// O output é uma string JSON de um objeto WikiArticle
const GenerateWikiArticleFromDataOutputSchema = z.object({
    wikiArticleJson: z.string().describe("Uma string JSON que representa o objeto completo do artigo da wiki gerado."),
});
export type GenerateWikiArticleFromDataOutput = z.infer<typeof GenerateWikiArticleFromDataOutputSchema>;

export async function generateWikiArticleFromData(input: GenerateWikiArticleFromDataInput): Promise<GenerateWikiArticleFromDataOutput> {
  return generateWikiArticleFromDataFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateWikiArticlePrompt',
  input: {schema: GenerateWikiArticleFromDataInputSchema},
  output: {schema: GenerateWikiArticleFromDataOutputSchema},
  prompt: `Você é um especialista em criar artigos de wiki para o jogo "Anime Eternal". Sua tarefa é pegar os dados JSON brutos de um mundo específico e transformá-los em um artigo de wiki bem estruturado no formato de um objeto JSON.

Siga estas regras estritamente:

1.  **Título:** Crie um título claro e informativo, como "Guia do Mundo: {{{worldName}}}".
2.  **ID:** Gere um ID único para o artigo usando o nome do mundo em formato de slug (ex: 'guia-mundo-20').
3.  **Resumo:** Escreva um resumo conciso de 2-3 frases sobre o que os jogadores encontrarão neste mundo, com base nos dados fornecidos (ex: "Explore o {{{worldName}}}, enfrente novos NPCs, e descubra poderes como 'Grand Elder Power'.").
4.  **Conteúdo Principal (Markdown):**
    *   Comece com uma breve introdução sobre o mundo.
    *   Para cada subcoleção nos dados (powers, npcs, pets, etc.), crie uma seção com um cabeçalho (ex: "### Poderes").
    *   Para cada seção, formate os itens em uma tabela Markdown.
    *   **Importante:** Se uma subcoleção não estiver presente ou estiver vazia nos dados JSON, omita completamente essa seção do conteúdo. Não crie tabelas vazias.
    *   Se um poder tiver uma sub-subcoleção 'stats', crie uma tabela separada para esses stats logo após a informação do poder principal.
5.  **Tags:** Gere uma lista de tags relevantes separadas por vírgula. Inclua o nome do mundo, os nomes das subcoleções presentes e termos gerais como "guia", "dicas", "novo mundo".
6.  **Saída Final:** A saída DEVE ser um único objeto JSON contendo o artigo da wiki formatado, encapsulado em uma chave 'wikiArticleJson'. O valor dessa chave deve ser uma string JSON válida, com todas as aspas devidamente escapadas.

**Dados do Mundo para Análise:**
\`\`\`json
{{{worldDataJson}}}
\`\`\`

Estruture o objeto JSON de saída da seguinte forma:
{
  "wikiArticleJson": "{\\"id\\":\\"seu-id-aqui\\",\\"title\\":\\"Seu Título Aqui\\",\\"summary\\":\\"Seu resumo aqui.\\",\\"content\\":\\"### Markdown aqui \\\\n\\\\n| Header |\\\\n|---|\\\\n| data |\\",\\"tags\\":\\"tag1,tag2\\",\\"imageUrl\\":\\"\\",\\"tables\\":{}}"
}
`,
});

const generateWikiArticleFromDataFlow = ai.defineFlow(
  {
    name: 'generateWikiArticleFromDataFlow',
    inputSchema: GenerateWikiArticleFromDataInputSchema,
    outputSchema: GenerateWikiArticleFromDataOutputSchema,
  },
  async ({ worldName, worldDataJson }) => {
    try {
      const { output } = await prompt({ worldName, worldDataJson });
       if (!output || !output.wikiArticleJson) {
        throw new Error('A IA não conseguiu gerar o artigo da wiki.');
      }
      return output;
    } catch (error) {
      console.error("Erro no fluxo de geração de wiki:", error);
      // Retornar um JSON de artigo vazio em caso de erro
      const errorArticle = {
        id: nanoid(),
        title: `Erro ao gerar artigo para ${worldName}`,
        summary: 'Não foi possível gerar o conteúdo.',
        content: `Ocorreu um erro ao tentar gerar o artigo a partir dos dados fornecidos.`,
        tags: 'erro',
        imageUrl: '',
        tables: {}
      }
      return { wikiArticleJson: JSON.stringify(errorArticle) };
    }
  }
);
