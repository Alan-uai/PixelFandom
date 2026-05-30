-- Migration 046: Add created_by to wiki_articles and backfill for existing articles

ALTER TABLE wiki_articles
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;

DO $$
DECLARE
  v_user_id UUID;
BEGIN
  SELECT id INTO v_user_id FROM auth.users WHERE email = 'aymatsu00@gmail.com';

  IF v_user_id IS NULL THEN
    RAISE WARNING 'User aymatsu00@gmail.com not found in auth.users. Skipping backfill.';
  ELSE
    UPDATE wiki_articles SET created_by = v_user_id WHERE created_by IS NULL;
    RAISE NOTICE 'Backfill concluído: % artigos atualizados', FOUND;
  END IF;
END;
$$;
