-- Migration 075: Security tables — IP blocking, threat detection, rate limiting
-- Sistema de blindagem contra ataques: SQL injection, malware, brute force

-- =====================================================
-- 1. ip_blocks — Bloqueios de IP permanentes ou temporários
-- =====================================================
CREATE TABLE IF NOT EXISTS ip_blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_hash TEXT NOT NULL,
  ip_cidr CIDR,
  reason TEXT NOT NULL,
  threat_type TEXT NOT NULL CHECK (threat_type IN (
    'sql_injection', 'malware_upload', 'brute_force', 'abuse', 'rate_limit', 'manual'
  )),
  blocked_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  blocked_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT true,
  metadata JSONB DEFAULT '{}'::jsonb,
  auto_blocked BOOLEAN NOT NULL DEFAULT true
);

CREATE INDEX IF NOT EXISTS idx_ip_blocks_active
  ON ip_blocks (ip_hash, is_active)
  WHERE is_active;

CREATE INDEX IF NOT EXISTS idx_ip_blocks_expires
  ON ip_blocks (expires_at)
  WHERE is_active AND expires_at IS NOT NULL;

ALTER TABLE ip_blocks ENABLE ROW LEVEL SECURITY;

-- Only authenticated users can view ip_blocks
CREATE POLICY "ip_blocks_select" ON ip_blocks
  FOR SELECT USING (auth.role() = 'authenticated');

-- Only service_role can insert (threat detection runs as trigger or edge function)
CREATE POLICY "ip_blocks_insert" ON ip_blocks
  FOR INSERT WITH CHECK (auth.role() = 'service_role' OR auth.role() = 'authenticated');

-- Only admins can update
CREATE POLICY "ip_blocks_update" ON ip_blocks
  FOR UPDATE USING (auth.role() = 'authenticated');

-- =====================================================
-- 2. request_fingerprints — Rastreamento cross-IP
-- =====================================================
CREATE TABLE IF NOT EXISTS request_fingerprints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fingerprint_hash TEXT NOT NULL UNIQUE,
  ip_hashes TEXT[] NOT NULL DEFAULT '{}',
  user_agent TEXT,
  is_blocked BOOLEAN NOT NULL DEFAULT false,
  first_seen TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_seen TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_fingerprints_hash
  ON request_fingerprints (fingerprint_hash);

CREATE INDEX IF NOT EXISTS idx_fingerprints_blocked
  ON request_fingerprints (is_blocked)
  WHERE is_blocked;

ALTER TABLE request_fingerprints ENABLE ROW LEVEL SECURITY;

CREATE POLICY "fingerprints_select" ON request_fingerprints
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "fingerprints_insert" ON request_fingerprints
  FOR INSERT WITH CHECK (auth.role() = 'service_role' OR auth.role() = 'authenticated');

CREATE POLICY "fingerprints_update" ON request_fingerprints
  FOR UPDATE USING (auth.role() = 'service_role' OR auth.role() = 'authenticated');

-- =====================================================
-- 3. threat_events — Log de todos os eventos de segurança
-- =====================================================
CREATE TABLE IF NOT EXISTS threat_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_hash TEXT NOT NULL,
  fingerprint_hash TEXT,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL CHECK (event_type IN (
    'sql_injection', 'malware_upload', 'brute_force', 'rate_limit',
    'invalid_file', 'suspicious_request', 'blocked_request'
  )),
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  path TEXT,
  method TEXT,
  details JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_threat_events_ip
  ON threat_events (ip_hash, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_threat_events_type
  ON threat_events (event_type, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_threat_events_severity
  ON threat_events (severity, created_at DESC);

ALTER TABLE threat_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "threat_events_select" ON threat_events
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "threat_events_insert" ON threat_events
  FOR INSERT WITH CHECK (auth.role() = 'service_role' OR auth.role() = 'authenticated');

-- =====================================================
-- 4. rate_limits — Rate limiting tracking
-- =====================================================
CREATE TABLE IF NOT EXISTS rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_hash TEXT NOT NULL,
  endpoint TEXT NOT NULL,
  request_count INTEGER NOT NULL DEFAULT 1,
  window_start TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_rate_limits_lookup
  ON rate_limits (ip_hash, endpoint, window_start);

ALTER TABLE rate_limits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "rate_limits_select" ON rate_limits
  FOR SELECT USING (auth.role() = 'service_role');

CREATE POLICY "rate_limits_insert" ON rate_limits
  FOR INSERT WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "rate_limits_delete" ON rate_limits
  FOR DELETE USING (auth.role() = 'service_role');

-- =====================================================
-- 5. Auto-cleanup old rate limits
-- =====================================================
CREATE OR REPLACE FUNCTION cleanup_rate_limits()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  DELETE FROM rate_limits
  WHERE window_start < now() - interval '1 hour';
END;
$$;
