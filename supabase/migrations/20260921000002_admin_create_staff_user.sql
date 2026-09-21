-- =============================================================================
-- DIRECT STAFF USER CREATION RPC FUNCTION
-- Bypasses Supabase SMTP email rate limits and auto-confirms staff user accounts
-- Run in Supabase SQL Editor: https://supabase.com/dashboard/project/uduerhxssuljnvcyuskj/sql/new
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto" SCHEMA extensions;

-- Function to create staff user directly without email verification/rate limit
CREATE OR REPLACE FUNCTION public.admin_create_staff_user(
  p_email text,
  p_password text,
  p_full_name text,
  p_role_name text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id uuid;
  v_role_id uuid;
  v_encrypted_pw text;
  v_clean_email text;
BEGIN
  v_clean_email := LOWER(TRIM(p_email));

  -- 1. Locate or create role in erp_roles
  SELECT id INTO v_role_id
  FROM public.erp_roles
  WHERE LOWER(name) = LOWER(p_role_name)
     OR (LOWER(p_role_name) IN ('sales', 'salesman') AND LOWER(name) IN ('sales', 'salesman'))
  LIMIT 1;

  IF v_role_id IS NULL THEN
    INSERT INTO public.erp_roles (name) 
    VALUES (CASE WHEN LOWER(p_role_name) = 'sales' THEN 'Salesman' ELSE p_role_name END)
    ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
    RETURNING id INTO v_role_id;
  END IF;

  -- 2. Encrypt password using pgcrypto
  v_encrypted_pw := extensions.crypt(p_password, extensions.gen_salt('bf'));

  -- 3. Check if user exists in auth.users
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE LOWER(email) = v_clean_email
  LIMIT 1;

  IF v_user_id IS NOT NULL THEN
    -- Update existing auth user password and ensure email is confirmed
    UPDATE auth.users
    SET encrypted_password = v_encrypted_pw,
        email_confirmed_at = COALESCE(email_confirmed_at, now()),
        raw_user_meta_data = jsonb_build_object('full_name', p_full_name, 'role', p_role_name),
        updated_at = now()
    WHERE id = v_user_id;
  ELSE
    -- Generate new UUID and insert into auth.users
    v_user_id := gen_random_uuid();
    
    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      v_user_id,
      'authenticated',
      'authenticated',
      v_clean_email,
      v_encrypted_pw,
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      jsonb_build_object('full_name', p_full_name, 'role', p_role_name),
      now(),
      now()
    );

    -- Also insert into auth.identities
    INSERT INTO auth.identities (
      id,
      user_id,
      identity_data,
      provider,
      provider_id,
      last_sign_in_at,
      created_at,
      updated_at
    ) VALUES (
      v_user_id,
      v_user_id,
      jsonb_build_object('sub', v_user_id::text, 'email', v_clean_email),
      'email',
      v_user_id::text,
      now(),
      now(),
      now()
    ) ON CONFLICT (provider, provider_id) DO NOTHING;
  END IF;

  -- 4. Upsert into erp_users
  INSERT INTO public.erp_users (id, email, full_name, is_active, updated_at)
  VALUES (v_user_id, v_clean_email, p_full_name, true, now())
  ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    email = EXCLUDED.email,
    is_active = true,
    updated_at = now();

  -- 5. Link role in erp_user_roles
  DELETE FROM public.erp_user_roles WHERE user_id = v_user_id;
  INSERT INTO public.erp_user_roles (user_id, role_id)
  VALUES (v_user_id, v_role_id)
  ON CONFLICT DO NOTHING;

  RETURN jsonb_build_object(
    'success', true,
    'user_id', v_user_id,
    'email', v_clean_email,
    'role_id', v_role_id,
    'role_name', p_role_name
  );
END;
$$;

-- Grant execution to API clients
GRANT EXECUTE ON FUNCTION public.admin_create_staff_user(text, text, text, text) TO anon, authenticated, service_role;
