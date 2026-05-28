-- Migration 038: Tenant landing page layouts (Page Builder)

CREATE TABLE IF NOT EXISTS tenant_pages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE UNIQUE,
    layout JSONB NOT NULL DEFAULT '{"blocks":[]}',
    published_layout JSONB,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add landing_layout field to tenants.theme JSON for quick access
-- (theme JSONB already exists; we extend it with landing_layout path)
