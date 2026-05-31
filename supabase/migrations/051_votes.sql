-- Migration 051: Polymorphic vote system (article + tenant upvote/downvote)

CREATE TABLE IF NOT EXISTS votes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    target_type TEXT NOT NULL CHECK (target_type IN ('article', 'tenant')),
    target_id UUID NOT NULL,
    vote_type TEXT NOT NULL CHECK (vote_type IN ('up', 'down')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (user_id, target_type, target_id)
);

CREATE INDEX IF NOT EXISTS idx_votes_target ON votes (target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_votes_user ON votes (user_id);
CREATE INDEX IF NOT EXISTS idx_votes_target_type ON votes (target_type, target_id, vote_type);

-- RLS
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Votes are public to read" ON votes FOR SELECT USING (true);
CREATE POLICY "Users can vote" ON votes FOR INSERT
    WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can remove own votes" ON votes FOR DELETE
    USING (auth.uid() = user_id);
CREATE POLICY "Users can update own votes" ON votes FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Trigger: update reactions_received on article author when upvote is added/removed
CREATE OR REPLACE FUNCTION update_article_vote_reactions()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
    target_author UUID;
BEGIN
    IF NEW.target_type = 'article' AND NEW.vote_type = 'up' THEN
        SELECT created_by INTO target_author FROM wiki_articles WHERE id = NEW.target_id::uuid;
        IF target_author IS NOT NULL THEN
            UPDATE profiles SET reactions_received = reactions_received + 1 WHERE id = target_author;
        END IF;
    END IF;
    RETURN NULL;
END;
$$;

CREATE OR REPLACE FUNCTION remove_article_vote_reactions()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
    target_author UUID;
BEGIN
    IF OLD.target_type = 'article' AND OLD.vote_type = 'up' THEN
        SELECT created_by INTO target_author FROM wiki_articles WHERE id = OLD.target_id::uuid;
        IF target_author IS NOT NULL THEN
            UPDATE profiles SET reactions_received = GREATEST(0, reactions_received - 1) WHERE id = target_author;
        END IF;
    END IF;
    RETURN NULL;
END;
$$;

CREATE TRIGGER trg_vote_reactions_add
    AFTER INSERT ON votes
    FOR EACH ROW
    EXECUTE FUNCTION update_article_vote_reactions();

CREATE TRIGGER trg_vote_reactions_remove
    AFTER DELETE ON votes
    FOR EACH ROW
    EXECUTE FUNCTION remove_article_vote_reactions();
