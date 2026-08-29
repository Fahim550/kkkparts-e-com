import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || '', 
  process.env.VITE_SUPABASE_ANON_KEY || ''
);

async function run() {
  const { data, error } = await supabase.from('journal_entry_lines').select('*').not('party_id', 'is', null).limit(10);
  console.log(data, error);
}
run();
