import { createClient } from "@supabase/supabase-js";

const url = "https://mzczkzcvlgtssrmyilhn.supabase.co";
const key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im16Y3premN2bGd0c3NybXlpbGhuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM5MzU5NjgsImV4cCI6MjA5OTUxMTk2OH0.sGdMaIDvw20iTETi6EiQkTpiNG20RJzKFkRjwGlPLSU";

const supabase = createClient(url, key);

async function run() {
  const { data: sb, error: sbErr } = await supabase
    .from("stock_balances")
    .select("*, product_variations(*, products(*)), warehouse_bins(*)");
  console.log("stock_balances count:", sb?.length);
  if (sb && sb.length > 0) {
    console.log("Sample stock_balance[0]:", JSON.stringify(sb[0], null, 2));
  }

  const { data: prods, error: pErr } = await supabase.from("products").select("*, product_variations(*)");
  console.log("products count:", prods?.length);
  if (prods && prods.length > 0) {
    console.log("Sample product[0]:", JSON.stringify(prods[0], null, 2));
  }
}

run();
