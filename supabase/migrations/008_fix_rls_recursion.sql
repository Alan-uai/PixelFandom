-- =====================================================
-- FIX RLS INFINITE RECURSION
-- Creates SECURITY DEFINER helper functions that bypass
-- RLS to avoid infinite recursion in policies that
-- query tenant_members.
-- =====================================================

-- =====================================================
-- HELPER: is_tenant_member
-- Returns true if auth.uid() is a member of the given
-- tenant. Runs as SECURITY DEFINER to bypass RLS.
-- =====================================================

CREATE OR REPLACE FUNCTION public.is_tenant_member(_tenant_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.tenant_members
    WHERE tenant_members.tenant_id = $1
      AND tenant_members.user_id = auth.uid()
  );
$$;

-- =====================================================
-- HELPER: is_tenant_member_with_role
-- Returns true if auth.uid() is a member of the given
-- tenant with at least the specified minimum role.
-- Role hierarchy: owner > admin > editor > viewer
-- =====================================================

CREATE OR REPLACE FUNCTION public.is_tenant_member_with_role(_tenant_id UUID, _min_role TEXT)
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.tenant_members
    WHERE tenant_members.tenant_id = $1
      AND tenant_members.user_id = auth.uid()
      AND (
        (_min_role = 'viewer') OR
        (_min_role = 'editor' AND tenant_members.role IN ('editor', 'admin', 'owner')) OR
        (_min_role = 'admin' AND tenant_members.role IN ('admin', 'owner')) OR
        (_min_role = 'owner' AND tenant_members.role = 'owner')
      )
  );
$$;

-- =====================================================
-- HELPER: get_tenant_id_from_collection
-- Resolves the tenant_id for a custom_collection item
-- by joining through custom_collections.
-- =====================================================

CREATE OR REPLACE FUNCTION public.get_tenant_id_from_collection_item(_item_id UUID)
RETURNS UUID
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
  SELECT cc.tenant_id
  FROM public.collection_items ci
  JOIN public.custom_collections cc ON cc.id = ci.collection_id
  WHERE ci.id = $1;
$$;

-- =====================================================
-- DROP AND RECREATE ALL POLICIES ON tenant_members
-- =====================================================

DROP POLICY IF EXISTS "Members can read tenant members" ON tenant_members;
DROP POLICY IF EXISTS "Owners and admins can manage members" ON tenant_members;
DROP POLICY IF EXISTS "Owners and admins can update members" ON tenant_members;
DROP POLICY IF EXISTS "Owners and admins can delete members" ON tenant_members;

CREATE POLICY "Members can read tenant members"
    ON tenant_members FOR SELECT
    USING (public.is_tenant_member(tenant_id));

CREATE POLICY "Owners and admins can manage members"
    ON tenant_members FOR INSERT
    WITH CHECK (public.is_tenant_member_with_role(tenant_id, 'admin'));

CREATE POLICY "Owners and admins can update members"
    ON tenant_members FOR UPDATE
    USING (public.is_tenant_member_with_role(tenant_id, 'admin'))
    WITH CHECK (public.is_tenant_member_with_role(tenant_id, 'admin'));

CREATE POLICY "Owners and admins can delete members"
    ON tenant_members FOR DELETE
    USING (public.is_tenant_member_with_role(tenant_id, 'admin'));

-- =====================================================
-- DROP AND RECREATE POLICIES ON tenants
-- =====================================================

DROP POLICY IF EXISTS "Public tenants are readable by everyone" ON tenants;
DROP POLICY IF EXISTS "Members can update their tenant" ON tenants;

CREATE POLICY "Public tenants are readable by everyone"
    ON tenants FOR SELECT
    USING (is_public = true OR public.is_tenant_member(id));

CREATE POLICY "Members can update their tenant"
    ON tenants FOR UPDATE
    USING (public.is_tenant_member_with_role(id, 'admin'))
    WITH CHECK (public.is_tenant_member_with_role(id, 'admin'));

