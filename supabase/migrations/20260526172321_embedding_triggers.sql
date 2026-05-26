-- Auto-generate embeddings on INSERT/UPDATE via Supabase Edge Function

CREATE OR REPLACE FUNCTION public.handle_embedding_generation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  function_url CONSTANT TEXT := 'https://fwvqliiudwwwubtlxpen.supabase.co/functions/v1/generate-embedding';
BEGIN
  PERFORM
    supabase_functions.http(
      request_id := gen_random_uuid()::text,
      url := function_url,
      body := jsonb_build_object(
        'table', TG_TABLE_NAME,
        'record', row_to_json(NEW)
      ),
      headers := jsonb_build_object('Content-Type', 'application/json'),
      timeout_milliseconds := 10000
    );
  RETURN NEW;
END;
$$;

-- Trigger for wiki_articles: generate embedding when title, summary, or content changes
CREATE TRIGGER trg_wiki_articles_embedding
  AFTER INSERT OR UPDATE OF title, summary, content
  ON wiki_articles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_embedding_generation();

-- Trigger for collection_items: generate embedding when data changes
CREATE TRIGGER trg_collection_items_embedding
  AFTER INSERT OR UPDATE OF data
  ON collection_items
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_embedding_generation();
