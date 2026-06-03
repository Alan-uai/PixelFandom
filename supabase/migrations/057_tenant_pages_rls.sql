-- Enable RLS on tenant_pages (already enabled via dashboard, idempotent)
ALTER TABLE tenant_pages ENABLE ROW LEVEL SECURITY;

-- SELECT: any authenticated user can read pages (needed for wiki rendering)
CREATE POLICY "tenant_pages_select" ON tenant_pages
  FOR SELECT
  USING (true);

-- INSERT: only tenant members with owner/admin/editor role
CREATE POLICY "tenant_pages_insert" ON tenant_pages
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM tenant_members
      WHERE tenant_id = tenant_pages.tenant_id
        AND user_id = auth.uid()
        AND role IN ('owner', 'admin', 'editor')
    )
  );

-- UPDATE: only tenant members with owner/admin/editor role
CREATE POLICY "tenant_pages_update" ON tenant_pages
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM tenant_members
      WHERE tenant_id = tenant_pages.tenant_id
        AND user_id = auth.uid()
        AND role IN ('owner', 'admin', 'editor')
    )
  );

-- DELETE: only tenant members with owner/admin role
CREATE POLICY "tenant_pages_delete" ON tenant_pages
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM tenant_members
      WHERE tenant_id = tenant_pages.tenant_id
        AND user_id = auth.uid()
        AND role IN ('owner', 'admin')
    )
  );
