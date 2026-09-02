-- ========================================================
-- SUPABASE FULL DATABASE MIGRATION SCRIPT
-- Generated for project: uduerhxssuljnvcyuskj
-- ========================================================


-- >>>>>>>>>>>>> MIGRATION FILE: 20260310151540_114f9676-0a21-48bd-b226-bcb2dee62c08.sql <<<<<<<<<<<<<
-- Create timestamp update function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Products table
CREATE TABLE public.products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  brand TEXT NOT NULL,
  price NUMERIC(10,2) NOT NULL,
  original_price NUMERIC(10,2),
  category TEXT NOT NULL DEFAULT 'running',
  image TEXT NOT NULL DEFAULT '/assets/shoe-runner-1.jpg',
  images TEXT[] DEFAULT ARRAY['/assets/shoe-runner-1.jpg'],
  sizes INTEGER[] DEFAULT ARRAY[40,41,42,43,44],
  colors TEXT[] DEFAULT ARRAY['Black'],
  description TEXT DEFAULT '',
  rating NUMERIC(2,1) DEFAULT 4.5,
  reviews INTEGER DEFAULT 0,
  stock INTEGER DEFAULT 50,
  is_active BOOLEAN DEFAULT true,
  is_trending BOOLEAN DEFAULT false,
  is_new BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Products are viewable by everyone" ON public.products FOR SELECT USING (true);
