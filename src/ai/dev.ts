'use server';
import { config } from 'dotenv';
config();

import '@/ai/flows/summarize-wiki-content.ts';
import '@/ai/flows/generate-solution.ts';
import '@/ai/flows/generate-tags-flow.ts';
import '@/ai/flows/extract-text-from-file-flow.ts';
import '@/ai/flows/format-text-to-json-flow.ts';
import '@/ai/flows/seed-world-data-flow.ts';
import '@/ai/flows/generate-wiki-from-data-flow.ts';
import '@/ai/flows/identify-powers-from-image-flow.ts';
import '@/ai/flows/analyze-negative-feedback-flow.ts';
import '@/ai/flows/extract-stats-from-image-flow.ts';
import '@/firebase/firestore/data.ts';
// This server-side seeding approach is not viable with default security rules.
// Seeding will now be handled on the client.
// The old seed file is now deleted.

    
