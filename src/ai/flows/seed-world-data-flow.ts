'use server';
import { z } from 'zod';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

const SeedWorldDataInputSchema = z.object({
    worldName: z.string().describe("O nome do novo mundo."),
    worldDataJson: z.string().describe("Uma string JSON contendo todos os dados do mundo, incluindo subcoleções como powers, npcs, etc."),
});
export type SeedWorldDataInput = z.infer<typeof SeedWorldDataInputSchema>;

function getSupabaseAdmin(): SupabaseClient {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Supabase URL or Service Role Key not found in environment variables');
  }

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}

export async function seedWorldData(input: SeedWorldDataInput): Promise<boolean> {
  const supabase = getSupabaseAdmin();
  const worldData = JSON.parse(input.worldDataJson);
  
  const worldId = worldData.id;
  if (!worldId) {
      console.error("Dados do mundo não contêm um 'id'.");
      return false;
  }

  const worldDocData: Record<string, any> = {
    id: worldId,
    world_name: input.worldName,
    world_number: worldData.worldNumber || worldData.world_number || 0,
    world_type: worldData.worldType || worldData.world_type || null,
    level_range: worldData.levelRange || worldData.level_range || null,
    description: worldData.description || null,
    environment: worldData.environment || null,
    chapters: worldData.chapters || 3,
    levels_per_chapter: worldData.levelsPerChapter || worldData.levels_per_chapter || 5,
    status: 'available',
    difficulties: worldData.difficulties || null,
  };

  try {
      const { error } = await supabase.from('worlds').upsert(worldDocData, { onConflict: 'id' });
      
      if (error) {
        console.error("Erro ao inserir mundo:", error);
        return false;
      }

      console.log(`Mundo '${input.worldName}' foi populado com sucesso no Supabase.`);
      return true;
  } catch (error) {
      console.error("Erro ao executar a semeadura do mundo:", error);
      return false;
  }
}
