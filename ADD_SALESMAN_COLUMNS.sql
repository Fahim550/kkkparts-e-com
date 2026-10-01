-- =============================================================================
-- ADD SALESMAN COLUMNS TO SALES_ORDERS AND CUSTOMERS
-- Run this in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/uduerhxssuljnvcyuskj
-- =============================================================================

-- 1. Add salesman tracking and source to sales_orders
ALTER TABLE public.sales_orders 
  ADD COLUMN IF NOT EXISTS salesman_id uuid,
  ADD COLUMN IF NOT EXISTS salesman_name text,
  ADD COLUMN IF NOT EXISTS order_source text DEFAULT 'admin';

-- 2. Add salesman assignment to customers
ALTER TABLE public.customers
  ADD COLUMN IF NOT EXISTS salesman_id uuid;

-- 3. Add salesman tracking to pos_receipts
ALTER TABLE public.pos_receipts
  ADD COLUMN IF NOT EXISTS salesman_id uuid,
  ADD COLUMN IF NOT EXISTS salesman_name text;

-- 4. Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';
