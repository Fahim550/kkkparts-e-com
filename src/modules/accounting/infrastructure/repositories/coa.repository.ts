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
    const todayStr = new Date().toISOString().split("T")[0];

    // 1. Try finding a fiscal year matching today's date
    const { data: currentFy, error: currentError } = await supabase
      .from("fiscal_years")
      .select("*")
      .eq("is_closed", false)
      .lte("start_date", todayStr)
      .gte("end_date", todayStr)
      .maybeSingle();

    if (currentFy) return currentFy;

    // 2. Fallback: try finding any open fiscal year
    const { data: anyOpenFy } = await supabase
      .from("fiscal_years")
      .select("*")
      .eq("is_closed", false)
      .order("start_date", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (anyOpenFy) return anyOpenFy;

    // 3. Fallback: Auto-create current fiscal year if DB has none
    const year = new Date().getFullYear();
    const { data: newFy, error: createError } = await supabase
      .from("fiscal_years")
      .insert({
        name: `FY${year}`,
        start_date: `${year}-01-01`,
        end_date: `${year}-12-31`,
        is_closed: false,
      })
      .select()
      .single();

    if (createError || !newFy) {
      throw new Error(createError?.message || "No active fiscal year found. Please create a Fiscal Year in Accounting settings.");
    }

    return newFy;
  }

  static async getAccountByNumber(accountNumber: string): Promise<ChartOfAccount> {
    // 1. Try finding by exact account_number
    const { data: acc } = await supabase
      .from("chart_of_accounts")
      .select("*")
      .eq("account_number", accountNumber)
      .maybeSingle();

    if (acc) return acc;

    // 2. Fallback by account_type if exact account_number doesn't exist
    let accountType = "Asset";
    let defaultName = "General Account";
    if (accountNumber.startsWith("2")) {
      accountType = "Liability";
      defaultName = "Accounts Payable";
    } else if (accountNumber.startsWith("3")) {
      accountType = "Equity";
      defaultName = "Owner Equity";
    } else if (accountNumber.startsWith("4")) {
      accountType = "Revenue";
      defaultName = "Sales Revenue";
    } else if (accountNumber.startsWith("5")) {
      accountType = "Expense";
      defaultName = "Cost of Goods Sold";
    } else {
      defaultName = "Inventory Asset";
    }

    const { data: typeAcc } = await supabase
      .from("chart_of_accounts")
      .select("*")
      .eq("account_type", accountType)
      .eq("is_group", false)
      .limit(1)
      .maybeSingle();

    if (typeAcc) return typeAcc;

    // 3. Auto-create account if not found
    const { data: newAcc, error: createAccErr } = await supabase
      .from("chart_of_accounts")
      .insert({
        account_number: accountNumber,
        name: defaultName,
        account_type: accountType,
        is_group: false,
        is_active: true,
      })
      .select()
      .single();

    if (createAccErr || !newAcc) {
      throw new Error(createAccErr?.message || `Chart of Account '${accountNumber}' not found.`);
    }

    return newAcc;
  }
}

