-- Migration 053: Add ON DELETE CASCADE to older tables
--
-- Tables created in early migrations (003, 005-006, no longer in source)
-- have FKs referencing tenants(id) without CASCADE or with SET NULL.
-- This prevents clean tenant deletion and can leave orphaned rows.
--
-- Tables affected:
--   content_suggestions  NO ACTION → CASCADE
--   discord_guilds       SET NULL  → CASCADE
--   negative_feedback    NO ACTION → CASCADE
--   saved_answers        NO ACTION → CASCADE
--   wiki_articles        NO ACTION → CASCADE

ALTER TABLE content_suggestions
  DROP CONSTRAINT content_suggestions_tenant_id_fkey,
  ADD CONSTRAINT content_suggestions_tenant_id_fkey
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;

ALTER TABLE discord_guilds
  DROP CONSTRAINT discord_guilds_tenant_id_fkey,
  ADD CONSTRAINT discord_guilds_tenant_id_fkey
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;

ALTER TABLE negative_feedback
  DROP CONSTRAINT negative_feedback_tenant_id_fkey,
  ADD CONSTRAINT negative_feedback_tenant_id_fkey
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;

ALTER TABLE saved_answers
  DROP CONSTRAINT saved_answers_tenant_id_fkey,
  ADD CONSTRAINT saved_answers_tenant_id_fkey
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;

ALTER TABLE wiki_articles
  DROP CONSTRAINT wiki_articles_tenant_id_fkey,
  ADD CONSTRAINT wiki_articles_tenant_id_fkey
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
