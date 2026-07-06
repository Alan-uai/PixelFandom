-- Migration 073: Fix unqualified 'tenants' reference in ensure_game_table CREATE POLICY
-- Migration 068 fixed most DDL/DML inside EXECUTE format() calls but forgot to
-- prefix 'tenants' and 'is_tenant_member' with 'public.' inside the SELECT policy.
-- With SET search_path = '', this caused "relation 'tenants' does not exist".

CREATE OR REPLACE FUNCTION ensure_game_table(
  p_table TEXT,
  p_tenant_id UUID,
  p_label TEXT DEFAULT NULL,
  p_icon TEXT DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
  v_exists BOOLEAN;
  v_label TEXT;
BEGIN
  IF p_tenant_id IS NULL OR NOT public.is_tenant_member_with_role(p_tenant_id, 'editor'::text) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Permissão negada.');
  END IF;

  IF NOT public.is_valid_column_name(p_table) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Nome de tabela inválido. Use apenas letras minúsculas, números e underscore.');
  END IF;

  IF EXISTS (SELECT 1 FROM public.tenant_game_tables WHERE tenant_id = p_tenant_id AND table_name = p_table) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Você já tem esta tabela na sua Wiki.');
  END IF;

  IF p_label IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.tenant_game_tables
    WHERE tenant_id = p_tenant_id AND LOWER(display_label) = LOWER(p_label)
  ) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Você já tem uma tabela com este nome de exibição na sua Wiki.');
  END IF;

  v_label := COALESCE(p_label, p_table);

  SELECT EXISTS (
    SELECT 1 FROM pg_class WHERE relname = p_table AND relkind = 'r'
  ) INTO v_exists;

  IF NOT v_exists THEN
    EXECUTE format('
      CREATE TABLE public.%I (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID NOT NULL,
        name TEXT,
        slug TEXT,
        description TEXT,
        image_url TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )', p_table);

    EXECUTE format('CREATE INDEX idx_%I_tenant ON public.%I(tenant_id)', p_table, p_table);
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', p_table);

    EXECUTE format(
      'CREATE POLICY "Game %I readable" ON public.%I FOR SELECT USING (
        (tenant_id IS NULL) OR (
          EXISTS (SELECT 1 FROM public.tenants WHERE public.tenants.id = public.%I.tenant_id AND (public.tenants.is_public = true OR public.is_tenant_member(public.tenants.id)))
        )
      )',
      p_table, p_table, p_table
    );
    EXECUTE format(
      'CREATE POLICY "Game %I insert" ON public.%I FOR INSERT WITH CHECK (public.is_tenant_member_with_role(tenant_id, ''editor''))',
      p_table, p_table
    );
    EXECUTE format(
      'CREATE POLICY "Game %I update" ON public.%I FOR UPDATE USING (public.is_tenant_member_with_role(tenant_id, ''editor''))',
      p_table, p_table
    );
    EXECUTE format(
      'CREATE POLICY "Game %I delete" ON public.%I FOR DELETE USING (public.is_tenant_member_with_role(tenant_id, ''admin''))',
      p_table, p_table
    );
  END IF;

  INSERT INTO public.tenant_game_tables (tenant_id, table_name, display_label, icon)
  VALUES (p_tenant_id, p_table, v_label, COALESCE(p_icon, 'Database'))
  ON CONFLICT (tenant_id, table_name) DO UPDATE SET display_label = v_label, icon = COALESCE(p_icon, public.tenant_game_tables.icon);

  RETURN jsonb_build_object('ok', true, 'table', p_table, 'created', NOT v_exists);
END;
$$;
