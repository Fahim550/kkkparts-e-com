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
