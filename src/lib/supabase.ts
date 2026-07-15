import { createClient } from "@supabase/supabase-js";

const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL || "https://placeholder.supabase.co";
const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  "placeholder-key";

if (supabaseUrl === "https://placeholder.supabase.co") {
  console.warn("⚠️ Supabase URL or Anon Key is missing in .env file.");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
