
// src/ai/flows/generate-solution.ts
'use server';
/**
 * @fileOverview A flow that generates solutions to Anime Eternal game problems.
 *
 * - generateSolution - A function that generates a potential solution to a described problem.
 * - GenerateSolutionInput - The input type for the generateSolution function.
 * - GenerateSolutionOutput - The return type for the generateSolution function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { getGameData, getUserProfileJson } from '@/firebase/firestore/data';


const getGameDataTool = ai.defineTool(
  {
    name: 'getGameData',
    description: 'Get information about game content like powers, NPCs, pets, accessories, or dungeons from a specific world.',
    inputSchema: z.object({
      worldName: z.string().describe('The name of the world to search in (e.g., "World 1", "Windmill Island").'),
      category: z.string().describe('The category of information to get (e.g., "powers", "npcs", "pets", "accessories", "dungeons").'),
      itemName: z.string().optional().describe('The specific name of the item to look for (e.g., "Grand Elder Power"). Be flexible; if an exact match fails, try a partial name.'),
    }),
    outputSchema: z.unknown(),
  },
  async ({ worldName, category, itemName }) => {
    return await getGameData(worldName, category, itemName);
  }
);

const getUserProfileTool = ai.defineTool(
    {
        name: 'getUserProfile',
        description: 'Get the current user\'s profile, including their stats and all equipped items, to provide personalized advice and calculations.',
        inputSchema: z.object({}), // No input needed, it gets the current user automatically
        outputSchema: z.unknown(),
    },
    async () => {
        return await getUserProfileJson();
    }
)


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

const StructuredResponseSchema = z
    .string()
    .describe(
      'Uma string JSON de um array de objetos. Cada objeto deve ter: `marcador` ("texto_introdutorio", "inicio", "meio", "fim"), `titulo` (string), e `conteudo` (string, formatado em Markdown).'
    );

const GenerateSolutionOutputSchema = z.object({
  generalResponse: StructuredResponseSchema,
  personalizedResponse: StructuredResponseSchema,
});


export type GenerateSolutionOutput = z.infer<typeof GenerateSolutionOutputSchema>;

export async function generateSolution(input: GenerateSolutionInput): Promise<GenerateSolutionOutput> {
  return generateSolutionFlow(input);
}

export async function generateSolutionStream(input: GenerateSolutionInput) {
    try {
        const { stream } = await prompt.stream(input);
        
        return new ReadableStream({
            async start(controller) {
                let accumulatedContent = { generalResponse: '', personalizedResponse: '' };

                for await (const chunk of stream) {
                    if (chunk.output?.generalResponse) {
                        accumulatedContent.generalResponse = chunk.output.generalResponse;
                    }
                    if (chunk.output?.personalizedResponse) {
                        accumulatedContent.personalizedResponse = chunk.output.personalizedResponse;
                    }

                    controller.enqueue(new TextEncoder().encode(JSON.stringify(accumulatedContent)));
                }

                controller.close();
            }
        });
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


export const prompt = ai.definePrompt({
  name: 'generateSolutionPrompt',
  input: {schema: GenerateSolutionInputSchema},
  output: {schema: GenerateSolutionOutputSchema},
  tools: [getGameDataTool, getUserProfileTool],
  prompt: `Você é um assistente especialista no jogo Anime Eternal. Sua tarefa é fornecer DUAS respostas para a pergunta do usuário: uma geral e uma personalizada.

**ESTRUTURA DA RESPOSTA (JSON OBRIGATÓRIO):**
Sua resposta DEVE ser um único objeto JSON com duas chaves: \`generalResponse\` e \`personalizedResponse\`.
O valor de cada chave DEVE ser uma string JSON de um array de objetos.

**Estrutura de cada objeto JSON dentro do array:**
- \`marcador\`: Use "texto_introdutorio", "meio", ou "fim".
- \`titulo\`: O título da seção (ex: "Solução Direta", "Justificativa").
- \`conteudo\`: O conteúdo da seção em formato Markdown.

---

### TAREFA 1: Gerar a \`generalResponse\`

- **FOCO:** Use APENAS o \`wikiContext\` e a ferramenta \`getGameData\`.
- **OBJETIVO:** Fornecer uma resposta completa, imparcial e baseada nos dados brutos do jogo.
- **REGRAS:**
    1.  Comece com \`marcador: "texto_introdutorio"\` para a resposta direta.
    2.  Use \`marcador: "meio"\` para detalhes e justificativas.
    3.  Se a pergunta for sobre "DPS para sair do mundo", use a regra da comunidade: HP do NPC Rank S do mundo atual, dividido por 10.
    4.  Se o \`wikiContext\` não tiver a resposta, indique isso claramente.

---

### TAREFA 2: Gerar a \`personalizedResponse\`

- **FOCO:** Use a ferramenta \`getUserProfile\` para obter os dados do jogador.
- **OBJETIVO:** Fornecer uma resposta curta e direta, aplicando a lógica do jogo aos dados específicos do usuário.
- **REGRAS:**
    *   **Se a ferramenta \`getUserProfile\` retornar dados:**
        *   **Para Cálculos (tempo, dano, etc.):** Use as estatísticas do perfil para fazer o cálculo exato e apresentá-lo na seção de conteúdo.
        *   **Para Estratégias ("o que fazer?"):** Compare os itens do perfil com os itens mencionados na pergunta. Sua resposta deve focar no que o usuário **precisa obter**, listando itens que ele **não tem**.
    *   **Se a ferramenta \`getUserProfile\` retornar um array vazio ou um erro:**
        *   A \`personalizedResponse\` DEVE ser uma string JSON de um array vazio: \`[]\`. NÃO gere nenhuma mensagem para o usuário.

---

### CONTEXTO PARA AMBAS AS TAREFAS

**Regras Gerais de Formatação e Cálculo:**
- A gamepass "fast click" dá ao jogador 4 cliques por segundo. DPS total = (Dano * 4).
- Use a notação científica do jogo ao apresentar números (consulte o artigo "Abreviações de Notação Científica").
- O dano de lutadores JÁ ESTÁ incluído no DPS do jogo. NÃO o adicione novamente.

INÍCIO DO CONTEÚDO DO WIKI (PARA TAREFA 1)
{{{wikiContext}}}
FIM DO CONTEÚDO DO WIKI

{{#if history}}
HISTÓRICO DA CONVERSA:
{{#each history}}
- {{role}}: {{content}}
{{/each}}
{{/if}}

Descrição do Problema: {{{problemDescription}}}`,
});


const generateSolutionFlow = ai.defineFlow(
  {
    name: 'generateSolutionFlow',
    inputSchema: GenerateSolutionInputSchema,
    outputSchema: GenerateSolutionOutputSchema,
  },
  async input => {
    const fallbackResponse = {
        generalResponse: JSON.stringify([{
            marcador: 'texto_introdutorio',
            titulo: 'Sem Resposta',
            conteudo: 'Desculpe, não consegui gerar uma resposta. Por favor, tente reformular sua pergunta.'
        }]),
        personalizedResponse: JSON.stringify([])
    };

    try {
      const {output} = await prompt(input);
      if (!output || !output.generalResponse) {
        return fallbackResponse;
      }
      return {
        generalResponse: output.generalResponse,
        personalizedResponse: output.personalizedResponse || JSON.stringify([])
      };
    } catch (error) {
      console.error("Erro no fluxo de geração de solução:", error);
      return fallbackResponse;
    }
  }
);
