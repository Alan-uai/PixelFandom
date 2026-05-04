'use server';
import { z } from 'zod';
import { chatStructured, GENERIC_ERROR_MESSAGE } from '@/lib/openrouter-client';

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

const SYSTEM_PROMPT = `Você é um engenharia de IA especialista em análise de qualidade de respostas de LLMs para o jogo Anime Eternal. Sua tarefa é analisar uma resposta que foi marcada como negativa por um usuário e fornecer duas coisas:
1. Uma sugestão clara e acionável para um administrador sobre como melhorar o prompt ou os dados.
2. Uma pontuação de reputação para o usuário que enviou o feedback.

**Contexto:**
A IA tem acesso a um prompt principal com regras muito estritas. Analise a resposta negativa à luz dessas regras.

**Regras do Prompt Principal (Resumidas):**
A IA deve sempre responder com JSON válido conforme schemas específicos. Respostas devem ser personalizadas quando possível.

---

**Sua Tarefa:**

1. **Analise a Pergunta do Usuário e a Resposta Negativa abaixo.**
2. **Identifique a Falha Principal.** Determine o motivo mais provável para a resposta ter sido marcada como negativa. (Ex: "Foi genérica", "Não listou itens específicos", "Faltou os cenários de tempo", "Cálculo incorreto").
3. **Gere uma Sugestão Acionável.** Forneça uma sugestão clara para um administrador.
4. **Atribua Pontos de Reputação:** Com base na qualidade do feedback do usuário (quão útil foi para identificar a falha), atribua uma pontuação de 1 a 5.
   * **1 ponto:** O feedback foi vago ou a pergunta original era ambígua, mas ainda assim apontou um descontentamento.
   * **3 pontos:** O feedback apontou uma falha clara e específica na resposta da IA (ex: "a resposta não listou os itens que eu pedi").
   * **5 pontos:** O feedback foi excepcionalmente detalhado, identificou um bug crítico, uma falha de lógica complexa, ou um erro de cálculo que economizará muito tempo de depuração.

---

Responda em JSON com {suggestion, reputationPointsAwarded}`;

export async function analyzeNegativeFeedback(input: AnalyzeNegativeFeedbackInput): Promise<AnalyzeNegativeFeedbackOutput> {
  const userPrompt = `**Pergunta do Usuário:**
"${input.question}"

**Resposta Negativa da IA:**
"${input.negativeResponse}"

Agora, forneça sua análise, sugestão e a pontuação de reputação.`;

  const fallbackResponse = { suggestion: GENERIC_ERROR_MESSAGE, reputationPointsAwarded: 0 };

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
      suggestion: parsed.suggestion || GENERIC_ERROR_MESSAGE,
      reputationPointsAwarded: parsed.reputationPointsAwarded || 0,
    };
  } catch (error) {
    console.error("Erro no fluxo de análise de feedback negativo:", error);
    return { suggestion: GENERIC_ERROR_MESSAGE, reputationPointsAwarded: 0 };
  }
}