CREATE POLICY "Products can be inserted by anyone" ON public.products FOR INSERT WITH CHECK (true);
CREATE POLICY "Products can be updated by anyone" ON public.products FOR UPDATE USING (true);
CREATE POLICY "Products can be deleted by anyone" ON public.products FOR DELETE USING (true);

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON public.products
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Orders table
CREATE TABLE public.orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_number TEXT NOT NULL UNIQUE,
  customer_name TEXT NOT NULL,
  customer_email TEXT DEFAULT '',
  customer_phone TEXT NOT NULL,
  items JSONB NOT NULL DEFAULT '[]',
  total NUMERIC(10,2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','confirmed','shipped','delivered','cancelled')),
  payment_method TEXT NOT NULL DEFAULT 'cod',
  shipping_address TEXT NOT NULL,
  notes TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Orders are viewable by everyone" ON public.orders FOR SELECT USING (true);
CREATE POLICY "Orders can be inserted by anyone" ON public.orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Orders can be updated by anyone" ON public.orders FOR UPDATE USING (true);
CREATE POLICY "Orders can be deleted by anyone" ON public.orders FOR DELETE USING (true);

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON public.orders
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Coupons table
CREATE TABLE public.coupons (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  type TEXT NOT NULL DEFAULT 'percentage' CHECK (type IN ('percentage','fixed')),
  value NUMERIC(10,2) NOT NULL DEFAULT 10,
  min_order NUMERIC(10,2) DEFAULT 0,
  max_uses INTEGER DEFAULT 100,
  used_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  expires_at DATE NOT NULL DEFAULT (now() + interval '1 year'),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Coupons are viewable by everyone" ON public.coupons FOR SELECT USING (true);
CREATE POLICY "Coupons can be inserted by anyone" ON public.coupons FOR INSERT WITH CHECK (true);
CREATE POLICY "Coupons can be updated by anyone" ON public.coupons FOR UPDATE USING (true);
CREATE POLICY "Coupons can be deleted by anyone" ON public.coupons FOR DELETE USING (true);

CREATE TRIGGER update_coupons_updated_at BEFORE UPDATE ON public.coupons
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Banners table
CREATE TABLE public.banners (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  subtitle TEXT DEFAULT '',
  image_url TEXT NOT NULL,
  link_url TEXT DEFAULT '/shop',
  is_active BOOLEAN DEFAULT true,
  position TEXT NOT NULL DEFAULT 'promo' CHECK (position IN ('hero','promo','category')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Banners are viewable by everyone" ON public.banners FOR SELECT USING (true);
CREATE POLICY "Banners can be inserted by anyone" ON public.banners FOR INSERT WITH CHECK (true);
CREATE POLICY "Banners can be updated by anyone" ON public.banners FOR UPDATE USING (true);
CREATE POLICY "Banners can be deleted by anyone" ON public.banners FOR DELETE USING (true);

CREATE TRIGGER update_banners_updated_at BEFORE UPDATE ON public.banners
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Site settings table (single row)
CREATE TABLE public.site_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  site_name TEXT DEFAULT 'SRK Collection',
  site_description TEXT DEFAULT 'Premium sports shoes in Kuwait',
  meta_title TEXT DEFAULT 'SRK Collection - Premium Sports Shoes in Kuwait',
  meta_description TEXT DEFAULT 'Shop authentic Nike, Adidas, Puma sports shoes in Kuwait.',
  whatsapp_number TEXT DEFAULT '+96512345678',
  instagram_handle TEXT DEFAULT 'srkcollectionkw',
  free_shipping_threshold NUMERIC(10,2) DEFAULT 30,
  currency TEXT DEFAULT 'BDT',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Settings are viewable by everyone" ON public.site_settings FOR SELECT USING (true);
CREATE POLICY "Settings can be updated by anyone" ON public.site_settings FOR UPDATE USING (true);
CREATE POLICY "Settings can be inserted by anyone" ON public.site_settings FOR INSERT WITH CHECK (true);

CREATE TRIGGER update_site_settings_updated_at BEFORE UPDATE ON public.site_settings
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- >>>>>>>>>>>>> MIGRATION FILE: 20260310152317_daa26e34-d3db-478f-8bb8-e7c9841da5c4.sql <<<<<<<<<<<<<

ALTER TABLE public.site_settings
  ADD COLUMN IF NOT EXISTS facebook_pixel_id text DEFAULT '',
  ADD COLUMN IF NOT EXISTS facebook_pixel_enabled boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS facebook_capi_enabled boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS facebook_access_token text DEFAULT '',
  ADD COLUMN IF NOT EXISTS facebook_test_event_code text DEFAULT '',
  ADD COLUMN IF NOT EXISTS facebook_api_version text DEFAULT 'v21.0',
  ADD COLUMN IF NOT EXISTS tracking_pageview boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS tracking_viewcontent boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS tracking_addtocart boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS tracking_initiatecheckout boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS tracking_purchase boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS tracking_lead boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS tracking_complete_registration boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS default_content_type text DEFAULT 'product';


-- >>>>>>>>>>>>> MIGRATION FILE: 20260310152751_f88e1a2d-cb17-4c66-8416-db0dbb2218bd.sql <<<<<<<<<<<<<

-- Add SKU to products
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS sku text DEFAULT '';

-- Create product_variations table
CREATE TABLE IF NOT EXISTS public.product_variations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  size text NOT NULL DEFAULT '',
  color text NOT NULL DEFAULT '',
  sku text DEFAULT '',
  price numeric DEFAULT NULL,
  stock integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.product_variations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Variations viewable by everyone" ON public.product_variations FOR SELECT TO public USING (true);
CREATE POLICY "Variations insertable by anyone" ON public.product_variations FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Variations updatable by anyone" ON public.product_variations FOR UPDATE TO public USING (true);
CREATE POLICY "Variations deletable by anyone" ON public.product_variations FOR DELETE TO public USING (true);

-- Create trigger for updated_at
CREATE TRIGGER update_product_variations_updated_at
  BEFORE UPDATE ON public.product_variations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.product_variations;

-- Create storage bucket for product images
INSERT INTO storage.buckets (id, name, public) VALUES ('product-images', 'product-images', true) ON CONFLICT DO NOTHING;

-- Storage policies
CREATE POLICY "Anyone can view product images" ON storage.objects FOR SELECT TO public USING (bucket_id = 'product-images');
CREATE POLICY "Anyone can upload product images" ON storage.objects FOR INSERT TO public WITH CHECK (bucket_id = 'product-images');
CREATE POLICY "Anyone can update product images" ON storage.objects FOR UPDATE TO public USING (bucket_id = 'product-images');
CREATE POLICY "Anyone can delete product images" ON storage.objects FOR DELETE TO public USING (bucket_id = 'product-images');


-- >>>>>>>>>>>>> MIGRATION FILE: 20260310153213_eadadc49-936a-46b6-b5ec-7839f13686c6.sql <<<<<<<<<<<<<

-- Create user roles enum and table
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- RLS policies for user_roles
CREATE POLICY "Users can view own roles" ON public.user_roles
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admins can manage roles" ON public.user_roles
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));


-- >>>>>>>>>>>>> MIGRATION FILE: 20260310155728_2a08362d-2d42-445a-b1a7-eccd32782875.sql <<<<<<<<<<<<<

CREATE TABLE public.categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  parent_id uuid REFERENCES public.categories(id) ON DELETE SET NULL,
  description text DEFAULT '',
  image_url text DEFAULT '',
  is_active boolean DEFAULT true,
  sort_order integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Categories viewable by everyone" ON public.categories FOR SELECT TO public USING (true);
CREATE POLICY "Categories insertable by anyone" ON public.categories FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Categories updatable by anyone" ON public.categories FOR UPDATE TO public USING (true);
CREATE POLICY "Categories deletable by anyone" ON public.categories FOR DELETE TO public USING (true);

CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON public.categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- >>>>>>>>>>>>> MIGRATION FILE: 20260310160600_e0d86dfb-27db-46c3-b5d3-fc40a8cb077e.sql <<<<<<<<<<<<<

CREATE TABLE public.checkout_leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text NOT NULL,
  customer_name text DEFAULT '',
  customer_phone text NOT NULL,
  customer_email text DEFAULT '',
  shipping_address text DEFAULT '',
  area text DEFAULT '',
  notes text DEFAULT '',
  cart_items jsonb DEFAULT '[]'::jsonb,
  cart_total numeric DEFAULT 0,
  status text NOT NULL DEFAULT 'pending_checkout',
  contacted boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.checkout_leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Checkout leads viewable by everyone" ON public.checkout_leads FOR SELECT TO public USING (true);
CREATE POLICY "Checkout leads insertable by anyone" ON public.checkout_leads FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Checkout leads updatable by anyone" ON public.checkout_leads FOR UPDATE TO public USING (true);
CREATE POLICY "Checkout leads deletable by anyone" ON public.checkout_leads FOR DELETE TO public USING (true);

CREATE TRIGGER update_checkout_leads_updated_at BEFORE UPDATE ON public.checkout_leads FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE UNIQUE INDEX idx_checkout_leads_session ON public.checkout_leads(session_id) WHERE status = 'pending_checkout';


-- >>>>>>>>>>>>> MIGRATION FILE: 20260310161001_f9d88802-14c6-40e4-84cf-6fff2d1af0c9.sql <<<<<<<<<<<<<

-- Visitor sessions table
CREATE TABLE public.visitor_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text NOT NULL,
  visitor_id text NOT NULL,
  device_type text DEFAULT '',
  browser text DEFAULT '',
  os text DEFAULT '',
  referrer text DEFAULT '',
  entry_page text DEFAULT '',
  exit_page text DEFAULT '',
  country text DEFAULT '',
  city text DEFAULT '',
  ip_address text DEFAULT '',
  is_online boolean DEFAULT true,
  last_active_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.visitor_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Visitor sessions viewable by everyone" ON public.visitor_sessions FOR SELECT TO public USING (true);
CREATE POLICY "Visitor sessions insertable by anyone" ON public.visitor_sessions FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Visitor sessions updatable by anyone" ON public.visitor_sessions FOR UPDATE TO public USING (true);

CREATE UNIQUE INDEX idx_visitor_sessions_session ON public.visitor_sessions(session_id);

CREATE TRIGGER update_visitor_sessions_updated_at BEFORE UPDATE ON public.visitor_sessions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Page views table
CREATE TABLE public.page_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text NOT NULL,
  visitor_id text NOT NULL,
  page_url text NOT NULL,
  page_title text DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.page_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Page views viewable by everyone" ON public.page_views FOR SELECT TO public USING (true);
CREATE POLICY "Page views insertable by anyone" ON public.page_views FOR INSERT TO public WITH CHECK (true);


-- >>>>>>>>>>>>> MIGRATION FILE: 20260310161309_ef5e29e5-efb3-4ace-95e3-436c7826381f.sql <<<<<<<<<<<<<

CREATE TABLE public.shipping_methods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  area_zone text NOT NULL DEFAULT '',
  charge numeric NOT NULL DEFAULT 0,
  estimated_delivery text DEFAULT '',
  description text DEFAULT '',
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.shipping_methods ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Shipping methods viewable by everyone" ON public.shipping_methods FOR SELECT TO public USING (true);
CREATE POLICY "Shipping methods insertable by anyone" ON public.shipping_methods FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Shipping methods updatable by anyone" ON public.shipping_methods FOR UPDATE TO public USING (true);
CREATE POLICY "Shipping methods deletable by anyone" ON public.shipping_methods FOR DELETE TO public USING (true);

CREATE TRIGGER update_shipping_methods_updated_at BEFORE UPDATE ON public.shipping_methods FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Seed default methods
INSERT INTO public.shipping_methods (name, area_zone, charge, estimated_delivery, description, sort_order) VALUES
  ('Standard Delivery', 'All Kuwait', 3, '2-4 days', 'Standard shipping across Kuwait', 1),
  ('Free Delivery (30+ BDT)', 'All Kuwait', 0, '2-4 days', 'Free shipping on orders 30 BDT and above', 0);


-- >>>>>>>>>>>>> MIGRATION FILE: 20260310161605_1bb16eba-88ef-4503-81e0-aa711d6b3c94.sql <<<<<<<<<<<<<

CREATE TABLE public.reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reviewer_name text NOT NULL,
  reviewer_image text DEFAULT '',
  review_text text NOT NULL DEFAULT '',
  rating integer NOT NULL DEFAULT 5,
  product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  show_for_all boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Reviews viewable by everyone" ON public.reviews FOR SELECT TO public USING (true);
CREATE POLICY "Reviews insertable by anyone" ON public.reviews FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Reviews updatable by anyone" ON public.reviews FOR UPDATE TO public USING (true);
CREATE POLICY "Reviews deletable by anyone" ON public.reviews FOR DELETE TO public USING (true);

CREATE TRIGGER update_reviews_updated_at BEFORE UPDATE ON public.reviews FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- >>>>>>>>>>>>> MIGRATION FILE: 20260310163038_6536dfb1-824e-4118-a939-99f8e2e55031.sql <<<<<<<<<<<<<

-- Create page_contents table for About Us, Contact Us, etc.
CREATE TABLE public.page_contents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  page_slug text NOT NULL UNIQUE,
  page_title text NOT NULL DEFAULT '',
  content text NOT NULL DEFAULT '',
  meta_title text DEFAULT '',
  meta_description text DEFAULT '',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.page_contents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Page contents viewable by everyone" ON public.page_contents FOR SELECT TO public USING (true);
CREATE POLICY "Page contents insertable by anyone" ON public.page_contents FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Page contents updatable by anyone" ON public.page_contents FOR UPDATE TO public USING (true);
CREATE POLICY "Page contents deletable by anyone" ON public.page_contents FOR DELETE TO public USING (true);

-- Seed default pages
INSERT INTO public.page_contents (page_slug, page_title, content) VALUES
('about', 'About Us', 'Welcome to SRK Collection – your ultimate destination for authentic sports footwear in Kuwait. We bring you the latest and greatest from Nike, Adidas, Puma, and more top brands.\n\nOur mission is to provide 100% authentic, high-quality sports shoes with exceptional customer service and fast delivery across Kuwait.\n\nWe believe every athlete deserves the best gear to fuel their performance.'),
('contact', 'Contact Us', 'We would love to hear from you! Reach out to us through any of the following channels.\n\nOur team is available Saturday to Thursday, 9 AM to 9 PM Kuwait time.');

-- Add new columns to site_settings for footer, logo, favicon, social links, contact info
ALTER TABLE public.site_settings
  ADD COLUMN IF NOT EXISTS logo_url text DEFAULT '/logo.png',
  ADD COLUMN IF NOT EXISTS favicon_url text DEFAULT '/favicon.ico',
  ADD COLUMN IF NOT EXISTS footer_description text DEFAULT 'Your ultimate destination for authentic sports footwear in Kuwait. Nike, Adidas, Puma, and more.',
  ADD COLUMN IF NOT EXISTS footer_copyright text DEFAULT '© 2026 SRK Collection. All rights reserved.',
  ADD COLUMN IF NOT EXISTS footer_tagline text DEFAULT '🇰🇼 Free delivery across Kuwait · Cash on Delivery available',
  ADD COLUMN IF NOT EXISTS contact_email text DEFAULT 'info@srkcollection.kw',
  ADD COLUMN IF NOT EXISTS contact_phone text DEFAULT '+965 1234 5678',
  ADD COLUMN IF NOT EXISTS contact_address text DEFAULT 'Kuwait City, Kuwait',
  ADD COLUMN IF NOT EXISTS facebook_url text DEFAULT '',
  ADD COLUMN IF NOT EXISTS twitter_url text DEFAULT '',
  ADD COLUMN IF NOT EXISTS youtube_url text DEFAULT '',
  ADD COLUMN IF NOT EXISTS instagram_url text DEFAULT '',
  ADD COLUMN IF NOT EXISTS about_short text DEFAULT 'Premium sports shoes in Kuwait';


-- >>>>>>>>>>>>> MIGRATION FILE: 20260313183558_ee165e7d-9414-443e-be15-d6839aa20ccb.sql <<<<<<<<<<<<<
ALTER TABLE public.site_settings ADD COLUMN IF NOT EXISTS language text DEFAULT 'en';

-- >>>>>>>>>>>>> MIGRATION FILE: 20260414193949_f5567701-9ced-445b-a62f-ef22c00d071d.sql <<<<<<<<<<<<<
ALTER TABLE public.site_settings 
  ADD COLUMN tiktok_pixel_id text DEFAULT '',
  ADD COLUMN tiktok_pixel_enabled boolean DEFAULT false,
  ADD COLUMN tiktok_access_token text DEFAULT '';

-- >>>>>>>>>>>>> MIGRATION FILE: 20260519000000_alter_products_sizes_to_text.sql <<<<<<<<<<<<<
-- Convert products.sizes from integer[] to text[] to support labels like 'M', 'L', 'XL'
BEGIN;

-- Add a new temporary text[] column
ALTER TABLE public.products ADD COLUMN sizes_text text[];

-- Copy existing integer sizes into the new text array column
UPDATE public.products SET sizes_text = (SELECT array_agg(s::text) FROM unnest(sizes) AS s);

-- Drop old integer sizes column
ALTER TABLE public.products DROP COLUMN sizes;

-- Rename the temporary column to sizes
ALTER TABLE public.products RENAME COLUMN sizes_text TO sizes;

COMMIT;


-- >>>>>>>>>>>>> MIGRATION FILE: 20260609000000_create_job_applications.sql <<<<<<<<<<<<<
create table if not exists public.job_applications (
  id uuid default gen_random_uuid() primary key,
  full_name text not null,
  email text not null,
  phone text not null,
  position text not null,
  cover_letter text,
  cv_url text,
  status text default 'pending',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.job_applications enable row level security;

-- Policies
create policy "Anyone can insert job applications"
  on public.job_applications for insert
  with check (true);

create policy "Anyone can view job applications"
  on public.job_applications for select
  using (true);

create policy "Anyone can update job applications"
  on public.job_applications for update
  using (true);

create policy "Anyone can delete job applications"
  on public.job_applications for delete
  using (true);


-- >>>>>>>>>>>>> MIGRATION FILE: 20260613000000_create_contact_messages.sql <<<<<<<<<<<<<
CREATE TABLE IF NOT EXISTS public.contact_messages (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  email text NOT NULL,
  subject text,
  message text NOT NULL,
  status text NOT NULL DEFAULT 'unread',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Messages are viewable by everyone" ON public.contact_messages FOR SELECT USING (true);
CREATE POLICY "Messages can be inserted by anyone" ON public.contact_messages FOR INSERT WITH CHECK (true);
CREATE POLICY "Messages can be updated by anyone" ON public.contact_messages FOR UPDATE USING (true);
CREATE POLICY "Messages can be deleted by anyone" ON public.contact_messages FOR DELETE USING (true);


-- >>>>>>>>>>>>> MIGRATION FILE: 20260616000000_add_is_offer_to_products.sql <<<<<<<<<<<<<
-- Add is_offer to products
ALTER TABLE public.products
ADD COLUMN is_offer boolean DEFAULT false;


-- >>>>>>>>>>>>> MIGRATION FILE: 20260621000000_add_dealer_price.sql <<<<<<<<<<<<<
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS dealer_price NUMERIC(10,2);


-- >>>>>>>>>>>>> MIGRATION FILE: 20260621000001_add_dealer_original_price.sql <<<<<<<<<<<<<
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS dealer_original_price numeric;


-- >>>>>>>>>>>>> MIGRATION FILE: 20260622000000_create_dealers_table.sql <<<<<<<<<<<<<
-- Create dealers table to store dealer registration details
CREATE TABLE IF NOT EXISTS public.dealers (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT,
  email TEXT,
  phone TEXT,
  sponsored_details TEXT,
  license_number TEXT,
  is_approved BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Ensure columns exist in case the table was already created before without them
ALTER TABLE public.dealers ADD COLUMN IF NOT EXISTS full_name TEXT;
ALTER TABLE public.dealers ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.dealers ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.dealers ADD COLUMN IF NOT EXISTS sponsored_details TEXT;
ALTER TABLE public.dealers ADD COLUMN IF NOT EXISTS license_number TEXT;
ALTER TABLE public.dealers ADD COLUMN IF NOT EXISTS is_approved BOOLEAN DEFAULT false;

-- Enable RLS
ALTER TABLE public.dealers ENABLE ROW LEVEL SECURITY;

-- Create policies
DROP POLICY IF EXISTS "Dealers can view their own profile" ON public.dealers;
CREATE POLICY "Dealers can view their own profile" 
  ON public.dealers FOR SELECT 
  USING (auth.uid() = id);

-- Assuming anyone with 'admin' role in user_roles can view/update/delete
DROP POLICY IF EXISTS "Admins can view all dealers" ON public.dealers;
CREATE POLICY "Admins can view all dealers" 
  ON public.dealers FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
    OR 
    (auth.jwt() ->> 'role' = 'admin')
  );

DROP POLICY IF EXISTS "Admins can update all dealers" ON public.dealers;
CREATE POLICY "Admins can update all dealers" 
  ON public.dealers FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Admins can delete all dealers" ON public.dealers;
CREATE POLICY "Admins can delete all dealers" 
  ON public.dealers FOR DELETE 
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Trigger to create dealer on auth.users insert IF role is dealer
CREATE OR REPLACE FUNCTION public.handle_new_dealer()
RETURNS trigger AS $$
BEGIN
  IF new.raw_user_meta_data->>'role' = 'dealer' THEN
    INSERT INTO public.dealers (id, full_name, email, phone, sponsored_details, license_number, is_approved)
    VALUES (
      new.id,
      new.raw_user_meta_data->>'full_name',
      new.email,
      new.raw_user_meta_data->>'phone',
      new.raw_user_meta_data->>'sponsored_details',
      new.raw_user_meta_data->>'license_number',
      false
    )
    ON CONFLICT (id) DO UPDATE SET
      full_name = EXCLUDED.full_name,
      email = EXCLUDED.email,
      phone = EXCLUDED.phone,
      sponsored_details = EXCLUDED.sponsored_details,
      license_number = EXCLUDED.license_number;
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

-- Backfill existing dealers from auth.users (requires postgres role, which migrations have)
INSERT INTO public.dealers (id, full_name, email, phone, is_approved)
SELECT 
  id, 
  raw_user_meta_data->>'full_name', 
  email, 
  raw_user_meta_data->>'phone',
  false
FROM auth.users
WHERE raw_user_meta_data->>'role' = 'dealer'
ON CONFLICT (id) DO NOTHING;


-- >>>>>>>>>>>>> MIGRATION FILE: 20260622000001_add_area_to_dealers.sql <<<<<<<<<<<<<
-- Add the area column to dealers table
ALTER TABLE public.dealers ADD COLUMN IF NOT EXISTS area TEXT;

-- Update the trigger function to include area
CREATE OR REPLACE FUNCTION public.handle_new_dealer()
RETURNS trigger AS $$
BEGIN
  IF new.raw_user_meta_data->>'role' = 'dealer' THEN
    INSERT INTO public.dealers (id, full_name, email, phone, sponsored_details, license_number, area, is_approved)
    VALUES (
      new.id,
      new.raw_user_meta_data->>'full_name',
      new.email,
      new.raw_user_meta_data->>'phone',
      new.raw_user_meta_data->>'sponsored_details',
      new.raw_user_meta_data->>'license_number',
      new.raw_user_meta_data->>'area',
      false
    )
    ON CONFLICT (id) DO UPDATE SET
      full_name = EXCLUDED.full_name,
      email = EXCLUDED.email,
      phone = EXCLUDED.phone,
      sponsored_details = EXCLUDED.sponsored_details,
      license_number = EXCLUDED.license_number,
      area = EXCLUDED.area;
  END IF;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- >>>>>>>>>>>>> MIGRATION FILE: 20260622000002_add_is_hidden_to_orders.sql <<<<<<<<<<<<<
-- Add is_hidden column to orders table for soft-delete functionality
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS is_hidden BOOLEAN DEFAULT false;


-- >>>>>>>>>>>>> MIGRATION FILE: 20260622000003_add_is_hidden_by_dealer.sql <<<<<<<<<<<<<
-- Add is_hidden_by_dealer column to orders table for dealer soft-delete functionality
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS is_hidden_by_dealer BOOLEAN DEFAULT false;


-- >>>>>>>>>>>>> MIGRATION FILE: 20260623000000_add_plain_password.sql <<<<<<<<<<<<<
-- Add the plain_password column to dealers table
ALTER TABLE public.dealers ADD COLUMN IF NOT EXISTS plain_password TEXT;

-- Update the trigger function to include plain_password
CREATE OR REPLACE FUNCTION public.handle_new_dealer()
RETURNS trigger AS $$
BEGIN
  IF new.raw_user_meta_data->>'role' = 'dealer' THEN
    INSERT INTO public.dealers (id, full_name, email, phone, sponsored_details, license_number, area, is_approved, plain_password)
    VALUES (
      new.id,
      new.raw_user_meta_data->>'full_name',
      new.email,
      new.raw_user_meta_data->>'phone',
      new.raw_user_meta_data->>'sponsored_details',
      new.raw_user_meta_data->>'license_number',
      new.raw_user_meta_data->>'area',
      false,
      new.raw_user_meta_data->>'plain_password'
    )
    ON CONFLICT (id) DO UPDATE SET
      full_name = EXCLUDED.full_name,
      email = EXCLUDED.email,
      phone = EXCLUDED.phone,
      sponsored_details = EXCLUDED.sponsored_details,
      license_number = EXCLUDED.license_number,
      area = EXCLUDED.area,
      plain_password = EXCLUDED.plain_password;
  END IF;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- >>>>>>>>>>>>> MIGRATION FILE: 20260704000000_add_location_to_products.sql <<<<<<<<<<<<<
ALTER TABLE products ADD COLUMN location TEXT;


-- >>>>>>>>>>>>> MIGRATION FILE: 20260704000001_add_profile_image_to_dealers.sql <<<<<<<<<<<<<
ALTER TABLE public.dealers ADD COLUMN profile_image TEXT;


-- >>>>>>>>>>>>> MIGRATION FILE: 20260715000000_drop_legacy_tables.sql <<<<<<<<<<<<<
-- DROP LEGACY E-COMMERCE TABLES
-- This script cleans up the old database schema to make way for the new ERP architecture.
-- CASCADE is used to ensure any foreign key dependencies are also dropped.

DROP TABLE IF EXISTS public.reviews CASCADE;
DROP TABLE IF EXISTS public.product_variations CASCADE;
DROP TABLE IF EXISTS public.visitor_sessions CASCADE;
DROP TABLE IF EXISTS public.page_views CASCADE;
DROP TABLE IF EXISTS public.categories CASCADE;
DROP TABLE IF EXISTS public.page_contents CASCADE;
DROP TABLE IF EXISTS public.products CASCADE;
DROP TABLE IF EXISTS public.orders CASCADE;
DROP TABLE IF EXISTS public.coupons CASCADE;
DROP TABLE IF EXISTS public.banners CASCADE;
DROP TABLE IF EXISTS public.site_settings CASCADE;
DROP TABLE IF EXISTS public.job_applications CASCADE;
DROP TABLE IF EXISTS public.user_roles CASCADE;
DROP TABLE IF EXISTS public.checkout_leads CASCADE;
DROP TABLE IF EXISTS public.dealers CASCADE;
DROP TABLE IF EXISTS public.contact_messages CASCADE;


-- >>>>>>>>>>>>> MIGRATION FILE: 20260715000001_module_1_foundation.sql <<<<<<<<<<<<<
-- MODULE 1: Product & Inventory Foundation

CREATE TABLE brands (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR NOT NULL UNIQUE,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_brands_name ON brands(name);

CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    parent_id UUID REFERENCES categories(id) ON DELETE RESTRICT,
    name VARCHAR NOT NULL,
    slug VARCHAR NOT NULL UNIQUE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT check_category_parent CHECK (id != parent_id)
);
CREATE INDEX idx_categories_parent_id ON categories(parent_id);
CREATE INDEX idx_categories_slug ON categories(slug);

CREATE TABLE units_of_measure (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR NOT NULL UNIQUE,
    abbreviation VARCHAR NOT NULL UNIQUE,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE uom_conversions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    from_uom_id UUID NOT NULL REFERENCES units_of_measure(id),
    to_uom_id UUID NOT NULL REFERENCES units_of_measure(id),
    conversion_factor NUMERIC(15,6) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(from_uom_id, to_uom_id),
    CONSTRAINT check_conversion_factor CHECK (conversion_factor > 0 AND from_uom_id != to_uom_id)
);

CREATE TABLE attributes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR NOT NULL UNIQUE,
    display_type VARCHAR NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE attribute_values (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    attribute_id UUID NOT NULL REFERENCES attributes(id) ON DELETE CASCADE,
    value VARCHAR NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(attribute_id, value)
);
CREATE INDEX idx_attr_values_attr_id ON attribute_values(attribute_id);

CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    item_code VARCHAR NOT NULL UNIQUE,
    name VARCHAR NOT NULL,
    description TEXT,
    category_id UUID NOT NULL REFERENCES categories(id),
    brand_id UUID REFERENCES brands(id),
    base_uom_id UUID NOT NULL REFERENCES units_of_measure(id),
    has_variants BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_brand ON products(brand_id);

CREATE TABLE product_attributes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    attribute_id UUID NOT NULL REFERENCES attributes(id) ON DELETE CASCADE,
    UNIQUE(product_id, attribute_id)
);

CREATE TABLE product_variations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    sku VARCHAR NOT NULL UNIQUE,
    barcode VARCHAR UNIQUE,
    weight NUMERIC(10,3),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_variations_sku ON product_variations(sku);
CREATE INDEX idx_variations_barcode ON product_variations(barcode);
CREATE INDEX idx_variations_product ON product_variations(product_id);

CREATE TABLE variation_attributes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    variation_id UUID NOT NULL REFERENCES product_variations(id) ON DELETE CASCADE,
    attribute_value_id UUID NOT NULL REFERENCES attribute_values(id) ON DELETE RESTRICT,
    UNIQUE(variation_id, attribute_value_id)
);
CREATE INDEX idx_var_attrs_variation ON variation_attributes(variation_id);
CREATE INDEX idx_var_attrs_value ON variation_attributes(attribute_value_id);


-- >>>>>>>>>>>>> MIGRATION FILE: 20260715000002_module_2_warehouse.sql <<<<<<<<<<<<<
-- MODULE 2: Warehouse & Stock Ledger

CREATE TABLE warehouses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR NOT NULL UNIQUE,
    code VARCHAR NOT NULL UNIQUE,
    address TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE warehouse_zones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    warehouse_id UUID NOT NULL REFERENCES warehouses(id) ON DELETE CASCADE,
    name VARCHAR NOT NULL,
    code VARCHAR NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(warehouse_id, code)
);

CREATE TABLE warehouse_bins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    zone_id UUID NOT NULL REFERENCES warehouse_zones(id) ON DELETE CASCADE,
    name VARCHAR NOT NULL,
    code VARCHAR NOT NULL,
    barcode VARCHAR UNIQUE,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(zone_id, code)
);

