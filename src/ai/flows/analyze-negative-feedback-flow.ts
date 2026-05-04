'use server';
/**
 * @fileOverview Um fluxo que analisa uma resposta negativa da IA e sugere melhorias.
 *
 * - analyzeNegativeFeedback - Uma função que analisa o feedback.
 * - AnalyzeNegativeFeedbackInput - O tipo de entrada para a função.
 * - AnalyzeNegativeFeedbackOutput - O tipo de retorno para a função.
 */

import {ai} from '@/ai/genkit';
import {z} from 'zod';
import { prompt as generateSolutionPrompt } from './generate-solution';

const AnalyzeNegativeFeedbackInputSchema = z.object({
  question: z.string().describe('A pergunta original do usuário.'),
  negativeResponse: z.string().describe('A resposta da IA que foi marcada como negativa.'),
});
export type AnalyzeNegativeFeedbackInput = z.infer<typeof AnalyzeNegativeFeedbackInputSchema>;

const AnalyzeNegativeFeedbackOutputSchema = z.object({
  suggestion: z.string().describe('Uma sugestão para o administrador sobre como melhorar a resposta da IA.'),
  reputationPointsAwarded: z.number().describe('A quantidade de pontos de reputação (1-5) a serem concedidos ao usuário por este feedback.'),
});
export type AnalyzeNegativeFeedbackOutput = z.infer<typeof AnalyzeNegativeFeedbackOutputSchema>;

export async function analyzeNegativeFeedback(input: AnalyzeNegativeFeedbackInput): Promise<AnalyzeNegativeFeedbackOutput> {
  return analyzeNegativeFeedbackFlow(input);
}

// Re-utilizando o prompt principal como a "base de conhecimento" do que é uma boa resposta.
const mainPromptTemplate = generateSolutionPrompt.prompt;

const prompt = ai.definePrompt({
  name: 'analyzeNegativeFeedbackPrompt',
  input: {schema: AnalyzeNegativeFeedbackInputSchema},
  output: {schema: AnalyzeNegativeFeedbackOutputSchema},
  prompt: `Você é um engenheiro de IA especialista em análise de qualidade de respostas de LLMs para o jogo Anime Eternal. Sua tarefa é analisar uma resposta que foi marcada como negativa por um usuário e fornecer duas coisas:
1. Uma sugestão clara e acionável para um administrador sobre como melhorar o prompt ou os dados.
2. Uma pontuação de reputação para o usuário que enviou o feedback.

**Contexto:**
A IA tem acesso a um prompt principal com regras muito estritas. Analise a resposta negativa à luz dessas regras.

**Regras do Prompt Principal (Resumidas):**
${mainPromptTemplate}

---

**Sua Tarefa:**

1.  **Analise a Pergunta do Usuário e a Resposta Negativa abaixo.**
2.  **Identifique a Falha Principal.** Determine o motivo mais provável para a resposta ter sido marcada como negativa. (Ex: "Foi genérica", "Não listou itens específicos", "Faltou os cenários de tempo", "Cálculo incorreto").
3.  **Gere uma Sugestão Acionável.** Forneça uma sugestão clara para um administrador.
4.  **Atribua Pontos de Reputação:** Com base na qualidade do feedback do usuário (quão útil foi para identificar a falha), atribua uma pontuação de 1 a 5.
    *   **1 ponto:** O feedback foi vago ou a pergunta original era ambígua, mas ainda assim apontou um descontentamento.
    *   **3 pontos:** O feedback apontou uma falha clara e específica na resposta da IA (ex: "a resposta não listou os itens que eu pedi").
    *   **5 pontos:** O feedback foi excepcionalmente detalhado, identificou um bug crítico, uma falha de lógica complexa, ou um erro de cálculo que economizará muito tempo de depuração.

---

**Pergunta do Usuário:**
"{{{question}}}"

**Resposta Negativa da IA:**
"{{{negativeResponse}}}"

Agora, forneça sua análise, sugestão e a pontuação de reputação.`,
});

const analyzeNegativeFeedbackFlow = ai.defineFlow(
  {
    name: 'analyzeNegativeFeedbackFlow',
    inputSchema: AnalyzeNegativeFeedbackInputSchema,
    outputSchema: AnalyzeNegativeFeedbackOutputSchema,
  },
  async input => {
    const fallbackResponse = { suggestion: "Não foi possível gerar uma sugestão de melhoria.", reputationPointsAwarded: 0 };
    try {
      const {output} = await prompt(input);
      if (!output || !output.suggestion) {
        return fallbackResponse;
      }
      return output;
    } catch (error) {
      console.error("Erro no fluxo de análise de feedback negativo:", error);
      return { suggestion: "Ocorreu um erro ao analisar o feedback.", reputationPointsAwarded: 0 };
    }
  }
);

    