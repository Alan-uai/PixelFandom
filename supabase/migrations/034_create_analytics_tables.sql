-- Migration 034: Analytics tables for page views and chat usage

-- Page views tracking
CREATE TABLE IF NOT EXISTS page_views (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    article_id UUID REFERENCES wiki_articles(id) ON DELETE SET NULL,
    page_path TEXT NOT NULL,
    page_title TEXT,
    viewer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    viewer_ip_hash TEXT,
    user_agent TEXT,
    referrer TEXT,
    viewed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_page_views_tenant_date
    ON page_views (tenant_id, viewed_at DESC);

CREATE INDEX IF NOT EXISTS idx_page_views_article
    ON page_views (tenant_id, article_id);

-- Chat usage tracking
CREATE TABLE IF NOT EXISTS chat_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    session_id TEXT,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    question TEXT NOT NULL,
    answer_length INT DEFAULT 0,
    model_used TEXT,
    provider TEXT,
    latency_ms INT,
    had_context BOOLEAN DEFAULT FALSE,
    feedback TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_chat_logs_tenant_date
    ON chat_logs (tenant_id, created_at DESC);

-- Materialized view for daily page view stats
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_daily_page_views AS
SELECT
    tenant_id,
    date_trunc('day', viewed_at) AS day,
    article_id,
    page_path,
    page_title,
    COUNT(*) AS views,
    COUNT(DISTINCT viewer_ip_hash) AS unique_visitors
FROM page_views
GROUP BY tenant_id, date_trunc('day', viewed_at), article_id, page_path, page_title;

CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_daily_page_views_unique
    ON mv_daily_page_views (tenant_id, day, COALESCE(article_id, '00000000-0000-0000-0000-000000000000'), page_path);

-- Materialized view for daily chat stats
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_daily_chat_stats AS
SELECT
    tenant_id,
    date_trunc('day', created_at) AS day,
    COUNT(*) AS total_questions,
    COUNT(DISTINCT COALESCE(user_id::text, session_id)) AS unique_users,
    AVG(latency_ms)::INT AS avg_latency_ms,
    COUNT(*) FILTER (WHERE had_context) AS with_context,
    COUNT(*) FILTER (WHERE feedback = 'positive') AS positive_feedback,
    COUNT(*) FILTER (WHERE feedback = 'negative') AS negative_feedback
FROM chat_logs
GROUP BY tenant_id, date_trunc('day', created_at);

CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_daily_chat_stats_unique
    ON mv_daily_chat_stats (tenant_id, day);

-- Function to refresh materialized views
CREATE OR REPLACE FUNCTION refresh_analytics_views()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_daily_page_views;
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_daily_chat_stats;
END;
$$;
