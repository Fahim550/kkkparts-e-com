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
    let payableAccountId = payload.payable_account_id;

    // Create a dedicated Accounts Payable account for each supplier if not specified or pointing to a shared account
    if (!payableAccountId) {
      const { data: accData, error: accError } = await supabase
        .from("chart_of_accounts")
        .insert({
          name: `AP - ${payload.name}`,
          account_number: `AP-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          account_type: "Liability",
          is_group: false,
          is_active: true,
        })
        .select("id")
        .single();

      if (accError) throw accError;
      payableAccountId = accData.id;
    }

    const { data, error } = await supabase
      .from("suppliers")
      .insert({
        ...payload,
        payable_account_id: payableAccountId,
      })
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
      .or("account_type.eq.Payable,account_type.eq.Liability")
      .eq("is_group", false)
      .eq("is_active", true)
      .order("name");
      
    if (error) throw error;

    if (data && data.length > 0) {
      return data;
    }

    // Auto-create standard Accounts Payable if no liability/payable account exists
    const { data: newAcc, error: createError } = await supabase
      .from("chart_of_accounts")
      .insert({
        account_number: "2100",
        name: "Accounts Payable",
        account_type: "Liability",
        is_group: false,
        is_active: true,
      })
      .select()
      .single();

    if (!createError && newAcc) {
      return [newAcc];
    }

    return [];
  }
}
