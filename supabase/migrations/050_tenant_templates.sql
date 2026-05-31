CREATE TABLE tenant_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  category TEXT DEFAULT 'custom',
  blocks JSONB NOT NULL DEFAULT '[]',
  thumbnail TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_tenant_templates_tenant ON tenant_templates(tenant_id);

ALTER TABLE tenant_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their tenant templates"
  ON tenant_templates
  FOR ALL
  USING (
    tenant_id IN (
      SELECT tenant_id FROM tenant_members
      WHERE user_id = auth.uid()
      AND role IN ('owner', 'admin', 'editor')
    )
  )
  WITH CHECK (
    tenant_id IN (
      SELECT tenant_id FROM tenant_members
      WHERE user_id = auth.uid()
      AND role IN ('owner', 'admin', 'editor')
    )
  );
