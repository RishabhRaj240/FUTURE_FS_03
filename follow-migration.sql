-- Create followers table for user following functionality
-- Run this in the Supabase SQL Editor

-- Create followers table
CREATE TABLE IF NOT EXISTS public.followers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(follower_id, following_id)
);

-- Enable RLS on followers
ALTER TABLE public.followers ENABLE ROW LEVEL SECURITY;

-- Create followers policies
CREATE POLICY "Followers are viewable by everyone"
  ON public.followers FOR SELECT
  USING (true);

CREATE POLICY "Users can follow other users"
  ON public.followers FOR INSERT
  WITH CHECK (auth.uid() = follower_id AND auth.uid() != following_id);

CREATE POLICY "Users can unfollow users they follow"
  ON public.followers FOR DELETE
  USING (auth.uid() = follower_id);

-- Add followers_count and following_count to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS followers_count INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS following_count INTEGER NOT NULL DEFAULT 0;

-- Create function to update follower counts
CREATE OR REPLACE FUNCTION update_follower_counts()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Increment following count for follower
    UPDATE public.profiles 
    SET following_count = following_count + 1 
    WHERE id = NEW.follower_id;
    
    -- Increment followers count for following user
    UPDATE public.profiles 
    SET followers_count = followers_count + 1 
    WHERE id = NEW.following_id;
    
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    -- Decrement following count for follower
    UPDATE public.profiles 
    SET following_count = following_count - 1 
    WHERE id = OLD.follower_id;
    
    -- Decrement followers count for following user
    UPDATE public.profiles 
    SET followers_count = followers_count - 1 
    WHERE id = OLD.following_id;
    
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create triggers to automatically update counts
DROP TRIGGER IF EXISTS update_follower_counts_trigger ON public.followers;
CREATE TRIGGER update_follower_counts_trigger
  AFTER INSERT OR DELETE ON public.followers
  FOR EACH ROW EXECUTE FUNCTION update_follower_counts();
