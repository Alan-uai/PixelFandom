-- Migration 095: Wiki reports (denúncias de wiki) + auto-restrição

-- 1. Coluna de status na tabela tenants
-- Estados: 'active' (normal) | 'restricted_review' (Acesso restrito para análise de denúncias)
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active'
  CHECK (status IN ('active', 'restricted_review'));

-- 2. Tabela de denúncias de wiki
CREATE TABLE IF NOT EXISTS wiki_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  reporter_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reason text NOT NULL,
  description text,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'reviewing', 'resolved', 'rejected', 'dismissed')),
  created_at timestamptz NOT NULL DEFAULT now(),
  reviewed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at timestamptz,
  review_notes text,
  UNIQUE (tenant_id, reporter_id)
);

CREATE INDEX IF NOT EXISTS idx_wiki_reports_tenant_status
  ON wiki_reports (tenant_id, status);

-- 3. Funções auxiliares de autorização
CREATE OR REPLACE FUNCTION is_global_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
  );
$$;

CREATE OR REPLACE FUNCTION is_tenant_manager(p_tenant_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.tenant_members
    WHERE tenant_id = p_tenant_id
      AND user_id = auth.uid()
      AND role IN ('owner', 'admin')
  );
$$;

-- 4. RLS
ALTER TABLE wiki_reports ENABLE ROW LEVEL SECURITY;

-- Qualquer usuário autenticado pode denunciar (a própria wiki)
DROP POLICY IF EXISTS "Usuários denunciam suas próprias wikis" ON wiki_reports;
CREATE POLICY "Usuários denunciam suas próprias wikis" ON wiki_reports
  FOR INSERT TO authenticated
  WITH CHECK (reporter_id = auth.uid());

-- Denunciante vê a própria denúncia; admin global e gestores do tenant veem tudo
DROP POLICY IF EXISTS "Leitura de denúncias" ON wiki_reports;
CREATE POLICY "Leitura de denúncias" ON wiki_reports
  FOR SELECT TO authenticated
  USING (
    reporter_id = auth.uid()
    OR is_global_admin()
    OR is_tenant_manager(tenant_id)
  );

-- Apenas admin global ou gestor do tenant podem avaliar (update/delete)
DROP POLICY IF EXISTS "Avaliação de denúncias" ON wiki_reports;
CREATE POLICY "Avaliação de denúncias" ON wiki_reports
  FOR UPDATE TO authenticated
  USING (is_global_admin() OR is_tenant_manager(tenant_id))
  WITH CHECK (is_global_admin() OR is_tenant_manager(tenant_id));

DROP POLICY IF EXISTS "Exclusão de denúncias" ON wiki_reports;
CREATE POLICY "Exclusão de denúncias" ON wiki_reports
  FOR DELETE TO authenticated
  USING (is_global_admin() OR is_tenant_manager(tenant_id));

-- 5. Trigger: restrição automática quando uma wiki é denunciada por mais de 500
--    usuários diferentes (denúncias não rejeitadas/dismissas).
CREATE OR REPLACE FUNCTION check_wiki_report_restriction()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
DECLARE
  v_tenant uuid;
  v_count int;
BEGIN
  v_tenant := COALESCE(NEW.tenant_id, OLD.tenant_id);

  SELECT COUNT(DISTINCT reporter_id) INTO v_count
  FROM wiki_reports
  WHERE tenant_id = v_tenant
    AND status NOT IN ('rejected', 'dismissed');

  IF v_count > 500 THEN
    UPDATE tenants
    SET status = 'restricted_review'
    WHERE id = v_tenant AND status <> 'restricted_review';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_wiki_report_restriction ON wiki_reports;
CREATE TRIGGER trg_wiki_report_restriction
  AFTER INSERT OR UPDATE OF status ON wiki_reports
  FOR EACH ROW
  EXECUTE FUNCTION check_wiki_report_restriction();
