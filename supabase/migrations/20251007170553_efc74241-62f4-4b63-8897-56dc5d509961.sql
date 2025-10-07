-- Add missing foreign key constraint for projects -> profiles relationship
ALTER TABLE public.projects
DROP CONSTRAINT IF EXISTS projects_user_id_fkey;

ALTER TABLE public.projects
ADD CONSTRAINT projects_user_id_fkey 
FOREIGN KEY (user_id) 
REFERENCES public.profiles(id) 
ON DELETE CASCADE;