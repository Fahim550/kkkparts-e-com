import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();
const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data: order, error } = await supabase.from('sales_orders').select('id').limit(1).single();
  if (error) {
    console.error(error);
    return;
  }
  const { error: err } = await supabase.from('sales_orders').delete().eq('id', order.id);
  console.log("Delete error:", err);
}
run();
