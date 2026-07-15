import { supabase } from "@/integrations/supabase/client";

const BUCKET = "product-images";

export async function uploadProductImage(
  file: File,
  folder: string = "products",
): Promise<string> {
  const ext = file.name.split(".").pop();
  const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).substr(2, 8)}.${ext}`;

  const { error } = await supabase.storage.from(BUCKET).upload(fileName, file, {
    cacheControl: "3600",
    upsert: false,
  });

  if (error) throw error;

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(fileName);
  return data.publicUrl;
}

export async function deleteProductImage(url: string): Promise<void> {
  // Extract path from URL
  const parts = url.split(`/storage/v1/object/public/${BUCKET}/`);
  if (parts.length < 2) return;
  const path = parts[1];
  await supabase.storage.from(BUCKET).remove([path]);
}
