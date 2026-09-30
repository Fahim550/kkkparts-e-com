import { supabase } from "@/integrations/supabase/client";
import { Customer, CreateCustomerDTO, UpdateCustomerDTO } from "../../domain/types";

export class CustomerRepository {
  static async getAll(): Promise<Customer[]> {
    const { data, error } = await supabase
      .from("customers")
      .select("*")
      .order("name", { ascending: true });

    if (error) throw error;
    return data as any;
  }

  static async getById(id: string): Promise<Customer> {
    const { data, error } = await supabase
      .from("customers")
      .select(`
        *,
        chart_of_accounts (id, name, code)
      `)
      .eq("id", id)
      .single();

    if (error) throw error;
    return data as any;
  }

  static async create(payload: CreateCustomerDTO): Promise<Customer> {
    const trimmedName = (payload.name || "").trim();

    // 1. Check if a customer with the same name already exists
    const { data: existingCust } = await supabase
      .from("customers")
      .select("*")
      .ilike("name", trimmedName)
      .maybeSingle();

    if (existingCust) {
      return existingCust as any;
    }

    // 2. Resolve receivable_account_id (try creating dedicated ledger account, fallback to default Control AR account)
    let receivableAccountId: string | null = (payload as any).receivable_account_id || null;

    if (!receivableAccountId) {
      try {
        const { data: accData, error: accError } = await supabase
          .from("chart_of_accounts")
          .insert({
            name: `Accounts Receivable - ${trimmedName}`,
            account_type: "Asset",
            account_number: `AR-${Date.now()}-${Math.floor(Math.random() * 1000)}`
          })
          .select("id")
          .single();

        if (accData?.id && !accError) {
          receivableAccountId = accData.id;
        }
      } catch (accErr) {
        console.warn("Could not create dedicated AR sub-ledger, falling back to control account:", accErr);
      }
    }

    if (!receivableAccountId) {
      // Find the standard Accounts Receivable (1200) or any Asset account
      const { data: defaultAr } = await supabase
        .from("chart_of_accounts")
        .select("id")
        .eq("account_number", "1200")
        .maybeSingle();

      if (defaultAr?.id) {
        receivableAccountId = defaultAr.id;
      } else {
        const { data: anyAsset } = await supabase
          .from("chart_of_accounts")
          .select("id")
          .eq("account_type", "Asset")
          .limit(1)
          .maybeSingle();

        receivableAccountId = anyAsset?.id || "72c5a58c-08e6-4cd5-a367-738b65358e9c";
      }
    }

    // 3. Create the customer with resolved receivable_account_id
    const customerPayload: any = {
      ...payload,
      name: trimmedName,
      receivable_account_id: receivableAccountId,
    };

    let { data, error } = await supabase
      .from("customers")
      .insert(customerPayload)
      .select()
      .single();

    // If salesman_id or custom column not found in schema cache, retry without it
    if (error && (error.code === "PGRST204" || error.message?.includes("salesman"))) {
      delete customerPayload.salesman_id;
      delete customerPayload.salesman_name;
      const retry = await supabase
        .from("customers")
        .insert(customerPayload)
        .select()
        .single();
      data = retry.data;
      error = retry.error;
    }

    if (error) throw error;
    return data as any;
  }

  static async update(id: string, payload: UpdateCustomerDTO): Promise<Customer> {
    const { data, error } = await supabase
      .from("customers")
      .update(payload)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return data as any;
  }

  static async delete(id: string): Promise<void> {
    const { error } = await supabase.from("customers").delete().eq("id", id);
    if (error) throw error;
  }
}
