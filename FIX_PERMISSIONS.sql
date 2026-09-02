-- =============================================================================
-- GRANT FULL PERMISSIONS & PUBLIC ACCESS TO ALL TABLES AND STORAGE
-- Run this in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/uduerhxssuljnvcyuskj
-- =============================================================================

-- 1. Grant Schema Usage to PostgREST roles (anon, authenticated, service_role)
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role, postgres;

-- 2. Grant table, sequence, and function access
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role, postgres;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role, postgres;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO anon, authenticated, service_role, postgres;

-- 3. Set Default Privileges for all future tables/sequences
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated, service_role, postgres;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO anon, authenticated, service_role, postgres;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON ROUTINES TO anon, authenticated, service_role, postgres;

-- 4. Ensure RLS policies allow reading and writing for the web app
DO $$
DECLARE
    tbl_name text;
BEGIN
    FOR tbl_name IN 
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public'
    LOOP
        EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', tbl_name);
        EXECUTE format('DROP POLICY IF EXISTS "Allow public all operations" ON public.%I;', tbl_name);
        EXECUTE format('CREATE POLICY "Allow public all operations" ON public.%I FOR ALL TO public USING (true) WITH CHECK (true);', tbl_name);
    END LOOP;
END $$;

-- 5. Ensure Storage Bucket & Policies exist
INSERT INTO storage.buckets (id, name, public) VALUES ('product-images', 'product-images', true) ON CONFLICT (id) DO NOTHING;
DROP POLICY IF EXISTS "Public access product images" ON storage.objects;
CREATE POLICY "Public access product images" ON storage.objects FOR ALL TO public USING (bucket_id = 'product-images') WITH CHECK (bucket_id = 'product-images');

-- 6. Reload PostgREST API schema cache
NOTIFY pgrst, 'reload schema';
