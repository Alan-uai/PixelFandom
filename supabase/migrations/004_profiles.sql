-- =====================================================
-- PROFILES TABLE
-- Complete profiles table for Supabase Auth
-- =====================================================

-- Create profiles table linked to auth.users
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username TEXT UNIQUE,
    display_name TEXT,
    email TEXT,
    avatar_url TEXT,
    role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin', 'moderator')),
    reputation_points INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles(username);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);

-- Trigger to update updated_at
CREATE TRIGGER IF NOT EXISTS update_profiles_updated_at BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Users can read any profile (public profiles)
CREATE POLICY "Profiles are publicly readable"
    ON profiles FOR SELECT
    USING (true);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
    ON profiles FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Users can insert their own profile (created during signup)
CREATE POLICY "Users can insert own profile"
    ON profiles FOR INSERT
    WITH CHECK (auth.uid() = id);

-- =====================================================
-- AUTO-CREATE PROFILE ON USER SIGNUP
-- =====================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger the function every time a user is created
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- RLS on other tables referencing profiles
-- =====================================================

ALTER TABLE content_suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE negative_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE wiki_articles ENABLE ROW LEVEL SECURITY;

-- Content suggestions: admins can read all, users can insert their own
CREATE POLICY "Admins can read all content suggestions"
    ON content_suggestions FOR SELECT
    USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Users can insert their own suggestions"
    ON content_suggestions FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Negative feedback: admins can read/update all
CREATE POLICY "Admins can read all negative feedback"
    ON negative_feedback FOR SELECT
    USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Admins can update negative feedback"
    ON negative_feedback FOR UPDATE
    USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- Saved answers: users can CRUD their own
CREATE POLICY "Users can read own saved answers"
    ON saved_answers FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own saved answers"
    ON saved_answers FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own saved answers"
    ON saved_answers FOR DELETE
    USING (auth.uid() = user_id);

-- Wiki articles: publicly readable, admins can write
CREATE POLICY "Wiki articles are publicly readable"
    ON wiki_articles FOR SELECT
    USING (true);

CREATE POLICY "Admins can insert wiki articles"
    ON wiki_articles FOR INSERT
    WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Admins can update wiki articles"
    ON wiki_articles FOR UPDATE
    USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Admins can delete wiki articles"
    ON wiki_articles FOR DELETE
    USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- =====================================================
-- SUMMARY
-- =====================================================

COMMENT ON TABLE profiles IS 'User profiles linked to Supabase Auth';
COMMENT ON COLUMN profiles.role IS 'User role: user, admin, or moderator';
COMMENT ON COLUMN profiles.reputation_points IS 'Points earned from contributing feedback';
