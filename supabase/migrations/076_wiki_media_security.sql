-- Migration 076: Extend wiki_media with security scanning columns
-- Adiciona campos de scan de vírus, hash do arquivo, e status de segurança

ALTER TABLE wiki_media
  ADD COLUMN IF NOT EXISTS scan_status TEXT NOT NULL DEFAULT 'pending'
    CHECK (scan_status IN ('pending', 'scanning', 'clean', 'infected', 'error')),
  ADD COLUMN IF NOT EXISTS scan_result JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS file_hash TEXT,
  ADD COLUMN IF NOT EXISTS original_filename TEXT,
  ADD COLUMN IF NOT EXISTS threat_detected BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_wiki_media_scan_status
  ON wiki_media (scan_status)
  WHERE scan_status IN ('pending', 'infected');