CREATE TABLE stock_ledgers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_date TIMESTAMPTZ NOT NULL DEFAULT now(),
    variation_id UUID NOT NULL REFERENCES product_variations(id) ON DELETE RESTRICT,
    warehouse_id UUID NOT NULL REFERENCES warehouses(id) ON DELETE RESTRICT,
    bin_id UUID REFERENCES warehouse_bins(id) ON DELETE RESTRICT,
    quantity NUMERIC(15,6) NOT NULL,
    uom_id UUID NOT NULL REFERENCES units_of_measure(id) ON DELETE RESTRICT,
    reference_type VARCHAR NOT NULL,
    reference_id UUID NOT NULL,
    batch_number VARCHAR,
    serial_number VARCHAR,
    created_at TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT check_quantity_not_zero CHECK (quantity != 0)
);
CREATE INDEX idx_ledger_variation_warehouse ON stock_ledgers(variation_id, warehouse_id);
CREATE INDEX idx_ledger_reference ON stock_ledgers(reference_type, reference_id);

CREATE TABLE stock_balances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    variation_id UUID NOT NULL REFERENCES product_variations(id) ON DELETE RESTRICT,
    warehouse_id UUID NOT NULL REFERENCES warehouses(id) ON DELETE RESTRICT,
    bin_id UUID REFERENCES warehouse_bins(id) ON DELETE RESTRICT,
    batch_number VARCHAR,
    quantity NUMERIC(15,6) NOT NULL DEFAULT 0,
    last_updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE NULLS NOT DISTINCT (variation_id, warehouse_id, bin_id, batch_number)
);


