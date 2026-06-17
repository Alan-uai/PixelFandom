-- Migration 069: Wiki media library
-- Tracks uploaded images per tenant for reuse across articles, page builder, and editor.

CREATE TABLE IF NOT EXISTS wiki_media (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    file_name TEXT NOT NULL,
    file_size INTEGER,
    mime_type TEXT,
    storage_path TEXT NOT NULL,
    public_url TEXT NOT NULL,
    alt_text TEXT DEFAULT '',
    width INTEGER,
    height INTEGER,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_wiki_media_tenant
    ON wiki_media (tenant_id, created_at DESC);

ALTER TABLE wiki_media ENABLE ROW LEVEL SECURITY;

-- Members can view media of their tenant
CREATE POLICY "wiki_media_select" ON wiki_media
    FOR SELECT USING (
        tenant_id IN (
            SELECT tenant_id FROM tenant_members WHERE user_id = auth.uid()
        )
    );

-- Editors+ can upload
CREATE POLICY "wiki_media_insert" ON wiki_media
    FOR INSERT WITH CHECK (
        uploaded_by = auth.uid()
        AND tenant_id IN (
            SELECT tenant_id FROM tenant_members
            WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'editor')
        )
    );

-- Owners/admins can delete
CREATE POLICY "wiki_media_delete" ON wiki_media
    FOR DELETE USING (
        tenant_id IN (
            SELECT tenant_id FROM tenant_members
            WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
        )
        OR uploaded_by = auth.uid()
    );
