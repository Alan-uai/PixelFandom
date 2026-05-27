-- Migration 026: Clear existing embeddings so they can be regenerated from slug only
-- The backfill API will regenerate them using: generateEmbedding(slug)

UPDATE wiki_articles SET embedding = NULL WHERE embedding IS NOT NULL;