-- >>>>>>>>>>>>> MIGRATION FILE: 20260715000003_module_3_accounting.sql <<<<<<<<<<<<<
-- MODULE 3: Accounting & Financial Ledger

CREATE TABLE fiscal_years (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR NOT NULL UNIQUE,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_closed BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE chart_of_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_number VARCHAR NOT NULL UNIQUE,
    name VARCHAR NOT NULL,
    account_type VARCHAR NOT NULL,
    parent_id UUID REFERENCES chart_of_accounts(id) ON DELETE RESTRICT,
    is_group BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_coa_parent ON chart_of_accounts(parent_id);
CREATE INDEX idx_coa_type ON chart_of_accounts(account_type);

CREATE TABLE journal_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entry_number VARCHAR NOT NULL UNIQUE,
    posting_date DATE NOT NULL,
    fiscal_year_id UUID NOT NULL REFERENCES fiscal_years(id) ON DELETE RESTRICT,
    reference_type VARCHAR,
    reference_id UUID,
    narration TEXT,
    status VARCHAR NOT NULL DEFAULT 'Draft',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_je_posting_date ON journal_entries(posting_date);
CREATE INDEX idx_je_reference ON journal_entries(reference_type, reference_id);

CREATE TABLE journal_entry_lines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    journal_entry_id UUID NOT NULL REFERENCES journal_entries(id) ON DELETE CASCADE,
    account_id UUID NOT NULL REFERENCES chart_of_accounts(id) ON DELETE RESTRICT,
    party_type VARCHAR,
    party_id UUID,
    debit_amount NUMERIC(15,6) NOT NULL DEFAULT 0,
    credit_amount NUMERIC(15,6) NOT NULL DEFAULT 0,
    narration TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT check_positive_amounts CHECK (debit_amount >= 0 AND credit_amount >= 0),
    CONSTRAINT check_single_sided CHECK ((debit_amount > 0 AND credit_amount = 0) OR (debit_amount = 0 AND credit_amount > 0) OR (debit_amount = 0 AND credit_amount = 0))
);
CREATE INDEX idx_jel_account ON journal_entry_lines(account_id);
CREATE INDEX idx_jel_party ON journal_entry_lines(party_type, party_id);

CREATE TABLE account_balances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id UUID NOT NULL REFERENCES chart_of_accounts(id) ON DELETE CASCADE,
    fiscal_year_id UUID NOT NULL REFERENCES fiscal_years(id) ON DELETE CASCADE,
    total_debit NUMERIC(15,6) NOT NULL DEFAULT 0,
    total_credit NUMERIC(15,6) NOT NULL DEFAULT 0,
    balance NUMERIC(15,6) NOT NULL DEFAULT 0,
    last_updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(account_id, fiscal_year_id)
);


-- >>>>>>>>>>>>> MIGRATION FILE: 20260715000004_module_4_purchasing.sql <<<<<<<<<<<<<
-- MODULE 4: Purchasing & Procure-to-Pay

CREATE TABLE suppliers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR NOT NULL UNIQUE,
    tax_id VARCHAR,
    contact_email VARCHAR,
    contact_phone VARCHAR,
    address TEXT,
    payable_account_id UUID NOT NULL REFERENCES chart_of_accounts(id) ON DELETE RESTRICT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE purchase_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    po_number VARCHAR NOT NULL UNIQUE,
    supplier_id UUID NOT NULL REFERENCES suppliers(id) ON DELETE RESTRICT,
    order_date DATE NOT NULL,
    expected_delivery_date DATE,
    status VARCHAR NOT NULL DEFAULT 'Draft',
    total_amount NUMERIC(15,6) NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE purchase_order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    purchase_order_id UUID NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
    variation_id UUID NOT NULL REFERENCES product_variations(id) ON DELETE RESTRICT,
    uom_id UUID NOT NULL REFERENCES units_of_measure(id) ON DELETE RESTRICT,
    quantity_ordered NUMERIC(15,6) NOT NULL,
    quantity_received NUMERIC(15,6) NOT NULL DEFAULT 0,
    unit_price NUMERIC(15,6) NOT NULL,
    total_price NUMERIC(15,6) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE purchase_receipts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    receipt_number VARCHAR NOT NULL UNIQUE,
    purchase_order_id UUID REFERENCES purchase_orders(id) ON DELETE SET NULL,
    supplier_id UUID NOT NULL REFERENCES suppliers(id) ON DELETE RESTRICT,
    receipt_date DATE NOT NULL,
    warehouse_id UUID NOT NULL REFERENCES warehouses(id) ON DELETE RESTRICT,
    status VARCHAR NOT NULL DEFAULT 'Draft',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE purchase_receipt_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    purchase_receipt_id UUID NOT NULL REFERENCES purchase_receipts(id) ON DELETE CASCADE,
    po_item_id UUID REFERENCES purchase_order_items(id) ON DELETE SET NULL,
    variation_id UUID NOT NULL REFERENCES product_variations(id) ON DELETE RESTRICT,
    quantity_received NUMERIC(15,6) NOT NULL,
    uom_id UUID NOT NULL REFERENCES units_of_measure(id) ON DELETE RESTRICT,
    bin_id UUID REFERENCES warehouse_bins(id) ON DELETE RESTRICT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT check_positive_received CHECK (quantity_received > 0)
);

CREATE TABLE purchase_invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_number VARCHAR NOT NULL UNIQUE,
    supplier_invoice_number VARCHAR NOT NULL,
    supplier_id UUID NOT NULL REFERENCES suppliers(id) ON DELETE RESTRICT,
    purchase_receipt_id UUID REFERENCES purchase_receipts(id) ON DELETE SET NULL,
    invoice_date DATE NOT NULL,
    due_date DATE NOT NULL,
    status VARCHAR NOT NULL DEFAULT 'Draft',
    total_amount NUMERIC(15,6) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(supplier_id, supplier_invoice_number)
);

CREATE TABLE purchase_invoice_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    purchase_invoice_id UUID NOT NULL REFERENCES purchase_invoices(id) ON DELETE CASCADE,
    receipt_item_id UUID REFERENCES purchase_receipt_items(id) ON DELETE SET NULL,
    variation_id UUID NOT NULL REFERENCES product_variations(id) ON DELETE RESTRICT,
    quantity_billed NUMERIC(15,6) NOT NULL,
    unit_price NUMERIC(15,6) NOT NULL,
    amount NUMERIC(15,6) NOT NULL,
    expense_account_id UUID REFERENCES chart_of_accounts(id) ON DELETE RESTRICT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);


