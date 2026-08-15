ALTER TABLE "public"."pos_receipts" 
ADD COLUMN IF NOT EXISTS "walk_in_dealer_name" text,
ADD COLUMN IF NOT EXISTS "walk_in_dealer_phone" text;
