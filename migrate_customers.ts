import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log("Starting migration...");
  const { data: customers, error } = await supabase.from('customers').select('*');
  if (error) {
    console.error("Error fetching customers:", error);
    return;
  }

  console.log(`Found ${customers.length} customers.`);

  for (const customer of customers) {
    console.log(`Processing customer: ${customer.name}`);
    
    // Create new account
    const { data: newAccount, error: accError } = await supabase.from('chart_of_accounts').insert({
      name: `AR - ${customer.name}`,
      account_type: 'Asset',
      description: `Accounts Receivable for ${customer.name}`
    }).select().single();

    if (accError) {
      console.error(`Error creating account for ${customer.name}:`, accError);
      continue;
    }

    console.log(`Created account ${newAccount.id}`);

    // Update customer
    const { error: updError } = await supabase.from('customers').update({
      receivable_account_id: newAccount.id
    }).eq('id', customer.id);

    if (updError) {
      console.error(`Error updating customer ${customer.name}:`, updError);
    } else {
      console.log(`Successfully updated customer ${customer.name}.`);
    }
  }

  console.log("Migration complete.");
}
run();
