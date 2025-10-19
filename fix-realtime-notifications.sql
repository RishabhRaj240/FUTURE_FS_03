-- Fix Real-time Notifications for Nexus
-- Run this in Supabase SQL Editor

-- 1. Enable real-time for projects table
ALTER PUBLICATION supabase_realtime ADD TABLE public.projects;

-- 2. Ensure RLS policies allow real-time subscriptions
-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Projects are viewable by everyone" ON public.projects;
DROP POLICY IF EXISTS "Authenticated users can view projects" ON public.projects;

-- Create policies that allow real-time subscriptions
CREATE POLICY "Projects are viewable by everyone" 
  ON public.projects FOR SELECT 
  USING (true);

CREATE POLICY "Authenticated users can view projects" 
  ON public.projects FOR SELECT 
  USING (auth.role() = 'authenticated');

-- 3. Ensure projects table has proper structure for real-time
-- Add any missing columns that might be needed
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- 4. Create a function to handle real-time notifications
CREATE OR REPLACE FUNCTION notify_new_project()
RETURNS TRIGGER AS $$
BEGIN
  -- This function will be called when a new project is inserted
  -- The real-time listener will pick up the INSERT event
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. Create trigger for new projects (optional - for additional processing)
DROP TRIGGER IF EXISTS on_project_created ON public.projects;
CREATE TRIGGER on_project_created
  AFTER INSERT ON public.projects
  FOR EACH ROW
  EXECUTE FUNCTION notify_new_project();

-- 6. Grant necessary permissions for real-time
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON public.projects TO anon, authenticated;
GRANT SELECT ON public.profiles TO anon, authenticated;
GRANT SELECT ON public.categories TO anon, authenticated;

-- 7. Ensure the real-time extension is enabled
-- This should already be enabled by default in Supabase
-- SELECT * FROM pg_extension WHERE extname = 'supabase_realtime';

-- 8. Test query to verify real-time setup
-- This should return the current projects count
SELECT COUNT(*) as total_projects FROM public.projects;
