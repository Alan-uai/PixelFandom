import {genkit} from 'genkit';
import {openAICompatible} from '@genkit-ai/compat-oai';

export const ai = genkit({
  plugins: [
    openAICompatible({
      name: 'openrouter',
      baseURL: 'https://openrouter.ai/api/v1',
      apiKey: process.env.OPENROUTER_API_KEY,
    }),
  ],
  model: 'openrouter/minimax/minimax-m2.5:free',
});