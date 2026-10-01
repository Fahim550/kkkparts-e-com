-- Migration: Add notes column to sales_orders
-- Date: 2026-10-01
-- Description: Adds notes column to sales_orders to support order remarks and internal notes

ALTER TABLE public.sales_orders 
ADD COLUMN IF NOT EXISTS notes TEXT DEFAULT '';

-- Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';
