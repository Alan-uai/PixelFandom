'use server';
/**
 * @fileOverview Um fluxo que extrai texto de um arquivo (imagem, PDF, etc.) usando um modelo multimodal.
 *
 * - extractTextFromFile - Uma função que lida com o processo de extração de texto.
 * - ExtractTextFromFileInput - O tipo de entrada para a função extractTextFromFile.
 * - ExtractTextFromFileOutput - O tipo de retorno para a função extractTextFromFile.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ExtractTextFromFileInputSchema = z.object({
  fileDataUri: z
    .string()
    .describe(
      "O arquivo como um data URI que deve incluir um tipo MIME e usar codificação Base64. Formato esperado: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  extractionType: z.enum(['markdown', 'json']).describe("O formato de saída desejado: 'markdown' para texto simples ou 'json' para tabelas estruturadas."),
});
export type ExtractTextFromFileInput = z.infer<typeof ExtractTextFromFileInputSchema>;

const ExtractTextFromFileOutputSchema = z.object({
  extractedText: z.string().describe('O texto extraído do arquivo no formato solicitado.'),
});
export type ExtractTextFromFileOutput = z.infer<typeof ExtractTextFromFileOutputSchema>;

export async function extractTextFromFile(input: ExtractTextFromFileInput): Promise<ExtractTextFromFileOutput> {
  return extractTextFromFileFlow(input);
}

const prompt = ai.definePrompt({
  name: 'extractTextFromFilePrompt',
  input: {schema: ExtractTextFromFileInputSchema},
  output: {schema: ExtractTextFromFileOutputSchema},
  prompt: `Você é um especialista em extração de dados. Sua tarefa é analisar o arquivo fornecido e extrair seu conteúdo de texto.

Instruções:
- Analise o arquivo e extraia todo o texto visível.
- Se o 'extractionType' for 'markdown', formate o texto extraído como Markdown, preservando a estrutura, como cabeçalhos, listas e parágrafos.
- Se o 'extractionType' for 'json', identifique quaisquer tabelas no arquivo e converta-as em uma string JSON válida. O JSON deve ser uma lista de objetos. Se não houver tabelas, retorne uma string JSON vazia '[]'.
- Seja o mais preciso possível.

Arquivo para Análise: {{media url=fileDataUri}}`,
});

const extractTextFromFileFlow = ai.defineFlow(
  {
    name: 'extractTextFromFileFlow',
    inputSchema: ExtractTextFromFileInputSchema,
    outputSchema: ExtractTextFromFileOutputSchema,
  },
  async input => {
    try {
      const {output} = await prompt(input);
      if (!output || typeof output.extractedText === 'undefined') {
        return { extractedText: '' };
      }
      return output;
    } catch (error) {
      console.error("Erro no fluxo de extração de texto:", error);
      return { extractedText: 'Erro ao processar o arquivo.' };
    }
  }
);
