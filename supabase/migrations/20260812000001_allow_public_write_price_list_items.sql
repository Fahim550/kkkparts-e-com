-- Allow public (anon + authenticated) write access to price_list_items and product_variations
-- This is needed so the admin panel (which uses the publishable/anon key) can sync
-- prices into price_list_items when creating/editing products, without requiring
-- a logged-in Supabase Auth user with the ERP Admin role.

-- price_list_items: allow full CRUD by anyone (consistent with products table policy)
DROP POLICY IF EXISTS "Public write price_list_items" ON public.price_list_items;
CREATE POLICY "Public write price_list_items"
  ON public.price_list_items
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

-- product_variations: allow full CRUD by anyone (consistent with products table policy)
DROP POLICY IF EXISTS "Public write product_variations" ON public.product_variations;
CREATE POLICY "Public write product_variations"
  ON public.product_variations
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

-- price_lists: allow INSERT/UPDATE/DELETE by anyone so admin can create new lists
DROP POLICY IF EXISTS "Public write price_lists" ON public.price_lists;
CREATE POLICY "Public write price_lists"
  ON public.price_lists
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

-- Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';

