-- Migration 056: Fix tenant_pages unique constraint for multi-page-type support
-- Previous migration 046 attempted to drop the old UNIQUE constraint but may have failed
-- on some environments due to PostgreSQL constraint naming differences.
--
-- This migration:
-- 1. Dynamically finds and drops ANY unique constraint on tenant_id alone
-- 2. Removes any duplicate (tenant_id, page_type) rows keeping the latest
-- 3. Ensures the composite unique index exists on (tenant_id, page_type)

-- Step 1: Find and drop any existing UNIQUE constraint on tenant_pages that
-- only involves tenant_id (the old single-column constraint from migration 038)
DO $$
DECLARE
    v_constraint_name TEXT;
    v_col_count INT;
BEGIN
    FOR v_constraint_name, v_col_count IN
        SELECT con.conname, (
            SELECT COUNT(*)
            FROM UNNEST(con.conkey) AS u_attnum
            JOIN pg_attribute AS a ON a.attrelid = con.conrelid AND a.attnum = u_attnum
            WHERE a.attname = 'tenant_id'
        )
        FROM pg_constraint con
        JOIN pg_class rel ON rel.oid = con.conrelid
        WHERE rel.relname = 'tenant_pages'
          AND con.contype = 'u'
    LOOP
        IF v_col_count > 0 AND v_col_count = (
            SELECT COUNT(*)
            FROM UNNEST(con.conkey) AS u_attnum
        ) THEN
            EXECUTE format('ALTER TABLE tenant_pages DROP CONSTRAINT %I', v_constraint_name);
            RAISE NOTICE 'Dropped constraint: %', v_constraint_name;
        END IF;
    END LOOP;
END $$;

-- Step 2: Clean up duplicate rows for same (tenant_id, page_type)
-- If previous upserts created duplicates, keep only the most recent row
DELETE FROM tenant_pages
WHERE id IN (
    SELECT id FROM (
        SELECT id, ROW_NUMBER() OVER (
            PARTITION BY tenant_id, page_type ORDER BY updated_at DESC, created_at DESC
        ) AS rn
        FROM tenant_pages
    ) ranked
    WHERE ranked.rn > 1
);

-- Step 3: Ensure the composite unique index exists
DROP INDEX IF EXISTS idx_tenant_pages_tenant_id;
CREATE UNIQUE INDEX IF NOT EXISTS idx_tenant_pages_tenant_type ON tenant_pages (tenant_id, page_type);
