'use server';
/**
 * @fileOverview A flow that generates relevant tags for a wiki article based on its content.
 *
 * - generateTags - A function that handles the tag generation process.
 * - GenerateTagsInput - The input type for the generateTags function.
 * - GenerateTagsOutput - The return type for the generateTags function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateTagsInputSchema = z.object({
  title: z.string().describe('The title of the wiki article.'),
  summary: z.string().describe('The summary of the wiki article.'),
  content: z.string().describe('The main content of the wiki article.'),
});
export type GenerateTagsInput = z.infer<typeof GenerateTagsInputSchema>;

const GenerateTagsOutputSchema = z.object({
  tags: z.string().describe('A comma-separated string of relevant tags for the article.'),
});
export type GenerateTagsOutput = z.infer<typeof GenerateTagsOutputSchema>;

export async function generateTags(input: GenerateTagsInput): Promise<GenerateTagsOutput> {
  return generateTagsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateTagsPrompt',
  input: {schema: GenerateTagsInputSchema},
  output: {schema: GenerateTagsOutputSchema},
  prompt: `You are an expert at categorizing content for a game wiki called "Anime Eternal". Your task is to generate a list of relevant, comma-separated tags based on the provided article content.

Follow these rules:
1.  **Be Concise:** Tags should be short keywords or 2-3 word phrases (e.g., 'sword evolution', 'world 4 boss', 'gamepass guide').
2.  **Use Lowercase:** All tags must be in lowercase.
3.  **Think like a Player:** What terms would a player search for to find this article? Include synonyms (e.g., 'dicas', 'guia', 'ajuda').
4.  **Extract Key Entities:** Identify specific game items, characters, world numbers, or mechanics mentioned (e.g., 'zangetsu', 'eizen', 'mundo 3', 'rank system').
5.  **Include Broad Categories:** Add general categories like 'guia', 'sistema', 'pvp', 'pve', 'dano', 'energia', 'geral'.
6.  **No Hashtags:** Do not include '#' in the tags.
7.  **Output Format:** The final output must be a single string of comma-separated tags.

Article Title: {{{title}}}
Article Summary: {{{summary}}}
Article Content:
{{{content}}}

Based on the content above, generate the tags.`,
});

const generateTagsFlow = ai.defineFlow(
  {
    name: 'generateTagsFlow',
    inputSchema: GenerateTagsInputSchema,
    outputSchema: GenerateTagsOutputSchema,
  },
  async input => {
    try {
      const {output} = await prompt(input);
      if (!output || !output.tags) {
        return { tags: '' };
      }
      return output;
    } catch (error) {
      console.error("Error in tag generation flow:", error);
      return { tags: '' };
    }
  }
);
