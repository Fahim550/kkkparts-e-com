-- =============================================================================
-- CREATE AUTH USERS (Admin & Dealers) IN SUPABASE AUTH
-- Target Project ID: uduerhxssuljnvcyuskj
-- Run in Supabase SQL Editor: https://supabase.com/dashboard/project/uduerhxssuljnvcyuskj
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto" SCHEMA extensions;

-- Ensure user_roles table exists for legacy compatibility
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
GRANT ALL ON public.user_roles TO anon, authenticated, service_role, postgres;
DROP POLICY IF EXISTS "Allow all user_roles" ON public.user_roles;
CREATE POLICY "Allow all user_roles" ON public.user_roles FOR ALL TO public USING (true) WITH CHECK (true);

-- Ensure erp_roles and erp_users tables have full permissions
GRANT ALL ON public.erp_roles TO anon, authenticated, service_role, postgres;
GRANT ALL ON public.erp_users TO anon, authenticated, service_role, postgres;
GRANT ALL ON public.erp_user_roles TO anon, authenticated, service_role, postgres;
GRANT ALL ON public.dealers TO anon, authenticated, service_role, postgres;

-- -----------------------------------------------------------------------------
-- User 1: Dealer (softzeniq@gmail.com / 123456)
-- -----------------------------------------------------------------------------
INSERT INTO auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  recovery_sent_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  '34ea705b-12e4-436a-93d7-aaf32e957aaf',
  'authenticated',
  'authenticated',
  'softzeniq@gmail.com',
  extensions.crypt('123456', extensions.gen_salt('bf')),
  now(), now(), now(),
  '{"provider":"email","providers":["email"]}',
  '{"full_name":"DealerName","phone":"01616219621","role":"dealer"}'::jsonb,
  now(), now(), '', '', '', ''
) ON CONFLICT (id) DO UPDATE SET 
  encrypted_password = extensions.crypt('123456', extensions.gen_salt('bf')),
  email_confirmed_at = now();

INSERT INTO auth.identities (
  id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at
) VALUES (
  '34ea705b-12e4-436a-93d7-aaf32e957aaf',
  '34ea705b-12e4-436a-93d7-aaf32e957aaf',
  format('{"sub":"%s","email":"%s"}', '34ea705b-12e4-436a-93d7-aaf32e957aaf', 'softzeniq@gmail.com')::jsonb,
  'email',
  '34ea705b-12e4-436a-93d7-aaf32e957aaf',
  now(), now(), now()
) ON CONFLICT (provider, provider_id) DO NOTHING;

-- -----------------------------------------------------------------------------
-- User 2: Dealer (mddawdrahi11@gmail.com / 111111)
-- -----------------------------------------------------------------------------
INSERT INTO auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  recovery_sent_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  '4627e418-a53b-4a00-a198-a35d5878e7c5',
  'authenticated',
  'authenticated',
  'mddawdrahi11@gmail.com',
  extensions.crypt('111111', extensions.gen_salt('bf')),
  now(), now(), now(),
  '{"provider":"email","providers":["email"]}',
  '{"full_name":"DAWOOD","phone":"79458035","role":"dealer"}'::jsonb,
  now(), now(), '', '', '', ''
) ON CONFLICT (id) DO UPDATE SET 
  encrypted_password = extensions.crypt('111111', extensions.gen_salt('bf')),
  email_confirmed_at = now();

INSERT INTO auth.identities (
  id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at
) VALUES (
  '4627e418-a53b-4a00-a198-a35d5878e7c5',
  '4627e418-a53b-4a00-a198-a35d5878e7c5',
  format('{"sub":"%s","email":"%s"}', '4627e418-a53b-4a00-a198-a35d5878e7c5', 'mddawdrahi11@gmail.com')::jsonb,
  'email',
  '4627e418-a53b-4a00-a198-a35d5878e7c5',
  now(), now(), now()
) ON CONFLICT (provider, provider_id) DO NOTHING;

