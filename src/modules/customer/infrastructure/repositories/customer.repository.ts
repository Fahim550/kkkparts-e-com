import { supabase } from "@/integrations/supabase/client";
import { Customer, CreateCustomerDTO, UpdateCustomerDTO } from "../../domain/types";

export class CustomerRepository {
  static async getAll(): Promise<Customer[]> {
    const { data, error } = await supabase
      .from("customers")
      .select(`
        *,
        chart_of_accounts (id, name, code)
      `)
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
    const { data, error } = await supabase
      .from("customers")
      .insert(payload)
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