-- =====================================================
-- DROP AND RECREATE POLICIES ON discord_guilds
-- =====================================================

DROP POLICY IF EXISTS "Members can read discord guilds" ON discord_guilds;
DROP POLICY IF EXISTS "Owners and admins can manage discord guilds" ON discord_guilds;
DROP POLICY IF EXISTS "Owners and admins can update discord guilds" ON discord_guilds;
DROP POLICY IF EXISTS "Owners and admins can delete discord guilds" ON discord_guilds;

CREATE POLICY "Members can read discord guilds"
    ON discord_guilds FOR SELECT
    USING (public.is_tenant_member(tenant_id));

CREATE POLICY "Owners and admins can manage discord guilds"
    ON discord_guilds FOR INSERT
    WITH CHECK (public.is_tenant_member_with_role(tenant_id, 'admin'));

CREATE POLICY "Owners and admins can update discord guilds"
    ON discord_guilds FOR UPDATE
    USING (public.is_tenant_member_with_role(tenant_id, 'admin'))
    WITH CHECK (public.is_tenant_member_with_role(tenant_id, 'admin'));

CREATE POLICY "Owners and admins can delete discord guilds"
    ON discord_guilds FOR DELETE
    USING (public.is_tenant_member_with_role(tenant_id, 'admin'));

-- =====================================================
-- DROP AND RECREATE POLICIES ON custom_collections
-- =====================================================

DROP POLICY IF EXISTS "Members can read custom collections" ON custom_collections;
DROP POLICY IF EXISTS "Members can create custom collections" ON custom_collections;
DROP POLICY IF EXISTS "Editors and above can update custom collections" ON custom_collections;
DROP POLICY IF EXISTS "Owners and admins can delete custom collections" ON custom_collections;

CREATE POLICY "Members can read custom collections"
    ON custom_collections FOR SELECT
    USING (public.is_tenant_member(tenant_id));

CREATE POLICY "Members can create custom collections"
    ON custom_collections FOR INSERT
    WITH CHECK (public.is_tenant_member_with_role(tenant_id, 'editor'));

CREATE POLICY "Editors and above can update custom collections"
    ON custom_collections FOR UPDATE
    USING (public.is_tenant_member_with_role(tenant_id, 'editor'))
    WITH CHECK (public.is_tenant_member_with_role(tenant_id, 'editor'));

CREATE POLICY "Owners and admins can delete custom collections"
    ON custom_collections FOR DELETE
    USING (public.is_tenant_member_with_role(tenant_id, 'admin'));

-- =====================================================
-- DROP AND RECREATE POLICIES ON collection_items
-- =====================================================

DROP POLICY IF EXISTS "Members can read collection items" ON collection_items;
DROP POLICY IF EXISTS "Members can create collection items" ON collection_items;
DROP POLICY IF EXISTS "Members can update collection items" ON collection_items;
DROP POLICY IF EXISTS "Members can delete their own items" ON collection_items;

CREATE POLICY "Members can read collection items"
    ON collection_items FOR SELECT
    USING (public.is_tenant_member(public.get_tenant_id_from_collection_item(id)));

CREATE POLICY "Members can create collection items"
    ON collection_items FOR INSERT
    WITH CHECK (public.is_tenant_member_with_role(
        (SELECT tenant_id FROM public.custom_collections WHERE id = collection_id),
        'editor'
    ));

CREATE POLICY "Members can update collection items"
    ON collection_items FOR UPDATE
    USING (public.is_tenant_member_with_role(
        public.get_tenant_id_from_collection_item(id),
        'editor'
    ))
    WITH CHECK (public.is_tenant_member_with_role(
        public.get_tenant_id_from_collection_item(id),
        'editor'
    ));

CREATE POLICY "Members can delete their own items"
    ON collection_items FOR DELETE
    USING (public.is_tenant_member_with_role(
        public.get_tenant_id_from_collection_item(id),
        'editor'
    ));

