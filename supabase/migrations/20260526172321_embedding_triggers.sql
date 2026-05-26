-- Auto-generate embeddings on INSERT/UPDATE via Edge Function + pg_net + vault
-- Prerequisites:
--   1. pg_net extension enabled
--   2. vault extension enabled
--   3. `supabase functions deploy generate-embedding`
--   4. TRIGGER_SECRET set: `supabase secrets set TRIGGER_SECRET=<value>`

-- Store shared secret in vault for trigger to use
-- SELECT vault.create_secret('<TRIGGER_SECRET>', 'trigger_secret', 'Shared secret for trigger-to-edge-function auth');

CREATE OR REPLACE FUNCTION public.handle_embedding_generation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public, extensions'
AS $$
DECLARE
  function_url CONSTANT TEXT := 'https://fwvqliiudwwwubtlxpen.supabase.co/functions/v1/generate-embedding';
  auth_key TEXT;
BEGIN
  SELECT decrypted_secret INTO auth_key
  FROM vault.decrypted_secrets
  WHERE name = 'trigger_secret';

  IF auth_key IS NULL THEN
    SELECT decrypted_secret INTO auth_key
    FROM vault.decrypted_secrets
    WHERE name = 'supabase_service_role_key';
  END IF;

  IF auth_key IS NULL THEN
    RAISE WARNING 'No auth key found in vault';
    RETURN NEW;
  END IF;

  PERFORM
    net.http_post(
      url := function_url,
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'apikey', auth_key
      ),
      body := jsonb_build_object(
        'table', TG_TABLE_NAME,
        'record', row_to_json(NEW)
      ),
      timeout_milliseconds := 10000
    );
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_wiki_articles_embedding
  AFTER INSERT OR UPDATE OF title, summary, content
  ON wiki_articles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_embedding_generation();

CREATE TRIGGER trg_collection_items_embedding
  AFTER INSERT OR UPDATE OF data
  ON collection_items
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_embedding_generation();
