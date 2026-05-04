'use server';

/**
 * @fileOverview A flow that summarizes the content of a wiki page using AI.
 *
 * - summarizeWikiContent - A function that handles the summarization process.
 * - SummarizeWikiContentInput - The input type for the summarizeWikiContent function.
 * - SummarizeWikiContentOutput - The return type for the summarizeWikiContent function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SummarizeWikiContentInputSchema = z.object({
  wikiContent: z
    .string()
    .describe('The content of the wiki page to summarize.'),
  topic: z.string().optional().describe('The topic of the wiki page.'),
});
export type SummarizeWikiContentInput = z.infer<typeof SummarizeWikiContentInputSchema>;

const SummarizeWikiContentOutputSchema = z.object({
  summary: z.string().describe('The summary of the wiki content.'),
});
export type SummarizeWikiContentOutput = z.infer<typeof SummarizeWikiContentOutputSchema>;

export async function summarizeWikiContent(input: SummarizeWikiContentInput): Promise<SummarizeWikiContentOutput> {
  return summarizeWikiContentFlow(input);
}

const prompt = ai.definePrompt({
  name: 'summarizeWikiContentPrompt',
  input: {schema: SummarizeWikiContentInputSchema},
  output: {schema: SummarizeWikiContentOutputSchema},
  prompt: `You are an AI assistant that summarizes wiki content.  Provide a concise summary of the following wiki content.  The summary should be no more than 3 sentences.

Topic: {{topic}}

Wiki Content: {{{wikiContent}}}`,
});

const summarizeWikiContentFlow = ai.defineFlow(
  {
    name: 'summarizeWikiContentFlow',
    inputSchema: SummarizeWikiContentInputSchema,
    outputSchema: SummarizeWikiContentOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
