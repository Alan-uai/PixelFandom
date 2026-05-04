// src/ai/flows/generate-solution.ts
'use server';
import { z } from 'zod';
import { chat, chatStream } from '@/lib/openrouter-client';
import { getGameDataByWorld, getUserProfileJson } from '@/supabase/game-data';

const MessageSchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string(),
});

const GenerateSolutionInputSchema = z.object({
  problemDescription: z.string().describe('A description of the player is encountering in Anime Eternal.'),
  wikiContext: z.string().describe('The entire content of the game wiki to be used as a knowledge base.'),
  history: z.array(MessageSchema).optional().describe('The previous messages in the conversation.'),
});
export type GenerateSolutionInput = z.infer<typeof GenerateSolutionInputSchema>;

const GenerateSolutionOutputSchema = z.object({
  generalResponse: z.string().describe('Uma string JSON de um array de objetos.'),
  personalizedResponse: z.string().describe('Uma string JSON de um array de objetos.'),
});

export type GenerateSolutionOutput = z.infer<typeof GenerateSolutionOutputSchema>;

const SYSTEM_PROMPT = `Você é um assistente especialista no jogo Anime Eternal. Sua tarefa é fornecer DUAS respostas para a pergunta do usuário: uma geral e uma personalizada.

**ESTRUTURA DA RESPOSTA (JSON OBRIGATÓRIO):**
Sua resposta DEVE ser um único objeto JSON com duas chaves: \`generalResponse\` e \`personalizedResponse\`.
O valor de cada chave DEVE ser uma string JSON de um array de objetos.

**Estrutura de cada objeto JSON dentro do array:**
- \`marcador\`: Use "texto_introdutorio", "meio", ou "fim".
- \`titulo\`: O título da seção (ex: "Solução Direta", "Justificativa").
- \`conteudo\`: O conteúdo da seção em formato Markdown.

---

### TAREFA 1: Gerar a \`generalResponse\`

- **FOCO:** Use APENAS o \`wikiContext\`.
- **OBJETIVO:** Fornecer uma resposta completa, imparcial e baseada nos dados brutos do jogo.
- **REGRAS:**
    1. Comece com \`marcador: "texto_introdutorio"\` para a resposta direta.
    2. Use \`marcador: "meio"\` para detalhes e justificativas.
    3. Se a pergunta for sobre "DPS para sair do mundo", use a regra da comunidade: HP do NPC Rank S do mundo atual, dividido por 10.
    4. Se o \`wikiContext\` não tiver a resposta, indique isso claramente.

---

### TAREFA 2: Gerar a \`personalizedResponse\`

- **OBJETIVO:** Fornecer uma resposta curta e direta, aplicando a lógica do jogo aos dados específicos do usuário.
- **REGRAS:**
    * **Para Cálculos (tempo, dano, etc.):** Use as estatísticas do perfil para fazer o cálculo exato e apresentá-lo na seção de conteúdo.
    * **Para Estratégias ("o que fazer?"):** Compare os itens do perfil com os itens mencionados na pergunta. Sua resposta deve focar no que o usuário **precisa obter**, listando itens que ele **não tem**.
    * **Se não houver dados do usuário:** A \`personalizedResponse\` DEVE ser uma string JSON de um array vazio: \`[]\`. NÃO gere nenhuma mensagem para o usuário.

---

### CONTEXTO PARA AMBAS AS TAREFAS

**Regras Gerais de Formatação e Cálculo:**
- A gamepass "fast click" dá ao jogador 4 cliques por segundo. DPS total = (Dano * 4).
- Use a notação científica do jogo ao apresentar números (consulte o artigo "Abreviações de Notação Científica").
- O dano de lutadores JÁ ESTÁ incluído no DPS do jogo. NÃO o adicione novamente.`;

const fallbackResponse = {
    generalResponse: JSON.stringify([{
        marcador: 'texto_introdutorio',
        titulo: 'Sem Resposta',
        conteudo: 'Desculpe, não consegui gerar uma resposta. Por favor, tente reformular sua pergunta.'
    }]),
    personalizedResponse: JSON.stringify([])
};

async function getUserProfileData() {
  try {
    return await getUserProfileJson();
  } catch {
    return [];
  }
}

async function searchGameData(worldName: string, category: string, itemName?: string) {
  try {
    return await getGameDataByWorld(worldName, category, itemName);
  } catch {
    return null;
  }
}

export async function generateSolution(input: GenerateSolutionInput): Promise<GenerateSolutionOutput> {
  const { problemDescription, wikiContext, history } = input;

  const historyText = history ? history.map(m => `- ${m.role}: ${m.content}`).join('\n') : '';

  const userProfile = await getUserProfileData();
  const userProfileText = userProfile && userProfile.length > 0 
    ? `Dados do perfil do usuário: ${JSON.stringify(userProfile)}`
    : 'Dados do perfil não disponíveis.';

  const userPrompt = `**Regras Gerais:**
${SYSTEM_PROMPT}

---
**INÍCIO DO CONTEÚDO DO WIKI**
${wikiContext}
**FIM DO CONTEÚDO DO WIKI**
---
${historyText ? `**HISTÓRICO DA CONVERSA:**\n${historyText}\n` : ''}
${userProfileText}

---
**Descrição do Problema:** ${problemDescription}`;

  try {
    const result = await chat({
      messages: [
        { role: 'user', content: userPrompt },
      ],
      model: 'openai/gpt-4o-mini',
      temperature: 0.3,
    });

    if (!result) {
      return fallbackResponse;
    }

    const parsed = JSON.parse(result);
    return {
      generalResponse: parsed.generalResponse || fallbackResponse.generalResponse,
      personalizedResponse: parsed.personalizedResponse || fallbackResponse.personalizedResponse,
    };
  } catch (error) {
    console.error("Erro no fluxo de geração de solução:", error);
    return fallbackResponse;
  }
}

export async function generateSolutionStream(input: GenerateSolutionInput) {
  const { problemDescription, wikiContext, history } = input;

  const historyText = history ? history.map(m => `- ${m.role}: ${m.content}`).join('\n') : '';

  const userPrompt = `**Regras Gerais:**
${SYSTEM_PROMPT}

---
**INÍCIO DO CONTEÚDO DO WIKI**
${wikiContext}
**FIM DO CONTEÚDO DO WIKI**
---
${historyText ? `**HISTÓRICO DA CONVERSA:**\n${historyText}\n` : ''}

---
**Descrição do Problema:** ${problemDescription}`;

  try {
    const stream = await chatStream({
      messages: [
        { role: 'user', content: userPrompt },
      ],
      model: 'openai/gpt-4o-mini',
      temperature: 0.3,
    });

    if (!stream) {
      throw new Error('A resposta da IA está vazia.');
    }

    return stream;
  } catch (error) {
    console.error("Erro no fluxo de geração de solução (stream):", error);
    return new ReadableStream({
      start(controller) {
        const errorObject = {
          generalResponse: JSON.stringify([{
            marcador: 'texto_introdutorio',
            titulo: 'Erro',
            conteudo: 'Desculpe, não consegui processar sua pergunta. Tente reformulá-la.'
          }]),
          personalizedResponse: JSON.stringify([])
        };
        controller.enqueue(new TextEncoder().encode(JSON.stringify(errorObject)));
        controller.close();
      }
    });
  }
}