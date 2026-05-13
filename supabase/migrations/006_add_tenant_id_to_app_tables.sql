-- =====================================================
-- ADD TENANT_ID TO EXISTING APP TABLES
-- Enables multi-tenant isolation for existing features
-- =====================================================

-- =====================================================
-- WIKI ARTICLES
-- =====================================================

ALTER TABLE wiki_articles ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id);
CREATE INDEX IF NOT EXISTS idx_wiki_articles_tenant ON wiki_articles(tenant_id);

-- =====================================================
-- CONTENT SUGGESTIONS
-- =====================================================

ALTER TABLE content_suggestions ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id);
CREATE INDEX IF NOT EXISTS idx_content_suggestions_tenant ON content_suggestions(tenant_id);

-- =====================================================
-- NEGATIVE FEEDBACK
-- =====================================================

ALTER TABLE negative_feedback ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id);
CREATE INDEX IF NOT EXISTS idx_negative_feedback_tenant ON negative_feedback(tenant_id);

-- =====================================================
-- SAVED ANSWERS
-- =====================================================

ALTER TABLE saved_answers ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id);
CREATE INDEX IF NOT EXISTS idx_saved_answers_tenant ON saved_answers(tenant_id);

-- =====================================================
-- UPDATE RLS POLICIES FOR TENANT ISOLATION
-- =====================================================

-- Update wiki_articles RLS
DROP POLICY IF EXISTS "Wiki articles are publicly readable" ON wiki_articles;
DROP POLICY IF EXISTS "Admins can insert wiki articles" ON wiki_articles;
DROP POLICY IF EXISTS "Admins can update wiki articles" ON wiki_articles;
DROP POLICY IF EXISTS "Admins can delete wiki articles" ON wiki_articles;

CREATE POLICY "Wiki articles are readable by tenant members and public if tenant is public"
    ON wiki_articles FOR SELECT
    USING (
        tenant_id IS NULL
        OR EXISTS (
            SELECT 1 FROM tenants
            WHERE tenants.id = wiki_articles.tenant_id
            AND (tenants.is_public = true OR EXISTS (
                SELECT 1 FROM tenant_members
                WHERE tenant_members.tenant_id = tenants.id
                AND tenant_members.user_id = auth.uid()
            ))
        )
    );

CREATE POLICY "Members can create wiki articles"
    ON wiki_articles FOR INSERT
    WITH CHECK (
        tenant_id IS NOT NULL
        AND EXISTS (
            SELECT 1 FROM tenant_members
            WHERE tenant_members.tenant_id = wiki_articles.tenant_id
            AND tenant_members.user_id = auth.uid()
            AND tenant_members.role IN ('owner', 'admin', 'editor')
        )
    );

CREATE POLICY "Members can update wiki articles"
    ON wiki_articles FOR UPDATE
    USING (
        tenant_id IS NOT NULL
        AND EXISTS (
            SELECT 1 FROM tenant_members
            WHERE tenant_members.tenant_id = wiki_articles.tenant_id
            AND tenant_members.user_id = auth.uid()
            AND tenant_members.role IN ('owner', 'admin', 'editor')
        )
    )
    WITH CHECK (
        tenant_id IS NOT NULL
        AND EXISTS (
            SELECT 1 FROM tenant_members
            WHERE tenant_members.tenant_id = wiki_articles.tenant_id
            AND tenant_members.user_id = auth.uid()
            AND tenant_members.role IN ('owner', 'admin', 'editor')
        )
    );

CREATE POLICY "Admins can delete wiki articles"
    ON wiki_articles FOR DELETE
    USING (
        tenant_id IS NOT NULL
        AND EXISTS (
            SELECT 1 FROM tenant_members
            WHERE tenant_members.tenant_id = wiki_articles.tenant_id
            AND tenant_members.user_id = auth.uid()
            AND tenant_members.role IN ('owner', 'admin')
        )
    );

-- Update content_suggestions RLS
DROP POLICY IF EXISTS "Admins can read all content suggestions" ON content_suggestions;
DROP POLICY IF EXISTS "Users can insert their own suggestions" ON content_suggestions;

CREATE POLICY "Members can read content suggestions for their tenant"
    ON content_suggestions FOR SELECT
    USING (
        tenant_id IS NOT NULL
        AND EXISTS (
            SELECT 1 FROM tenant_members
            WHERE tenant_members.tenant_id = content_suggestions.tenant_id
            AND tenant_members.user_id = auth.uid()
            AND tenant_members.role IN ('owner', 'admin')
        )
    );

CREATE POLICY "Users can insert suggestions to their tenant"
    ON content_suggestions FOR INSERT
    WITH CHECK (
        auth.uid() = user_id
        AND tenant_id IS NOT NULL
        AND EXISTS (
            SELECT 1 FROM tenant_members
            WHERE tenant_members.tenant_id = content_suggestions.tenant_id
            AND tenant_members.user_id = auth.uid()
        )
    );

-- Update negative_feedback RLS
DROP POLICY IF EXISTS "Admins can read all negative feedback" ON negative_feedback;
DROP POLICY IF EXISTS "Admins can update negative feedback" ON negative_feedback;

CREATE POLICY "Members can read negative feedback for their tenant"
    ON negative_feedback FOR SELECT
    USING (
        tenant_id IS NOT NULL
        AND EXISTS (
            SELECT 1 FROM tenant_members
            WHERE tenant_members.tenant_id = negative_feedback.tenant_id
            AND tenant_members.user_id = auth.uid()
            AND tenant_members.role IN ('owner', 'admin')
        )
    );

CREATE POLICY "Members can update negative feedback for their tenant"
    ON negative_feedback FOR UPDATE
    USING (
        tenant_id IS NOT NULL
        AND EXISTS (
            SELECT 1 FROM tenant_members
            WHERE tenant_members.tenant_id = negative_feedback.tenant_id
            AND tenant_members.user_id = auth.uid()
            AND tenant_members.role IN ('owner', 'admin')
        )
    )
    WITH CHECK (
        tenant_id IS NOT NULL
        AND EXISTS (
            SELECT 1 FROM tenant_members
            WHERE tenant_members.tenant_id = negative_feedback.tenant_id
            AND tenant_members.user_id = auth.uid()
            AND tenant_members.role IN ('owner', 'admin')
        )
    );

-- Update saved_answers RLS
DROP POLICY IF EXISTS "Users can read own saved answers" ON saved_answers;
DROP POLICY IF EXISTS "Users can insert own saved answers" ON saved_answers;
DROP POLICY IF EXISTS "Users can delete own saved answers" ON saved_answers;

CREATE POLICY "Users can read own saved answers"
    ON saved_answers FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own saved answers"
    ON saved_answers FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own saved answers"
    ON saved_answers FOR DELETE
    USING (auth.uid() = user_id);

-- =====================================================
-- SUMMARY
-- =====================================================

COMMENT ON COLUMN wiki_articles.tenant_id IS 'The tenant (wiki) this article belongs to. NULL for legacy articles.';
COMMENT ON COLUMN content_suggestions.tenant_id IS 'The tenant this suggestion belongs to.';
COMMENT ON COLUMN negative_feedback.tenant_id IS 'The tenant this feedback belongs to.';
COMMENT ON COLUMN saved_answers.tenant_id IS 'The tenant context when this answer was saved.';
