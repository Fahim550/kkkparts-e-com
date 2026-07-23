import { createClient } from "@supabase/supabase-js";

const url = "https://mzczkzcvlgtssrmyilhn.supabase.co";
const key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im16Y3premN2bGd0c3NybXlpbGhuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM5MzU5NjgsImV4cCI6MjA5OTUxMTk2OH0.sGdMaIDvw20iTETi6EiQkTpiNG20RJzKFkRjwGlPLSU";

const supabase = createClient(url, key);

async function inspect() {
  console.log("--- PRODUCTS ---");
  const { data: prods, error: prodErr } = await supabase.from("products").select("*, product_variations(*)");
  console.log("prodErr:", prodErr);
  console.log("prods count:", prods?.length);
  console.log("prods:", JSON.stringify(prods, null, 2));

  console.log("\n--- STOCK BALANCES ---");
  const { data: sb, error: sbErr } = await supabase.from("stock_balances").select("*");
  console.log("sbErr:", sbErr);
  console.log("sb count:", sb?.length);
  console.log("sb:", JSON.stringify(sb, null, 2));

  console.log("\n--- WAREHOUSES ---");
  const { data: wh, error: whErr } = await supabase.from("warehouses").select("*");
  console.log("whErr:", whErr);
  console.log("wh count:", wh?.length);
  console.log("wh:", JSON.stringify(wh, null, 2));
}

inspect();
