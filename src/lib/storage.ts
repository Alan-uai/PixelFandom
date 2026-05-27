import { supabase } from '@/supabase';

const REQUIRED_BUCKETS = ['wiki-images', 'wiki-assets', 'game-items'] as const;

let bucketsEnsured = false;
let bucketPromise: Promise<void> | null = null;

export async function ensureStorageBuckets(): Promise<void> {
  if (bucketsEnsured) return;
  if (bucketPromise) return bucketPromise;

  bucketPromise = (async () => {
    try {
      const { data: existing } = await supabase.storage.listBuckets();
      const existingNames = new Set(existing?.map((b) => b.name) || []);

      for (const bucket of REQUIRED_BUCKETS) {
        if (!existingNames.has(bucket)) {
          await supabase.storage.createBucket(bucket, {
            public: true,
            fileSizeLimit: 10485760,
          });
        }
      }
      bucketsEnsured = true;
    } catch {
      // silent fail – buckets may already exist
    }
  })();

  return bucketPromise;
}
