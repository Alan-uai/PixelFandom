-- =====================================================
-- FIX AUTH, RLS, AND FUNCTION ISSUES
--
-- 1. Add SET search_path to all SECURITY DEFINER functions
-- 2. Fix profiles RLS policies for init plan performance
-- 3. Fix tenant_members INSERT policy for first-owner creation
-- =====================================================

-- =====================================================
-- 1. FIX SECURITY DEFINER FUNCTIONS: add search_path
-- =====================================================

CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    NEW.updated_at = NOW();
        RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;

        CREATE OR REPLACE FUNCTION public.handle_new_user()
        RETURNS TRIGGER
        SECURITY DEFINER
        SET search_path = ''
        AS $$
        BEGIN
            INSERT INTO public.profiles (id, username, email, avatar_url)
                VALUES (
                        NEW.id,
                                COALESCE(NEW.raw_user_meta_data->>'username', 'user_' || substr(NEW.id::text, 1, 8)),
                                        NEW.email,
                                                NEW.raw_user_meta_data->>'avatar_url'
                                                    );
                                                        RETURN NEW;
                                                        END;
                                                        $$ LANGUAGE plpgsql;

                                                        CREATE OR REPLACE FUNCTION public.is_tenant_member(_tenant_id UUID)
                                                        RETURNS BOOLEAN
                                                        LANGUAGE SQL
                                                        SECURITY DEFINER
                                                        SET search_path = ''
                                                        STABLE
                                                        AS $$
                                                          SELECT EXISTS (
                                                              SELECT 1 FROM public.tenant_members
                                                                  WHERE tenant_members.tenant_id = $1
                                                                        AND tenant_members.user_id = auth.uid()
                                                                          );
                                                                          $$;

                                                                          CREATE OR REPLACE FUNCTION public.is_tenant_member_with_role(_tenant_id UUID, _min_role TEXT)
                                                                          RETURNS BOOLEAN
                                                                          LANGUAGE SQL
                                                                          SECURITY DEFINER
                                                                          SET search_path = ''
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

                                                                                                                                        CREATE OR REPLACE FUNCTION public.get_tenant_id_from_collection_item(_item_id UUID)
                                                                                                                                        RETURNS UUID
                                                                                                                                        LANGUAGE SQL
                                                                                                                                        SECURITY DEFINER
                                                                                                                                        SET search_path = ''
                                                                                                                                        STABLE
                                                                                                                                        AS $$
                                                                                                                                          SELECT cc.tenant_id
                                                                                                                                            FROM public.collection_items ci
                                                                                                                                              JOIN public.custom_collections cc ON cc.id = ci.collection_id
                                                                                                                                                WHERE ci.id = $1;
                                                                                                                                                $$;

                                                                                                                                                -- =====================================================
                                                                                                                                                -- 2. FIX PROFILES RLS POLICIES (init plan optimization)
                                                                                                                                                -- =====================================================

                                                                                                                                                DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
                                                                                                                                                CREATE POLICY "Users can insert own profile" ON profiles
                                                                                                                                                    FOR INSERT
                                                                                                                                                        WITH CHECK ((select auth.uid()) = id);

                                                                                                                                                        DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
                                                                                                                                                        CREATE POLICY "Users can update own profile" ON profiles
                                                                                                                                                            FOR UPDATE
                                                                                                                                                                USING ((select auth.uid()) = id)
                                                                                                                                                                    WITH CHECK ((select auth.uid()) = id);

                                                                                                                                                                    -- =====================================================
                                                                                                                                                                    -- 3. FIX TENANT_MEMBERS INSERT POLICY (allow first owner)
                                                                                                                                                                    -- =====================================================

                                                                                                                                                                    DROP POLICY IF EXISTS "Owners and admins can manage members" ON tenant_members;

                                                                                                                                                                    CREATE POLICY "Owners and admins can manage members"
                                                                                                                                                                        ON tenant_members FOR INSERT
                                                                                                                                                                            WITH CHECK (
                                                                                                                                                                                    (user_id = auth.uid() AND role = 'owner')
                                                                                                                                                                                            OR public.is_tenant_member_with_role(tenant_id, 'admin')
                                                                                                                                                                                                );

                                                                                                                                                                                                -- =====================================================
                                                                                                                                                                                                -- SUMMARY
                                                                                                                                                                                                -- =====================================================

                                                                                                                                                                                                COMMENT ON FUNCTION public.handle_new_user IS 'Creates a profile row on user signup. SECURITY DEFINER with locked search_path.';
                                                                                                                                                                                                