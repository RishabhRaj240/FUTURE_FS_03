-- Comprehensive fix for save, comment, and follow functionality
-- Run this in Supabase SQL Editor

-- 1. Ensure all required tables exist with proper structure
CREATE TABLE IF NOT EXISTS public.saves (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, project_id)
);

CREATE TABLE IF NOT EXISTS public.comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.followers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(follower_id, following_id)
);

-- 2. Enable RLS on all tables
ALTER TABLE public.saves ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.followers ENABLE ROW LEVEL SECURITY;

-- 3. Create RLS policies for saves
DROP POLICY IF EXISTS "Saves are viewable by everyone" ON public.saves;
CREATE POLICY "Saves are viewable by everyone"
  ON public.saves FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Authenticated users can save projects" ON public.saves;
CREATE POLICY "Authenticated users can save projects"
  ON public.saves FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can unsave own saves" ON public.saves;
CREATE POLICY "Users can unsave own saves"
  ON public.saves FOR DELETE
  USING (auth.uid() = user_id);

-- 4. Create RLS policies for comments
DROP POLICY IF EXISTS "Comments are viewable by everyone" ON public.comments;
CREATE POLICY "Comments are viewable by everyone"
  ON public.comments FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Authenticated users can create comments" ON public.comments;
CREATE POLICY "Authenticated users can create comments"
  ON public.comments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own comments" ON public.comments;
CREATE POLICY "Users can update own comments"
  ON public.comments FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own comments" ON public.comments;
CREATE POLICY "Users can delete own comments"
  ON public.comments FOR DELETE
  USING (auth.uid() = user_id);

-- 5. Create RLS policies for followers
DROP POLICY IF EXISTS "Followers are viewable by everyone" ON public.followers;
CREATE POLICY "Followers are viewable by everyone"
  ON public.followers FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Authenticated users can follow others" ON public.followers;
CREATE POLICY "Authenticated users can follow others"
  ON public.followers FOR INSERT
  WITH CHECK (auth.uid() = follower_id);

DROP POLICY IF EXISTS "Users can unfollow others" ON public.followers;
CREATE POLICY "Users can unfollow others"
  ON public.followers FOR DELETE
  USING (auth.uid() = follower_id);

-- 6. Add missing columns to projects table if they don't exist
ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS saves_count INTEGER NOT NULL DEFAULT 0;

ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS comments_count INTEGER NOT NULL DEFAULT 0;

-- 7. Add missing columns to profiles table if they don't exist
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS followers_count INTEGER NOT NULL DEFAULT 0;

ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS following_count INTEGER NOT NULL DEFAULT 0;

-- 8. Create or replace the update_updated_at_column function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 9. Create or replace the update_project_saves_count function
CREATE OR REPLACE FUNCTION update_project_saves_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.projects 
    SET saves_count = COALESCE(saves_count, 0) + 1 
    WHERE id = NEW.project_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.projects 
    SET saves_count = GREATEST(COALESCE(saves_count, 0) - 1, 0) 
    WHERE id = OLD.project_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 10. Create or replace the update_project_comments_count function
CREATE OR REPLACE FUNCTION update_project_comments_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.projects 
    SET comments_count = COALESCE(comments_count, 0) + 1 
    WHERE id = NEW.project_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.projects 
    SET comments_count = GREATEST(COALESCE(comments_count, 0) - 1, 0) 
    WHERE id = OLD.project_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 11. Create or replace the update_profile_followers_count function
CREATE OR REPLACE FUNCTION update_profile_followers_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Update following count for follower
    UPDATE public.profiles 
    SET following_count = COALESCE(following_count, 0) + 1 
    WHERE id = NEW.follower_id;
    
    -- Update followers count for following
    UPDATE public.profiles 
    SET followers_count = COALESCE(followers_count, 0) + 1 
    WHERE id = NEW.following_id;
  ELSIF TG_OP = 'DELETE' THEN
    -- Update following count for follower
    UPDATE public.profiles 
    SET following_count = GREATEST(COALESCE(following_count, 0) - 1, 0) 
    WHERE id = OLD.follower_id;
    
    -- Update followers count for following
    UPDATE public.profiles 
    SET followers_count = GREATEST(COALESCE(followers_count, 0) - 1, 0) 
    WHERE id = OLD.following_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 12. Drop existing triggers if they exist
DROP TRIGGER IF EXISTS update_saves_count ON public.saves;
DROP TRIGGER IF EXISTS update_comments_count ON public.comments;
DROP TRIGGER IF EXISTS update_followers_count ON public.followers;
DROP TRIGGER IF EXISTS update_comments_updated_at ON public.comments;

-- 13. Create triggers
CREATE TRIGGER update_saves_count
AFTER INSERT OR DELETE ON public.saves
FOR EACH ROW EXECUTE FUNCTION update_project_saves_count();

CREATE TRIGGER update_comments_count
AFTER INSERT OR DELETE ON public.comments
FOR EACH ROW EXECUTE FUNCTION update_project_comments_count();

CREATE TRIGGER update_followers_count
AFTER INSERT OR DELETE ON public.followers
FOR EACH ROW EXECUTE FUNCTION update_profile_followers_count();

CREATE TRIGGER update_comments_updated_at
BEFORE UPDATE ON public.comments
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 14. Update existing counts (run this to fix any existing data)
UPDATE public.projects 
SET saves_count = (
  SELECT COUNT(*) FROM public.saves 
  WHERE saves.project_id = projects.id
);

UPDATE public.projects 
SET comments_count = (
  SELECT COUNT(*) FROM public.comments 
  WHERE comments.project_id = projects.id
);

UPDATE public.profiles 
SET followers_count = (
  SELECT COUNT(*) FROM public.followers 
  WHERE followers.following_id = profiles.id
);

UPDATE public.profiles 
SET following_count = (
  SELECT COUNT(*) FROM public.followers 
  WHERE followers.follower_id = profiles.id
);

-- 15. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_saves_user_id ON public.saves(user_id);
CREATE INDEX IF NOT EXISTS idx_saves_project_id ON public.saves(project_id);
CREATE INDEX IF NOT EXISTS idx_comments_project_id ON public.comments(project_id);
CREATE INDEX IF NOT EXISTS idx_comments_user_id ON public.comments(user_id);
CREATE INDEX IF NOT EXISTS idx_followers_follower_id ON public.followers(follower_id);
CREATE INDEX IF NOT EXISTS idx_followers_following_id ON public.followers(following_id);

-- Success message
SELECT 'Database triggers and policies updated successfully!' as message;