-- >>>>>>>>>>>>> MIGRATION FILE: 20260715000005_module_5_sales.sql <<<<<<<<<<<<<
-- MODULE 5: Sales & Order-to-Cash

CREATE TABLE customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR NOT NULL UNIQUE,
    tax_id VARCHAR,
    contact_email VARCHAR,
    contact_phone VARCHAR,
    billing_address TEXT,
    shipping_address TEXT,
    receivable_account_id UUID NOT NULL REFERENCES chart_of_accounts(id) ON DELETE RESTRICT,
    credit_limit NUMERIC(15,6) NOT NULL DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_customers_name ON customers(name);

CREATE TABLE sales_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    so_number VARCHAR NOT NULL UNIQUE,
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
    order_date DATE NOT NULL,
    delivery_date DATE,
    status VARCHAR NOT NULL DEFAULT 'Draft',
    total_amount NUMERIC(15,6) NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_so_customer ON sales_orders(customer_id);
CREATE INDEX idx_so_status ON sales_orders(status);

CREATE TABLE sales_order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sales_order_id UUID NOT NULL REFERENCES sales_orders(id) ON DELETE CASCADE,
    variation_id UUID NOT NULL REFERENCES product_variations(id) ON DELETE RESTRICT,
    uom_id UUID NOT NULL REFERENCES units_of_measure(id) ON DELETE RESTRICT,
    quantity_ordered NUMERIC(15,6) NOT NULL,
    quantity_delivered NUMERIC(15,6) NOT NULL DEFAULT 0,
    unit_price NUMERIC(15,6) NOT NULL,
    discount_amount NUMERIC(15,6) NOT NULL DEFAULT 0,
    total_price NUMERIC(15,6) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE delivery_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    delivery_number VARCHAR NOT NULL UNIQUE,
    sales_order_id UUID REFERENCES sales_orders(id) ON DELETE SET NULL,
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
    delivery_date DATE NOT NULL,
    warehouse_id UUID NOT NULL REFERENCES warehouses(id) ON DELETE RESTRICT,
    status VARCHAR NOT NULL DEFAULT 'Draft',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE delivery_note_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    delivery_note_id UUID NOT NULL REFERENCES delivery_notes(id) ON DELETE CASCADE,
    so_item_id UUID REFERENCES sales_order_items(id) ON DELETE SET NULL,
    variation_id UUID NOT NULL REFERENCES product_variations(id) ON DELETE RESTRICT,
    quantity_delivered NUMERIC(15,6) NOT NULL,
    uom_id UUID NOT NULL REFERENCES units_of_measure(id) ON DELETE RESTRICT,
    bin_id UUID REFERENCES warehouse_bins(id) ON DELETE RESTRICT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT check_positive_delivered CHECK (quantity_delivered > 0)
);

CREATE TABLE sales_invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_number VARCHAR NOT NULL UNIQUE,
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
    sales_order_id UUID REFERENCES sales_orders(id) ON DELETE SET NULL,
    delivery_note_id UUID REFERENCES delivery_notes(id) ON DELETE SET NULL,
    invoice_date DATE NOT NULL,
    due_date DATE NOT NULL,
    status VARCHAR NOT NULL DEFAULT 'Draft',
    total_amount NUMERIC(15,6) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE sales_invoice_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sales_invoice_id UUID NOT NULL REFERENCES sales_invoices(id) ON DELETE CASCADE,
    delivery_item_id UUID REFERENCES delivery_note_items(id) ON DELETE SET NULL,
    variation_id UUID NOT NULL REFERENCES product_variations(id) ON DELETE RESTRICT,
    quantity_billed NUMERIC(15,6) NOT NULL,
    unit_price NUMERIC(15,6) NOT NULL,
    amount NUMERIC(15,6) NOT NULL,
    revenue_account_id UUID REFERENCES chart_of_accounts(id) ON DELETE RESTRICT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);


-- >>>>>>>>>>>>> MIGRATION FILE: 20260715000006_module_6_fifo.sql <<<<<<<<<<<<<
-- MODULE 6: FIFO Cost Valuation Engine

CREATE TABLE fifo_ledgers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    variation_id UUID NOT NULL REFERENCES product_variations(id) ON DELETE RESTRICT,
    warehouse_id UUID NOT NULL REFERENCES warehouses(id) ON DELETE RESTRICT,
    inbound_reference_type VARCHAR NOT NULL,
    inbound_reference_id UUID NOT NULL,
    transaction_date TIMESTAMPTZ NOT NULL,
    original_quantity NUMERIC(15,6) NOT NULL,
    quantity_remaining NUMERIC(15,6) NOT NULL,
    unit_cost NUMERIC(15,6) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_fifo_variation_warehouse ON fifo_ledgers(variation_id, warehouse_id);
CREATE INDEX idx_fifo_remaining ON fifo_ledgers(quantity_remaining);

CREATE TABLE cogs_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    fifo_ledger_id UUID NOT NULL REFERENCES fifo_ledgers(id) ON DELETE RESTRICT,
    outbound_reference_type VARCHAR NOT NULL,
    outbound_reference_id UUID NOT NULL,
    quantity_deducted NUMERIC(15,6) NOT NULL,
    unit_cost_applied NUMERIC(15,6) NOT NULL,
    total_cogs NUMERIC(15,6) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_cogs_outbound_ref ON cogs_entries(outbound_reference_type, outbound_reference_id);
CREATE INDEX idx_cogs_fifo_ledger ON cogs_entries(fifo_ledger_id);


-- >>>>>>>>>>>>> MIGRATION FILE: 20260715000007_module_7_pos.sql <<<<<<<<<<<<<
-- MODULE 7: POS (Point of Sale) Engine

CREATE TABLE pos_registers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR NOT NULL UNIQUE,
    warehouse_id UUID NOT NULL REFERENCES warehouses(id) ON DELETE RESTRICT,
    default_cash_account_id UUID REFERENCES chart_of_accounts(id) ON DELETE RESTRICT,
    default_card_account_id UUID REFERENCES chart_of_accounts(id) ON DELETE RESTRICT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE pos_shifts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    register_id UUID NOT NULL REFERENCES pos_registers(id) ON DELETE RESTRICT,
    user_id UUID NOT NULL, -- Assuming auth.users or similar
    opened_at TIMESTAMPTZ NOT NULL,
    closed_at TIMESTAMPTZ,
    opening_cash NUMERIC(15,6) NOT NULL,
    closing_cash_expected NUMERIC(15,6),
    closing_cash_actual NUMERIC(15,6),
    status VARCHAR NOT NULL DEFAULT 'Open'
);
CREATE INDEX idx_pos_shifts_status ON pos_shifts(status);

CREATE TABLE pos_receipts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    receipt_number VARCHAR NOT NULL UNIQUE,
    shift_id UUID NOT NULL REFERENCES pos_shifts(id) ON DELETE RESTRICT,
    customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
    transaction_date TIMESTAMPTZ NOT NULL,
    total_amount NUMERIC(15,6) NOT NULL,
    tax_amount NUMERIC(15,6) NOT NULL DEFAULT 0,
    discount_amount NUMERIC(15,6) NOT NULL DEFAULT 0,
    status VARCHAR NOT NULL DEFAULT 'Draft',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_pos_receipt_shift ON pos_receipts(shift_id);
CREATE INDEX idx_pos_receipt_date ON pos_receipts(transaction_date);

CREATE TABLE pos_receipt_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    receipt_id UUID NOT NULL REFERENCES pos_receipts(id) ON DELETE CASCADE,
    variation_id UUID NOT NULL REFERENCES product_variations(id) ON DELETE RESTRICT,
    quantity NUMERIC(15,6) NOT NULL,
    unit_price NUMERIC(15,6) NOT NULL,
    total_price NUMERIC(15,6) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE pos_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    receipt_id UUID NOT NULL REFERENCES pos_receipts(id) ON DELETE CASCADE,
    payment_method VARCHAR NOT NULL,
    amount NUMERIC(15,6) NOT NULL,
    reference_code VARCHAR,
    created_at TIMESTAMPTZ DEFAULT now()
);


-- >>>>>>>>>>>>> MIGRATION FILE: 20260715000008_module_8_pricing.sql <<<<<<<<<<<<<
-- MODULE 8: Pricing & Discount Engine

CREATE TABLE price_lists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR NOT NULL UNIQUE,
    currency VARCHAR NOT NULL DEFAULT 'BDT',
    is_tax_included BOOLEAN NOT NULL DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE price_list_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    price_list_id UUID NOT NULL REFERENCES price_lists(id) ON DELETE CASCADE,
    variation_id UUID NOT NULL REFERENCES product_variations(id) ON DELETE RESTRICT,
    uom_id UUID NOT NULL REFERENCES units_of_measure(id) ON DELETE RESTRICT,
    price NUMERIC(15,6) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(price_list_id, variation_id, uom_id)
);

CREATE TABLE discount_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR NOT NULL,
    priority INTEGER NOT NULL DEFAULT 0,
    discount_type VARCHAR NOT NULL,
    discount_value NUMERIC(15,6) NOT NULL,
    valid_from TIMESTAMPTZ,
    valid_to TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE discount_rule_conditions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    discount_rule_id UUID NOT NULL REFERENCES discount_rules(id) ON DELETE CASCADE,
    condition_type VARCHAR NOT NULL,
    condition_value VARCHAR NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);


-- >>>>>>>>>>>>> MIGRATION FILE: 20260715000009_module_9_rbac_rls.sql <<<<<<<<<<<<<
-- MODULE 9: Authentication, RBAC, and RLS

-- 1. Create RBAC Tables
CREATE TABLE erp_users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name VARCHAR,
    email VARCHAR,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE erp_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR NOT NULL UNIQUE
);

CREATE TABLE erp_user_roles (
    user_id UUID NOT NULL REFERENCES erp_users(id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES erp_roles(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, role_id)
);
CREATE INDEX idx_erp_user_roles_user ON erp_user_roles(user_id);

-- Insert default roles
INSERT INTO erp_roles (name) VALUES 
('Admin'), 
('WarehouseManager'), 
('Accountant'), 
('Purchasing'), 
('Sales'), 
('Cashier')
ON CONFLICT DO NOTHING;

-- 2. Auth Helper Function
CREATE OR REPLACE FUNCTION public.has_role(role_name text)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER -- Runs with elevated privileges to check user roles
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.erp_user_roles ur
    JOIN public.erp_roles r ON ur.role_id = r.id
    WHERE ur.user_id = auth.uid()
    AND r.name = role_name
  );
