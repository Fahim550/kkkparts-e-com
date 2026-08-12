ALTER TABLE "public"."pos_receipts" 
ADD COLUMN IF NOT EXISTS "walk_in_customer_name" text,
ADD COLUMN IF NOT EXISTS "walk_in_customer_phone" text;
