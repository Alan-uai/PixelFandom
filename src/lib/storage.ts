// Buckets are now created via migration 027_storage_buckets_and_rls.sql.
// This function is kept as a noop for backwards compatibility with callers.

export async function ensureStorageBuckets(): Promise<void> {
  // noop — buckets are guaranteed by migration
}
