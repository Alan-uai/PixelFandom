-- Migration 082: Fix remaining performance advisor warnings
--
-- Fixes auth_rls_initplan and multiple_permissive_policies warnings
-- that were NOT caught by migration 079 (dashboard-created policies
-- that persisted or were recreated).
--
-- ============================================================
-- PART 1: auth_rls_initplan
-- Replace auth.<function>() with (SELECT auth.<function>())
-- so Postgres creates an initplan that evaluates once per query
-- instead of once per row.
-- ============================================================

-- ---------------------------------------------------------
-- saved_answers: "Users can read own saved answers"
-- ---------------------------------------------------------
DROP POLICY IF EXISTS "Users can read own saved answers" ON saved_answers;
CREATE POLICY "Users can read own saved answers" ON saved_answers
  FOR SELECT
  USING (user_id = (select auth.uid()));

-- ---------------------------------------------------------
-- saved_answers: "Users can insert own saved answers"
-- ---------------------------------------------------------
DROP POLICY IF EXISTS "Users can insert own saved answers" ON saved_answers;
CREATE POLICY "Users can insert own saved answers" ON saved_answers
  FOR INSERT
  WITH CHECK (user_id = (select auth.uid()));

-- ---------------------------------------------------------
-- saved_answers: "Users can delete own saved answers"
-- ---------------------------------------------------------
DROP POLICY IF EXISTS "Users can delete own saved answers" ON saved_answers;
CREATE POLICY "Users can delete own saved answers" ON saved_answers
  FOR DELETE
  USING (user_id = (select auth.uid()));

-- ---------------------------------------------------------
-- tenants: "Authenticated users can create tenants"
-- ---------------------------------------------------------
DROP POLICY IF EXISTS "Authenticated users can create tenants" ON tenants;
CREATE POLICY "Authenticated users can create tenants" ON tenants
  FOR INSERT
  WITH CHECK ((select auth.role()) = 'authenticated');

-- ---------------------------------------------------------
-- content_suggestions: "Users can insert suggestions to their tenant"
-- ---------------------------------------------------------
DROP POLICY IF EXISTS "Users can insert suggestions to their tenant" ON content_suggestions;
CREATE POLICY "Users can insert suggestions to their tenant" ON content_suggestions
  FOR INSERT
  WITH CHECK ((select auth.role()) = 'authenticated');

-- ---------------------------------------------------------
-- tenant_members: "Owners and admins can manage members"
-- Uses SECURITY DEFINER function is_tenant_member_with_role()
-- which bypasses RLS internally (avoids self-referential recursion)
-- and calls auth.uid() inside the function body, not in the policy.
-- ---------------------------------------------------------
DROP POLICY IF EXISTS "Owners and admins can manage members" ON tenant_members;
CREATE POLICY "Owners and admins can manage members" ON tenant_members
  FOR ALL
  USING (is_tenant_member_with_role(tenant_id, 'admin'))
  WITH CHECK (is_tenant_member_with_role(tenant_id, 'admin'));


-- ============================================================
-- PART 2: multiple_permissive_policies
-- invitations had two SELECT policies for the same role+action:
--   "Anyone can read invitation by token" (USING true)
--   "Tenant admins can view invitations"    (EXISTS check)
-- Merge into a single policy.
-- ============================================================

DROP POLICY IF EXISTS "Anyone can read invitation by token" ON invitations;
DROP POLICY IF EXISTS "Tenant admins can view invitations" ON invitations;
CREATE POLICY "Anyone can read invitation by token" ON invitations
  FOR SELECT
  USING (
    (
      EXISTS (
        SELECT 1 FROM tenant_members
        WHERE tenant_id = invitations.tenant_id
          AND user_id = (select auth.uid())
          AND role IN ('owner', 'admin')
      )
    )
    OR (select auth.role()) IS NULL
  );
