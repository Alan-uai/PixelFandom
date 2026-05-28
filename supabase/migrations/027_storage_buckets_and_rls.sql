-- Migration 027: Create storage buckets and set up RLS policies
-- This replaces the broken client-side bucket creation in src/lib/storage.ts

-- =====================================================
-- 1. Create buckets
-- =====================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('wiki-images', 'wiki-images', true, 10485760, NULL),
  ('wiki-assets', 'wiki-assets', true, 10485760, NULL),
  ('game-items', 'game-items', true, 10485760, NULL)
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- 2. Enable RLS on storage.objects (enabled by default,
--    but explicit in case it was disabled)
-- =====================================================
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 3. Drop existing policies to avoid duplicates on re-run
-- =====================================================
DO $$
DECLARE
  pol TEXT;
BEGIN
  FOR pol IN (
    SELECT policyname FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
    AND policyname IN (
      'Public read access on wiki-images',
      'Public read access on wiki-assets',
      'Public read access on game-items',
      'Authenticated upload to wiki-images',
      'Authenticated upload to wiki-assets',
      'Authenticated upload to game-items',
      'Authenticated update on wiki-images',
      'Authenticated update on wiki-assets',
      'Authenticated update on game-items',
      'Authenticated delete own files'
    )
  ) LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', pol);
  END LOOP;
END $$;

-- =====================================================
-- 4. SELECT policies — allow public read on public buckets
-- =====================================================
CREATE POLICY "Public read access on wiki-images"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'wiki-images');

CREATE POLICY "Public read access on wiki-assets"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'wiki-assets');

CREATE POLICY "Public read access on game-items"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'game-items');

-- =====================================================
-- 5. INSERT policies — authenticated users can upload
-- =====================================================
CREATE POLICY "Authenticated upload to wiki-images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'wiki-images');

CREATE POLICY "Authenticated upload to wiki-assets"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'wiki-assets');

CREATE POLICY "Authenticated upload to game-items"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'game-items');

-- =====================================================
-- 6. UPDATE policies — needed for upsert to work
-- =====================================================
CREATE POLICY "Authenticated update on wiki-images"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'wiki-images')
  WITH CHECK (bucket_id = 'wiki-images');

CREATE POLICY "Authenticated update on wiki-assets"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'wiki-assets')
  WITH CHECK (bucket_id = 'wiki-assets');

CREATE POLICY "Authenticated update on game-items"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'game-items')
  WITH CHECK (bucket_id = 'game-items');

-- =====================================================
-- 7. DELETE policies — authenticated users can delete
-- =====================================================
CREATE POLICY "Authenticated delete own files"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id IN ('wiki-images', 'wiki-assets', 'game-items'));
