'use server';
/**
 * @fileOverview Um fluxo que popula os dados de um mundo no Firestore a partir de um objeto JSON.
 *
 * - seedWorldData - Uma função que lida com o processo de semeadura.
 * - SeedWorldDataInput - O tipo de entrada para a função seedWorldData.
 */

import {ai} from '@/ai/genkit';
import {z} from 'zod';
import { initializeFirebaseServer } from '@/firebase/server';
import { writeBatch, doc } from 'firebase/firestore';

const SeedWorldDataInputSchema = z.object({
    worldName: z.string().describe("O nome do novo mundo."),
    worldDataJson: z.string().describe("Uma string JSON contendo todos os dados do mundo, incluindo subcoleções como powers, npcs, etc."),
});
export type SeedWorldDataInput = z.infer<typeof SeedWorldDataInputSchema>;

// No output schema needed as this flow performs an action and doesn't return data to the client UI.
const SeedWorldDataOutputSchema = z.boolean();
export type SeedWorldDataOutput = z.infer<typeof SeedWorldDataOutputSchema>;


export async function seedWorldData(input: SeedWorldDataInput): Promise<SeedWorldDataOutput> {
  return seedWorldDataFlow(input);
}


const seedWorldDataFlow = ai.defineFlow(
  {
    name: 'seedWorldDataFlow',
    inputSchema: SeedWorldDataInputSchema,
    outputSchema: SeedWorldDataOutputSchema,
  },
  async ({ worldName, worldDataJson }) => {
    const { firestore } = initializeFirebaseServer();
    const worldData = JSON.parse(worldDataJson);
    
    // Use the new numeric ID from the data file as the document ID
    const worldId = worldData.id;
    if (!worldId) {
        console.error("Dados do mundo não contêm um 'id' numérico.");
        return false;
    }

    const batch = writeBatch(firestore);
    const worldRef = doc(firestore, 'worlds', worldId);

    // 1. Set top-level world document
    // Ensure the name in the data object is the one provided by the user
    const worldDocData = { ...worldData, name: worldName };
    // Remove subcollection arrays from the top-level document data
    delete worldDocData.powers;
    delete worldDocData.npcs;
    delete worldDocData.pets;
    delete worldDocData.dungeons;
    delete worldDocData.shadows;
    delete worldDocData.stands;
    delete worldDocData.accessories;
    batch.set(worldRef, worldDocData);

    // 2. Helper function to seed subcollections
    const seedSubcollection = (subcollectionName: string, items: any[]) => {
      if (items && Array.isArray(items) && items.length > 0) {
        for (const item of items) {
            if (!item.id) {
                console.warn(`Item em '${subcollectionName}' sem ID, pulando:`, item);
                continue;
            };
            const itemRef = doc(worldRef, subcollectionName, item.id);
            const { stats, ...itemData } = item; // Separate stats if they exist
            batch.set(itemRef, itemData);

            // 3. Seed nested 'stats' subcollection for powers
            if (subcollectionName === 'powers' && stats && Array.isArray(stats) && stats.length > 0) {
                for (const stat of stats) {
                    // Generate a simple ID for the stat if it doesn't have one
                    const statId = stat.id || (stat.name || JSON.stringify(stat)).toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
                    if (!statId) {
                         console.warn(`Stat em '${item.name}' sem ID, pulando:`, stat);
                         continue;
                    };
                    const statRef = doc(itemRef, 'stats', statId);
                    batch.set(statRef, stat);
                }
            }
        }
      }
    };

    // 4. Seed all potential subcollections
    seedSubcollection('powers', worldData.powers);
    seedSubcollection('npcs', worldData.npcs);
    seedSubcollection('pets', worldData.pets);
    seedSubcollection('dungeons', worldData.dungeons);
    seedSubcollection('shadows', worldData.shadows);
    seedSubcollection('stands', worldData.stands);
    seedSubcollection('accessories', worldData.accessories);

    // 5. Commit the batch
    try {
        await batch.commit();
        console.log(`Mundo '${worldName}' e suas subcoleções foram populados com sucesso.`);
        return true;
    } catch (error) {
        console.error("Erro ao executar o batch de semeadura do mundo:", error);
        // In a real app, you'd want more robust error handling,
        // maybe even try to roll back or notify an admin.
        return false;
    }
  }
);
