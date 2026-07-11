import { z } from 'zod';
import { chatStructured, GENERIC_ERROR_MESSAGE } from '@/lib/openrouter-client';

export const ImproveArticleInputSchema = z.object({
  title: z.string().describe('O título atual do artigo.'),
  content: z.string().describe('JSON string do conteúdo atual no formato TipTap ProseMirror doc.'),
  summary: z.string().describe('O resumo atual do artigo.'),
  tags: z.string().describe('Tags atuais separadas por vírgula.'),
  gameDataContext: z.string().describe('String JSON com dados relevantes do jogo para enriquecer o artigo.'),
  tone: z.enum(['guia', 'tutorial', 'analise']).describe('O tom desejado para o artigo reestruturado.'),
});
export type ImproveArticleInput = z.infer<typeof ImproveArticleInputSchema>;

export const ImproveArticleOutputSchema = z.object({
  title: z.string().describe('O título melhorado do artigo.'),
  summary: z.string().describe('O resumo melhorado do artigo (2-3 frases).'),
  content: z.string().describe('JSON string do conteúdo reestruturado no formato TipTap ProseMirror doc.'),
  tags: z.string().describe('Tags relevantes separadas por vírgula (3-5 tags).'),
});
export type ImproveArticleOutput = z.infer<typeof ImproveArticleOutputSchema>;

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

function extractArticleText(contentJson: string): string {
  try {
    const doc = JSON.parse(contentJson);
    if (doc.type !== 'doc' || !Array.isArray(doc.content)) return contentJson;
    const parts: string[] = [];
    const walk = (node: any): void => {
      if (node.text) parts.push(node.text);
      if (node.content && Array.isArray(node.content)) node.content.forEach(walk);
    };
    doc.content.forEach(walk);
    return parts.join(' ') || contentJson;
  } catch {
    return contentJson;
  }
}

const SYSTEM_PROMPT = `Você é um especialista em reestruturar e melhorar artigos de wiki para o jogo "Anime Eternal". Sua tarefa é receber um artigo existente e transformá-lo em um guia completo e bem organizado no formato JSON.

Regras obrigatórias:

1. **Idioma:** Artigos em português (PT-BR). Mantenha nomes próprios de itens/poderes/mecânicas no original do jogo.

2. **Formato do Conteúdo (TipTap ProseMirror JSON):** O campo "content" deve ser uma string JSON no formato ProseMirror doc:
   \`\`\`json
   {
     "type": "doc",
     "content": [
       { "type": "paragraph", "content": [{ "type": "text", "text": "Texto..." }] },
       { "type": "heading", "attrs": { "level": 2 }, "content": [{ "type": "text", "text": "Seção" }] },
       { "type": "bulletList", "content": [
         { "type": "listItem", "content": [{ "type": "paragraph", "content": [{ "type": "text", "text": "Item" }] }] }
       ]},
       { "type": "codeBlock", "content": [{ "type": "text", "text": " código " }] },
       { "type": "heading", "attrs": { "level": 3 }, "content": [{ "type": "text", "text": "Subseção" }] }
     ]
   }
   \`\`\`

3. **Melhorias obrigatórias ao reestruturar:**
   - Melhore a organização: agrupe informações relacionadas, crie seções lógicas com headings (level 2) e subseções (level 3)
   - Adicione referências a dados do jogo: use as informações em gameDataContext para enriquecer stats, nomes de itens, NPCs, etc.
   - **Remova informações duplicadas de stats que deveriam estar em tabelas** — o conteúdo textual não deve listar stats completos; mencione apenas destaques e deixe stats detalhados para as tabelas referenciadas
   - Adicione dicas práticas, observações e contexto que ajudem jogadores
   - Corrija erros de formatação e consistência

4. **Tom:** Adapte o tom conforme solicitado:
   - "guia": direto, prático, focado em instruções úteis
   - "tutorial": passo a passo detalhado para iniciantes
   - "analise": análise aprofundada com comparações e prós/contras

5. **Tags:** Gere 3-5 tags relevantes em minúsculo, separadas por vírgula.

Responda APENAS com um objeto JSON contendo: title, summary, content, tags.`;

export async function improveArticle(input: ImproveArticleInput): Promise<ImproveArticleOutput> {
  const existingText = extractArticleText(input.content);

  const userPrompt = `Artigo Atual:
Título: ${input.title}
Resumo: ${input.summary}
Tags: ${input.tags}


Conteúdo do Artigo:
${existingText}

Dados do Jogo para Enriquecer:
\`\`\`json
${formatGameDataContext(input.gameDataContext)}
\`\`\`

Tom desejado: ${input.tone}

Reestruture este artigo como um guia completo e bem organizado em português (PT-BR). Melhore a estrutura, adicione contexto dos dados fornecidos, remova stats duplicados e crie seções lógicas.`;

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
        title: input.title,
        summary: GENERIC_ERROR_MESSAGE,
        content: input.content,
        tags: input.tags,
      };
    }

    const parsed = JSON.parse(result);
    return {
      title: parsed.title || input.title,
      summary: parsed.summary || input.summary,
      content: parsed.content || input.content,
      tags: parsed.tags || input.tags,
    };
  } catch (error) {
    console.error('Erro no fluxo de melhoria de artigo:', error);
    return {
      title: input.title,
      summary: GENERIC_ERROR_MESSAGE,
      content: input.content,
      tags: input.tags,
    };
  }
}
