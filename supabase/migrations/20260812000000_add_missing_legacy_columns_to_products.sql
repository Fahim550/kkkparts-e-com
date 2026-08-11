-- Add is_new column to public.products table
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS is_new boolean DEFAULT false;

-- Also adding other columns that the frontend expects in case they are missing
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS is_trending boolean DEFAULT false;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS is_offer boolean DEFAULT false;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS stock integer DEFAULT 50;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS brand text DEFAULT '';
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS category text DEFAULT '';
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS image text DEFAULT '';
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS images text[] DEFAULT ARRAY[]::text[];
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS sku text DEFAULT '';
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS sizes text[] DEFAULT ARRAY[]::text[];
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS colors text[] DEFAULT ARRAY[]::text[];
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS location text DEFAULT '';

-- Notify PostgREST to reload the schema cache so the new columns are immediately available
NOTIFY pgrst, 'reload schema';
