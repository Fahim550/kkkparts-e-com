import { createClient } from "@supabase/supabase-js";

const url = "https://svswmeaakrhgveuxtrbv.supabase.co";
const key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN2c3dtZWFha3JoZ3ZldXh0cmJ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUwMzExODgsImV4cCI6MjEwMDYwNzE4OH0.t55QO_50LqYpE_nF_2XJb393G-7_Z2y8YyY3";

const supabase = createClient(url, key);

async function run() {
  const { data: sb, error: sbErr } = await supabase.from("stock_balances").select("*");
  console.log("stock_balances error:", sbErr);
  console.log("stock_balances count:", sb?.length);

  const { data: prods, error: pErr } = await supabase.from("products").select("*, product_variations(*)");
  console.log("products error:", pErr);
  console.log("products count:", prods?.length);
  if (prods && prods.length > 0) {
    console.log("Sample product:", JSON.stringify(prods[0], null, 2));
  }

  const { data: whs, error: whErr } = await supabase.from("warehouses").select("*");
  console.log("warehouses error:", whErr);
  console.log("warehouses:", whs);
}

run();
