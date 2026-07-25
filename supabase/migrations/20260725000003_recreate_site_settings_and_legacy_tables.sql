-- Recreate / Fix site_settings table and add all missing columns
CREATE TABLE IF NOT EXISTS public.site_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.site_settings
  ADD COLUMN IF NOT EXISTS site_name TEXT DEFAULT 'SuperShop',
  ADD COLUMN IF NOT EXISTS site_title TEXT DEFAULT 'SuperShop - Modern E-Commerce',
  ADD COLUMN IF NOT EXISTS logo_url TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS favicon_url TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS primary_color TEXT DEFAULT '#3B82F6',
  ADD COLUMN IF NOT EXISTS secondary_color TEXT DEFAULT '#1E40AF',
  ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'USD',
  ADD COLUMN IF NOT EXISTS currency_symbol TEXT DEFAULT '$',
  ADD COLUMN IF NOT EXISTS support_email TEXT DEFAULT 'support@supershop.com',
  ADD COLUMN IF NOT EXISTS support_phone TEXT DEFAULT '+1 (555) 123-4567',
  ADD COLUMN IF NOT EXISTS contact_address TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS working_hours TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS footer_text TEXT DEFAULT '© 2026 SuperShop. All rights reserved.',
  ADD COLUMN IF NOT EXISTS facebook_url TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS instagram_url TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS twitter_url TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS youtube_url TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS facebook_pixel_id TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS google_analytics_id TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS google_tag_manager_id TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS tiktok_pixel_id TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS facebook_access_token TEXT DEFAULT '',
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

INSERT INTO public.site_settings (site_name, site_title, support_email, support_phone, contact_address, footer_text)
SELECT 'SuperShop', 'SuperShop - Modern E-Commerce', 'support@supershop.com', '+1 (555) 123-4567', '123 Main Street, City, Country', '© 2026 SuperShop. All rights reserved.'
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
