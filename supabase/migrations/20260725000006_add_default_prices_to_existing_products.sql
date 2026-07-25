-- Add price columns to public.products table
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS price numeric(10,2) DEFAULT 0.00;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS original_price numeric(10,2) DEFAULT NULL;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS dealer_price numeric(10,2) DEFAULT NULL;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS dealer_original_price numeric(10,2) DEFAULT NULL;

-- Update existing products with a default price if price is 0 or NULL
UPDATE public.products 
SET price = 15.00 
WHERE price IS NULL OR price = 0;