$$;

-- 3. Enable RLS on ALL tables
ALTER TABLE brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE units_of_measure ENABLE ROW LEVEL SECURITY;
ALTER TABLE uom_conversions ENABLE ROW LEVEL SECURITY;
ALTER TABLE attributes ENABLE ROW LEVEL SECURITY;
ALTER TABLE attribute_values ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_attributes ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_variations ENABLE ROW LEVEL SECURITY;
ALTER TABLE variation_attributes ENABLE ROW LEVEL SECURITY;
ALTER TABLE warehouses ENABLE ROW LEVEL SECURITY;
ALTER TABLE warehouse_zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE warehouse_bins ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_ledgers ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE fiscal_years ENABLE ROW LEVEL SECURITY;
ALTER TABLE chart_of_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE journal_entry_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE account_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_receipt_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_note_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE fifo_ledgers ENABLE ROW LEVEL SECURITY;
ALTER TABLE cogs_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE pos_registers ENABLE ROW LEVEL SECURITY;
ALTER TABLE pos_shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE pos_receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE pos_receipt_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE pos_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE price_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE price_list_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE discount_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE discount_rule_conditions ENABLE ROW LEVEL SECURITY;
ALTER TABLE erp_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE erp_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE erp_user_roles ENABLE ROW LEVEL SECURITY;

-- 4. Apply Admin Override Policy to ALL tables
DO $$
DECLARE
    tbl_name text;
BEGIN
    FOR tbl_name IN 
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename IN (
            'brands', 'categories', 'units_of_measure', 'uom_conversions', 'attributes', 'attribute_values', 
            'products', 'product_attributes', 'product_variations', 'variation_attributes', 'warehouses', 
            'warehouse_zones', 'warehouse_bins', 'stock_ledgers', 'stock_balances', 'fiscal_years', 
            'chart_of_accounts', 'journal_entries', 'journal_entry_lines', 'account_balances', 'suppliers', 
            'purchase_orders', 'purchase_order_items', 'purchase_receipts', 'purchase_receipt_items', 
            'purchase_invoices', 'purchase_invoice_items', 'customers', 'sales_orders', 'sales_order_items', 
            'delivery_notes', 'delivery_note_items', 'sales_invoices', 'sales_invoice_items', 'fifo_ledgers', 
            'cogs_entries', 'pos_registers', 'pos_shifts', 'pos_receipts', 'pos_receipt_items', 'pos_payments', 
            'price_lists', 'price_list_items', 'discount_rules', 'discount_rule_conditions', 
            'erp_users', 'erp_roles', 'erp_user_roles'
        )
    LOOP
        EXECUTE format('CREATE POLICY "Admin Override All Access" ON %I FOR ALL USING (public.has_role(''Admin''));', tbl_name);
    END LOOP;
END $$;

-- 5. Read-Only Policies for Foundational Data (Authenticated users can read so the UI works)
DO $$
DECLARE
    tbl_name text;
BEGIN
    FOR tbl_name IN 
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename IN (
            'brands', 'categories', 'units_of_measure', 'uom_conversions', 'attributes', 'attribute_values', 
            'products', 'product_attributes', 'product_variations', 'variation_attributes', 'warehouses', 
            'warehouse_zones', 'warehouse_bins', 'suppliers', 'customers', 'price_lists', 'price_list_items',
            'erp_users', 'erp_roles'
        )
    LOOP
        EXECUTE format('CREATE POLICY "Authenticated users can read foundational data" ON %I FOR SELECT USING (auth.role() = ''authenticated'');', tbl_name);
    END LOOP;
END $$;


-- >>>>>>>>>>>>> MIGRATION FILE: 20260715000010_module_6_customer_group.sql <<<<<<<<<<<<<
-- MODULE 6: Customer Groups

ALTER TABLE customers
ADD COLUMN customer_group VARCHAR DEFAULT 'General';


-- >>>>>>>>>>>>> MIGRATION FILE: 20260716000000_seed_demo_data.sql <<<<<<<<<<<<<
-- Disable notices
SET client_min_messages TO WARNING;

-- 1. Brands
INSERT INTO brands (name, description, is_active) VALUES
('Toyota Genuine Parts', 'Original equipment manufacturer parts for Toyota', true),
('Bosch', 'Premium automotive parts and systems', true),
('NGK', 'Leading spark plug manufacturer', true),
('Mobil 1', 'Synthetic motor oil', true)
ON CONFLICT (name) DO NOTHING;

-- 2. Categories
INSERT INTO categories (name, slug, is_active) VALUES
('Engine Parts', 'engine-parts', true),
('Brakes & Suspension', 'brakes-suspension', true),
('Oils & Fluids', 'oils-fluids', true),
('Electrical & Lighting', 'electrical-lighting', true)
ON CONFLICT (slug) DO NOTHING;

-- Insert Subcategories
INSERT INTO categories (parent_id, name, slug, is_active) VALUES
((SELECT id FROM categories WHERE slug = 'engine-parts'), 'Spark Plugs', 'spark-plugs', true),
((SELECT id FROM categories WHERE slug = 'brakes-suspension'), 'Brake Pads', 'brake-pads', true),
((SELECT id FROM categories WHERE slug = 'oils-fluids'), 'Engine Oil', 'engine-oil', true)
ON CONFLICT (slug) DO NOTHING;

-- 3. Units of Measure
INSERT INTO units_of_measure (name, abbreviation) VALUES
('Piece', 'pcs'),
('Set', 'set'),
('Liter', 'L'),
('Gallon', 'gal'),
('Kilogram', 'kg')
ON CONFLICT (name) DO NOTHING;

-- 4. Attributes
INSERT INTO attributes (name, display_type) VALUES
('Size', 'text'),
('Material', 'text'),
('Viscosity', 'text'),
('Vehicle Fitment', 'text')
ON CONFLICT (name) DO NOTHING;

INSERT INTO attribute_values (attribute_id, value) VALUES
((SELECT id FROM attributes WHERE name = 'Viscosity'), '5W-30'),
((SELECT id FROM attributes WHERE name = 'Viscosity'), '10W-40'),
((SELECT id FROM attributes WHERE name = 'Material'), 'Ceramic'),
((SELECT id FROM attributes WHERE name = 'Material'), 'Semi-Metallic')
ON CONFLICT (attribute_id, value) DO NOTHING;

-- 5. Warehouses
INSERT INTO warehouses (name, code, address, is_active) VALUES
('Main Distribution Center', 'MDC-01', '123 Industrial Park, Dhaka', true),
('Gulshan Retail Store', 'RET-01', '45 Gulshan Ave, Dhaka', true)
ON CONFLICT (code) DO NOTHING;

INSERT INTO warehouse_zones (warehouse_id, name, code) VALUES
((SELECT id FROM warehouses WHERE code = 'MDC-01'), 'Bulk Storage', 'Z-BLK'),
((SELECT id FROM warehouses WHERE code = 'MDC-01'), 'Picking Zone', 'Z-PCK'),
((SELECT id FROM warehouses WHERE code = 'RET-01'), 'Store Front', 'Z-STR')
ON CONFLICT (warehouse_id, code) DO NOTHING;

INSERT INTO warehouse_bins (zone_id, name, code) VALUES
((SELECT id FROM warehouse_zones WHERE code = 'Z-BLK' AND warehouse_id = (SELECT id FROM warehouses WHERE code = 'MDC-01')), 'A1', 'A1'),
((SELECT id FROM warehouse_zones WHERE code = 'Z-BLK' AND warehouse_id = (SELECT id FROM warehouses WHERE code = 'MDC-01')), 'A2', 'A2'),
((SELECT id FROM warehouse_zones WHERE code = 'Z-STR' AND warehouse_id = (SELECT id FROM warehouses WHERE code = 'RET-01')), 'Shelf 1', 'S1')
ON CONFLICT (zone_id, code) DO NOTHING;

-- 6. Chart of Accounts
INSERT INTO chart_of_accounts (account_number, name, account_type, is_group, is_active) VALUES
('1000', 'Assets', 'Asset', true, true),
('2000', 'Liabilities', 'Liability', true, true),
('3000', 'Equity', 'Equity', true, true),
('4000', 'Revenue', 'Revenue', true, true),
('5000', 'Expenses', 'Expense', true, true)
ON CONFLICT (account_number) DO NOTHING;

INSERT INTO chart_of_accounts (parent_id, account_number, name, account_type, is_active) VALUES
((SELECT id FROM chart_of_accounts WHERE account_number = '1000'), '1100', 'Cash', 'Asset', true),
((SELECT id FROM chart_of_accounts WHERE account_number = '1000'), '1200', 'Accounts Receivable', 'Asset', true),
((SELECT id FROM chart_of_accounts WHERE account_number = '1000'), '1300', 'Inventory', 'Asset', true),
((SELECT id FROM chart_of_accounts WHERE account_number = '2000'), '2100', 'Accounts Payable', 'Liability', true),
((SELECT id FROM chart_of_accounts WHERE account_number = '4000'), '4100', 'Sales Revenue', 'Revenue', true),
((SELECT id FROM chart_of_accounts WHERE account_number = '5000'), '5100', 'Cost of Goods Sold', 'Expense', true),
((SELECT id FROM chart_of_accounts WHERE account_number = '5000'), '5200', 'Operating Expenses', 'Expense', true)
ON CONFLICT (account_number) DO NOTHING;

-- 7. Fiscal Years
INSERT INTO fiscal_years (name, start_date, end_date, is_closed) VALUES
('FY2026', '2026-01-01', '2026-12-31', false),
('FY2025', '2025-01-01', '2025-12-31', true)
ON CONFLICT (name) DO NOTHING;

-- 8. Suppliers and Customers
INSERT INTO suppliers (name, contact_email, contact_phone, payable_account_id, is_active) VALUES
('Global Auto Parts Ltd', 'sales@globalauto.com', '+8801700000001', (SELECT id FROM chart_of_accounts WHERE account_number = '2100'), true),
('Bosch Bangladesh', 'contact@bosch.com.bd', '+8801700000002', (SELECT id FROM chart_of_accounts WHERE account_number = '2100'), true)
ON CONFLICT (name) DO NOTHING;