-- -----------------------------------------------------------------------------
-- User 3: Admin (admin@kkkparts.com / admin123)
-- -----------------------------------------------------------------------------
INSERT INTO auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  recovery_sent_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  'a0000000-0000-0000-0000-000000000001',
  'authenticated',
  'authenticated',
  'admin@kkkparts.com',
  extensions.crypt('admin123', extensions.gen_salt('bf')),
  now(), now(), now(),
  '{"provider":"email","providers":["email"]}',
  '{"full_name":"System Admin","role":"admin"}'::jsonb,
  now(), now(), '', '', '', ''
) ON CONFLICT (id) DO UPDATE SET 
  encrypted_password = extensions.crypt('admin123', extensions.gen_salt('bf')),
  email_confirmed_at = now();

INSERT INTO auth.identities (
  id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at
) VALUES (
  'a0000000-0000-0000-0000-000000000001',
  'a0000000-0000-0000-0000-000000000001',
  format('{"sub":"%s","email":"%s"}', 'a0000000-0000-0000-0000-000000000001', 'admin@kkkparts.com')::jsonb,
  'email',
  'a0000000-0000-0000-0000-000000000001',
  now(), now(), now()
) ON CONFLICT (provider, provider_id) DO NOTHING;

-- -----------------------------------------------------------------------------
-- User 4: Admin (ahmedfahim2305@gmail.com / admin123)
-- -----------------------------------------------------------------------------
INSERT INTO auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  recovery_sent_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  'a0000000-0000-0000-0000-000000000002',
  'authenticated',
  'authenticated',
  'ahmedfahim2305@gmail.com',
  extensions.crypt('admin123', extensions.gen_salt('bf')),
  now(), now(), now(),
  '{"provider":"email","providers":["email"]}',
  '{"full_name":"Fahim Admin","role":"admin"}'::jsonb,
  now(), now(), '', '', '', ''
) ON CONFLICT (id) DO UPDATE SET 
  encrypted_password = extensions.crypt('admin123', extensions.gen_salt('bf')),
  email_confirmed_at = now();

INSERT INTO auth.identities (
  id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at
) VALUES (
  'a0000000-0000-0000-0000-000000000002',
  'a0000000-0000-0000-0000-000000000002',
  format('{"sub":"%s","email":"%s"}', 'a0000000-0000-0000-0000-000000000002', 'ahmedfahim2305@gmail.com')::jsonb,
  'email',
  'a0000000-0000-0000-0000-000000000002',
  now(), now(), now()
) ON CONFLICT (provider, provider_id) DO NOTHING;

-- -----------------------------------------------------------------------------
-- SETUP ROLES & PERMISSIONS
-- -----------------------------------------------------------------------------
-- Insert ERP Roles
INSERT INTO public.erp_roles (name) VALUES ('admin'), ('Admin') ON CONFLICT (name) DO NOTHING;

-- Insert into erp_users
INSERT INTO public.erp_users (id, full_name, email, is_active)
VALUES 
  ('a0000000-0000-0000-0000-000000000001', 'System Admin', 'admin@kkkparts.com', true),
  ('a0000000-0000-0000-0000-000000000002', 'Fahim Admin', 'ahmedfahim2305@gmail.com', true)
ON CONFLICT (id) DO NOTHING;

-- Link admin role to admin users in erp_user_roles
INSERT INTO public.erp_user_roles (user_id, role_id)
SELECT 'a0000000-0000-0000-0000-000000000001', id FROM public.erp_roles WHERE lower(name) = 'admin'
ON CONFLICT DO NOTHING;

INSERT INTO public.erp_user_roles (user_id, role_id)
SELECT 'a0000000-0000-0000-0000-000000000002', id FROM public.erp_roles WHERE lower(name) = 'admin'
ON CONFLICT DO NOTHING;

-- Link admin role in legacy user_roles
INSERT INTO public.user_roles (user_id, role)
VALUES 
  ('a0000000-0000-0000-0000-000000000001', 'admin'),
  ('a0000000-0000-0000-0000-000000000002', 'admin')
ON CONFLICT DO NOTHING;

-- Refresh PostgREST schema cache
NOTIFY pgrst, 'reload schema';
