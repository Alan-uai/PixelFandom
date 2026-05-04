'use server';
import { z } from 'zod';
import { chat, GENERIC_ERROR_MESSAGE } from '@/lib/openrouter-client';

const SummarizeWikiContentInputSchema = z.object({
  wikiContent: z.string().describe('The content of the wiki page to summarize.'),
  topic: z.string().optional().describe('The topic of the wiki page.'),
});
export type SummarizeWikiContentInput = z.infer<typeof SummarizeWikiContentInputSchema>;

const SummarizeWikiContentOutputSchema = z.object({
  summary: z.string().describe('The summary of the wiki content.'),
});
export type SummarizeWikiContentOutput = z.infer<typeof SummarizeWikiContentOutputSchema>;

export async function summarizeWikiContent(input: SummarizeWikiContentInput): Promise<SummarizeWikiContentOutput> {
  const userPrompt = `Summarize the following wiki content in no more than 3 sentences.

Topic: ${input.topic || 'N/A'}

Wiki Content: ${input.wikiContent}`;

  try {
    const result = await chat({
      messages: [
        { role: 'user', content: userPrompt },
      ],
      model: 'minimax/minimax-m2.5:free',
      temperature: 0.3,
    });

    if (!result) {
      return { summary: GENERIC_ERROR_MESSAGE };
    }

    return { summary: result };
  } catch (error) {
    console.error("Erro no fluxo de resumir conteúdo wiki:", error);
    return { summary: GENERIC_ERROR_MESSAGE };
  }
}