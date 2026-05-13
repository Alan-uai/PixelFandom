-- =====================================================
-- MULTI-TENANT INFRASTRUCTURE
-- Tenants, members, guilds, custom collections
-- =====================================================

-- =====================================================
-- TENANTS
-- =====================================================

CREATE TABLE IF NOT EXISTS tenants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    custom_domain TEXT UNIQUE,
    logo_url TEXT,
    description TEXT,
    theme JSONB DEFAULT '{}'::jsonb,
    ai_enabled BOOLEAN DEFAULT false,
    ai_config JSONB DEFAULT '{}'::jsonb,
    is_public BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tenants_slug ON tenants(slug);
CREATE INDEX IF NOT EXISTS idx_tenants_domain ON tenants(custom_domain);
CREATE INDEX IF NOT EXISTS idx_tenants_public ON tenants(is_public) WHERE is_public = true;

-- =====================================================
-- TENANT MEMBERS
-- =====================================================

CREATE TABLE IF NOT EXISTS tenant_members (
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'viewer'
        CHECK (role IN ('owner', 'admin', 'editor', 'viewer')),
    invited_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT now(),
    PRIMARY KEY (tenant_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_tenant_members_user ON tenant_members(user_id);
CREATE INDEX IF NOT EXISTS idx_tenant_members_role ON tenant_members(tenant_id, role);

-- =====================================================
-- DISCORD GUILDS (guild -> tenant mapping)
-- =====================================================

CREATE TABLE IF NOT EXISTS discord_guilds (
    guild_id TEXT PRIMARY KEY,
    tenant_id UUID REFERENCES tenants(id) ON DELETE SET NULL,
    channel_id TEXT,
    bot_enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_discord_guilds_tenant ON discord_guilds(tenant_id);

-- =====================================================
-- CUSTOM COLLECTIONS (per-tenant flexible schemas)
-- =====================================================

CREATE TABLE IF NOT EXISTS custom_collections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    slug TEXT NOT NULL,
    description TEXT,
    schema JSONB DEFAULT '{}'::jsonb,
    icon TEXT,
    item_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(tenant_id, slug)
);

CREATE INDEX IF NOT EXISTS idx_custom_collections_tenant ON custom_collections(tenant_id);

-- =====================================================
-- COLLECTION ITEMS (the actual data rows)
-- =====================================================

CREATE TABLE IF NOT EXISTS collection_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    collection_id UUID REFERENCES custom_collections(id) ON DELETE CASCADE NOT NULL,
    data JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_collection_items_collection ON collection_items(collection_id);
CREATE INDEX IF NOT EXISTS idx_collection_items_created_by ON collection_items(created_by);

-- =====================================================
-- TRIGGERS
-- =====================================================

CREATE TRIGGER IF NOT EXISTS update_tenants_updated_at BEFORE UPDATE ON tenants
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER IF NOT EXISTS update_custom_collections_updated_at BEFORE UPDATE ON custom_collections
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER IF NOT EXISTS update_collection_items_updated_at BEFORE UPDATE ON collection_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE discord_guilds ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE collection_items ENABLE ROW LEVEL SECURITY;

-- Tenants: public can read public tenants, members can read their own
CREATE POLICY "Public tenants are readable by everyone"
    ON tenants FOR SELECT
    USING (is_public = true OR EXISTS (
        SELECT 1 FROM tenant_members WHERE tenant_id = tenants.id AND user_id = auth.uid()
    ));

CREATE POLICY "Members can update their tenant"
    ON tenants FOR UPDATE
    USING (EXISTS (
        SELECT 1 FROM tenant_members
        WHERE tenant_id = tenants.id AND user_id = auth.uid() AND role IN ('owner', 'admin')
    ))
    WITH CHECK (EXISTS (
        SELECT 1 FROM tenant_members
        WHERE tenant_id = tenants.id AND user_id = auth.uid() AND role IN ('owner', 'admin')
    ));

CREATE POLICY "Authenticated users can create tenants"
    ON tenants FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);

-- Tenant members: members can see other members of their tenant
CREATE POLICY "Members can read tenant members"
    ON tenant_members FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM tenant_members AS tm
        WHERE tm.tenant_id = tenant_members.tenant_id AND tm.user_id = auth.uid()
    ));

CREATE POLICY "Owners and admins can manage members"
    ON tenant_members FOR INSERT
    WITH CHECK (EXISTS (
        SELECT 1 FROM tenant_members
        WHERE tenant_id = tenant_members.tenant_id AND user_id = auth.uid() AND role IN ('owner', 'admin')
    ));

CREATE POLICY "Owners and admins can update members"
    ON tenant_members FOR UPDATE
    USING (EXISTS (
        SELECT 1 FROM tenant_members
        WHERE tenant_id = tenant_members.tenant_id AND user_id = auth.uid() AND role IN ('owner', 'admin')
    ))
    WITH CHECK (EXISTS (
        SELECT 1 FROM tenant_members
        WHERE tenant_id = tenant_members.tenant_id AND user_id = auth.uid() AND role IN ('owner', 'admin')
    ));

CREATE POLICY "Owners and admins can delete members"
    ON tenant_members FOR DELETE
    USING (EXISTS (
        SELECT 1 FROM tenant_members
        WHERE tenant_id = tenant_members.tenant_id AND user_id = auth.uid() AND role IN ('owner', 'admin')
    ));

