import { supabase } from './src/integrations/supabase/client'

async function run() {
  const { data: uomData, error: uomErr } = await supabase.from('units_of_measure').select('*').limit(5)
  console.log("UOMs:", uomData, uomErr)

  const { data: items, error: itemsErr } = await supabase.from('sales_order_items').select('*').order('created_at', { ascending: false }).limit(2)
  console.log("Recent sales items:", items, itemsErr)
}
run()