INSERT INTO customers (name, contact_email, contact_phone, receivable_account_id, is_active, customer_group) VALUES
('Rahim Auto Shop', 'rahim@autoshop.com', '+8801800000001', (SELECT id FROM chart_of_accounts WHERE account_number = '1200'), true, 'Dealer'),
('Walk-in Customer', 'walkin@example.com', 'N/A', (SELECT id FROM chart_of_accounts WHERE account_number = '1200'), true, 'Retail')
ON CONFLICT (name) DO NOTHING;

-- 9. Products & Variations
INSERT INTO products (item_code, name, description, category_id, brand_id, base_uom_id, has_variants)
VALUES (
    'BP-001', 'Toyota Corolla Brake Pads', 'Premium Ceramic Brake Pads for Toyota Corolla (2015-2023)',
    (SELECT id FROM categories WHERE slug = 'brake-pads'),
    (SELECT id FROM brands WHERE name = 'Toyota Genuine Parts'),
    (SELECT id FROM units_of_measure WHERE abbreviation = 'set'),
    false
) ON CONFLICT (item_code) DO NOTHING;

INSERT INTO product_variations (product_id, sku, barcode, weight)
VALUES (
    (SELECT id FROM products WHERE item_code = 'BP-001'),
    'SKU-BP-001', '7891011121314', 1.5
) ON CONFLICT (sku) DO NOTHING;

INSERT INTO products (item_code, name, description, category_id, brand_id, base_uom_id, has_variants)
VALUES (
    'SP-NGK-01', 'NGK Iridium Spark Plug', 'High performance iridium spark plug',
    (SELECT id FROM categories WHERE slug = 'spark-plugs'),
    (SELECT id FROM brands WHERE name = 'NGK'),
    (SELECT id FROM units_of_measure WHERE abbreviation = 'pcs'),
    false
) ON CONFLICT (item_code) DO NOTHING;

INSERT INTO product_variations (product_id, sku, barcode, weight)
VALUES (
    (SELECT id FROM products WHERE item_code = 'SP-NGK-01'),
    'SKU-SP-NGK-01', '1234567890123', 0.1
) ON CONFLICT (sku) DO NOTHING;

INSERT INTO products (item_code, name, description, category_id, brand_id, base_uom_id, has_variants)
VALUES (
    'OIL-M1-5W30', 'Mobil 1 Full Synthetic 5W-30', 'Advanced full synthetic motor oil',
    (SELECT id FROM categories WHERE slug = 'engine-oil'),
    (SELECT id FROM brands WHERE name = 'Mobil 1'),
    (SELECT id FROM units_of_measure WHERE abbreviation = 'L'),
    false
) ON CONFLICT (item_code) DO NOTHING;

INSERT INTO product_variations (product_id, sku, barcode, weight)
VALUES (
    (SELECT id FROM products WHERE item_code = 'OIL-M1-5W30'),
    'SKU-OIL-M1-5W30-4L', '4567890123456', 3.8
) ON CONFLICT (sku) DO NOTHING;

-- 10. Initial Stock Balances
INSERT INTO stock_balances (variation_id, warehouse_id, bin_id, quantity)
VALUES (
    (SELECT id FROM product_variations WHERE sku = 'SKU-BP-001'),
    (SELECT id FROM warehouses WHERE code = 'MDC-01'),
    (SELECT id FROM warehouse_bins WHERE code = 'A1'),
    150
) ON CONFLICT (variation_id, warehouse_id, bin_id, batch_number) DO NOTHING;

INSERT INTO stock_balances (variation_id, warehouse_id, bin_id, quantity)
VALUES (
    (SELECT id FROM product_variations WHERE sku = 'SKU-SP-NGK-01'),
    (SELECT id FROM warehouses WHERE code = 'RET-01'),
    (SELECT id FROM warehouse_bins WHERE code = 'S1'),
    500
) ON CONFLICT (variation_id, warehouse_id, bin_id, batch_number) DO NOTHING;

INSERT INTO stock_balances (variation_id, warehouse_id, bin_id, quantity)
VALUES (
    (SELECT id FROM product_variations WHERE sku = 'SKU-OIL-M1-5W30-4L'),
    (SELECT id FROM warehouses WHERE code = 'MDC-01'),
    (SELECT id FROM warehouse_bins WHERE code = 'A2'),
    200
) ON CONFLICT (variation_id, warehouse_id, bin_id, batch_number) DO NOTHING;

-- 11. Price Lists
INSERT INTO price_lists (name, currency, is_tax_included, is_active) VALUES
('Standard Retail Price', 'BDT', true, true),
('Wholesale Dealer Price', 'BDT', false, true)
ON CONFLICT (name) DO NOTHING;

INSERT INTO price_list_items (price_list_id, variation_id, uom_id, price) VALUES
((SELECT id FROM price_lists WHERE name = 'Standard Retail Price'), (SELECT id FROM product_variations WHERE sku = 'SKU-BP-001'), (SELECT id FROM units_of_measure WHERE abbreviation = 'set'), 4500),
((SELECT id FROM price_lists WHERE name = 'Standard Retail Price'), (SELECT id FROM product_variations WHERE sku = 'SKU-SP-NGK-01'), (SELECT id FROM units_of_measure WHERE abbreviation = 'pcs'), 1200),
((SELECT id FROM price_lists WHERE name = 'Standard Retail Price'), (SELECT id FROM product_variations WHERE sku = 'SKU-OIL-M1-5W30-4L'), (SELECT id FROM units_of_measure WHERE abbreviation = 'L'), 5500)
ON CONFLICT (price_list_id, variation_id, uom_id) DO NOTHING;

INSERT INTO price_list_items (price_list_id, variation_id, uom_id, price) VALUES
((SELECT id FROM price_lists WHERE name = 'Wholesale Dealer Price'), (SELECT id FROM product_variations WHERE sku = 'SKU-BP-001'), (SELECT id FROM units_of_measure WHERE abbreviation = 'set'), 3800),
((SELECT id FROM price_lists WHERE name = 'Wholesale Dealer Price'), (SELECT id FROM product_variations WHERE sku = 'SKU-SP-NGK-01'), (SELECT id FROM units_of_measure WHERE abbreviation = 'pcs'), 900),
((SELECT id FROM price_lists WHERE name = 'Wholesale Dealer Price'), (SELECT id FROM product_variations WHERE sku = 'SKU-OIL-M1-5W30-4L'), (SELECT id FROM units_of_measure WHERE abbreviation = 'L'), 4800)
ON CONFLICT (price_list_id, variation_id, uom_id) DO NOTHING;

-- 12. POS Registers
INSERT INTO pos_registers (name, warehouse_id, default_cash_account_id, is_active) VALUES
('Main Cash Register 1', 
 (SELECT id FROM warehouses WHERE code = 'RET-01'), 
 (SELECT id FROM chart_of_accounts WHERE account_number = '1100'), 
 true)
ON CONFLICT (name) DO NOTHING;


-- >>>>>>>>>>>>> MIGRATION FILE: 20260723000000_recreate_dealers_table.sql <<<<<<<<<<<<<
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


-- >>>>>>>>>>>>> MIGRATION FILE: 20260725000000_add_image_url_to_products.sql <<<<<<<<<<<<<
-- Add image_url to products table
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS image_url text DEFAULT NULL;


-- >>>>>>>>>>>>> MIGRATION FILE: 20260725000001_add_image_url_to_categories.sql <<<<<<<<<<<<<
-- Add image_url to categories table
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS image_url text DEFAULT NULL;


-- >>>>>>>>>>>>> MIGRATION FILE: 20260725000002_recreate_banners_table.sql <<<<<<<<<<<<<
-- Recreate banners table
CREATE TABLE IF NOT EXISTS public.banners (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  subtitle TEXT DEFAULT '',
  image_url TEXT NOT NULL,
  link_url TEXT DEFAULT '/shop',
  is_active BOOLEAN DEFAULT true,
  position TEXT NOT NULL DEFAULT 'promo' CHECK (position IN ('hero','promo','category')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'banners' AND policyname = 'Banners are viewable by everyone') THEN
    CREATE POLICY "Banners are viewable by everyone" ON public.banners FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'banners' AND policyname = 'Banners can be inserted by anyone') THEN
    CREATE POLICY "Banners can be inserted by anyone" ON public.banners FOR INSERT WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'banners' AND policyname = 'Banners can be updated by anyone') THEN
    CREATE POLICY "Banners can be updated by anyone" ON public.banners FOR UPDATE USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'banners' AND policyname = 'Banners can be deleted by anyone') THEN
    CREATE POLICY "Banners can be deleted by anyone" ON public.banners FOR DELETE USING (true);
  END IF;
END $$;

DROP TRIGGER IF EXISTS update_banners_updated_at ON public.banners;
CREATE TRIGGER update_banners_updated_at BEFORE UPDATE ON public.banners
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


