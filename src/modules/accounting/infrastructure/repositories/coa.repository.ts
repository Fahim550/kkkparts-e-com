import { supabase } from "@/integrations/supabase/client";
import { ChartOfAccount, FiscalYear } from "../../domain/types";

export class CoaRepository {
  static async getAllAccounts(): Promise<ChartOfAccount[]> {
    const { data, error } = await supabase
      .from("chart_of_accounts")
      .select("*")
      .order("account_number", { ascending: true });

    if (error) throw error;
    return data;
  }

  static async getActiveFiscalYear(): Promise<FiscalYear> {
    const { data, error } = await supabase
      .from("fiscal_years")
      .select("*")
      .eq("is_closed", false)
      .lte("start_date", new Date().toISOString())
      .gte("end_date", new Date().toISOString())
      .maybeSingle();

    if (error) throw error;
    if (!data) throw new Error("No active fiscal year found for today's date.");
    return data;
  }

  static async getAccountByNumber(accountNumber: string): Promise<ChartOfAccount> {
    const { data, error } = await supabase
      .from("chart_of_accounts")
      .select("*")
      .eq("account_number", accountNumber)
      .single();

    if (error) throw error;
    return data;
  }
}
