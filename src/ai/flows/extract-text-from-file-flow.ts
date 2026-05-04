'use server';
import { z } from 'zod';
import { chatStructured } from '@/lib/openrouter-client';

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

const SYSTEM_PROMPT = `Você é um especialista em extração de dados. Sua tarefa é analisar o arquivo fornecido e extrair seu conteúdo de texto.

Instruções:
- Analise o arquivo e extraia todo o texto visível.
- Se o 'extractionType' for 'markdown', formate o texto extraído como Markdown, preservando a estrutura, como cabeçalhos, listas e parágrafos.
- Se o 'extractionType' for 'json', identifique quaisquer tabelas no arquivo e converta-as em uma string JSON válida. O JSON deve ser uma lista de objetos. Se não houver tabelas, retorne uma string JSON vazia '[]'.
- Seja o mais preciso possível.

Responda em JSON com {extractedText: "..."}`;

export async function extractTextFromFile(input: ExtractTextFromFileInput): Promise<ExtractTextFromFileOutput> {
  const userPrompt = `Arquivo para Análise: ${input.fileDataUri}`;

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
      return { extractedText: '' };
    }

    const parsed = JSON.parse(result);
    return { extractedText: parsed.extractedText || '' };
  } catch (error) {
    console.error("Erro no fluxo de extração de texto:", error);
    return { extractedText: 'Erro ao processar o arquivo.' };
  }
}