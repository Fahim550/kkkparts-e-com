-- Migration: Add Salesman field marketing attribution and customer assignment
-- Date: 2026-10-01
-- Description:
-- 1. Attaches salesman_id, salesman_name, and order_source to sales_orders and pos_receipts
-- 2. Links customers (shops/dealers) to assigned salesman for territory/route marketing
-- 3. Adds indexes for fast querying on salesman performance and under-receivables

-- 1. Enhance sales_orders table
ALTER TABLE public.sales_orders 
ADD COLUMN IF NOT EXISTS salesman_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS salesman_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS order_source VARCHAR(50) DEFAULT 'admin';

CREATE INDEX IF NOT EXISTS idx_sales_orders_salesman_id ON public.sales_orders(salesman_id);
CREATE INDEX IF NOT EXISTS idx_sales_orders_source ON public.sales_orders(order_source);

-- 2. Enhance pos_receipts table
ALTER TABLE public.pos_receipts 
ADD COLUMN IF NOT EXISTS salesman_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS salesman_name VARCHAR(255);

CREATE INDEX IF NOT EXISTS idx_pos_receipts_salesman_id ON public.pos_receipts(salesman_id);

-- 3. Enhance customers table with assigned salesman
ALTER TABLE public.customers 
ADD COLUMN IF NOT EXISTS salesman_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_customers_salesman_id ON public.customers(salesman_id);

-- 4. Ensure RLS policies allow Salesman to read and create orders
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'sales_orders') THEN
    DROP POLICY IF EXISTS "Sales Staff Orders Access" ON public.sales_orders;
    CREATE POLICY "Sales Staff Orders Access" ON public.sales_orders
      FOR ALL
      USING (
        public.has_role('Admin') 
        OR public.has_role('Sales') 
        OR public.has_role('Salesman')
        OR salesman_id = auth.uid()
      )
      WITH CHECK (
        public.has_role('Admin') 
        OR public.has_role('Sales') 
        OR public.has_role('Salesman')
        OR salesman_id = auth.uid()
      );
  END IF;

  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'customers') THEN
    DROP POLICY IF EXISTS "Sales Staff Customers Access" ON public.customers;
    CREATE POLICY "Sales Staff Customers Access" ON public.customers
      FOR ALL
      USING (
        public.has_role('Admin') 
        OR public.has_role('Sales') 
        OR public.has_role('Salesman')
      )
      WITH CHECK (
        public.has_role('Admin') 
        OR public.has_role('Sales') 
        OR public.has_role('Salesman')
      );
  END IF;
END $$;
