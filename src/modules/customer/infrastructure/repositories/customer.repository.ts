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
    const { data: accData, error: accError } = await supabase
      .from("chart_of_accounts")
      .insert({
        name: `Accounts Receivable - ${payload.name}`,
        account_type: "Asset",
        account_number: `AR-${Date.now()}-${Math.floor(Math.random() * 1000)}`
      })
      .select("id")
      .single();

    if (accError) throw accError;

    // 2. Create the customer and link the new account
    const { data, error } = await supabase
      .from("customers")
      .insert({
        ...payload,
        receivable_account_id: accData.id
      })
      .select()
      .single();

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
