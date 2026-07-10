'use server';
import { z } from 'zod';
import { chatStructured, GENERIC_ERROR_MESSAGE } from '@/lib/openrouter-client';

export const GenerateGuideInputSchema = z.object({
  topic: z.string().describe('O tópico do guia (ex: "Melhores armas para iniciantes", "Como derrotar o Goblin Rei").'),
  gameDataContext: z.string().describe('String JSON com dados relevantes do jogo (itens, stats, etc.) que a IA pode referenciar.'),
  tone: z.enum(['guia', 'tutorial', 'analise']).describe('O tom do guia: guia (prático e direto), tutorial (passo a passo), analise (análise detalhada).'),
  targetSlug: z.string().optional().describe('Se fornecido, é um slug de artigo existente — modo de melhoria/reescrita.'),
});
export type GenerateGuideInput = z.infer<typeof GenerateGuideInputSchema>;

export const GenerateGuideOutputSchema = z.object({
  title: z.string().describe('O título do guia, claro e informativo.'),
  summary: z.string().describe('Resumo conciso de 2-3 frases sobre o guia.'),
  content: z.string().describe('JSON string do conteúdo no formato TipTap ProseMirror (doc com content array).'),
  tags: z.string().describe('Tags relevantes separadas por vírgula (3-5 tags).'),
});
export type GenerateGuideOutput = z.infer<typeof GenerateGuideOutputSchema>;

function formatGameDataContext(gameDataContext: string): string {
  try {
    const parsed = JSON.parse(gameDataContext);
    if (!parsed || (Array.isArray(parsed) && parsed.length === 0)) {
      return 'Nenhum dado relevante encontrado.';
    }
    return JSON.stringify(parsed, null, 2);
  } catch {
    return gameDataContext || 'Nenhum dado relevante encontrado.';
  }
}

const SYSTEM_PROMPT = `Você é um especialista em criar guias de jogo completos e práticos para a wiki do jogo "Anime Eternal". Sua tarefa é gerar um artigo de guia bem estruturado no formato JSON.

Regras obrigatórias:

1. **Idioma:** Escreva o guia COMPLETAMENTE em português (PT-BR), exceto nomes próprios de itens, poderes ou mecânicas que devem manter o nome original do jogo.

2. **Formato do Conteúdo (TipTap ProseMirror JSON):** O campo "content" deve ser uma string JSON no formato ProseMirror doc. Exemplo de estrutura:
   \`\`\`json
   {
     "type": "doc",
     "content": [
       { "type": "paragraph", "content": [{ "type": "text", "text": "Texto introdutório..." }] },
       { "type": "heading", "attrs": { "level": 2 }, "content": [{ "type": "text", "text": "Seção Principal" }] },
       { "type": "bulletList", "content": [
         { "type": "listItem", "content": [{ "type": "paragraph", "content": [{ "type": "text", "text": "Item 1" }] }] },
         { "type": "listItem", "content": [{ "type": "paragraph", "content": [{ "type": "text", "text": "Item 2" }] }] }
       ]},
       { "type": "codeBlock", "content": [{ "type": "text", "text": "código ou comando" }] },
       { "type": "heading", "attrs": { "level": 3 }, "content": [{ "type": "text", "text": "Subseção" }] }
     ]
   }
   \`\`\`

3. **Estrutura do guia:** O guia deve ser prático, bem organizado e útil para jogadores. Use:
   - Parágrafos para introdução e explicações
   - Headings level 2 para seções principais
   - Headings level 3 para subseções
   - Bullet lists para listas de itens, requisitos, dicas
   - Code blocks para comandos, coordenadas ou códigos
   - **NÃO** use orderedList, use bulletList com numeração no texto se necessário

4. **Tom:** Adapte o tom conforme solicitado:
   - "guia": direto, prático, focado em dar instruções úteis
   - "tutorial": passo a passo detalhado, ideal para iniciantes
   - "analise": análise aprofundada, comparações, prós e contras

5. **Tags:** Gere 3-5 tags relevantes em minúsculo, separadas por vírgula. Inclua termos que jogadores usariam para buscar (ex: "guia, armas, iniciante, dano, mundo 3").

7. **targetSlug (modo melhoria):** Se um targetSlug for fornecido, significa que você está MELHORANDO um guia existente. Nesse caso, reestruture o conteúdo existente em vez de criar do zero — melhore a organização, adicione informações relevantes dos dados fornecidos e corrija problemas.

8. **Game Data:** Use os dados fornecidos em gameDataContext para enriquecer o guia com informações precisas sobre itens, stats, NPCs, etc. NÃO invente dados.

Responda APENAS com um objeto JSON contendo os campos: title, summary, content, tags.`;

export async function generateGuide(input: GenerateGuideInput): Promise<GenerateGuideOutput> {
  const userPrompt = `Tópico do Guia: ${input.topic}
Tom: ${input.tone}
${input.targetSlug ? `Slug do Artigo Existente (modo melhoria): ${input.targetSlug}` : ''}

Dados do Jogo para Referência:
\`\`\`json
${formatGameDataContext(input.gameDataContext)}
\`\`\`

Gere um guia completo e bem estruturado em português (PT-BR) seguindo as regras do system prompt.`;

  try {
    const result = await chatStructured({
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userPrompt },
      ],
      model: 'minimax/minimax-m2.5:free',
      temperature: 0.4,
      responseFormat: 'json',
    });

    if (!result) {
      return {
        title: `Guia: ${input.topic}`,
        summary: GENERIC_ERROR_MESSAGE,
        content: JSON.stringify({
          type: 'doc',
          content: [{ type: 'paragraph', content: [{ type: 'text', text: GENERIC_ERROR_MESSAGE }] }],
        }),
        tags: 'erro',
      };
    }

    const parsed = JSON.parse(result);
    return {
      title: parsed.title || `Guia: ${input.topic}`,
      summary: parsed.summary || GENERIC_ERROR_MESSAGE,
      content: parsed.content || JSON.stringify({
        type: 'doc',
        content: [{ type: 'paragraph', content: [{ type: 'text', text: GENERIC_ERROR_MESSAGE }] }],
      }),
      tags: parsed.tags || 'guia',
    };
  } catch (error) {
    console.error('Erro no fluxo de geração de guia:', error);
    return {
      title: `Guia: ${input.topic}`,
      summary: GENERIC_ERROR_MESSAGE,
      content: JSON.stringify({
        type: 'doc',
        content: [{ type: 'paragraph', content: [{ type: 'text', text: GENERIC_ERROR_MESSAGE }] }],
      }),
      tags: 'erro',
    };
  }
}
