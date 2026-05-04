'use server';
/**
 * @fileOverview Um fluxo que converte texto bruto em uma string JSON estruturada, traduzindo cabeçalhos para o inglês.
 *
 * - formatTextToJson - Uma função que lida com o processo de formatação de texto.
 * - FormatTextToJsonInput - O tipo de entrada para a função formatTextToJson.
 * - FormatTextToJsonOutput - O tipo de retorno para a função formatTextToJson.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const FormatTextToJsonInputSchema = z.object({
  rawText: z.string().describe('O texto bruto a ser convertido em JSON.'),
});
export type FormatTextToJsonInput = z.infer<typeof FormatTextToJsonInputSchema>;

const FormatTextToJsonOutputSchema = z.object({
  jsonString: z.string().describe('A string JSON formatada a partir do texto bruto.'),
});
export type FormatTextToJsonOutput = z.infer<typeof FormatTextToJsonOutputSchema>;

export async function formatTextToJson(input: FormatTextToJsonInput): Promise<FormatTextToJsonOutput> {
  return formatTextToJsonFlow(input);
}

const prompt = ai.definePrompt({
  name: 'formatTextToJsonPrompt',
  input: {schema: FormatTextToJsonInputSchema},
  output: {schema: FormatTextToJsonOutputSchema},
  prompt: `Você é um especialista em formatação de dados. Sua tarefa é converter o texto bruto fornecido em uma string JSON estruturada.

Siga estas regras estritamente:
1.  Analise o texto para identificar uma estrutura de tabela (cabeçalhos e linhas de dados).
2.  TRADUZA todos os cabeçalhos para o INGLÊS.
3.  Converta os cabeçalhos traduzidos para o formato camelCase (ex: "Nome do Herói" se torna "heroName").
4.  Use os cabeçalhos em camelCase como as chaves para os objetos JSON.
5.  Formate a saída como uma string JSON de uma lista de objetos.
6.  Se o texto não se parecer com uma tabela ou não puder ser processado, retorne uma string JSON de uma lista vazia: '[]'.
7.  Preserve os valores dos dados exatamente como estão no texto original, a menos que seja um número que precise ser convertido.

Texto Bruto para Análise:
{{{rawText}}}
`,
});

const formatTextToJsonFlow = ai.defineFlow(
  {
    name: 'formatTextToJsonFlow',
    inputSchema: FormatTextToJsonInputSchema,
    outputSchema: FormatTextToJsonOutputSchema,
  },
  async input => {
    try {
      const {output} = await prompt(input);
      if (!output || typeof output.jsonString === 'undefined') {
        return { jsonString: '[]' };
      }
      return output;
    } catch (error) {
      console.error("Erro no fluxo de formatação de texto para JSON:", error);
      return { jsonString: 'Erro ao processar o texto.' };
    }
  }
);