-- Discord guilds: members can read their tenant's guilds
CREATE POLICY "Members can read discord guilds"
    ON discord_guilds FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM tenant_members
        WHERE tenant_id = discord_guilds.tenant_id AND user_id = auth.uid()
    ));

CREATE POLICY "Owners and admins can manage discord guilds"
    ON discord_guilds FOR INSERT
    WITH CHECK (EXISTS (
        SELECT 1 FROM tenant_members
        WHERE tenant_id = discord_guilds.tenant_id AND user_id = auth.uid() AND role IN ('owner', 'admin')
    ));

CREATE POLICY "Owners and admins can update discord guilds"
    ON discord_guilds FOR UPDATE
    USING (EXISTS (
        SELECT 1 FROM tenant_members
        WHERE tenant_id = discord_guilds.tenant_id AND user_id = auth.uid() AND role IN ('owner', 'admin')
    ));

CREATE POLICY "Owners and admins can delete discord guilds"
    ON discord_guilds FOR DELETE
    USING (EXISTS (
        SELECT 1 FROM tenant_members
        WHERE tenant_id = discord_guilds.tenant_id AND user_id = auth.uid() AND role IN ('owner', 'admin')
    ));

-- Custom collections: members can read their tenant's collections
CREATE POLICY "Members can read custom collections"
    ON custom_collections FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM tenant_members
        WHERE tenant_id = custom_collections.tenant_id AND user_id = auth.uid()
    ));

CREATE POLICY "Members can create custom collections"
    ON custom_collections FOR INSERT
    WITH CHECK (EXISTS (
        SELECT 1 FROM tenant_members
        WHERE tenant_id = custom_collections.tenant_id AND user_id = auth.uid() AND role IN ('owner', 'admin', 'editor')
    ));

CREATE POLICY "Editors and above can update custom collections"
    ON custom_collections FOR UPDATE
    USING (EXISTS (
        SELECT 1 FROM tenant_members
        WHERE tenant_id = custom_collections.tenant_id AND user_id = auth.uid() AND role IN ('owner', 'admin', 'editor')
    ))
    WITH CHECK (EXISTS (
        SELECT 1 FROM tenant_members
        WHERE tenant_id = custom_collections.tenant_id AND user_id = auth.uid() AND role IN ('owner', 'admin', 'editor')
    ));

CREATE POLICY "Owners and admins can delete custom collections"
    ON custom_collections FOR DELETE
    USING (EXISTS (
        SELECT 1 FROM tenant_members
        WHERE tenant_id = custom_collections.tenant_id AND user_id = auth.uid() AND role IN ('owner', 'admin')
    ));

-- Collection items: members can read their collection items
CREATE POLICY "Members can read collection items"
    ON collection_items FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM custom_collections
        JOIN tenant_members ON tenant_members.tenant_id = custom_collections.tenant_id
        WHERE custom_collections.id = collection_items.collection_id
        AND tenant_members.user_id = auth.uid()
    ));

CREATE POLICY "Members can create collection items"
    ON collection_items FOR INSERT
    WITH CHECK (EXISTS (
        SELECT 1 FROM custom_collections
        JOIN tenant_members ON tenant_members.tenant_id = custom_collections.tenant_id
        WHERE custom_collections.id = collection_items.collection_id
        AND tenant_members.user_id = auth.uid()
        AND tenant_members.role IN ('owner', 'admin', 'editor')
    ));

CREATE POLICY "Members can update collection items"
    ON collection_items FOR UPDATE
    USING (EXISTS (
        SELECT 1 FROM custom_collections
        JOIN tenant_members ON tenant_members.tenant_id = custom_collections.tenant_id
        WHERE custom_collections.id = collection_items.collection_id
        AND tenant_members.user_id = auth.uid()
        AND tenant_members.role IN ('owner', 'admin', 'editor')
    ))
    WITH CHECK (EXISTS (
        SELECT 1 FROM custom_collections
        JOIN tenant_members ON tenant_members.tenant_id = custom_collections.tenant_id
        WHERE custom_collections.id = collection_items.collection_id
        AND tenant_members.user_id = auth.uid()
        AND tenant_members.role IN ('owner', 'admin', 'editor')
    ));

CREATE POLICY "Members can delete their own items"
    ON collection_items FOR DELETE
    USING (EXISTS (
        SELECT 1 FROM custom_collections
        JOIN tenant_members ON tenant_members.tenant_id = custom_collections.tenant_id
        WHERE custom_collections.id = collection_items.collection_id
        AND tenant_members.user_id = auth.uid()
        AND tenant_members.role IN ('owner', 'admin', 'editor')
    ));

-- =====================================================
-- SUMMARY
-- =====================================================

COMMENT ON TABLE tenants IS 'Multi-tenant wiki spaces. Each tenant is an independent wiki.';
COMMENT ON TABLE tenant_members IS 'Maps users to tenants with role-based access control.';
COMMENT ON TABLE discord_guilds IS 'Maps Discord guilds (servers) to tenants for bot integration.';
COMMENT ON TABLE custom_collections IS 'Per-tenant flexible data collections. Admins define the schema.';
COMMENT ON TABLE collection_items IS 'Individual items within a custom collection. Stored as JSONB.';
