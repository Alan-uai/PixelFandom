'use server';
import { z } from 'zod';
// seed-world-data-flow.ts - chatStructured import removed (unused)
import { initializeFirebaseServer } from '@/firebase/server';
import { writeBatch, doc } from 'firebase/firestore';

const SeedWorldDataInputSchema = z.object({
    worldName: z.string().describe("O nome do novo mundo."),
    worldDataJson: z.string().describe("Uma string JSON contendo todos os dados do mundo, incluindo subcoleções como powers, npcs, etc."),
});
export type SeedWorldDataInput = z.infer<typeof SeedWorldDataInputSchema>;

export async function seedWorldData(input: SeedWorldDataInput): Promise<boolean> {
  const { firestore } = initializeFirebaseServer();
  const worldData = JSON.parse(input.worldDataJson);
  
  const worldId = worldData.id;
  if (!worldId) {
      console.error("Dados do mundo não contêm um 'id' numérico.");
      return false;
  }

  const batch = writeBatch(firestore);
  const worldRef = doc(firestore, 'worlds', worldId);

  const worldDocData = { ...worldData, name: input.worldName };
  delete worldDocData.powers;
  delete worldDocData.npcs;
  delete worldDocData.pets;
  delete worldDocData.dungeons;
  delete worldDocData.shadows;
  delete worldDocData.stands;
  delete worldDocData.accessories;
  batch.set(worldRef, worldDocData);

  const seedSubcollection = (subcollectionName: string, items: any[]) => {
    if (items && Array.isArray(items) && items.length > 0) {
      for (const item of items) {
          if (!item.id) {
              console.warn(`Item em '${subcollectionName}' sem ID, pulando:`, item);
              continue;
          };
          const itemRef = doc(worldRef, subcollectionName, item.id);
          const { stats, ...itemData } = item;
          batch.set(itemRef, itemData);

          if (subcollectionName === 'powers' && stats && Array.isArray(stats) && stats.length > 0) {
              for (const stat of stats) {
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

  seedSubcollection('powers', worldData.powers);
  seedSubcollection('npcs', worldData.npcs);
  seedSubcollection('pets', worldData.pets);
  seedSubcollection('dungeons', worldData.dungeons);
  seedSubcollection('shadows', worldData.shadows);
  seedSubcollection('stands', worldData.stands);
  seedSubcollection('accessories', worldData.accessories);

  try {
      await batch.commit();
      console.log(`Mundo '${input.worldName}' e suas subcoleções foram populados com sucesso.`);
      return true;
  } catch (error) {
      console.error("Erro ao executar o batch de semeadura do mundo:", error);
      return false;
  }
}