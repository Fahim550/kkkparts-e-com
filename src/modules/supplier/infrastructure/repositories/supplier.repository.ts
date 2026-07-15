import { supabase } from "@/integrations/supabase/client";
import { Supplier, CreateSupplierDTO, UpdateSupplierDTO, ChartOfAccount } from "../../domain/types";

export class SupplierRepository {
  static async getAll(): Promise<Supplier[]> {
    const { data, error } = await supabase
      .from("suppliers")
      .select("*")
      .order("name");

    if (error) throw error;
    return data || [];
  }

  static async searchByName(query: string): Promise<Supplier[]> {
    const { data, error } = await supabase
      .from("suppliers")
      .select("*")
      .ilike("name", `%${query}%`)
      .order("name");

    if (error) throw error;
    return data || [];
  }

  static async getById(id: string): Promise<Supplier | null> {
    const { data, error } = await supabase
      .from("suppliers")
      .select("*")
      .eq("id", id)
      .single();

    if (error) throw error;
    return data;
  }

  static async create(payload: CreateSupplierDTO): Promise<Supplier> {
    const { data, error } = await supabase
      .from("suppliers")
      .insert(payload)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async update(payload: UpdateSupplierDTO): Promise<Supplier> {
    const { id, ...updateData } = payload;
    const { data, error } = await supabase
      .from("suppliers")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async delete(id: string): Promise<void> {
    const { error } = await supabase.from("suppliers").delete().eq("id", id);

    if (error) throw error;
  }

  // Helper for accounts
  static async getPayableAccounts(): Promise<ChartOfAccount[]> {
    const { data, error } = await supabase
      .from("chart_of_accounts")
      .select("*")
      .eq("account_type", "Payable")
      .eq("is_group", false)
      .eq("is_active", true)
      .order("name");
      
    if (error) throw error;
    return data || [];
  }
}