-- =====================================================
-- UPDATE RLS POLICIES ON wiki_articles, content_suggestions,
-- negative_feedback (referenced from migration 006)
-- =====================================================

DROP POLICY IF EXISTS "Wiki articles are readable by tenant members and public if tenant is public" ON wiki_articles;

CREATE POLICY "Wiki articles are readable by tenant members and public if tenant is public"
    ON wiki_articles FOR SELECT
    USING (
        tenant_id IS NULL
        OR EXISTS (
            SELECT 1 FROM public.tenants
            WHERE tenants.id = wiki_articles.tenant_id
            AND (tenants.is_public = true OR public.is_tenant_member(tenants.id))
        )
    );

DROP POLICY IF EXISTS "Members can create wiki articles" ON wiki_articles;
DROP POLICY IF EXISTS "Members can update wiki articles" ON wiki_articles;
DROP POLICY IF EXISTS "Admins can delete wiki articles" ON wiki_articles;

CREATE POLICY "Members can create wiki articles"
    ON wiki_articles FOR INSERT
    WITH CHECK (
        tenant_id IS NOT NULL
        AND public.is_tenant_member_with_role(tenant_id, 'editor')
    );

CREATE POLICY "Members can update wiki articles"
    ON wiki_articles FOR UPDATE
    USING (tenant_id IS NOT NULL AND public.is_tenant_member_with_role(tenant_id, 'editor'))
    WITH CHECK (tenant_id IS NOT NULL AND public.is_tenant_member_with_role(tenant_id, 'editor'));

CREATE POLICY "Admins can delete wiki articles"
    ON wiki_articles FOR DELETE
    USING (tenant_id IS NOT NULL AND public.is_tenant_member_with_role(tenant_id, 'admin'));

-- content_suggestions
DROP POLICY IF EXISTS "Members can read content suggestions for their tenant" ON content_suggestions;
DROP POLICY IF EXISTS "Users can insert suggestions to their tenant" ON content_suggestions;

CREATE POLICY "Members can read content suggestions for their tenant"
    ON content_suggestions FOR SELECT
    USING (tenant_id IS NOT NULL AND public.is_tenant_member_with_role(tenant_id, 'admin'));

CREATE POLICY "Users can insert suggestions to their tenant"
    ON content_suggestions FOR INSERT
    WITH CHECK (
        auth.uid() = user_id
        AND tenant_id IS NOT NULL
        AND public.is_tenant_member(tenant_id)
    );

-- negative_feedback
DROP POLICY IF EXISTS "Members can read negative feedback for their tenant" ON negative_feedback;
DROP POLICY IF EXISTS "Members can update negative feedback for their tenant" ON negative_feedback;

CREATE POLICY "Members can read negative feedback for their tenant"
    ON negative_feedback FOR SELECT
    USING (tenant_id IS NOT NULL AND public.is_tenant_member_with_role(tenant_id, 'admin'));

CREATE POLICY "Members can update negative feedback for their tenant"
    ON negative_feedback FOR UPDATE
    USING (tenant_id IS NOT NULL AND public.is_tenant_member_with_role(tenant_id, 'admin'))
    WITH CHECK (tenant_id IS NOT NULL AND public.is_tenant_member_with_role(tenant_id, 'admin'));

-- =====================================================
-- SUMMARY
-- =====================================================

COMMENT ON FUNCTION public.is_tenant_member IS 'Checks if auth.uid() is a member of the given tenant. SECURITY DEFINER to bypass RLS.';
COMMENT ON FUNCTION public.is_tenant_member_with_role IS 'Checks if auth.uid() is a member with at least the minimum role. SECURITY DEFINER to bypass RLS.';
COMMENT ON FUNCTION public.get_tenant_id_from_collection_item IS 'Resolves tenant_id from a collection_items.id. SECURITY DEFINER to bypass RLS.';
