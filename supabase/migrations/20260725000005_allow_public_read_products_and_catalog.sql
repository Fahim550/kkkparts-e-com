-- Allow public (anon + authenticated) read access to products and catalog tables
-- This ensures unauthenticated visitors can view products, categories, brands, variations on the public website/homepage.

DO $$
DECLARE
    tbl_name text;
BEGIN
    FOR tbl_name IN 
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename IN (
            'brands', 'categories', 'units_of_measure', 'uom_conversions', 
            'attributes', 'attribute_values', 'products', 'product_attributes', 
            'product_variations', 'variation_attributes', 'price_lists', 'price_list_items'
        )
    LOOP
        -- Drop restrictive authenticated-only SELECT policy if exists
        EXECUTE format('DROP POLICY IF EXISTS "Authenticated users can read foundational data" ON public.%I;', tbl_name);
        EXECUTE format('DROP POLICY IF EXISTS "Public read access" ON public.%I;', tbl_name);
        
        -- Create public read SELECT policy allowing anyone (anon + authenticated) to view catalog data
        EXECUTE format('CREATE POLICY "Public read access" ON public.%I FOR SELECT TO public USING (true);', tbl_name);
    END LOOP;
END $$;
