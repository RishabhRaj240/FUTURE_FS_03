-- Add additional profile fields to the profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS website TEXT,
ADD COLUMN IF NOT EXISTS location TEXT,
ADD COLUMN IF NOT EXISTS twitter TEXT,
ADD COLUMN IF NOT EXISTS instagram TEXT,
ADD COLUMN IF NOT EXISTS linkedin TEXT,
ADD COLUMN IF NOT EXISTS banner_url TEXT;

-- Update the updated_at timestamp
UPDATE public.profiles SET updated_at = NOW() WHERE updated_at IS NULL;
