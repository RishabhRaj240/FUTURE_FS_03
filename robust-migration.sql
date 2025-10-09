-- ROBUST MIGRATION SCRIPT - Run this if the previous migration didn't work
-- This script handles all potential conflicts and errors

-- Step 1: Drop existing tables if they exist (to start fresh)
DROP TABLE IF EXISTS public.saves CASCADE;
DROP TABLE IF EXISTS public.comments CASCADE;

-- Step 2: Add columns to projects table (with proper error handling)
DO $$ 
BEGIN
    -- Add saves_count column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'projects' AND column_name = 'saves_count') THEN
        ALTER TABLE public.projects ADD COLUMN saves_count INTEGER NOT NULL DEFAULT 0;
    END IF;
    
    -- Add comments_count column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'projects' AND column_name = 'comments_count') THEN
        ALTER TABLE public.projects ADD COLUMN comments_count INTEGER NOT NULL DEFAULT 0;
    END IF;
END $$;

-- Step 3: Create saves table
CREATE TABLE public.saves (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, project_id)
);

-- Step 4: Enable RLS on saves
ALTER TABLE public.saves ENABLE ROW LEVEL SECURITY;

-- Step 5: Create saves policies
CREATE POLICY "Saves are viewable by everyone" 
  ON public.saves FOR SELECT 
  USING (true);

CREATE POLICY "Authenticated users can save projects" 
  ON public.saves FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unsave own saves" 
  ON public.saves FOR DELETE 
  USING (auth.uid() = user_id);

-- Step 6: Create comments table
CREATE TABLE public.comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Step 7: Enable RLS on comments
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

-- Step 8: Create comments policies
CREATE POLICY "Comments are viewable by everyone" 
  ON public.comments FOR SELECT 
  USING (true);

CREATE POLICY "Authenticated users can create comments" 
  ON public.comments FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own comments" 
  ON public.comments FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own comments" 
  ON public.comments FOR DELETE 
  USING (auth.uid() = user_id);

-- Step 9: Create function to update project saves count
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

-- Step 10: Create trigger for saves count
CREATE TRIGGER update_saves_count
  AFTER INSERT OR DELETE ON public.saves
  FOR EACH ROW EXECUTE FUNCTION update_project_saves_count();

-- Step 11: Create function to update project comments count
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

-- Step 12: Create trigger for comments count
CREATE TRIGGER update_comments_count
  AFTER INSERT OR DELETE ON public.comments
  FOR EACH ROW EXECUTE FUNCTION update_project_comments_count();

-- Step 13: Create function to update updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 14: Create trigger for comments updated_at
CREATE TRIGGER update_comments_updated_at
  BEFORE UPDATE ON public.comments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Step 15: Verify the setup
SELECT 
  'Migration completed successfully!' as status,
  (SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'saves' AND table_schema = 'public') as saves_table_exists,
  (SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'comments' AND table_schema = 'public') as comments_table_exists,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'saves_count') as saves_count_column_exists,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'comments_count') as comments_count_column_exists;
