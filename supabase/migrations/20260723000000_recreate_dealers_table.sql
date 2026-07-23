-- Migration to re-create the dealers table and automatically backfill existing dealer accounts from auth.users

CREATE TABLE IF NOT EXISTS public.dealers (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT,
  email TEXT,
  phone TEXT,
  sponsored_details TEXT,
  area TEXT,
  license_number TEXT,
  plain_password TEXT,
  profile_image TEXT,
  is_approved BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Ensure RLS is enabled
ALTER TABLE public.dealers ENABLE ROW LEVEL SECURITY;

-- Permissive policies for dealers table
DROP POLICY IF EXISTS "Dealers can view their own profile" ON public.dealers;
CREATE POLICY "Dealers can view their own profile" 
  ON public.dealers FOR SELECT 
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Dealers can insert/update own profile" ON public.dealers;
CREATE POLICY "Dealers can insert/update own profile" 
  ON public.dealers FOR ALL 
  USING (true)
  WITH CHECK (true);

-- Trigger to automatically create dealer on auth.users insert IF role is dealer
CREATE OR REPLACE FUNCTION public.handle_new_dealer()
RETURNS trigger AS $$
BEGIN
  IF new.raw_user_meta_data->>'role' = 'dealer' THEN
    INSERT INTO public.dealers (
      id, 
      full_name, 
      email, 
      phone, 
      sponsored_details, 
      area, 
      license_number, 
      plain_password, 
      is_approved
    )
    VALUES (
      new.id,
      new.raw_user_meta_data->>'full_name',
      new.email,
      new.raw_user_meta_data->>'phone',
      new.raw_user_meta_data->>'sponsored_details',
      new.raw_user_meta_data->>'area',
      new.raw_user_meta_data->>'license_number',
      new.raw_user_meta_data->>'plain_password',
      false
    )
    ON CONFLICT (id) DO UPDATE SET
      full_name = EXCLUDED.full_name,
      email = EXCLUDED.email,
      phone = EXCLUDED.phone,
      sponsored_details = EXCLUDED.sponsored_details,
      area = EXCLUDED.area,
      license_number = EXCLUDED.license_number,
      plain_password = EXCLUDED.plain_password;
  END IF;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if exists to prevent errors on multiple runs
DROP TRIGGER IF EXISTS on_auth_user_created_dealer ON auth.users;

-- Create trigger
CREATE TRIGGER on_auth_user_created_dealer
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_dealer();

-- Backfill existing dealers from auth.users into public.dealers
INSERT INTO public.dealers (
  id, 
  full_name, 
  email, 
  phone, 
  sponsored_details, 
  area, 
  license_number, 
  plain_password, 
  is_approved,
  created_at
)
SELECT 
  id, 
  raw_user_meta_data->>'full_name', 
  email, 
  raw_user_meta_data->>'phone',
  raw_user_meta_data->>'sponsored_details',
  raw_user_meta_data->>'area',
  raw_user_meta_data->>'license_number',
  raw_user_meta_data->>'plain_password',
  COALESCE((raw_user_meta_data->>'is_approved')::boolean, false),
  created_at
FROM auth.users
WHERE raw_user_meta_data->>'role' = 'dealer'
ON CONFLICT (id) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  email = EXCLUDED.email,
  phone = EXCLUDED.phone,
  sponsored_details = EXCLUDED.sponsored_details,
  area = EXCLUDED.area,
  license_number = EXCLUDED.license_number,
  plain_password = EXCLUDED.plain_password;