-- >>>>>>>>>>>>> MIGRATION FILE: 20260725000003_recreate_site_settings_and_legacy_tables.sql <<<<<<<<<<<<<
-- Recreate / Fix site_settings table and add ALL missing columns
CREATE TABLE IF NOT EXISTS public.site_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.site_settings
  ADD COLUMN IF NOT EXISTS site_name TEXT DEFAULT 'SuperShop',
  ADD COLUMN IF NOT EXISTS site_description TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS site_title TEXT DEFAULT 'SuperShop - Modern E-Commerce',
  ADD COLUMN IF NOT EXISTS logo_url TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS favicon_url TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS primary_color TEXT DEFAULT '#3B82F6',
  ADD COLUMN IF NOT EXISTS secondary_color TEXT DEFAULT '#1E40AF',
  ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'OMR',
  ADD COLUMN IF NOT EXISTS currency_symbol TEXT DEFAULT '$',
  ADD COLUMN IF NOT EXISTS support_email TEXT DEFAULT 'support@supershop.com',
  ADD COLUMN IF NOT EXISTS support_phone TEXT DEFAULT '+1 (555) 123-4567',
  ADD COLUMN IF NOT EXISTS contact_email TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS contact_phone TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS contact_address TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS working_hours TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS footer_description TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS footer_copyright TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS footer_tagline TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS footer_text TEXT DEFAULT '© 2026 SuperShop. All rights reserved.',
  ADD COLUMN IF NOT EXISTS whatsapp_number TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS instagram_handle TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS free_shipping_threshold NUMERIC(10,2) DEFAULT 30,
  ADD COLUMN IF NOT EXISTS facebook_url TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS instagram_url TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS twitter_url TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS youtube_url TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS facebook_pixel_id TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS facebook_pixel_enabled BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS facebook_capi_enabled BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS facebook_access_token TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS facebook_test_event_code TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS facebook_api_version TEXT DEFAULT 'v21.0',
  ADD COLUMN IF NOT EXISTS tiktok_pixel_id TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS tiktok_pixel_enabled BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS tiktok_access_token TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS google_analytics_id TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS google_tag_manager_id TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS tracking_pageview BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS tracking_viewcontent BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS tracking_addtocart BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS tracking_initiatecheckout BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS tracking_purchase BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS tracking_lead BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS tracking_complete_registration BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS default_content_type TEXT DEFAULT 'product',
  ADD COLUMN IF NOT EXISTS test_event_code TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS meta_title TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS meta_description TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS meta_keywords TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS language TEXT DEFAULT 'en';

ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'site_settings' AND policyname = 'Settings viewable by everyone') THEN
    CREATE POLICY "Settings viewable by everyone" ON public.site_settings FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'site_settings' AND policyname = 'Settings updatable by anyone') THEN
    CREATE POLICY "Settings updatable by anyone" ON public.site_settings FOR UPDATE USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'site_settings' AND policyname = 'Settings insertable by anyone') THEN
    CREATE POLICY "Settings insertable by anyone" ON public.site_settings FOR INSERT WITH CHECK (true);
  END IF;
END $$;

INSERT INTO public.site_settings (site_name, site_title, support_email, support_phone, contact_email, contact_phone, contact_address, footer_text)
SELECT 'SuperShop', 'SuperShop - Modern E-Commerce', 'support@supershop.com', '+1 (555) 123-4567', 'contact@supershop.com', '+1 (555) 123-4567', '123 Main Street, City, Country', '© 2026 SuperShop. All rights reserved.'
WHERE NOT EXISTS (SELECT 1 FROM public.site_settings);

-- 2. Coupons Table
CREATE TABLE IF NOT EXISTS public.coupons (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  type TEXT NOT NULL DEFAULT 'percentage' CHECK (type IN ('percentage','fixed')),
  value NUMERIC(10,2) NOT NULL DEFAULT 10,
  min_order NUMERIC(10,2) DEFAULT 0,
  max_uses INTEGER DEFAULT 100,
  used_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  expires_at DATE NOT NULL DEFAULT (now() + interval '1 year'),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'coupons' AND policyname = 'Coupons viewable by everyone') THEN
    CREATE POLICY "Coupons viewable by everyone" ON public.coupons FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'coupons' AND policyname = 'Coupons insertable by anyone') THEN
    CREATE POLICY "Coupons insertable by anyone" ON public.coupons FOR INSERT WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'coupons' AND policyname = 'Coupons updatable by anyone') THEN
    CREATE POLICY "Coupons updatable by anyone" ON public.coupons FOR UPDATE USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'coupons' AND policyname = 'Coupons deletable by anyone') THEN
    CREATE POLICY "Coupons deletable by anyone" ON public.coupons FOR DELETE USING (true);
  END IF;
END $$;

-- 3. Reviews Table
CREATE TABLE IF NOT EXISTS public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reviewer_name TEXT NOT NULL,
  reviewer_image TEXT DEFAULT '',
  review_text TEXT NOT NULL DEFAULT '',
  rating INTEGER NOT NULL DEFAULT 5,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  show_for_all BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'reviews' AND policyname = 'Reviews viewable by everyone') THEN
    CREATE POLICY "Reviews viewable by everyone" ON public.reviews FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'reviews' AND policyname = 'Reviews insertable by anyone') THEN
    CREATE POLICY "Reviews insertable by anyone" ON public.reviews FOR INSERT WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'reviews' AND policyname = 'Reviews updatable by anyone') THEN
    CREATE POLICY "Reviews updatable by anyone" ON public.reviews FOR UPDATE USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'reviews' AND policyname = 'Reviews deletable by anyone') THEN
    CREATE POLICY "Reviews deletable by anyone" ON public.reviews FOR DELETE USING (true);
  END IF;
END $$;

-- 4. Contact Messages Table
CREATE TABLE IF NOT EXISTS public.contact_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  subject TEXT,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'unread',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'contact_messages' AND policyname = 'Messages viewable by everyone') THEN
    CREATE POLICY "Messages viewable by everyone" ON public.contact_messages FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'contact_messages' AND policyname = 'Messages insertable by anyone') THEN
    CREATE POLICY "Messages insertable by anyone" ON public.contact_messages FOR INSERT WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'contact_messages' AND policyname = 'Messages updatable by anyone') THEN
    CREATE POLICY "Messages updatable by anyone" ON public.contact_messages FOR UPDATE USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'contact_messages' AND policyname = 'Messages deletable by anyone') THEN
    CREATE POLICY "Messages deletable by anyone" ON public.contact_messages FOR DELETE USING (true);
  END IF;
END $$;

-- 5. Job Applications Table
CREATE TABLE IF NOT EXISTS public.job_applications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  position TEXT NOT NULL,
  cover_letter TEXT,
  cv_url TEXT,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.job_applications ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'job_applications' AND policyname = 'Job applications viewable by everyone') THEN
    CREATE POLICY "Job applications viewable by everyone" ON public.job_applications FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'job_applications' AND policyname = 'Job applications insertable by anyone') THEN
    CREATE POLICY "Job applications insertable by anyone" ON public.job_applications FOR INSERT WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'job_applications' AND policyname = 'Job applications updatable by anyone') THEN
    CREATE POLICY "Job applications updatable by anyone" ON public.job_applications FOR UPDATE USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'job_applications' AND policyname = 'Job applications deletable by anyone') THEN
    CREATE POLICY "Job applications deletable by anyone" ON public.job_applications FOR DELETE USING (true);
  END IF;
END $$;


-- >>>>>>>>>>>>> MIGRATION FILE: 20260725000004_fix_all_site_settings_columns.sql <<<<<<<<<<<<<
-- Add all missing site_settings columns
ALTER TABLE public.site_settings
  ADD COLUMN IF NOT EXISTS site_name TEXT DEFAULT 'SuperShop',
  ADD COLUMN IF NOT EXISTS site_description TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS site_title TEXT DEFAULT 'SuperShop - Modern E-Commerce',
  ADD COLUMN IF NOT EXISTS logo_url TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS favicon_url TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS primary_color TEXT DEFAULT '#3B82F6',
  ADD COLUMN IF NOT EXISTS secondary_color TEXT DEFAULT '#1E40AF',
  ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'OMR',
  ADD COLUMN IF NOT EXISTS currency_symbol TEXT DEFAULT '$',
  ADD COLUMN IF NOT EXISTS support_email TEXT DEFAULT 'support@supershop.com',
  ADD COLUMN IF NOT EXISTS support_phone TEXT DEFAULT '+1 (555) 123-4567',
  ADD COLUMN IF NOT EXISTS contact_email TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS contact_phone TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS contact_address TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS working_hours TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS footer_description TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS footer_copyright TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS footer_tagline TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS footer_text TEXT DEFAULT '© 2026 SuperShop. All rights reserved.',
  ADD COLUMN IF NOT EXISTS whatsapp_number TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS instagram_handle TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS free_shipping_threshold NUMERIC(10,2) DEFAULT 30,
  ADD COLUMN IF NOT EXISTS facebook_url TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS instagram_url TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS twitter_url TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS youtube_url TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS facebook_pixel_id TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS facebook_pixel_enabled BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS facebook_capi_enabled BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS facebook_access_token TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS facebook_test_event_code TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS facebook_api_version TEXT DEFAULT 'v21.0',
  ADD COLUMN IF NOT EXISTS tiktok_pixel_id TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS tiktok_pixel_enabled BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS tiktok_access_token TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS google_analytics_id TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS google_tag_manager_id TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS tracking_pageview BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS tracking_viewcontent BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS tracking_addtocart BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS tracking_initiatecheckout BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS tracking_purchase BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS tracking_lead BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS tracking_complete_registration BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS default_content_type TEXT DEFAULT 'product',
  ADD COLUMN IF NOT EXISTS test_event_code TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS meta_title TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS meta_description TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS meta_keywords TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS language TEXT DEFAULT 'en';


-- >>>>>>>>>>>>> MIGRATION FILE: 20260725000005_allow_public_read_products_and_catalog.sql <<<<<<<<<<<<<
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


-- >>>>>>>>>>>>> MIGRATION FILE: 20260725000006_add_default_prices_to_existing_products.sql <<<<<<<<<<<<<
-- Add price columns to public.products table
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS price numeric(10,2) DEFAULT 0.00;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS original_price numeric(10,2) DEFAULT NULL;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS dealer_price numeric(10,2) DEFAULT NULL;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS dealer_original_price numeric(10,2) DEFAULT NULL;

-- Update existing products with a default price if price is 0 or NULL
UPDATE public.products 
SET price = 15.00 
WHERE price IS NULL OR price = 0;


-- >>>>>>>>>>>>> MIGRATION FILE: 20260812000000_add_missing_legacy_columns_to_products.sql <<<<<<<<<<<<<
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


-- >>>>>>>>>>>>> MIGRATION FILE: 20260812000001_allow_public_write_price_list_items.sql <<<<<<<<<<<<<
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



-- >>>>>>>>>>>>> MIGRATION FILE: 20260812000002_add_walk_in_customer_fields.sql <<<<<<<<<<<<<
ALTER TABLE "public"."pos_receipts" 
ADD COLUMN IF NOT EXISTS "walk_in_customer_name" text,
ADD COLUMN IF NOT EXISTS "walk_in_customer_phone" text;


-- >>>>>>>>>>>>> MIGRATION FILE: 20260816000003_add_walk_in_dealer_fields.sql <<<<<<<<<<<<<
ALTER TABLE "public"."pos_receipts" 
ADD COLUMN IF NOT EXISTS "walk_in_dealer_name" text,
ADD COLUMN IF NOT EXISTS "walk_in_dealer_phone" text;

