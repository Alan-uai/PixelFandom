-- Migration 089: RPC para alterar tipo de coluna existente no banco
-- Permite ALTER TABLE … ALTER COLUMN … TYPE com validação de permissão

CREATE OR REPLACE FUNCTION alter_column_type(
  p_table TEXT,
  p_column TEXT,
  p_type TEXT,
  p_tenant_id UUID DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
  v_allowed_types TEXT[] := ARRAY['text', 'integer', 'numeric', 'boolean', 'jsonb', 'real', 'bigint', 'double precision'];
BEGIN
  IF p_tenant_id IS NULL OR NOT public.is_tenant_member_with_role(p_tenant_id, 'editor'::text) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Permissão negada — apenas editores, admins ou owners podem alterar o schema.');
  END IF;

  IF NOT public.is_game_table(p_table) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Tabela não permitida: ' || p_table);
  END IF;

  IF NOT public.is_valid_column_name(p_column) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Nome de coluna inválido. Use apenas letras minúsculas, números e underscore.');
  END IF;

  IF NOT (p_type = ANY(v_allowed_types)) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Tipo não permitido: ' || p_type);
  END IF;

  IF public.is_system_column(p_column) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Coluna do sistema não pode ser alterada.');
  END IF;

  BEGIN
    EXECUTE format('ALTER TABLE public.%I ALTER COLUMN %I TYPE %s USING %I::%s', p_table, p_column, p_type, p_column, p_type);
    RETURN jsonb_build_object('ok', true, 'column', p_column, 'type', p_type);
  EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('ok', false, 'error', SQLERRM);
  END;
END;
$$;
