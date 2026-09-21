-- Migration: Add Salesman Role and RLS Policies for Sales staff
-- Date: 2026-09-21

-- 1. Ensure 'Sales' and 'Salesman' roles exist in erp_roles
INSERT INTO erp_roles (name) 
VALUES ('Sales'), ('Salesman')
ON CONFLICT (name) DO NOTHING;

-- 2. Enhance or create function to check if current user has any matching role (case-insensitive & synonym-aware)
CREATE OR REPLACE FUNCTION public.has_role(role_name text)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.erp_user_roles ur
    JOIN public.erp_roles r ON ur.role_id = r.id
    WHERE ur.user_id = auth.uid()
    AND (
      LOWER(r.name) = LOWER(role_name)
      OR (LOWER(role_name) IN ('sales', 'salesman') AND LOWER(r.name) IN ('sales', 'salesman'))
    )
  );
$$;

-- 3. RPC to fetch all roles for the current authenticated user
CREATE OR REPLACE FUNCTION public.get_my_roles()
RETURNS TABLE (role_name text)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT r.name
  FROM public.erp_user_roles ur
  JOIN public.erp_roles r ON ur.role_id = r.id
  WHERE ur.user_id = auth.uid();
$$;

-- 4. RPC to check if current user is an ERP staff member (Admin, Sales, Salesman, Cashier, WarehouseManager, Accountant)
CREATE OR REPLACE FUNCTION public.is_erp_staff()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.erp_user_roles ur
    WHERE ur.user_id = auth.uid()
  ) OR EXISTS (
    SELECT 1
    FROM public.users u
    WHERE u.id = auth.uid() AND u.role IN ('admin', 'staff', 'sales', 'salesman')
  );
$$;

-- 5. RLS Policies for Sales/Salesman staff on Sales and POS tables
DO $$
BEGIN
  -- Sales Orders
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'sales_orders') THEN
    DROP POLICY IF EXISTS "Sales Staff Orders Access" ON sales_orders;
    CREATE POLICY "Sales Staff Orders Access" ON sales_orders
      FOR ALL
      USING (public.has_role('Admin') OR public.has_role('Sales') OR public.has_role('Salesman'))
      WITH CHECK (public.has_role('Admin') OR public.has_role('Sales') OR public.has_role('Salesman'));
  END IF;

  -- Sales Order Items
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'sales_order_items') THEN
    DROP POLICY IF EXISTS "Sales Staff Order Items Access" ON sales_order_items;
    CREATE POLICY "Sales Staff Order Items Access" ON sales_order_items
      FOR ALL
      USING (public.has_role('Admin') OR public.has_role('Sales') OR public.has_role('Salesman'))
      WITH CHECK (public.has_role('Admin') OR public.has_role('Sales') OR public.has_role('Salesman'));
  END IF;

  -- POS Receipts
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'pos_receipts') THEN
    DROP POLICY IF EXISTS "Sales Staff POS Receipts Access" ON pos_receipts;
    CREATE POLICY "Sales Staff POS Receipts Access" ON pos_receipts
      FOR ALL
      USING (public.has_role('Admin') OR public.has_role('Sales') OR public.has_role('Salesman') OR public.has_role('Cashier'))
      WITH CHECK (public.has_role('Admin') OR public.has_role('Sales') OR public.has_role('Salesman') OR public.has_role('Cashier'));
  END IF;

  -- POS Receipt Items
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'pos_receipt_items') THEN
    DROP POLICY IF EXISTS "Sales Staff POS Receipt Items Access" ON pos_receipt_items;
    CREATE POLICY "Sales Staff POS Receipt Items Access" ON pos_receipt_items
      FOR ALL
      USING (public.has_role('Admin') OR public.has_role('Sales') OR public.has_role('Salesman') OR public.has_role('Cashier'))
      WITH CHECK (public.has_role('Admin') OR public.has_role('Sales') OR public.has_role('Salesman') OR public.has_role('Cashier'));
  END IF;

  -- POS Shifts
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'pos_shifts') THEN
    DROP POLICY IF EXISTS "Sales Staff POS Shifts Access" ON pos_shifts;
    CREATE POLICY "Sales Staff POS Shifts Access" ON pos_shifts
      FOR ALL
      USING (public.has_role('Admin') OR public.has_role('Sales') OR public.has_role('Salesman') OR public.has_role('Cashier'))
      WITH CHECK (public.has_role('Admin') OR public.has_role('Sales') OR public.has_role('Salesman') OR public.has_role('Cashier'));
  END IF;

  -- POS Payments
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'pos_payments') THEN
    DROP POLICY IF EXISTS "Sales Staff POS Payments Access" ON pos_payments;
    CREATE POLICY "Sales Staff POS Payments Access" ON pos_payments
      FOR ALL
      USING (public.has_role('Admin') OR public.has_role('Sales') OR public.has_role('Salesman') OR public.has_role('Cashier'))
      WITH CHECK (public.has_role('Admin') OR public.has_role('Sales') OR public.has_role('Salesman') OR public.has_role('Cashier'));
  END IF;

  -- Customers (Sales staff can view, insert, update customers)
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'customers') THEN
    DROP POLICY IF EXISTS "Sales Staff Customers Access" ON customers;
    CREATE POLICY "Sales Staff Customers Access" ON customers
      FOR ALL
      USING (public.has_role('Admin') OR public.has_role('Sales') OR public.has_role('Salesman'))
      WITH CHECK (public.has_role('Admin') OR public.has_role('Sales') OR public.has_role('Salesman'));
  END IF;
END $$;
