-- =====================================================
-- APPLICATION TABLES - Suggestions, Wiki, Saved Answers
-- =====================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- WIKI ARTICLES
-- =====================================================

CREATE TABLE IF NOT EXISTS wiki_articles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    summary TEXT,
    content TEXT,
    tags TEXT[],
    image_url TEXT,
    tables JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_wiki_articles_title ON wiki_articles(title);
CREATE INDEX IF NOT EXISTS idx_wiki_articles_tags ON wiki_articles USING GIN(tags);

-- =====================================================
-- CONTENT SUGGESTIONS (for admin review panel)
-- =====================================================

CREATE TABLE IF NOT EXISTS content_suggestions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID,
    user_email TEXT,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    attachment_urls TEXT[],
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_content_suggestions_status ON content_suggestions(status);
CREATE INDEX IF NOT EXISTS idx_content_suggestions_created ON content_suggestions(created_at DESC);

-- =====================================================
-- NEGATIVE FEEDBACK (for admin review panel)
-- =====================================================

CREATE TABLE IF NOT EXISTS negative_feedback (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID,
    user_email TEXT,
    question TEXT NOT NULL,
    negative_response TEXT NOT NULL,
    ai_suggestion TEXT,
    reputation_points_awarded INTEGER DEFAULT 1,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewing', 'fixed')),
    reviewed_by TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_negative_feedback_status ON negative_feedback(status);
CREATE INDEX IF NOT EXISTS idx_negative_feedback_created ON negative_feedback(created_at DESC);

-- =====================================================
-- SAVED ANSWERS (user saved responses)
-- =====================================================

CREATE TABLE IF NOT EXISTS saved_answers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    question TEXT,
    answer TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_saved_answers_user ON saved_answers(user_id);

-- =====================================================
-- TRIGGERS for updated_at
-- =====================================================

CREATE TRIGGER IF NOT EXISTS update_wiki_articles_updated_at BEFORE UPDATE ON wiki_articles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- =====================================================
-- SUMMARY
-- =====================================================

COMMENT ON TABLE wiki_articles IS 'Wiki articles for the Eternal Guide';
COMMENT ON TABLE content_suggestions IS 'User-submitted content suggestions for admin review';
COMMENT ON TABLE negative_feedback IS 'Negative AI feedback reports for admin review';
COMMENT ON TABLE saved_answers IS 'User-saved chat answers';
