-- Migration 096: Rastreamento de entrega de e-mails + trilha de auditoria jurídica

-- 1. Tabela de auditoria (append-only) de eventos do Resend.
--    Cada evento (enviado, entregue, bounce, spam, aberto, etc) vira uma linha.
--    Finalidade: prova jurídica de que a notificação chegou (ou não) ao dono da Wiki.
CREATE TABLE IF NOT EXISTS email_events (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  resend_id   text,
  recipient   text,
  tenant_id   uuid REFERENCES tenants(id) ON DELETE SET NULL,
  category    text,
  event       text NOT NULL,
  occurred_at timestamptz,
  data        jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_email_events_resend  ON email_events (resend_id);
CREATE INDEX IF NOT EXISTS idx_email_events_recipient ON email_events (recipient);
CREATE INDEX IF NOT EXISTS idx_email_events_tenant  ON email_events (tenant_id);

-- 2. Estado de entrega por e-mail enviado (usado para reenvio/retry a cada 12h).
CREATE TABLE IF NOT EXISTS email_deliveries (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  resend_id     text UNIQUE,
  recipient     text NOT NULL,
  tenant_id     uuid REFERENCES tenants(id) ON DELETE SET NULL,
  category      text,
  subject       text,
  html          text,
  text_body     text,
  status        text NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending','sent','delivered','bounced','complained','delayed')),
  opened        boolean NOT NULL DEFAULT false,
  last_event_at timestamptz,
  retries       int NOT NULL DEFAULT 0,
  next_retry_at timestamptz,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_email_deliveries_retry
  ON email_deliveries (status, next_retry_at);

-- 3. RLS: trilha jurídica só é visível para admin global.
ALTER TABLE email_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_deliveries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Leitura de eventos de e-mail (admin)" ON email_events;
CREATE POLICY "Leitura de eventos de e-mail (admin)" ON email_events
  FOR SELECT TO authenticated USING (is_global_admin());

DROP POLICY IF EXISTS "Leitura de entregas de e-mail (admin)" ON email_deliveries;
CREATE POLICY "Leitura de entregas de e-mail (admin)" ON email_deliveries
  FOR SELECT TO authenticated USING (is_global_admin());
